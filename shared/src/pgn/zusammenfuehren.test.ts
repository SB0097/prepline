import { pgnLesen } from './lesen.ts';
import { alleKnoten, stellungOhneZaehler, zusammenfuehren } from './zusammenfuehren.ts';

describe('Zusammenführen', () => {
  it('trennt Partien mit unterschiedlicher Startstellung', () => {
    const { partien } = pgnLesen(
      '1. e4 e5 *\n\n[FEN "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"]\n\n4. b4 *\n\n1. d4 d5 *',
    );
    const baeume = zusammenfuehren(partien);
    expect(baeume).toHaveLength(2);
    expect(baeume[0]!.zuege.map((k) => k.san)).toEqual(['e4', 'd4']);
    expect(baeume[1]!.zuege.map((k) => k.san)).toEqual(['b4']);
  });

  it('verändert die eingelesenen Partien nicht', () => {
    const { partien } = pgnLesen('1. e4 e5 *\n\n1. e4 c5 *');
    zusammenfuehren(partien);
    expect(partien[0]!.zuege[0]!.kinder.map((k) => k.san)).toEqual(['e5']);
  });

  it('sammelt Kommentare und Bewertungen beider Partien', () => {
    const { partien } = pgnLesen('1. e4 {Klassisch} e5 *\n\n1. e4! {Bester Zug} c5 *');
    const e4 = zusammenfuehren(partien)[0]!.zuege[0]!;
    expect(e4.kommentar).toBe('Klassisch Bester Zug');
    expect(e4.nags).toEqual([1]);
    expect([...alleKnoten([e4])]).toHaveLength(3);
  });

  it('vergleicht Stellungen ohne Zugzähler', () => {
    expect(stellungOhneZaehler('8/8/8/8/8/8/8/k6K w - - 12 40')).toBe('8/8/8/8/8/8/8/k6K w - -');
  });
});
