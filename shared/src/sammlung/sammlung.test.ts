import { Chess } from 'chess.js';

import { kartenAusBaum, amZug } from '../lernen/karten.ts';
import { pgnLesen } from '../pgn/lesen.ts';
import { alleKnoten } from '../pgn/zusammenfuehren.ts';
import {
  erklaerungen,
  erklaerungFuer,
  erklaerungsSchluessel,
  SAMMLUNG,
  sammlungsBaum,
  sammlungsEintrag,
} from './index.ts';

describe('Sammlung', () => {
  it('hat eindeutige, feste Schlüssel', () => {
    const ids = SAMMLUNG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      'italienisch-evans',
      'london',
      'damengambit',
      'skandinavisch',
      'caro-kann',
      'sizilianisch-najdorf',
    ]);
  });

  it.each(SAMMLUNG.map((e) => [e.id, e] as const))('%s: alle Züge sind regelgerecht', (_, e) => {
    const { partien, fehler } = pgnLesen(e.pgn);
    expect(fehler).toEqual([]);
    expect(partien).toHaveLength(1);
    const baum = sammlungsBaum(e);
    expect(kartenAusBaum(baum, e.seite).length).toBeGreaterThan(5);
  });

  it.each(SAMMLUNG.map((e) => [e.id, e] as const))(
    '%s: jede Erklärung gehört zu einem eigenen Zug im Baum',
    (_, e) => {
      const baum = sammlungsBaum(e);
      const imBaum = new Set<string>();
      const gehe = (liste: typeof baum.zuege, fen: string) => {
        for (const k of liste) {
          imBaum.add(erklaerungsSchluessel(fen, k.san));
          gehe(k.kinder, k.fen);
        }
      };
      gehe(baum.zuege, baum.startFen);
      for (const erkl of e.erklaerungen) {
        const schach = new Chess();
        const zuege = erkl.zuege.split(' ');
        for (const san of zuege.slice(0, -1)) schach.move(san);
        const fen = schach.fen();
        const schluessel = erklaerungsSchluessel(fen, zuege.at(-1)!);
        expect({ zuege: erkl.zuege, imBaum: imBaum.has(schluessel) }).toEqual({
          zuege: erkl.zuege,
          imBaum: true,
        });
        expect({ zuege: erkl.zuege, seite: amZug(fen) }).toEqual({
          zuege: erkl.zuege,
          seite: e.seite,
        });
        expect(erkl.de.length).toBeGreaterThan(10);
        expect(erkl.en.length).toBeGreaterThan(10);
      }
      expect(erklaerungen(e).size).toBe(e.erklaerungen.length);
      expect([...alleKnoten(baum.zuege)].length).toBeGreaterThan(5);
    },
  );

  it('findet die Erklärung zum Evansgambit', () => {
    const schach = new Chess();
    for (const san of ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5']) schach.move(san);
    expect(erklaerungFuer('italienisch-evans', schach.fen(), 'b4')?.de).toMatch(/^Das Evansgambit/);
    expect(erklaerungFuer('italienisch-evans', schach.fen(), 'c3')).toBeUndefined();
    expect(erklaerungFuer('gibt-es-nicht', schach.fen(), 'b4')).toBeUndefined();
    expect(sammlungsEintrag('london')?.stufe).toBe('einsteiger');
  });
});
