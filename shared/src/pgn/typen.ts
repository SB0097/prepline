// Datenmodell für eingelesene PGN-Dateien: ein Baum aus Zügen mit Varianten.

/** Ein Zug im Baum. Die Kinder sind die möglichen Fortsetzungen, das erste Kind ist die Hauptlinie. */
export type Zugknoten = {
  /** Zug in Standard-Notation (englische Figurenbuchstaben), z. B. "Nf3", "O-O", "exd5". */
  san: string;
  /** Zug als Start- und Zielfeld, z. B. "g1f3" oder "e7e8q" (für Animationen). */
  uci: string;
  /** Stellung NACH diesem Zug als FEN. */
  fen: string;
  /** Kommentar aus der PGN zu diesem Zug (ohne Lichess-Befehle wie [%clk …]). */
  kommentar?: string;
  /** Bewertungszeichen als NAG-Nummern, z. B. 1 = !, 2 = ?, 3 = !!, 4 = ??, 5 = !?, 6 = ?!. */
  nags: number[];
  kinder: Zugknoten[];
};

/** Eine Partie bzw. ein Kapitel aus der PGN-Datei. */
export type Partie = {
  /** Kopfzeilen wie Event, White, Black, ECO, Opening, FEN … */
  kopf: Record<string, string>;
  /** Startstellung (Grundstellung oder FEN aus dem Kopf). */
  startFen: string;
  /** Kommentar vor dem ersten Zug. */
  kommentar?: string;
  /** Mögliche erste Züge. Das erste Element ist die Hauptlinie. */
  zuege: Zugknoten[];
};

/** Was beim Einlesen schiefging. Texte macht die App (Deutsch/Englisch) aus der Art. */
export type PgnFehler =
  | {
      art: 'zug_ungueltig';
      /** Nummer der Partie in der Datei, ab 1. */
      partie: number;
      san: string;
      zugnummer: number;
      amZug: 'weiss' | 'schwarz';
    }
  | { art: 'klammer_nicht_geschlossen'; partie: number }
  | { art: 'klammer_ohne_anfang'; partie: number }
  | { art: 'kommentar_nicht_geschlossen'; partie: number }
  | { art: 'variante_ohne_zug'; partie: number }
  | { art: 'fen_ungueltig'; partie: number; fen: string }
  | { art: 'unbekannter_text'; partie: number; text: string }
  | { art: 'keine_zuege' };

export type PgnErgebnis = {
  partien: Partie[];
  /** Hinweise zu Stellen, die übersprungen wurden. Leer, wenn alles geklappt hat. */
  fehler: PgnFehler[];
};
