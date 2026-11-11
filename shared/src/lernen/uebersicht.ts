// Zahlen für Übersichten: Fortschritt eines Repertoires, Vorschau beim Import, Mini-Brett-Stellung.
import { pgnLesen } from '../pgn/lesen.ts';
import type { Partie, PgnFehler } from '../pgn/typen.ts';
import { alleLinien, type Baum, zusammenfuehren } from '../pgn/zusammenfuehren.ts';
import type { Seite } from '../seite.ts';
import { type Karte, kartenAusBaum } from './karten.ts';
import { istFaellig, istNeu, type Lernstand, sicherheit } from './lernstand.ts';

/** Stellung am Ende der Hauptlinie (für das Mini-Brett auf der Kachel). */
export function hauptlinieEnde(baum: Baum): string {
  let fen = baum.startFen;
  let liste = baum.zuege;
  while (liste[0]) {
    fen = liste[0].fen;
    liste = liste[0].kinder;
  }
  return fen;
}

export type Fortschritt = {
  /** Stellungen, in denen man selbst am Zug ist. */
  stellungen: number;
  /** Heute fällige Wiederholungen. */
  faellig: number;
  /** Noch nie gelernte Stellungen. */
  neu: number;
  /** Stellungen, die sicher sitzen. */
  sicher: number;
};

export function fortschritt(
  karten: readonly Karte[],
  staende: ReadonlyMap<string, Lernstand>,
  jetzt: number,
): Fortschritt {
  let faellig = 0;
  let neu = 0;
  let sicher = 0;
  for (const k of karten) {
    const stand = staende.get(k.schluessel);
    if (istNeu(stand)) neu++;
    else if (istFaellig(stand, jetzt)) faellig++;
    if (sicherheit(stand) === 'sicher') sicher++;
  }
  return { stellungen: karten.length, faellig, neu, sicher };
}

/** Namensvorschlag aus den PGN-Kopfzeilen (Opening, sonst Event), sonst leer. */
export function nameAusKopf(partien: readonly Partie[]): string {
  const leer = (w: string | undefined) => !w || w === '?' || w === '-';
  for (const feld of ['Opening', 'Event']) {
    const wert = partien.map((p) => p.kopf[feld]).find((w) => !leer(w));
    if (wert) return wert.replace(/^Study:\s*/i, '').trim();
  }
  return '';
}

export type ImportVorschau = {
  baeume: Baum[];
  fehler: PgnFehler[];
  name: string;
  /** Stellungen, in denen man mit der gewählten Seite am Zug ist. */
  stellungen: number;
  /** Anzahl Linien bis zum Ende (Hauptlinie + Varianten). */
  linien: number;
};

/** Liest PGN-Text und fasst zusammen, was beim Import herauskäme. */
export function importVorschau(text: string, seite: Seite): ImportVorschau {
  const { partien, fehler } = pgnLesen(text);
  const baeume = zusammenfuehren(partien);
  let stellungen = 0;
  let linien = 0;
  for (const baum of baeume) {
    stellungen += kartenAusBaum(baum, seite).length;
    linien += alleLinien(baum.zuege).length;
  }
  return { baeume, fehler, name: nameAusKopf(partien), stellungen, linien };
}
