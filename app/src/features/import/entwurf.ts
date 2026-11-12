// Der gerade gewählte Import (Text aus Datei oder Zwischenablage) für die folgenden Schritte.
// Bewusst nur im Speicher: Wird die App beendet, fängt der Import von vorn an.
export type Entwurf = { text: string; dateiname?: string };

let aktuell: Entwurf | null = null;

export function entwurfSetzen(entwurf: Entwurf | null): void {
  aktuell = entwurf;
}

export function entwurfHolen(): Entwurf | null {
  return aktuell;
}
