// Anzeige von Zügen in deutscher Notation (S = Springer, L = Läufer, T = Turm, D = Dame, K = König).
const DEUTSCH: Record<string, string> = { N: 'S', B: 'L', R: 'T', Q: 'D', K: 'K' };

/** "Nf3" → "Sf3", "exd8=Q+" → "exd8=D+", "O-O" bleibt. */
export function sanAufDeutsch(san: string): string {
  return san
    .replace(/^[NBRQK]/, (b) => DEUTSCH[b]!)
    .replace(/=([NBRQ])/, (_, b: string) => `=${DEUTSCH[b]!}`);
}
