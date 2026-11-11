// Linien eines Zugbaums für die Anzeige: Hauptlinie und Varianten mit der Stelle,
// an der sie von einer früheren Linie abzweigen, und Zugfolgen als Text.
import { sanAufDeutsch } from './notation.ts';
import type { Zugknoten } from './typen.ts';
import type { Baum } from './zusammenfuehren.ts';

export type Zuglinie = {
  /** Züge vom Start bis zum Ende der Linie. */
  knoten: Zugknoten[];
  /** Ab diesem Zug (Index) unterscheidet sich die Linie von den Linien davor; 0 bei der Hauptlinie. */
  abzweig: number;
};

/** Alle Linien in Baum-Reihenfolge, die Hauptlinie zuerst. */
export function linienAusBaum(baum: Baum): Zuglinie[] {
  const linien: Zuglinie[] = [];
  const gehe = (liste: Zugknoten[], weg: Zugknoten[], abzweig: number) => {
    liste.forEach((k, i) => {
      const neu = [...weg, k];
      const ab = i === 0 ? abzweig : weg.length;
      if (k.kinder.length === 0) linien.push({ knoten: neu, abzweig: ab });
      else gehe(k.kinder, neu, ab);
    });
  };
  gehe(baum.zuege, [], 0);
  return linien;
}

/**
 * Zugfolge als Text in deutscher Notation, z. B. „4. b4 Lb6 5. a4“ oder „3… Lc5 4. b4“.
 * `startFen` ist die Stellung vor dem ersten Zug von `knoten`.
 */
export function zugfolgeText(startFen: string, knoten: readonly Zugknoten[]): string {
  let fen = startFen;
  const teile: string[] = [];
  knoten.forEach((k, i) => {
    const [, farbe, , , , nummer] = fen.split(' ');
    const san = sanAufDeutsch(k.san);
    if (farbe === 'w') teile.push(`${nummer ?? '1'}. ${san}`);
    else teile.push(i === 0 ? `${nummer ?? '1'}… ${san}` : san);
    fen = k.fen;
  });
  return teile.join(' ');
}

/** Stellung vor dem Zug mit Index `index` einer Zugliste. */
export function stellungVor(startFen: string, knoten: readonly Zugknoten[], index: number): string {
  return index === 0 ? startFen : knoten[index - 1]!.fen;
}

/** Kurzer Text für eine Linie: ab einem Zug vor der Abzweigung, höchstens `laenge` Halbzüge. */
export function linienKurztext(baum: Baum, linie: Zuglinie, laenge = 6): string {
  const von = Math.max(0, linie.abzweig - 1);
  const bis = Math.min(linie.knoten.length, von + laenge);
  const text = zugfolgeText(
    stellungVor(baum.startFen, linie.knoten, von),
    linie.knoten.slice(von, bis),
  );
  return `${von > 0 ? '… ' : ''}${text}${bis < linie.knoten.length ? ' …' : ''}`;
}
