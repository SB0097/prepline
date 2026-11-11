// Daten für eine Trainingsrunde: Was ist heute in welchem Repertoire dran, und Ergebnisse speichern.
import {
  bewerten,
  type Ereignis,
  gezeigt,
  type Karte,
  kartenAusBaum,
  type Lernstand,
  neuerLernstand,
  type Tagesplan,
  tagesplan,
} from '@prepline/shared';

import { type Einstellungen, einstellungenLaden } from '@/daten/einstellungen';
import {
  lernstaendeLaden,
  lernstandSpeichern,
  type Repertoire,
  repertoireLaden,
  repertoireListe,
  tagSchluessel,
  tageszaehler,
  tageszaehlerErhoehen,
} from '@/daten/speicher';
import type { Sql } from '@/daten/sql';

export type Trainingsteil = {
  rep: Repertoire;
  karten: Karte[];
  /** Lernstände dieses Repertoires; wird beim Speichern mitgeführt. */
  staende: Map<string, Lernstand>;
  plan: Tagesplan;
};

export type Trainingsvorbereitung = { teile: Trainingsteil[]; einstellungen: Einstellungen };

/** Alle Repertoires, in denen heute etwas dran ist, mit ihrem Tagesplan. */
export async function trainingVorbereiten(
  sql: Sql,
  jetzt = Date.now(),
): Promise<Trainingsvorbereitung> {
  const einstellungen = await einstellungenLaden(sql);
  const heute = await tageszaehler(sql, tagSchluessel(jetzt));
  let schonEingefuehrt = heute.neu;
  const teile: Trainingsteil[] = [];
  for (const kopf of await repertoireListe(sql)) {
    const rep = await repertoireLaden(sql, kopf.id);
    if (!rep) continue;
    const karten = kartenAusBaum(rep.baum, rep.seite);
    const staende = await lernstaendeLaden(sql, rep.id);
    const plan = tagesplan(karten, staende, jetzt, {
      neuProTag: einstellungen.neuProTag,
      heuteSchonEingefuehrt: schonEingefuehrt,
    });
    // Das Tageslimit für neue Züge gilt über alle Repertoires zusammen.
    schonEingefuehrt += plan.neu.filter((k) => !staende.get(k)?.gezeigt).length;
    if (plan.faellig.length + plan.neu.length > 0) teile.push({ rep, karten, staende, plan });
  }
  return { teile, einstellungen };
}

/** Speichert ein Ereignis aus der Runde und zählt es für den Tag. */
export async function ereignisSpeichern(
  sql: Sql,
  teil: Trainingsteil,
  ereignis: Ereignis,
  jetzt = Date.now(),
): Promise<void> {
  const alt = teil.staende.get(ereignis.karte) ?? neuerLernstand(jetzt);
  const neu =
    ereignis.art === 'gezeigt' ? gezeigt(alt, jetzt) : bewerten(alt, ereignis.richtig, jetzt);
  teil.staende.set(ereignis.karte, neu);
  await lernstandSpeichern(sql, teil.rep.id, ereignis.karte, neu);
  const tag = tagSchluessel(jetzt);
  if (ereignis.art === 'gezeigt') await tageszaehlerErhoehen(sql, tag, { neu: 1 });
  else await tageszaehlerErhoehen(sql, tag, { wiederholt: 1, fehler: ereignis.richtig ? 0 : 1 });
}
