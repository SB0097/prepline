// Farbschemata der App. „Graphit“ dunkel (Serkan 12.11.2026, Runde 16 „Tiefe“ 15.11.2026) und
// „Hell & klar“ (Runde 17, Serkan 15.11.2026): beide mit denselben Namen, damit jede Seite mit
// beiden funktioniert. Welches gilt, entscheidet `ui/thema.tsx` (Handy-Einstellung oder Mehr).
import { LOGO_FARBEN } from './logo/logoDaten';

export const DUNKEL = {
  /** true im dunklen Schema – z. B. für Statusleiste und Systemleiste. */
  dunkel: true,
  hintergrund: LOGO_FARBEN.hintergrund as string,
  karte: '#17191D',
  /** Erhöhte Flächen auf einer Karte: Chips, runde Knöpfe, leere Balken. */
  karteHell: '#24272D',
  /** Oberer Teil der Hauptkarte (Verlauf nach unten zu `karte`). */
  karteOben: '#22252F',
  /** Feiner Rand um Karten. */
  rand: '#22252B',
  leiste: '#121316',
  linie: '#2B2E35',
  text: LOGO_FARBEN.hell as string,
  textLeise: '#9BA0AA',
  akzent: LOGO_FARBEN.akzent as string,
  /** Zweite Farbe für Verläufe im Fortschrittsring und in Balken, auch für Akzent-Text. */
  akzentHell: '#8FA6FF',
  akzentFlaeche: 'rgba(108, 140, 255, 0.14)',
  akzentRand: 'rgba(108, 140, 255, 0.55)',
  /** Schrift auf dem hellen Akzent-Verlauf (Chips, Tageskreise). */
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
  /** Deckkraft des sanften Leuchtens oben auf den Hauptseiten. */
  glanz: 0.14,
  /** Heller Teil im Fortschrittsbalken: gelernt, aber noch nicht sicher. */
  gelernt: 'rgba(108, 140, 255, 0.4)',
  /** Rand um den weißen Seitenpunkt (im Dunklen nicht nötig). */
  punktRand: 'transparent',
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
};

export type Farben = typeof DUNKEL;

/** „Hell & klar“ (Skizze r17/H1): kühles Hellgrau, weiße Karten mit weichem Schatten. */
export const HELL: Farben = {
  dunkel: false,
  hintergrund: '#F3F5F9',
  karte: '#FFFFFF',
  karteHell: '#ECEFF5',
  karteOben: '#FFFFFF',
  rand: '#E2E6EE',
  leiste: '#FFFFFF',
  linie: '#DCE1EA',
  text: '#11131A',
  textLeise: '#5B6272',
  akzent: '#4A5CF0',
  akzentHell: '#3D4FDB',
  akzentFlaeche: 'rgba(74, 92, 240, 0.10)',
  akzentRand: 'rgba(74, 92, 240, 0.45)',
  textAufAkzent: '#FFFFFF',
  knopfVon: '#4A5CF0',
  knopfBis: '#6478FF',
  textAufKnopf: '#FFFFFF',
  knopfLeuchten: 'rgba(74, 92, 240, 0.32)',
  lichtkante: 'rgba(255, 255, 255, 0.8)',
  schatten: 'rgba(25, 35, 70, 0.10)',
  glanz: 0.07,
  gelernt: 'rgba(74, 92, 240, 0.28)',
  punktRand: '#9AA1B0',
  // Auf Weiß dunkler als im dunklen Schema, damit sie als Text lesbar bleiben (≥ 4,5:1).
  richtig: '#177A4C',
  falsch: '#C9343A',
  hinweis: '#96600F',
  serie: '#E07B12',
  brettHell: '#E3E8F2',
  brettDunkel: '#5E73A8',
  brettMarkierung: 'rgba(255, 214, 92, 0.62)',
  brettTipp: 'rgba(74, 92, 240, 0.6)',
  schleier: 'rgba(15, 20, 35, 0.45)',
};
