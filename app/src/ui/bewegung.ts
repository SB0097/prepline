// Kurven, Zeiten und Einstiegs-Animationen für Bewegungen in der App (Runde 14, Serkan 14.11.2026).
// CSS-Übergänge in Reanimated brauchen cubicBezier(…), withTiming braucht Easing.bezier(…).
import {
  cubicBezier,
  Easing,
  type EntryExitAnimationFunction,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

/** Kräftiges Ausklingen: für alles, was erscheint oder auf Druck reagiert. */
export const CSS_AUSKLINGEN = cubicBezier(0.23, 1, 0.32, 1);
export const AUSKLINGEN = Easing.bezier(0.23, 1, 0.32, 1);
/** Für Bewegung über den Bildschirm, z. B. eine gleitende Figur. */
export const GLEITEN = Easing.bezier(0.77, 0, 0.175, 1);

export const DAUER = {
  /** Knopf gibt beim Drücken nach. */
  druck: 120,
  /** Figur gleitet zum Zielfeld. */
  zug: 240,
  /** Rückmeldung (Haken, Kreuz) taucht auf. */
  meldung: 200,
  /** Fortschrittsbalken wächst. */
  balken: 300,
} as const;

/**
 * Einstieg für `entering`: Das Element startet versetzt, verkleinert und/oder unsichtbar und läuft
 * in seine normale Lage. Anders als eine CSS-Animation gilt der Startwert schon im ersten Bild,
 * so blitzt nichts kurz an der Endposition auf.
 */
export function erscheinen({
  dauer,
  verzoegerung = 0,
  vonX = 0,
  vonY = 0,
  skala = 1,
  blenden = true,
  gleiten = false,
}: {
  dauer: number;
  verzoegerung?: number;
  vonX?: number;
  vonY?: number;
  skala?: number;
  /** Von unsichtbar einblenden (aus bei der gleitenden Figur). */
  blenden?: boolean;
  /** Kurve für Bewegung über das Brett statt Ausklingen. */
  gleiten?: boolean;
}): EntryExitAnimationFunction {
  const kurve = gleiten ? GLEITEN : AUSKLINGEN;
  return () => {
    'worklet';
    const ziel = (wert: number) =>
      withDelay(verzoegerung, withTiming(wert, { duration: dauer, easing: kurve }));
    return {
      initialValues: {
        opacity: blenden ? 0 : 1,
        transform: [{ translateX: vonX }, { translateY: vonY }, { scale: skala }],
      },
      animations: {
        opacity: ziel(1),
        transform: [{ translateX: ziel(0) }, { translateY: ziel(0) }, { scale: ziel(1) }],
      },
    };
  };
}
