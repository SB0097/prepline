// Eine Übung: Die App spielt eine Linie ab Zug 1, man selbst spielt seine Züge.
// Abgefragt und bewertet werden nur die fälligen Stellungen, neue werden zuerst gezeigt.
// Bei mehreren Gegnerantworten wählt die App die, hinter der am meisten ansteht
// („Fälliges zuerst“, Serkan 11.11.2026), bei Gleichstand zufällig. Karten mit Vorrang
// (gerade gelernte Züge, die noch gefestigt werden) ziehen die Linie zuerst zu sich.
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
  /** Abfrage eines Zugs, der gerade erst gezeigt wurde und noch gefestigt wird („aus dem Kopf“). */
  frisch?: boolean;
  /** Kommentar aus der PGN zu diesem Zug (wird neutral angezeigt). */
  kommentar?: string;
};

export type Uebungsauswahl = {
  /** Heute fällige Karten. */
  faellig: ReadonlySet<string>;
  /** Neue Karten, die heute eingeführt werden dürfen. */
  neu: ReadonlySet<string>;
  /** Karten, die bei der Wahl der Gegnerantwort vor allen anderen zählen. */
  vorrang?: ReadonlySet<string>;
  /** Nach so vielen neuen Zügen endet die Linie (Lernen in Häppchen). Ohne Angabe: keine Grenze. */
  maxNeu?: number;
};

/** So viel mehr zählt eine Karte mit Vorrang bei der Wahl der Gegnerantwort. */
const VORRANG_GEWICHT = 1000;

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
   * Gewicht der anstehenden Karten in diesem Teilbaum (ab Stellung fen mit diesen Fortsetzungen):
   * jede Karte zählt 1, mit Vorrang deutlich mehr.
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
      if (karte && ansteht(schluessel)) {
        summe += auswahl.vorrang?.has(schluessel) ? VORRANG_GEWICHT : 1;
      }
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
  const maxNeu = auswahl.maxNeu ?? Infinity;
  let neueZuege = 0;
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
      schritte.push({
        art,
        fen,
        san: naechster.san,
        uci: naechster.uci,
        karte: schluessel,
        ...(naechster.kommentar && { kommentar: naechster.kommentar }),
      });
      // Häppchen voll: Die Linie endet hier, die gezeigten Züge werden zuerst abgerufen.
      if (art === 'neu' && ++neueZuege >= maxNeu) break;
    } else {
      naechster = gegnerzugWaehlen(kinder, offen, zufall);
      schritte.push({
        art: 'gegner',
        fen,
        san: naechster.san,
        uci: naechster.uci,
        ...(naechster.kommentar && { kommentar: naechster.kommentar }),
      });
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
