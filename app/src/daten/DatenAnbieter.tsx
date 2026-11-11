// Öffnet beim App-Start die Datenbank (inkl. Migrationen) und stellt sie allen Bildschirmen bereit.
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { datenbankOeffnen } from './expoSql';
import type { Sql } from './sql';

type Zustand =
  { status: 'laedt' } | { status: 'bereit'; sql: Sql } | { status: 'fehler'; fehler: unknown };

const DatenKontext = createContext<Zustand>({ status: 'laedt' });

export function DatenAnbieter({ children }: { children: ReactNode }) {
  const [zustand, setZustand] = useState<Zustand>({ status: 'laedt' });

  useEffect(() => {
    let aktiv = true;
    datenbankOeffnen()
      .then((sql) => aktiv && setZustand({ status: 'bereit', sql }))
      .catch((fehler: unknown) => aktiv && setZustand({ status: 'fehler', fehler }));
    return () => {
      aktiv = false;
    };
  }, []);

  return <DatenKontext.Provider value={zustand}>{children}</DatenKontext.Provider>;
}

/** Zustand der Datenbank (lädt / bereit / Fehler). */
export function useDatenbank(): Zustand {
  return useContext(DatenKontext);
}
