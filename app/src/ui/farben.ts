// Farbschema „Mitternacht“ (Serkan 11.11.2026): tiefes Nachtblau, Akzent Blau, blaugraues Brett.
import { LOGO_FARBEN } from './logo/logoDaten';

export const FARBEN = {
  hintergrund: LOGO_FARBEN.hintergrund,
  karte: '#151D36',
  leiste: '#111936',
  linie: '#222C4A',
  text: LOGO_FARBEN.hell,
  textLeise: '#8E9BC0',
  akzent: LOGO_FARBEN.akzent,
  textAufAkzent: '#0A1230',
  richtig: '#3DD68C',
  falsch: '#FF6B6B',
  hinweis: '#F5B54A',
  brettHell: '#C9D4E3',
  brettDunkel: '#7C93B2',
  brettMarkierung: 'rgba(108, 140, 255, 0.55)',
} as const;
