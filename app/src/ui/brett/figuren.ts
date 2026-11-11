// Figurensätze (Serkan 11.11.2026): alle drei wählbar, Standard ist „klassisch“.

export type Figurensatz = 'klassisch' | 'modern' | 'verspielt';
export type FigurName = `${'w' | 'b'}${'K' | 'Q' | 'R' | 'B' | 'N' | 'P'}`;

export const FIGURENSAETZE: readonly Figurensatz[] = ['klassisch', 'modern', 'verspielt'];
export const FIGURENSATZ_STANDARD: Figurensatz = 'klassisch';

export function istFigurensatz(wert: unknown): wert is Figurensatz {
  return typeof wert === 'string' && (FIGURENSAETZE as readonly string[]).includes(wert);
}
