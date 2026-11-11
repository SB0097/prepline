// Eine Übung: Die App spielt eine Linie ab Zug 1, man selbst spielt seine Züge.
// Abgefragt und bewertet werden nur die fälligen Stellungen, neue werden zuerst gezeigt.
// Bei mehreren Gegnerantworten wählt die App die, hinter der am meisten ansteht
// („Fälliges zuerst“, Serkan 11.11.2026), bei Gleichstand zufällig.
import type { Zugknoten } from '../pgn/typen.ts';
import { type Baum, stellungOhneZaehler } from '../pgn/zusammenfuehren.ts';
import type { Seite } from '../seite.ts';
import { amZug, type Karte } from './karten.ts';

export type Schrittart =
  /** Die App spielt den Gegnerzug. */
  | 'gegner'
  /** Eigener Zug, der heute fällig ist: wird bewertet. */
  | 'abfrage'
  /** Neuer eigener Zug: wird erst gezeigt, dann nachgespielt. */
  | 'neu'
  /** Eigener Zug, der heute nicht dran ist: selbst spielen, aber ohne Bewertung. */
  | 'mitspielen';

export type Schritt = {
  art: Schrittart;
  /** Stellung vor dem Zug. */
  fen: string;
  san: string;
  uci: string;
  /** Karten-Schlüssel bei eigenen Zügen. */
  karte?: string;
};

export type Uebungsauswahl = {
  /** Heute fällige Karten. */
  faellig: ReadonlySet<string>;
  /** Neue Karten, die heute eingeführt werden dürfen. */
  neu: ReadonlySet<string>;
};

/**
 * Baut die nächste Übungslinie. Sie endet, sobald dahinter nichts mehr ansteht
 * (spart Zeit bei langen Varianten). Leere Liste: In diesem Baum ist heute nichts mehr dran.
 */
export function uebungslinie(
  baum: Baum,
  seite: Seite,
  karten: ReadonlyMap<string, Karte>,
  auswahl: Uebungsauswahl,
  zufall: () => number = Math.random,
): Schritt[] {
  const ansteht = (schluessel: string) =>
    auswahl.faellig.has(schluessel) || auswahl.neu.has(schluessel);
  const zaehler = new Map<Zugknoten[], number>();

  /**
   * Anzahl anstehender Karten in diesem Teilbaum (ab Stellung fen mit diesen Fortsetzungen).
   * Eine Karte, die über zwei Wege erreichbar ist, zählt doppelt – für die Auswahl egal.
   */
  const offen = (fen: string, kinder: Zugknoten[]): number => {
    if (kinder.length === 0) return 0;
    const gemerkt = zaehler.get(kinder);
    if (gemerkt !== undefined) return gemerkt;
    let summe = 0;
    if (amZug(fen) === seite) {
      const schluessel = stellungOhneZaehler(fen);
      const karte = karten.get(schluessel);
      if (karte && ansteht(schluessel)) summe++;
      const weiter = karte ? kinder.find((k) => k.san === karte.zug) : kinder[0];
      if (weiter) summe += offen(weiter.fen, weiter.kinder);
    } else {
      for (const k of kinder) summe += offen(k.fen, k.kinder);
    }
    zaehler.set(kinder, summe);
    return summe;
  };

  if (offen(baum.startFen, baum.zuege) === 0) return [];

  const schritte: Schritt[] = [];
  let fen = baum.startFen;
  let kinder = baum.zuege;
  while (kinder.length > 0 && offen(fen, kinder) > 0) {
    let naechster: Zugknoten;
    if (amZug(fen) === seite) {
      const schluessel = stellungOhneZaehler(fen);
      const karte = karten.get(schluessel);
      naechster = (karte && kinder.find((k) => k.san === karte.zug)) || kinder[0]!;
      const art: Schrittart = auswahl.faellig.has(schluessel)
        ? 'abfrage'
        : auswahl.neu.has(schluessel)
          ? 'neu'
          : 'mitspielen';
      schritte.push({ art, fen, san: naechster.san, uci: naechster.uci, karte: schluessel });
    } else {
      naechster = gegnerzugWaehlen(kinder, offen, zufall);
      schritte.push({ art: 'gegner', fen, san: naechster.san, uci: naechster.uci });
    }
    fen = naechster.fen;
    kinder = naechster.kinder;
  }
  return schritte;
}

function gegnerzugWaehlen(
  kinder: Zugknoten[],
  offen: (fen: string, kinder: Zugknoten[]) => number,
  zufall: () => number,
): Zugknoten {
  const werte = kinder.map((k) => offen(k.fen, k.kinder));
  const bester = Math.max(...werte);
  const kandidaten = kinder.filter((_, i) => werte[i] === bester);
  return kandidaten[Math.floor(zufall() * kandidaten.length)] ?? kandidaten[0]!;
}
