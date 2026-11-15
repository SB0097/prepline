// Schmale Schnittstelle zur Datenbank. In der App steckt expo-sqlite dahinter (expoSql.ts),
// in den Tests die SQLite von Node – so laufen die Speicher-Tests mit echtem SQL.

export type SqlWert = string | number | null;

export type Sql = {
  /** Mehrere Anweisungen ohne Parameter (z. B. CREATE TABLE …). */
  ausfuehren(anweisungen: string): Promise<void>;
  /** Eine Anweisung mit Parametern (INSERT, UPDATE, DELETE). */
  lauf(anweisung: string, werte?: SqlWert[]): Promise<{ neueId: number; geaendert: number }>;
  alle<T>(abfrage: string, werte?: SqlWert[]): Promise<T[]>;
  erste<T>(abfrage: string, werte?: SqlWert[]): Promise<T | null>;
  /** Alles oder nichts: Bei einem Fehler wird nichts gespeichert. */
  transaktion(arbeit: () => Promise<void>): Promise<void>;
};
