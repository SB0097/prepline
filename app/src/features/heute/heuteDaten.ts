// Zahlen für die Seite „Heute“: Was ist heute dran, wie sicher sitzen Weiß und Schwarz.
import type { Seite } from '@prepline/shared';

import { einstellungenLaden } from '@/daten/einstellungen';
import { repertoireUebersicht, tagSchluessel, tageszaehler } from '@/daten/speicher';
import type { Sql } from '@/daten/sql';
import type { Figurensatz } from '@/ui/brett/figuren';

/** Die Eröffnung, bei der heute am meisten ansteht (Karte „Weiter mit“). */
export type WeiterMit = {
  id: number;
  name: string;
  seite: Seite;
  endFen: string;
  faellig: number;
  neu: number;
};

export type HeuteDaten = {
  anzahlRepertoires: number;
  wiederholungen: number;
  neu: number;
  /** Heute schon geübte Stellungen (neu gelernt und wiederholt). */
  erledigt: number;
  /** Tage in Folge mit Training; ein heute noch offener Tag unterbricht die Serie nicht. */
  serie: number;
  weiter: WeiterMit | null;
  figurensatz: Figurensatz;
  /** Anteil sicher sitzender Stellungen in Prozent, null ohne Repertoire dieser Seite. */
  sicher: Record<Seite, number | null>;
};

function vortag(tag: string): string {
  const [jahr = 0, monat = 1, t = 1] = tag.split('-').map(Number);
  return tagSchluessel(new Date(jahr, monat - 1, t - 1));
}

/** Zählt die Tage in Folge bis heute (oder bis gestern, wenn heute noch nichts geübt wurde). */
export function serieZaehlen(tage: readonly string[], heute: string): number {
  const aktiv = new Set(tage);
  let tag = aktiv.has(heute) ? heute : vortag(heute);
  let anzahl = 0;
  while (aktiv.has(tag)) {
    anzahl++;
    tag = vortag(tag);
  }
  return anzahl;
}

export async function heuteLaden(sql: Sql, jetzt = Date.now()): Promise<HeuteDaten> {
  const heute = tagSchluessel(jetzt);
  const [einstellungen, liste, zaehler, tage] = await Promise.all([
    einstellungenLaden(sql),
    repertoireUebersicht(sql, jetzt),
    tageszaehler(sql, heute),
    sql.alle<{ tag: string }>('SELECT tag FROM tag WHERE neu + wiederholt > 0'),
  ]);
  const summe = (
    seite: Seite | null,
    feld: 'faellig' | 'neu' | 'angefangen' | 'sicher' | 'stellungen',
  ) =>
    liste
      .filter((r) => seite === null || r.seite === seite)
      .reduce((n, r) => n + r.fortschritt[feld], 0);
  const prozent = (seite: Seite) => {
    const alle = summe(seite, 'stellungen');
    return alle === 0 ? null : Math.round((summe(seite, 'sicher') / alle) * 100);
  };
  const nochFrei = Math.max(0, einstellungen.neuProTag - zaehler.neu);
  // Angefangene Züge (gezeigt, noch nicht gelernt) stehen immer an, frische nur bis zum Tageslimit.
  const neuHeute = (neu: number, angefangen: number) =>
    angefangen + Math.min(nochFrei, neu - angefangen);

  // „Weiter mit“: die Eröffnung mit den meisten fälligen Wiederholungen, sonst die erste mit neuen Zügen.
  const offen = liste
    .map((r) => ({
      id: r.id,
      name: r.name,
      seite: r.seite,
      endFen: r.endFen,
      faellig: r.fortschritt.faellig,
      neu: neuHeute(r.fortschritt.neu, r.fortschritt.angefangen),
    }))
    .filter((r) => r.faellig + r.neu > 0)
    .sort((a, b) => b.faellig - a.faellig);

  return {
    anzahlRepertoires: liste.length,
    wiederholungen: summe(null, 'faellig'),
    neu: neuHeute(summe(null, 'neu'), summe(null, 'angefangen')),
    erledigt: zaehler.neu + zaehler.wiederholt,
    serie: serieZaehlen(
      tage.map((t) => t.tag),
      heute,
    ),
    weiter: offen[0] ?? null,
    figurensatz: einstellungen.figurensatz,
    sicher: { weiss: prozent('weiss'), schwarz: prozent('schwarz') },
  };
}
