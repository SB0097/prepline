// Die mitgelieferte Sammlung: Liste, Zugbaum und Erklärungen des Coach-Bauern.
import { Chess } from 'chess.js';

import { pgnLesen } from '../pgn/lesen.ts';
import { type Baum, stellungOhneZaehler, zusammenfuehren } from '../pgn/zusammenfuehren.ts';
import { CARO_KANN } from './eroeffnungen/carokann.ts';
import { DAMENGAMBIT } from './eroeffnungen/damengambit.ts';
import { ITALIENISCH } from './eroeffnungen/italienisch.ts';
import { LONDON } from './eroeffnungen/london.ts';
import { NAJDORF } from './eroeffnungen/najdorf.ts';
import { SKANDINAVISCH } from './eroeffnungen/skandinavisch.ts';
import type { Sammlungseintrag, Stufe, Zweisprachig } from './typen.ts';

export * from './typen.ts';

/** Reihenfolge: erst Weiß, dann Schwarz, jeweils nach Stufe. */
export const SAMMLUNG: readonly Sammlungseintrag[] = [
  ITALIENISCH,
  LONDON,
  DAMENGAMBIT,
  SKANDINAVISCH,
  CARO_KANN,
  NAJDORF,
];

export const STUFEN: readonly Stufe[] = ['einsteiger', 'fortgeschritten', 'profi'];

export function sammlungsEintrag(id: string | null | undefined): Sammlungseintrag | undefined {
  return SAMMLUNG.find((e) => e.id === id);
}

const baeume = new Map<string, Baum>();

/** Zugbaum eines Eintrags (aus der PGN gelesen, danach zwischengespeichert). */
export function sammlungsBaum(eintrag: Sammlungseintrag): Baum {
  const gemerkt = baeume.get(eintrag.id);
  if (gemerkt) return gemerkt;
  const [baum] = zusammenfuehren(pgnLesen(eintrag.pgn).partien);
  if (!baum) throw new Error(`Sammlung ${eintrag.id}: keine Züge`);
  baeume.set(eintrag.id, baum);
  return baum;
}

/** Schlüssel einer Erklärung: Stellung vor dem Zug (ohne Zähler) und der Zug ohne Schach-Zeichen. */
export function erklaerungsSchluessel(fenVorher: string, san: string): string {
  return `${stellungOhneZaehler(fenVorher)}|${san.replace(/[+#]/g, '')}`;
}

const zwischenspeicher = new Map<string, Map<string, Zweisprachig>>();

/** Alle Erklärungen eines Eintrags, nach Schlüssel. Wirft, wenn ein Weg nicht spielbar ist. */
export function erklaerungen(eintrag: Sammlungseintrag): Map<string, Zweisprachig> {
  const gemerkt = zwischenspeicher.get(eintrag.id);
  if (gemerkt) return gemerkt;
  const karte = new Map<string, Zweisprachig>();
  for (const e of eintrag.erklaerungen) {
    const schach = new Chess();
    const zuege = e.zuege.split(' ');
    let vorher = schach.fen();
    for (const san of zuege) {
      vorher = schach.fen();
      schach.move(san);
    }
    karte.set(erklaerungsSchluessel(vorher, zuege.at(-1)!), { de: e.de, en: e.en });
  }
  zwischenspeicher.set(eintrag.id, karte);
  return karte;
}

/** Erklärung zu einem Zug in einer Stellung, falls der Coach-Bauer etwas dazu sagt. */
export function erklaerungFuer(
  id: string | null | undefined,
  fenVorher: string,
  san: string,
): Zweisprachig | undefined {
  const eintrag = sammlungsEintrag(id);
  return eintrag ? erklaerungen(eintrag).get(erklaerungsSchluessel(fenVorher, san)) : undefined;
}
