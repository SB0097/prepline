// Hell oder dunkel (Runde 17, Serkan 15.11.2026): folgt der Handy-Einstellung, unter „Mehr“ fest
// wählbar. Seiten holen ihre Farben mit `useFarben()` und ihre Stile mit einem Hook aus
// `stileErstellen` – die Stile werden je Farbschema nur einmal erzeugt.
import { createContext, type ReactNode, use, useEffect, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { useDatenbank } from '@/daten/DatenAnbieter';
import { type Erscheinungsbild, einstellungenLaden } from '@/daten/einstellungen';

import { DUNKEL, type Farben, HELL } from './farben';

type Thema = {
  farben: Farben;
  modus: Erscheinungsbild;
  setModus: (modus: Erscheinungsbild) => void;
};

const ThemaKontext = createContext<Thema>({
  farben: DUNKEL,
  modus: 'automatisch',
  setModus: () => {},
});

/** Farben nach Wahl: fest hell oder dunkel, sonst wie das Handy. */
export function farbenFuer(
  modus: Erscheinungsbild,
  system: 'light' | 'dark' | null | undefined,
): Farben {
  if (modus === 'hell') return HELL;
  if (modus === 'dunkel') return DUNKEL;
  return system === 'light' ? HELL : DUNKEL;
}

export function ThemaAnbieter({ children }: { children: ReactNode }) {
  const db = useDatenbank();
  const system = useColorScheme();
  const [modus, setModus] = useState<Erscheinungsbild>('automatisch');

  // Gespeicherte Wahl einmal laden, sobald die Datenbank bereit ist.
  useEffect(() => {
    if (db.status !== 'bereit') return;
    let aktiv = true;
    void einstellungenLaden(db.sql).then((e) => aktiv && setModus(e.erscheinungsbild));
    return () => {
      aktiv = false;
    };
  }, [db]);

  const farben = farbenFuer(modus, system);
  return <ThemaKontext value={{ farben, modus, setModus }}>{children}</ThemaKontext>;
}

/** Die Farben des aktuellen Schemas. */
export function useFarben(): Farben {
  return use(ThemaKontext).farben;
}

/** Gewählter Modus und Umschalten (für „Mehr“). */
export function useThema(): Thema {
  return use(ThemaKontext);
}

/** Was `StyleSheet.create` als Stile annimmt. */
type Stilangaben = Parameters<typeof StyleSheet.create>[0];

/**
 * Stile abhängig vom Farbschema. Gibt einen Hook zurück, der die Stile für das aktuelle Schema
 * liefert; jedes Schema wird nur einmal mit `StyleSheet.create` erzeugt.
 */
export function stileErstellen<S extends Stilangaben>(bauen: (F: Farben) => S): () => Readonly<S> {
  const gemerkt = new Map<Farben, Readonly<S>>();
  return function useStile() {
    const F = useFarben();
    const vorhanden = gemerkt.get(F);
    if (vorhanden) return vorhanden;
    const stile = StyleSheet.create(bauen(F));
    gemerkt.set(F, stile);
    return stile;
  };
}
