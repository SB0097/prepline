// Farbschema „Graphit“ (Serkan 12.11.2026): neutrales Fast-Schwarz, Blau nur noch als Akzent.
// Flächen und Schrift sind bewusst ohne Blaustich, damit die App nicht wie eingefärbt wirkt.
// Runde 16 „Tiefe“ (Serkan 15.11.2026): Karten mit Schatten und Lichtkante, Knöpfe mit Leuchten.
import { LOGO_FARBEN } from './logo/logoDaten';

export const FARBEN = {
  hintergrund: LOGO_FARBEN.hintergrund,
  karte: '#17191D',
  /** Erhöhte Flächen auf einer Karte: Chips, runde Knöpfe, leere Balken. */
  karteHell: '#24272D',
  /** Oberer Teil der Hauptkarte (Verlauf nach unten zu `karte`). */
  karteOben: '#22252F',
  /** Feiner Rand um Karten. */
  rand: '#22252B',
  leiste: '#121316',
  linie: '#2B2E35',
  text: LOGO_FARBEN.hell,
  textLeise: '#9BA0AA',
  akzent: LOGO_FARBEN.akzent,
  /** Zweite Farbe für Verläufe im Fortschrittsring und in Balken. */
  akzentHell: '#8FA6FF',
  akzentFlaeche: 'rgba(108, 140, 255, 0.14)',
  akzentRand: 'rgba(108, 140, 255, 0.55)',
  textAufAkzent: '#0A1230',
  /** Hauptknöpfe: satterer Verlauf, damit die weiße Schrift gut lesbar ist. */
  knopfVon: '#4A5CF0',
  knopfBis: '#6478FF',
  textAufKnopf: '#FFFFFF',
  /** Leuchten unter Hauptknöpfen. */
  knopfLeuchten: 'rgba(74, 92, 240, 0.5)',
  /** Feine Lichtkante oben an Karten. */
  lichtkante: 'rgba(255, 255, 255, 0.07)',
  schatten: 'rgba(0, 0, 0, 0.5)',
  /** Heller Teil im Fortschrittsbalken: gelernt, aber noch nicht sicher. */
  gelernt: 'rgba(108, 140, 255, 0.4)',
  richtig: '#3DD68C',
  falsch: '#FF6B6B',
  hinweis: '#F5B54A',
  serie: '#FF9F2E',
  /** Satteres Brett (Runde 16), wirkt weniger blass. */
  brettHell: '#E3E8F2',
  brettDunkel: '#5E73A8',
  /** Letzter Zug und ausgewählte Figur. */
  brettMarkierung: 'rgba(255, 214, 92, 0.62)',
  /** Figur, die der Tipp hervorhebt. */
  brettTipp: 'rgba(108, 140, 255, 0.7)',
  /** Abdunklung hinter Dialogen. */
  schleier: 'rgba(0, 0, 0, 0.7)',
} as const;
