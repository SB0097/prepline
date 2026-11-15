// Test-Helfer: echte SQLite aus Node (node:sqlite) hinter der Sql-Schnittstelle der App.
// Damit prüfen die Tests das wirkliche SQL, nur ohne Handy.
import { DatabaseSync } from 'node:sqlite';

import { migrieren } from '@/daten/schema';
import type { Sql, SqlWert } from '@/daten/sql';

export function nodeSql(datei = ':memory:'): Sql & { schliessen(): void } {
  const db = new DatabaseSync(datei);
  return {
    ausfuehren: async (anweisungen) => {
      db.exec(anweisungen);
    },
    lauf: async (anweisung, werte: SqlWert[] = []) => {
      const r = db.prepare(anweisung).run(...werte);
      return { neueId: Number(r.lastInsertRowid), geaendert: Number(r.changes) };
    },
    alle: async <T>(abfrage: string, werte: SqlWert[] = []) =>
      db.prepare(abfrage).all(...werte) as T[],
    erste: async <T>(abfrage: string, werte: SqlWert[] = []) =>
      (db.prepare(abfrage).get(...werte) as T | undefined) ?? null,
    transaktion: async (arbeit) => {
      db.exec('BEGIN');
      try {
        await arbeit();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    schliessen: () => db.close(),
  };
}

/** Frische, migrierte Datenbank im Speicher. */
export async function testDatenbank() {
  const sql = nodeSql();
  await migrieren(sql);
  return sql;
}
