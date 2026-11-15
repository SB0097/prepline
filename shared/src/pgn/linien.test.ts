import { pgnLesen } from './lesen.ts';
import { linienAusBaum, linienKurztext, zugfolgeText } from './linien.ts';
import { zusammenfuehren } from './zusammenfuehren.ts';

const baum = zusammenfuehren(
  pgnLesen('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 (3... Nf6 4. Ng5) 4. b4 Bxb4 (4... Bb6 5. a4) 5. c3 *')
    .partien,
)[0]!;

describe('Linien', () => {
  it('listet Hauptlinie und Varianten mit Abzweigung', () => {
    const linien = linienAusBaum(baum);
    expect(linien.map((l) => [l.knoten.map((k) => k.san).join(' '), l.abzweig])).toEqual([
      ['e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3', 0],
      ['e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bb6 a4', 7],
      ['e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5', 5],
    ]);
  });

  it('schreibt Zugfolgen mit Nummern in deutscher Notation', () => {
    const [haupt] = linienAusBaum(baum);
    expect(zugfolgeText(baum.startFen, haupt!.knoten.slice(0, 5))).toBe(
      '1. e4 e5 2. Sf3 Sc6 3. Lc4',
    );
    expect(zugfolgeText(haupt!.knoten[4]!.fen, haupt!.knoten.slice(5, 7))).toBe('3… Lc5 4. b4');
  });

  it('kürzt Linien für die Liste', () => {
    const [haupt, evans, zwei] = linienAusBaum(baum);
    expect(linienKurztext(baum, haupt!)).toBe('1. e4 e5 2. Sf3 Sc6 3. Lc4 Lc5 …');
    expect(linienKurztext(baum, evans!)).toBe('… 4. b4 Lb6 5. a4');
    expect(linienKurztext(baum, zwei!)).toBe('… 3. Lc4 Sf6 4. Sg5');
  });
});
