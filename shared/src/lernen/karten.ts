// Lernkarten aus dem Zugbaum: Eine Karte ist eine Stellung, in der man selbst am Zug ist,
// mit dem Repertoirezug als Antwort. Gleiche Stellungen (über andere Zugfolgen erreicht)
// sind dieselbe Karte.
import type { Zugknoten } from '../pgn/typen.ts';
import { type Baum, stellungOhneZaehler } from '../pgn/zusammenfuehren.ts';
import { type Seite, seiteAusFen } from '../seite.ts';

export type Karte = {
  /** Stellung ohne Zugzähler – eindeutiger Schlüssel der Karte. */
  schluessel: string;
  /** Vollständige FEN der Stellung (beim ersten Auftreten). */
  fen: string;
  /** Der Repertoirezug (SAN). */
  zug: string;
  uci: string;
  /** Weitere eigene Züge aus der PGN: kein Fehler, aber „nicht dein Hauptzug“. */
  alternativen: string[];
  /** Züge vom Start bis zu dieser Stellung beim ersten Auftreten (für Anzeige und Sortierung). */
  weg: string[];
};

/** Seite, die in einer FEN am Zug ist. */
export function amZug(fen: string): Seite {
  return seiteAusFen(fen.split(' ')[1] === 'b' ? 'b' : 'w');
}

/**
 * Sammelt alle Karten für die eigene Seite in Baum-Reihenfolge (Hauptlinien zuerst).
 * Die Reihenfolge ist auch die Reihenfolge, in der neue Karten eingeführt werden.
 */
export function kartenAusBaum(baum: Baum, seite: Seite): Karte[] {
  const karten = new Map<string, Karte>();

  const besuche = (fen: string, kinder: Zugknoten[], weg: string[]) => {
    if (kinder.length === 0) return;
    if (amZug(fen) === seite) {
      const schluessel = stellungOhneZaehler(fen);
      const vorhanden = karten.get(schluessel);
      if (vorhanden) {
        for (const k of kinder) {
          if (k.san !== vorhanden.zug && !vorhanden.alternativen.includes(k.san)) {
            vorhanden.alternativen.push(k.san);
          }
        }
      } else {
        const [haupt, ...rest] = kinder;
        karten.set(schluessel, {
          schluessel,
          fen,
          zug: haupt!.san,
          uci: haupt!.uci,
          alternativen: rest.map((k) => k.san),
          weg,
        });
      }
    }
    for (const k of kinder) besuche(k.fen, k.kinder, [...weg, k.san]);
  };

  // Breitensuche wäre „gerechter“, aber Tiefensuche hält eine Linie zusammen:
  // Neue Karten kommen so Linie für Linie, Hauptlinie zuerst.
  besuche(baum.startFen, baum.zuege, []);
  return [...karten.values()];
}

export type Pruefung = 'richtig' | 'alternative' | 'falsch';

/** Vergleicht einen gespielten Zug mit der Karte. */
export function zugPruefen(karte: Karte, san: string): Pruefung {
  const ohneZeichen = (s: string) => s.replace(/[+#!?]/g, '');
  const gespielt = ohneZeichen(san);
  if (gespielt === ohneZeichen(karte.zug)) return 'richtig';
  if (karte.alternativen.some((a) => ohneZeichen(a) === gespielt)) return 'alternative';
  return 'falsch';
}
