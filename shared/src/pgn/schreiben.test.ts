import { readFileSync } from 'node:fs';

import { SAMMLUNG, sammlungsBaum } from '../sammlung/index.ts';
import { pgnLesen } from './lesen.ts';
import { pgnSchreiben } from './schreiben.ts';
import { zusammenfuehren } from './zusammenfuehren.ts';

const baumAus = (pgn: string) => zusammenfuehren(pgnLesen(pgn).partien)[0]!;

describe('PGN schreiben', () => {
  it('schreibt Hauptlinie und Varianten mit Zugnummern', () => {
    const baum = baumAus('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 (4... Bb6 5. a4) 5. c3 *');
    const pgn = pgnSchreiben(baum, { event: 'Evans' });
    expect(pgn).toContain('[Event "Evans"]');
    expect(pgn).toContain('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 (4... Bb6 5. a4) 5. c3 *');
  });

  it('schreibt Kommentare und Bewertungen', () => {
    const baum = baumAus('1. e4 {Gut} e5 2. Nf3! *');
    expect(pgnSchreiben(baum)).toContain('1. e4 {Gut} 1... e5 2. Nf3 $1 *');
  });

  it('übernimmt eine eigene Startstellung', () => {
    const fen = 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
    const baum = baumAus(`[FEN "${fen}"]\n\n4. b4 Bxb4 *`);
    const pgn = pgnSchreiben(baum);
    expect(pgn).toContain(`[FEN "${fen}"]`);
    expect(pgn).toContain('4. b4 Bxb4 *');
  });

  it.each([
    [
      'Testdatei Italienisch',
      readFileSync(new URL('../../test/pgn/italienisch-evans.pgn', import.meta.url), 'utf8'),
    ],
    [
      'Lichess-Studie',
      readFileSync(new URL('../../test/pgn/lichess-studie.pgn', import.meta.url), 'utf8'),
    ],
    ...SAMMLUNG.map((e) => [e.id, e.pgn] as [string, string]),
  ])('%s: wieder eingelesen ergibt sich derselbe Zugbaum', (_, pgn) => {
    const baum = zusammenfuehren(pgnLesen(pgn).partien)[0]!;
    const zurueck = pgnLesen(pgnSchreiben(baum));
    expect(zurueck.fehler).toEqual([]);
    expect(zusammenfuehren(zurueck.partien)[0]).toEqual(baum);
  });

  it('nutzt den Baum der Sammlung ohne ihn zu verändern', () => {
    const baum = sammlungsBaum(SAMMLUNG[0]!);
    const vorher = JSON.stringify(baum);
    pgnSchreiben(baum);
    expect(JSON.stringify(baum)).toBe(vorher);
  });
});
