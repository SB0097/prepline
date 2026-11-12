// Ablauf einer Trainingsrunde für ein Repertoire.
//
// Lernstrategie (Serkan 12.11.2026): neue Züge in Häppchen lernen und aktiv abrufen.
// - Pro Durchgang werden höchstens `haeppchen` neue Züge gezeigt, dann beginnt die Linie von vorn.
// - Gezeigte Züge werden in den nächsten Durchgängen ohne Hilfe abgefragt. Erst nach
//   TREFFER_ZIEL richtigen Antworten gilt ein Zug als für heute gelernt und wird bewertet:
//   „richtig“, wenn er dabei nie falsch war und kein Tipp nötig war.
// - Fehler beim Abrufen: Zug zeigen und nachspielen lassen, die Treffer beginnen von vorn,
//   und in diesem Durchgang kommen keine weiteren neuen Züge dazu.
// - Fällige Wiederholungen: Die erste Antwort wird bewertet. Nach einem Fehler nachspielen,
//   die Stellung kommt am Ende der Runde noch einmal (ohne zweite Bewertung).
// - „Nicht dein Hauptzug“ (Alternative aus der PGN) zählt nicht als Fehler, man versucht es nochmal.
// - Wer einen Tipp nimmt, hat den Zug nicht gewusst.
import type { Baum } from '../pgn/zusammenfuehren.ts';
import type { Seite } from '../seite.ts';
import { type Karte, zugPruefen } from './karten.ts';
import type { Tagesplan } from './tagesplan.ts';
import { type Schritt, uebungslinie } from './uebung.ts';

export type Rueckmeldung = 'richtig' | 'alternative' | 'falsch';

/** Was gespeichert werden muss. */
export type Ereignis =
  { art: 'gezeigt'; karte: string } | { art: 'bewertet'; karte: string; richtig: boolean };

/** So viele neue Züge werden auf einmal gezeigt, bevor sie abgerufen werden. */
export const HAEPPCHEN_STANDARD = 3;
export const HAEPPCHEN_BEREICH = { min: 1, max: 6 } as const;

/** So oft muss ein neuer Zug aus dem Kopf richtig kommen, bis er für heute gelernt ist. */
export const TREFFER_ZIEL = 2;

export type Runde = {
  readonly baum: Baum;
  readonly seite: Seite;
  readonly karten: ReadonlyMap<string, Karte>;
  /** Fällige Wiederholungen, heute noch abzufragen. */
  readonly faellig: ReadonlySet<string>;
  /** Neue Züge, heute noch zu zeigen. */
  readonly neu: ReadonlySet<string>;
  /** Schon gezeigte neue Züge mit der Zahl ihrer richtigen Antworten bisher. */
  readonly lernen: ReadonlyMap<string, number>;
  /** Neue Züge, die beim Abrufen falsch waren oder einen Tipp brauchten. */
  readonly wackelig: ReadonlySet<string>;
  /** Falsch beantwortete Wiederholung: kommt am Ende der Runde noch einmal. */
  readonly nochmal: ReadonlySet<string>;
  /** Schon bewertet (zählt für den Fortschritt). */
  readonly erledigt: ReadonlySet<string>;
  readonly gesamt: number;
  /** Arbeitsschritte je Karte für den Fortschrittsbalken (zeigen und jede Abfrage zählen einzeln). */
  readonly einheiten: ReadonlyMap<string, number>;
  readonly haeppchen: number;
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
  optionen: { haeppchen?: number } = {},
): Runde {
  const einheiten = new Map<string, number>();
  for (const k of plan.faellig) einheiten.set(k, 1);
  for (const k of plan.angefangen) einheiten.set(k, TREFFER_ZIEL);
  for (const k of plan.neu) einheiten.set(k, 1 + TREFFER_ZIEL);
  const runde: Runde = {
    baum,
    seite,
    karten: new Map(karten.map((k) => [k.schluessel, k])),
    faellig: new Set(plan.faellig),
    neu: new Set(plan.neu),
    // Schon früher gezeigte, aber noch nicht gelernte Züge werden gleich abgefragt statt nochmal gezeigt.
    lernen: new Map(plan.angefangen.map((k) => [k, 0])),
    wackelig: new Set(),
    nochmal: new Set(),
    erledigt: new Set(),
    gesamt: einheiten.size,
    einheiten,
    haeppchen: Math.min(
      HAEPPCHEN_BEREICH.max,
      Math.max(HAEPPCHEN_BEREICH.min, optionen.haeppchen ?? HAEPPCHEN_STANDARD),
    ),
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
  const lernen = new Map(runde.lernen);
  const wackelig = new Set(runde.wackelig);
  const nochmal = new Set(runde.nochmal);
  const erledigt = new Set(runde.erledigt);
  const ereignisse: Ereignis[] = [];
  let linie = runde.linie;

  const abfrage = schritt.art === 'abfrage' && !runde.nachspielen;
  const wirdGelernt = lernen.has(schluessel);
  /** Neuer Zug nicht gewusst: Treffer von vorn, erst festigen, bevor weitere neue Züge kommen. */
  const nichtGewusst = () => {
    lernen.set(schluessel, 0);
    wackelig.add(schluessel);
    linie = ohneNeueZuege(runde.linie, runde.index);
  };

  if (rueckmeldung === 'falsch') {
    if (abfrage && wirdGelernt) {
      nichtGewusst();
    } else if (abfrage) {
      if (!erledigt.has(schluessel)) {
        ereignisse.push({ art: 'bewertet', karte: schluessel, richtig: false });
        erledigt.add(schluessel);
      }
      faellig.delete(schluessel);
      nochmal.add(schluessel);
    }
    return {
      runde: { ...runde, faellig, lernen, wackelig, nochmal, erledigt, linie, nachspielen: true },
      rueckmeldung,
      ereignisse,
    };
  }

  // richtig
  if (abfrage && wirdGelernt) {
    if (runde.tipp) {
      nichtGewusst();
    } else {
      const treffer = (lernen.get(schluessel) ?? 0) + 1;
      if (treffer < TREFFER_ZIEL) {
        lernen.set(schluessel, treffer);
      } else {
        lernen.delete(schluessel);
        erledigt.add(schluessel);
        ereignisse.push({ art: 'bewertet', karte: schluessel, richtig: !wackelig.has(schluessel) });
      }
    }
  } else if (abfrage) {
    if (!erledigt.has(schluessel)) {
      ereignisse.push({ art: 'bewertet', karte: schluessel, richtig: !runde.tipp });
      erledigt.add(schluessel);
    }
    faellig.delete(schluessel);
    if (runde.tipp) nochmal.add(schluessel);
  } else if (schritt.art === 'neu') {
    ereignisse.push({ art: 'gezeigt', karte: schluessel });
    neu.delete(schluessel);
    lernen.set(schluessel, 0);
  }
  return {
    runde: weiter({ ...runde, faellig, neu, lernen, wackelig, nochmal, erledigt, linie }),
    rueckmeldung,
    ereignisse,
  };
}

/** Wo man beim Lernen neuer Züge gerade steht, z. B. „neu, 2 von 3“ oder „abrufen, 1 von 3“. */
export type Lernphase = { art: 'neu' | 'abrufen'; nummer: number; anzahl: number };

function phaseVon(schritt: Schritt | undefined | null): Lernphase['art'] | null {
  if (schritt?.art === 'neu') return 'neu';
  return schritt?.art === 'abfrage' && schritt.frisch ? 'abrufen' : null;
}

/**
 * Lernphase des aktuellen Schritts mit Zählung innerhalb des laufenden Durchgangs.
 * Null bei Gegnerzügen, fälligen Wiederholungen und Zügen, die nur mitgespielt werden.
 */
export function lernphase(runde: Runde): Lernphase | null {
  const art = phaseVon(aktuellerSchritt(runde));
  if (!art) return null;
  const gleiche = runde.linie.flatMap((s, i) => (phaseVon(s) === art ? [i] : []));
  return { art, nummer: gleiche.indexOf(runde.index) + 1, anzahl: gleiche.length };
}

/**
 * Fortschritt der Runde: fertige Karten für die Anzeige „3 / 24“ und ein feinerer Anteil
 * (0 bis 1) für den Balken, in dem auch Zeigen und jede richtige Abfrage zählen.
 */
export function rundenFortschritt(runde: Runde): {
  erledigt: number;
  gesamt: number;
  anteil: number;
} {
  let summe = 0;
  let fertig = 0;
  for (const [schluessel, einheiten] of runde.einheiten) {
    summe += einheiten;
    const treffer = runde.lernen.get(schluessel);
    if (runde.erledigt.has(schluessel)) fertig += einheiten;
    else if (treffer !== undefined) fertig += einheiten - (TREFFER_ZIEL - treffer);
  }
  return {
    erledigt: runde.erledigt.size,
    gesamt: runde.gesamt,
    anteil: summe === 0 ? 1 : fertig / summe,
  };
}

/** Kürzt die Linie vor dem nächsten neuen Zug; Gegnerzüge am Ende fallen mit weg. */
function ohneNeueZuege(linie: readonly Schritt[], index: number): readonly Schritt[] {
  const naechsterNeuer = linie.findIndex((s, i) => i > index && s.art === 'neu');
  if (naechsterNeuer < 0) return linie;
  let ende = naechsterNeuer;
  while (ende > index + 1 && linie[ende - 1]?.art === 'gegner') ende--;
  return linie.slice(0, ende);
}

function weiter(runde: Runde): Runde {
  const naechste = { ...runde, index: runde.index + 1, nachspielen: false, tipp: false };
  return naechste.index < naechste.linie.length ? naechste : naechsteLinie(naechste);
}

function naechsteLinie(runde: Runde): Runde {
  const bauen = (r: Runde) =>
    uebungslinie(
      r.baum,
      r.seite,
      r.karten,
      {
        faellig: new Set([...r.faellig, ...r.lernen.keys()]),
        neu: r.neu,
        // Erst festigen, was schon gezeigt wurde, dann Neues.
        vorrang: new Set(r.lernen.keys()),
        maxNeu: r.haeppchen,
      },
      r.zufall,
    ).map((s) =>
      s.art === 'abfrage' && s.karte && r.lernen.has(s.karte) ? { ...s, frisch: true } : s,
    );
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
