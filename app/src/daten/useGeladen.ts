// Lädt Daten aus der Datenbank, sobald sie bereit ist, und jedes Mal, wenn die Seite wieder sichtbar wird.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useDatenbank } from './DatenAnbieter';
import type { Sql } from './sql';

export function useGeladen<T>(laden: (sql: Sql) => Promise<T>): T | null {
  const db = useDatenbank();
  const sql = db.status === 'bereit' ? db.sql : null;
  const [daten, setDaten] = useState<T | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!sql) return;
      let aktiv = true;
      void laden(sql).then((d) => aktiv && setDaten(d));
      return () => {
        aktiv = false;
      };
    }, [sql, laden]),
  );
  return daten;
}
