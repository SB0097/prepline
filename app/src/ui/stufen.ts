// Stufen der Sammlung mit Text und Farbe (grün / gelb / rot wie in der Skizze).
import type { Stufe } from '@prepline/shared';

import { FARBEN } from './farben';

export const STUFE_TEXT: Record<Stufe, string> = {
  einsteiger: 'Einsteiger',
  fortgeschritten: 'Fortgeschritten',
  profi: 'Profi',
};

export const STUFE_FARBE: Record<Stufe, string> = {
  einsteiger: FARBEN.richtig,
  fortgeschritten: FARBEN.hinweis,
  profi: FARBEN.falsch,
};
