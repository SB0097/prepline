// Seite im Schach: Für welche Farbe gilt ein Repertoire, wer ist am Zug.

export type Seite = 'weiss' | 'schwarz';

export const SEITEN: readonly Seite[] = ['weiss', 'schwarz'];

/** Die jeweils andere Seite (der Gegner). */
export function gegenseite(seite: Seite): Seite {
  return seite === 'weiss' ? 'schwarz' : 'weiss';
}

/** Seite aus der Schreibweise von chess.js / FEN ("w" oder "b"). */
export function seiteAusFen(farbe: 'w' | 'b'): Seite {
  return farbe === 'w' ? 'weiss' : 'schwarz';
}
