// Tabellen der App und ihre Migrationen. Die Version steht in PRAGMA user_version.
// Neue Änderungen immer als NEUEN Eintrag unten anhängen, alte nie verändern –
// sonst passen Handys mit älterem Stand nicht mehr.
import type { Sql } from './sql';

const MIGRATIONEN: string[] = [
  // 1: Grundstand (M3)
  `
  CREATE TABLE repertoire (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    seite TEXT NOT NULL CHECK (seite IN ('weiss', 'schwarz')),
    -- 1 = mitgelieferte Eröffnung (mit Coach), 0 = eigener Import
    offiziell INTEGER NOT NULL DEFAULT 0,
    start_fen TEXT NOT NULL,
    -- Zugbaum als JSON (Liste von Zugknoten, siehe @prepline/shared)
    baum TEXT NOT NULL,
    erstellt INTEGER NOT NULL,
    geaendert INTEGER NOT NULL
  );

  CREATE TABLE lernstand (
    repertoire_id INTEGER NOT NULL REFERENCES repertoire(id) ON DELETE CASCADE,
    schluessel TEXT NOT NULL,
    faellig INTEGER NOT NULL,
    stabilitaet REAL NOT NULL,
    schwierigkeit REAL NOT NULL,
    tage_geplant INTEGER NOT NULL,
    wiederholungen INTEGER NOT NULL,
    vergessen INTEGER NOT NULL,
    lernschritt INTEGER NOT NULL,
    zustand INTEGER NOT NULL,
    letzte_wiederholung INTEGER,
    gezeigt INTEGER NOT NULL,
    PRIMARY KEY (repertoire_id, schluessel)
  );
  CREATE INDEX lernstand_faellig ON lernstand (faellig);

  -- Pro Kalendertag: wie viele neue Karten eingeführt und wie viele wiederholt wurden
  CREATE TABLE tag (
    tag TEXT PRIMARY KEY,
    neu INTEGER NOT NULL DEFAULT 0,
    wiederholt INTEGER NOT NULL DEFAULT 0,
    fehler INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE einstellung (
    schluessel TEXT PRIMARY KEY,
    wert TEXT NOT NULL
  );
  `,
];

export const SCHEMA_VERSION = MIGRATIONEN.length;

/** Bringt die Datenbank auf den neuesten Stand. Läuft bei jedem App-Start. */
export async function migrieren(sql: Sql): Promise<void> {
  // Außerhalb jeder Transaktion: Fremdschlüssel prüfen, schnelleres Schreiben (WAL)
  await sql.ausfuehren('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const zeile = await sql.erste<{ user_version: number }>('PRAGMA user_version');
  const version = zeile?.user_version ?? 0;
  for (let i = version; i < MIGRATIONEN.length; i++) {
    await sql.transaktion(async () => {
      await sql.ausfuehren(MIGRATIONEN[i]!);
      await sql.ausfuehren(`PRAGMA user_version = ${i + 1};`);
    });
  }
}
