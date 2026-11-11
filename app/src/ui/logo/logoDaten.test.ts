import { BRETT, feldMitte, GITTER_PFAD, KOENIG, MATTZUG } from './logoDaten';

describe('Logo-Daten', () => {
  it('rechnet Felder in Brett-Koordinaten um (a8 oben links)', () => {
    expect(feldMitte('a', 8)).toEqual([6, 6]);
    expect(feldMitte('h', 1)).toEqual([90, 90]);
  });

  it('zeichnet den Mattzug d1–h5–f7 und den König auf e8', () => {
    expect(MATTZUG).toEqual([
      [42, 90],
      [90, 42],
      [66, 18],
    ]);
    expect(KOENIG).toEqual([54, 6]);
  });

  it('hat 9 senkrechte und 9 waagerechte Linien über das ganze Brett', () => {
    expect(GITTER_PFAD.match(/V/g)).toHaveLength(9);
    expect(GITTER_PFAD.match(/H/g)).toHaveLength(9);
    expect(GITTER_PFAD).toContain(`M${BRETT} 0V${BRETT}`);
  });
});
