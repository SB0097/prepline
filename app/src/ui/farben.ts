// Farbschema „Graphit“ (Serkan 12.11.2026): neutrales Fast-Schwarz, Blau nur noch als Akzent.
// Flächen und Schrift sind bewusst ohne Blaustich, damit die App nicht wie eingefärbt wirkt.
import { LOGO_FARBEN } from './logo/logoDaten';

export const FARBEN = {
  hintergrund: LOGO_FARBEN.hintergrund,
  karte: '#17191D',
  /** Erhöhte Flächen auf einer Karte: Chips, runde Knöpfe, leere Balken. */
  karteHell: '#24272D',
  /** Feiner Rand um Karten. */
  rand: '#22252B',
  leiste: '#121316',
  linie: '#2B2E35',
  text: LOGO_FARBEN.hell,
  textLeise: '#9BA0AA',
  akzent: LOGO_FARBEN.akzent,
  /** Zweite Farbe für Verläufe auf Knöpfen und im Fortschrittsring. */
  akzentHell: '#8FA6FF',
  akzentFlaeche: 'rgba(108, 140, 255, 0.14)',
  akzentRand: 'rgba(108, 140, 255, 0.55)',
  textAufAkzent: '#0A1230',
  richtig: '#3DD68C',
  falsch: '#FF6B6B',
  hinweis: '#F5B54A',
  serie: '#FF9F2E',
  brettHell: '#EDF0F6',
  brettDunkel: '#7C92C6',
  /** Letzter Zug und ausgewählte Figur. */
  brettMarkierung: 'rgba(255, 214, 92, 0.62)',
  /** Figur, die der Tipp hervorhebt. */
  brettTipp: 'rgba(108, 140, 255, 0.7)',
  /** Abdunklung hinter Dialogen. */
  schleier: 'rgba(0, 0, 0, 0.7)',
} as const;
