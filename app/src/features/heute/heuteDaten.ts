// Zahlen für die Seite „Heute“: Was ist heute dran, wie weit sind Weiß und Schwarz,
// an welchen Tagen dieser Woche wurde geübt.
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
  /** Stand je Seite, null ohne Repertoire dieser Seite. */
  stand: Record<Seite, Seitenstand | null>;
  /** Montag bis Sonntag der laufenden Woche: an welchen Tagen geübt wurde. */
  woche: boolean[];
  /** Heute in der Woche, 0 = Montag. */
  wochentag: number;
};

/** Wie weit eine Seite ist: gelernt = nicht mehr neu, sicher = hält etwa drei Wochen. */
export type Seitenstand = { stellungen: number; gelernt: number; sicher: number };

function tagAusSchluessel(tag: string): Date {
  const [jahr = 0, monat = 1, t = 1] = tag.split('-').map(Number);
  return new Date(jahr, monat - 1, t);
}

function vortag(tag: string): string {
  const d = tagAusSchluessel(tag);
  return tagSchluessel(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
}

/** Montag bis Sonntag der Woche, in der `heute` liegt: true, wenn an dem Tag geübt wurde. */
export function wocheZaehlen(
  tage: readonly string[],
  heute: string,
): { woche: boolean[]; wochentag: number } {
  const aktiv = new Set(tage);
  const d = tagAusSchluessel(heute);
  const wochentag = (d.getDay() + 6) % 7;
  const woche = Array.from({ length: 7 }, (_, i) =>
    aktiv.has(tagSchluessel(new Date(d.getFullYear(), d.getMonth(), d.getDate() - wochentag + i))),
  );
  return { woche, wochentag };
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
    feld: 'faellig' | 'neu' | 'angefangen' | 'gelernt' | 'sicher' | 'stellungen',
  ) =>
    liste
      .filter((r) => seite === null || r.seite === seite)
      .reduce((n, r) => n + r.fortschritt[feld], 0);
  const stand = (seite: Seite): Seitenstand | null =>
    liste.some((r) => r.seite === seite)
      ? {
          stellungen: summe(seite, 'stellungen'),
          gelernt: summe(seite, 'gelernt'),
          sicher: summe(seite, 'sicher'),
        }
      : null;
  const tagListe = tage.map((t) => t.tag);
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
    serie: serieZaehlen(tagListe, heute),
    weiter: offen[0] ?? null,
    figurensatz: einstellungen.figurensatz,
    stand: { weiss: stand('weiss'), schwarz: stand('schwarz') },
    ...wocheZaehlen(tagListe, heute),
  };
}
