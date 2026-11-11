// Zugbaum als PGN schreiben (Export für Lichess, ChessBase und andere Apps).
// Varianten stehen in Klammern, Kommentare in {}, Bewertungen als $n.
import { GRUNDSTELLUNG } from './lesen.ts';
import type { Zugknoten } from './typen.ts';
import type { Baum } from './zusammenfuehren.ts';

/** Zeichen, die in Kommentaren die PGN zerstören würden. */
function kommentar(text: string): string {
  return `{${text.replace(/[{}]/g, '')}}`;
}

function kopfWert(wert: string): string {
  return wert.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Nummer und Farbe aus einer FEN: „4.“ für Weiß, „4...“ für Schwarz. */
function nummer(fen: string, immer: boolean): string {
  const [, farbe, , , , zahl] = fen.split(' ');
  if (farbe === 'w') return `${zahl ?? '1'}. `;
  return immer ? `${zahl ?? '1'}... ` : '';
}

function zug(k: Zugknoten): string {
  const nags = k.nags.map((n) => ` $${n}`).join('');
  return `${k.san}${nags}${k.kommentar ? ` ${kommentar(k.kommentar)}` : ''}`;
}

/** Schreibt eine Zugliste ab der Stellung `fen`; `nummerNoetig` erzwingt die Nummer am Anfang. */
function liste(fen: string, knoten: readonly Zugknoten[], nummerNoetig: boolean): string {
  const [haupt, ...varianten] = knoten;
  if (!haupt) return '';
  const teile = [`${nummer(fen, nummerNoetig)}${zug(haupt)}`];
  for (const v of varianten) {
    teile.push(
      `(${[`${nummer(fen, true)}${zug(v)}`, liste(v.fen, v.kinder, !!v.kommentar)].filter(Boolean).join(' ')})`,
    );
  }
  // Nach Varianten oder einem Kommentar braucht der nächste schwarze Zug wieder seine Nummer.
  const rest = liste(haupt.fen, haupt.kinder, varianten.length > 0 || !!haupt.kommentar);
  if (rest) teile.push(rest);
  return teile.join(' ');
}

export type PgnKopf = { event?: string; white?: string; black?: string };

/** Ein Repertoire als PGN-Partie mit allen Varianten. */
export function pgnSchreiben(baum: Baum, kopf: PgnKopf = {}): string {
  const zeilen = [
    `[Event "${kopfWert(kopf.event ?? '?')}"]`,
    `[White "${kopfWert(kopf.white ?? '?')}"]`,
    `[Black "${kopfWert(kopf.black ?? '?')}"]`,
    '[Result "*"]',
  ];
  if (baum.startFen !== GRUNDSTELLUNG) {
    zeilen.push('[SetUp "1"]', `[FEN "${baum.startFen}"]`);
  }
  return `${zeilen.join('\n')}\n\n${liste(baum.startFen, baum.zuege, true)} *\n`;
}
