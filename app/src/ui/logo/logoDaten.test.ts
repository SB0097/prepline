import { BAUER_AUGEN, BAUER_UMRISS, LOGO_BEREICH, LOGO_FARBEN } from './logoDaten';

describe('Logo-Daten', () => {
  it('nutzt die Farben des Stils „Graphit“', () => {
    expect(LOGO_FARBEN).toMatchObject({ akzent: '#6C8CFF', hintergrund: '#0D0E11' });
  });

  it('hat einen Umriss aus vier Teilen und zwei Augen im Kopf', () => {
    expect(BAUER_UMRISS.match(/M/g)).toHaveLength(4);
    for (const [x, y] of BAUER_AUGEN) {
      // Kopf: Kreis um (50, 25) mit Radius 17
      expect(Math.hypot(x - 50, y - 25)).toBeLessThan(17);
    }
  });

  it('ist ein Quadrat, in das der Bauer samt Leuchten passt', () => {
    const { x, y, breite } = LOGO_BEREICH;
    expect(x).toBeLessThanOrEqual(20 - 6);
    expect(x + breite).toBeGreaterThanOrEqual(84 + 6);
    expect(y).toBeLessThanOrEqual(8 - 6);
    expect(y + breite).toBeGreaterThanOrEqual(96 + 6);
  });
});
