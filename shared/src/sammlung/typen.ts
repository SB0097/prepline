// Mitgelieferte Eröffnungen („Sammlung“) mit Erklärungen des Coach-Bauern.
import type { Seite } from '../seite.ts';

export type Stufe = 'einsteiger' | 'fortgeschritten' | 'profi';

/** Text in beiden App-Sprachen. */
export type Zweisprachig = { de: string; en: string };

/** Erklärung zu einem eigenen Zug. `zuege` ist der Weg vom Start bis einschließlich dieses Zugs (SAN). */
export type Erklaerung = Zweisprachig & { zuege: string };

export type Sammlungseintrag = {
  /** Fester Schlüssel, wird im Repertoire als Herkunft gespeichert – nie ändern. */
  id: string;
  name: Zweisprachig;
  /** Kurzer Zusatz unter dem Namen, z. B. „mit Evansgambit“. */
  zusatz: Zweisprachig;
  seite: Seite;
  stufe: Stufe;
  /** „Darum geht's“ in der Vorschau. */
  beschreibung: Zweisprachig;
  /** Züge mit Varianten als PGN (englische Figurenbuchstaben). */
  pgn: string;
  erklaerungen: readonly Erklaerung[];
};
