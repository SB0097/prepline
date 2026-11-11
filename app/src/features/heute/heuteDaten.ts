// Zahlen für die Seite „Heute“: Was ist heute dran, wie sicher sitzen Weiß und Schwarz.
import type { Seite } from '@prepline/shared';

import { einstellungenLaden } from '@/daten/einstellungen';
import { repertoireUebersicht, tagSchluessel, tageszaehler } from '@/daten/speicher';
import type { Sql } from '@/daten/sql';

export type HeuteDaten = {
  anzahlRepertoires: number;
  wiederholungen: number;
  neu: number;
  /** Anteil sicher sitzender Stellungen in Prozent, null ohne Repertoire dieser Seite. */
  sicher: Record<Seite, number | null>;
};

export async function heuteLaden(sql: Sql, jetzt = Date.now()): Promise<HeuteDaten> {
  const [einstellungen, liste, zaehler] = await Promise.all([
    einstellungenLaden(sql),
    repertoireUebersicht(sql, jetzt),
    tageszaehler(sql, tagSchluessel(jetzt)),
  ]);
  const summe = (seite: Seite | null, feld: 'faellig' | 'neu' | 'sicher' | 'stellungen') =>
    liste
      .filter((r) => seite === null || r.seite === seite)
      .reduce((n, r) => n + r.fortschritt[feld], 0);
  const prozent = (seite: Seite) => {
    const alle = summe(seite, 'stellungen');
    return alle === 0 ? null : Math.round((summe(seite, 'sicher') / alle) * 100);
  };
  const nochFrei = Math.max(0, einstellungen.neuProTag - zaehler.neu);
  return {
    anzahlRepertoires: liste.length,
    wiederholungen: summe(null, 'faellig'),
    neu: Math.min(nochFrei, summe(null, 'neu')),
    sicher: { weiss: prozent('weiss'), schwarz: prozent('schwarz') },
  };
}
