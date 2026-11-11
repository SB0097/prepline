// Maße und Farben des App-Logos „Linienbrett“ (Serkan 11.11.2026: Variante 1, Smaragd).
// Ein Schachbrett nur aus Linien, darauf der Mattzug der Dame d1–h5–f7 (Schäfermatt),
// ein Ring um den schwarzen König auf e8 und ein leuchtender Rahmen.
// Einheiten: Ein Feld ist 12 breit, das Brett reicht von 0 bis 96.
// Wird von der App (LogoGrafik.tsx) und vom Skript scripts/logo-erzeugen.mjs genutzt.

export const LOGO_FARBEN = {
  akzent: '#10B981',
  hintergrund: '#0E1318',
  gitter: '#46546A',
  hell: '#E8EEF2',
} as const;

export const FELD = 12;
export const BRETT = 8 * FELD;

/** Sichtbarer Bereich inklusive Leuchtrahmen (für die viewBox). */
export const LOGO_BEREICH = { x: -12, y: -12, breite: BRETT + 24 } as const;

/** Mitte eines Feldes, z. B. feldMitte('e', 4). */
export function feldMitte(linie: string, reihe: number): readonly [number, number] {
  const spalte = linie.charCodeAt(0) - 'a'.charCodeAt(0);
  return [spalte * FELD + FELD / 2, (8 - reihe) * FELD + FELD / 2];
}

/** Mattzug der Dame: d1 → h5 → f7. */
export const MATTZUG = [feldMitte('d', 1), feldMitte('h', 5), feldMitte('f', 7)] as const;

/** Feld des schwarzen Königs (e8). */
export const KOENIG = feldMitte('e', 8);

/** Linien des Gitters als SVG-Pfad (9 senkrechte, 9 waagerechte). */
export const GITTER_PFAD = Array.from({ length: 9 }, (_, i) => i * FELD)
  .map((p) => `M${p} 0V${BRETT}M0 ${p}H${BRETT}`)
  .join('');

export const MATTZUG_PFAD = `M${MATTZUG.map(([x, y]) => `${x} ${y}`).join(' L')}`;

/** Leuchtrahmen: außen weich, innen kräftiger. */
export const RAHMEN = [
  { abstand: 10, rundung: 7, staerke: 6, deckkraft: 0.13 },
  { abstand: 5, rundung: 4, staerke: 2, deckkraft: 0.4 },
] as const;
