// Form und Farben des App-Logos (Serkan 11.11.2026: Variante L1, der Coach-Bauer).
// Ein Bauer aus einer leuchtenden blauen Linie mit kleinem Gesicht, auf neutralem Fast-Schwarz.
// Einheiten: 100er Raster. Wird von der App (CoachBauer, Start-Animation) und vom Skript
// scripts/logo-erzeugen.mjs genutzt – so sehen Symbol, Startbild und App gleich aus.

export const LOGO_FARBEN = {
  akzent: '#6C8CFF',
  hintergrund: '#0D0E11',
  /** Dezente Linien im Umfeld des Logos. */
  gitter: '#2B2E35',
  hell: '#F6F7F9',
} as const;

/** Umriss des Bauern: Kopf, Kragen, Körper, Sockel. */
export const BAUER_UMRISS =
  'M50 8a17 17 0 1 1 0 34a17 17 0 1 1 0-34zM36 44h28l-4 8h-20zM38 54h24c2 14 6 24 14 32h-52c8-8 12-18 14-32zM20 88h60a4 4 0 0 1 4 4v4h-68v-4a4 4 0 0 1 4-4z';

export const BAUER_AUGEN = [
  [44, 25],
  [56, 25],
] as const;

export const BAUER_MUND = 'M45 32q5 4 10 0';

export const STRICH = { linie: 3.5, leuchten: 12, augen: 3.2, mund: 2.6 } as const;

/** Quadratischer Bereich um den Bauern inklusive Leuchten (für Symbole und Startbild). */
export const LOGO_BEREICH = { x: -2, y: 2, breite: 104 } as const;
