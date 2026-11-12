// Verständliche Texte zu Stellen, die beim Einlesen übersprungen wurden.
import { type PgnFehler, sanAufDeutsch } from '@prepline/shared';

export function fehlerText(f: PgnFehler): string {
  switch (f.art) {
    case 'zug_ungueltig':
      return `Partie ${f.partie}, Zug ${f.zugnummer}: ${sanAufDeutsch(f.san)} ist nicht möglich`;
    case 'klammer_nicht_geschlossen':
      return `Partie ${f.partie}: Eine Variante wird nicht geschlossen`;
    case 'klammer_ohne_anfang':
      return `Partie ${f.partie}: Klammer ohne Anfang`;
    case 'kommentar_nicht_geschlossen':
      return `Partie ${f.partie}: Ein Kommentar wird nicht geschlossen`;
    case 'variante_ohne_zug':
      return `Partie ${f.partie}: Leere Variante`;
    case 'fen_ungueltig':
      return `Partie ${f.partie}: Die Startstellung ist ungültig`;
    case 'unbekannter_text':
      return `Partie ${f.partie}: „${f.text}“ wurde nicht erkannt`;
    case 'keine_zuege':
      return 'Keine Züge gefunden';
  }
}

/** Name aus dem Dateinamen ohne Endung, z. B. "italienisch.pgn" → "italienisch". */
export function nameAusDatei(dateiname: string | undefined): string {
  return (dateiname ?? '').replace(/\.[a-z0-9]+$/i, '').trim();
}
