// Stufen der Sammlung mit Text und Farbe (grün / gelb / rot wie in der Skizze).
import type { Stufe } from '@prepline/shared';

import type { Farben } from './farben';

export const STUFE_TEXT: Record<Stufe, string> = {
  einsteiger: 'Einsteiger',
  fortgeschritten: 'Fortgeschritten',
  profi: 'Profi',
};

export function stufeFarbe(F: Farben, stufe: Stufe): string {
  return { einsteiger: F.richtig, fortgeschritten: F.hinweis, profi: F.falsch }[stufe];
}
