// Logik für das Schachbrett auf dem Bildschirm: Felder in Anzeige-Reihenfolge,
// erlaubte Zielfelder und Züge aus „von Feld – nach Feld“. Die Regeln kommen von chess.js.
import { Chess, type Square } from 'chess.js';

import type { Seite } from '../seite.ts';

export type Linie = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Reihe = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type Feld = `${Linie}${Reihe}`;
export type Figurtyp = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type Figur = { farbe: 'w' | 'b'; typ: Figurtyp };

export type Brettfeld = {
  feld: Feld;
  figur: Figur | null;
  /** Helles oder dunkles Feld. */
  hell: boolean;
};

export type Brettzug = { san: string; uci: string; fen: string };

const LINIEN: readonly Linie[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/** Feld an Position 0–63 in Anzeige-Reihenfolge (oben links zuerst, zeilenweise). */
export function feldAusIndex(index: number, ansicht: Seite): Feld {
  const zeile = Math.floor(index / 8);
  const spalte = index % 8;
  const linie = ansicht === 'weiss' ? spalte : 7 - spalte;
  const reihe = ansicht === 'weiss' ? 8 - zeile : zeile + 1;
  return `${LINIEN[linie]!}${reihe}` as Feld;
}

/** Gegenstück zu feldAusIndex. */
export function indexAusFeld(feld: Feld, ansicht: Seite): number {
  const linie = LINIEN.indexOf(feld[0] as Linie);
  const reihe = Number(feld[1]);
  const zeile = ansicht === 'weiss' ? 8 - reihe : reihe - 1;
  const spalte = ansicht === 'weiss' ? linie : 7 - linie;
  return zeile * 8 + spalte;
}

export function istHellesFeld(feld: Feld): boolean {
  const linie = LINIEN.indexOf(feld[0] as Linie);
  return (linie + Number(feld[1])) % 2 === 0;
}

/** Alle 64 Felder in Anzeige-Reihenfolge mit der Figur darauf. */
export function brettfelder(fen: string, ansicht: Seite): Brettfeld[] {
  const schach = new Chess(fen);
  return Array.from({ length: 64 }, (_, index) => {
    const feld = feldAusIndex(index, ansicht);
    const figur = schach.get(feld as Square);
    return {
      feld,
      figur: figur ? { farbe: figur.color, typ: figur.type } : null,
      hell: istHellesFeld(feld),
    };
  });
}

/** Felder, auf die die Figur auf `von` ziehen darf. Leer, wenn dort keine Figur der Seite am Zug steht. */
export function zielfelder(fen: string, von: Feld): Feld[] {
  const schach = new Chess(fen);
  const ziele = schach.moves({ square: von as Square, verbose: true }).map((z) => z.to as Feld);
  return [...new Set(ziele)];
}

/**
 * Zug aus Start- und Zielfeld. Gibt null zurück, wenn der Zug nicht erlaubt ist.
 * Bauernumwandlung wird zur Dame (in Eröffnungen praktisch nie anders).
 */
export function zugAusFeldern(fen: string, von: Feld, nach: Feld): Brettzug | null {
  const schach = new Chess(fen);
  const passend = schach
    .moves({ square: von as Square, verbose: true })
    .filter((z) => z.to === nach);
  if (passend.length === 0) return null;
  const zug = passend.find((z) => !z.promotion || z.promotion === 'q') ?? passend[0]!;
  schach.move(zug);
  return { san: zug.san, uci: zug.lan, fen: schach.fen() };
}

/** Start- und Zielfeld aus einem Zug wie "e2e4" oder "e7e8q". */
export function felderAusUci(uci: string): [Feld, Feld] {
  return [uci.slice(0, 2) as Feld, uci.slice(2, 4) as Feld];
}
