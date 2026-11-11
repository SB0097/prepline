// Farben der App. Vorläufig (M0): dunkler Grund, Smaragd als Akzent (Serkan 11.11.2026).
// Das vollständige Farbschema wird in der Design-Runde (M4) festgelegt.
import { LOGO_FARBEN } from './logo/logoDaten';

export const FARBEN = {
  hintergrund: LOGO_FARBEN.hintergrund,
  text: LOGO_FARBEN.hell,
  textLeise: '#8A97A6',
  akzent: LOGO_FARBEN.akzent,
} as const;
