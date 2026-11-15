// Größe des Bretts im Training: so breit wie möglich, aber auf kleinen Handys nur so groß,
// dass Phase („Aus dem Kopf“) und Rückmeldung („Dein Zug“, „Nicht ganz“) darunter sichtbar bleiben.

const RAND = 16;
const ABSTAND_OBEN = 18;
const KLEINSTE = 240;

/** Platz unter dem Brett für Phase und Rückmeldung, wächst mit der Systemschrift. */
export function platzUnterBrett(schrift: number): number {
  // Phase: Abstand + Chip, Rückmeldung: Abstand + großer Titel (wächst gebremst) + Text.
  return 18 + (12 + 15 * schrift) + 10 + 36 * Math.min(schrift, 1.3) + 4 + 17 * schrift + 22;
}

/**
 * @param breite Bildschirmbreite in dp
 * @param hoehe sichtbare Höhe des Bereichs zwischen Kopf und Bedienleiste, `null` solange unbekannt
 * @param schrift Faktor der Systemschrift (1 = normal)
 */
export function brettGroesse(breite: number, hoehe: number | null, schrift = 1): number {
  const nachBreite = breite - 2 * RAND;
  if (hoehe === null) return nachBreite;
  const nachHoehe = Math.floor(hoehe - ABSTAND_OBEN - platzUnterBrett(schrift));
  return Math.max(Math.min(nachBreite, KLEINSTE), Math.min(nachBreite, nachHoehe));
}
