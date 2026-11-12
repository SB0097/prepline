import { GRUNDSTELLUNG } from '../pgn/lesen.ts';
import {
  brettfelder,
  feldAusIndex,
  felderAusUci,
  indexAusFeld,
  istHellesFeld,
  zielfelder,
  zugAusFeldern,
} from './brett.ts';

// Italienisch nach 3...Lc5, Weiß am Zug
const ITALIENISCH = 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';

describe('Felder und Ansicht', () => {
  it('zeigt aus Sicht von Weiß a8 oben links und h1 unten rechts', () => {
    expect(feldAusIndex(0, 'weiss')).toBe('a8');
    expect(feldAusIndex(7, 'weiss')).toBe('h8');
    expect(feldAusIndex(63, 'weiss')).toBe('h1');
  });

  it('dreht das Brett aus Sicht von Schwarz', () => {
    expect(feldAusIndex(0, 'schwarz')).toBe('h1');
    expect(feldAusIndex(63, 'schwarz')).toBe('a8');
  });

  it('rechnet Feld und Position in beide Richtungen um', () => {
    for (const ansicht of ['weiss', 'schwarz'] as const) {
      for (let i = 0; i < 64; i++) expect(indexAusFeld(feldAusIndex(i, ansicht), ansicht)).toBe(i);
    }
  });

  it('kennt helle und dunkle Felder', () => {
    expect(istHellesFeld('a1')).toBe(false);
    expect(istHellesFeld('h1')).toBe(true);
    expect(istHellesFeld('d1')).toBe(true);
    expect(istHellesFeld('e1')).toBe(false);
  });

  it('liefert alle Figuren der Grundstellung', () => {
    const felder = brettfelder(GRUNDSTELLUNG, 'weiss');
    expect(felder).toHaveLength(64);
    expect(felder[0]).toEqual({ feld: 'a8', figur: { farbe: 'b', typ: 'r' }, hell: true });
    expect(felder[60]).toEqual({ feld: 'e1', figur: { farbe: 'w', typ: 'k' }, hell: false });
    expect(felder.filter((f) => f.figur).length).toBe(32);
  });
});

describe('Züge auf dem Brett', () => {
  it('nennt die erlaubten Zielfelder einer Figur', () => {
    expect(zielfelder(ITALIENISCH, 'b2').sort()).toEqual(['b3', 'b4']);
    expect(zielfelder(ITALIENISCH, 'e1').sort()).toEqual(['e2', 'f1', 'g1']);
  });

  it('gibt keine Zielfelder für leere Felder oder Figuren des Gegners', () => {
    expect(zielfelder(ITALIENISCH, 'e3')).toEqual([]);
    expect(zielfelder(ITALIENISCH, 'c5')).toEqual([]);
  });

  it('macht aus Start- und Zielfeld einen Zug', () => {
    expect(zugAusFeldern(ITALIENISCH, 'b2', 'b4')).toMatchObject({ san: 'b4', uci: 'b2b4' });
    expect(zugAusFeldern(ITALIENISCH, 'e1', 'g1')).toMatchObject({ san: 'O-O', uci: 'e1g1' });
    expect(zugAusFeldern(ITALIENISCH, 'b2', 'b5')).toBeNull();
  });

  it('wandelt Bauern in eine Dame um', () => {
    const fen = '8/P6k/8/8/8/8/8/K7 w - - 0 1';
    expect(zugAusFeldern(fen, 'a7', 'a8')).toMatchObject({ san: 'a8=Q', uci: 'a7a8q' });
  });

  it('liest Start- und Zielfeld aus einem UCI-Zug', () => {
    expect(felderAusUci('e7e8q')).toEqual(['e7', 'e8']);
  });
});
