// Datenbank der App auf dem Gerät (expo-sqlite). Die Datei liegt nur auf dem Handy.
import * as SQLite from 'expo-sqlite';

import { migrieren } from './schema';
import type { Sql } from './sql';

export const DATEINAME = 'prepline.db';

export async function datenbankOeffnen(): Promise<Sql> {
  const db = await SQLite.openDatabaseAsync(DATEINAME);
  const sql: Sql = {
    ausfuehren: (anweisungen) => db.execAsync(anweisungen),
    lauf: async (anweisung, werte = []) => {
      const r = await db.runAsync(anweisung, werte);
      return { neueId: r.lastInsertRowId, geaendert: r.changes };
    },
    alle: (abfrage, werte = []) => db.getAllAsync(abfrage, werte),
    erste: (abfrage, werte = []) => db.getFirstAsync(abfrage, werte),
    // withTransactionAsync: Alle Abfragen über diese Verbindung gehören zur Transaktion.
    transaktion: (arbeit) => db.withTransactionAsync(arbeit),
  };
  await migrieren(sql);
  return sql;
}
