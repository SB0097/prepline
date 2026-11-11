// Ablauf einer Trainingsrunde für ein Repertoire (Serkan 11.11.2026):
// - Die App spielt den Gegner, man selbst spielt seine Züge.
// - Neue Züge werden zuerst gezeigt und nachgespielt, später in der Runde abgefragt.
// - Falscher Zug: richtigen Zug zeigen und nachspielen lassen; die Stellung kommt in
//   derselben Runde noch einmal dran (ohne zweite Bewertung).
// - „Nicht dein Hauptzug“ (Alternative aus der PGN) zählt nicht als Fehler, man versucht es nochmal.
// - Wer einen Tipp nimmt, bekommt die Karte als „nicht gewusst“ bewertet.
import type { Baum } from '../pgn/zusammenfuehren.ts';
import type { Seite } from '../seite.ts';
import { type Karte, zugPruefen } from './karten.ts';
import type { Tagesplan } from './tagesplan.ts';
import { type Schritt, uebungslinie } from './uebung.ts';

export type Rueckmeldung = 'richtig' | 'alternative' | 'falsch';

/** Was gespeichert werden muss. */
export type Ereignis =
  { art: 'gezeigt'; karte: string } | { art: 'bewertet'; karte: string; richtig: boolean };

export type Runde = {
  readonly baum: Baum;
  readonly seite: Seite;
  readonly karten: ReadonlyMap<string, Karte>;
  /** Heute noch abzufragen. */
  readonly faellig: ReadonlySet<string>;
  /** Heute noch zu zeigen. */
  readonly neu: ReadonlySet<string>;
  /** Falsch beantwortet: kommt am Ende der Runde noch einmal. */
  readonly nochmal: ReadonlySet<string>;
  /** Schon bewertet (zählt für den Fortschritt). */
  readonly erledigt: ReadonlySet<string>;
  readonly gesamt: number;
  readonly linie: readonly Schritt[];
  readonly index: number;
  /** Nach einem Fehler: Der richtige Zug ist zu sehen und muss nachgespielt werden. */
  readonly nachspielen: boolean;
  /** Für den aktuellen Zug wurde ein Tipp genommen. */
  readonly tipp: boolean;
  readonly zufall: () => number;
};

export function rundeStarten(
  baum: Baum,
  seite: Seite,
  karten: readonly Karte[],
  plan: Tagesplan,
  zufall: () => number = Math.random,
): Runde {
  const runde: Runde = {
    baum,
    seite,
    karten: new Map(karten.map((k) => [k.schluessel, k])),
    faellig: new Set(plan.faellig),
    neu: new Set(plan.neu),
    nochmal: new Set(),
    erledigt: new Set(),
    gesamt: plan.faellig.length + plan.neu.length,
    linie: [],
    index: 0,
    nachspielen: false,
    tipp: false,
    zufall,
  };
  return naechsteLinie(runde);
}

/** Der Schritt, der gerade dran ist; null, wenn die Runde fertig ist. */
export function aktuellerSchritt(runde: Runde): Schritt | null {
  return runde.linie[runde.index] ?? null;
}

export function rundeFertig(runde: Runde): boolean {
  return aktuellerSchritt(runde) === null;
}

/** Die App spielt den Gegnerzug. */
export function gegnerZiehen(runde: Runde): Runde {
  const schritt = aktuellerSchritt(runde);
  if (schritt?.art !== 'gegner') return runde;
  return weiter(runde);
}

/** Tipp für den aktuellen eigenen Zug: Startfeld der Figur, die ziehen muss. */
export function tippNehmen(runde: Runde): { runde: Runde; feld: string } | null {
  const schritt = aktuellerSchritt(runde);
  if (!schritt || schritt.art === 'gegner') return null;
  return { runde: { ...runde, tipp: true }, feld: schritt.uci.slice(0, 2) };
}

/** Ein eigener Zug wurde gespielt. */
export function eigenerZug(
  runde: Runde,
  san: string,
): { runde: Runde; rueckmeldung: Rueckmeldung; ereignisse: Ereignis[] } {
  const schritt = aktuellerSchritt(runde);
  if (!schritt || schritt.art === 'gegner' || !schritt.karte) {
    return { runde, rueckmeldung: 'falsch', ereignisse: [] };
  }
  const schluessel = schritt.karte;
  const karte = runde.karten.get(schluessel);
  const pruefung = karte
    ? zugPruefen(karte, san)
    : san.replace(/[+#]/g, '') === schritt.san.replace(/[+#]/g, '')
      ? 'richtig'
      : 'falsch';
  // Beim Nachspielen und bei neuen Zügen zählt nur genau der gezeigte Zug.
  const rueckmeldung: Rueckmeldung =
    pruefung === 'alternative' && (runde.nachspielen || schritt.art !== 'abfrage')
      ? 'falsch'
      : pruefung;

  if (rueckmeldung === 'alternative') return { runde, rueckmeldung, ereignisse: [] };

  const faellig = new Set(runde.faellig);
  const neu = new Set(runde.neu);
  const nochmal = new Set(runde.nochmal);
  const erledigt = new Set(runde.erledigt);
  const ereignisse: Ereignis[] = [];
  const ersteAntwort = schritt.art === 'abfrage' && !erledigt.has(schluessel);

  if (rueckmeldung === 'falsch') {
    if (schritt.art === 'abfrage' && !runde.nachspielen) {
      if (ersteAntwort) {
        ereignisse.push({ art: 'bewertet', karte: schluessel, richtig: false });
        erledigt.add(schluessel);
      }
      faellig.delete(schluessel);
      nochmal.add(schluessel);
    }
    return {
      runde: { ...runde, faellig, nochmal, erledigt, nachspielen: true },
      rueckmeldung,
      ereignisse,
    };
  }

  // richtig
  if (schritt.art === 'abfrage' && !runde.nachspielen) {
    if (ersteAntwort) {
      ereignisse.push({ art: 'bewertet', karte: schluessel, richtig: !runde.tipp });
      erledigt.add(schluessel);
    }
    faellig.delete(schluessel);
    if (runde.tipp) nochmal.add(schluessel);
  } else if (schritt.art === 'neu') {
    ereignisse.push({ art: 'gezeigt', karte: schluessel });
    neu.delete(schluessel);
    faellig.add(schluessel);
  }
  return {
    runde: weiter({ ...runde, faellig, neu, nochmal, erledigt }),
    rueckmeldung,
    ereignisse,
  };
}

/** Fortschritt für die Anzeige „3 / 24“. */
export function rundenFortschritt(runde: Runde): { erledigt: number; gesamt: number } {
  return { erledigt: runde.erledigt.size, gesamt: runde.gesamt };
}

function weiter(runde: Runde): Runde {
  const naechste = { ...runde, index: runde.index + 1, nachspielen: false, tipp: false };
  return naechste.index < naechste.linie.length ? naechste : naechsteLinie(naechste);
}

function naechsteLinie(runde: Runde): Runde {
  const bauen = (r: Runde) =>
    uebungslinie(r.baum, r.seite, r.karten, { faellig: r.faellig, neu: r.neu }, r.zufall);
  let linie = bauen(runde);
  let aktuell = runde;
  if (linie.length === 0 && runde.nochmal.size > 0) {
    aktuell = {
      ...runde,
      faellig: new Set([...runde.faellig, ...runde.nochmal]),
      nochmal: new Set(),
    };
    linie = bauen(aktuell);
  }
  return { ...aktuell, linie, index: 0, nachspielen: false, tipp: false };
}
