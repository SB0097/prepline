import { brettGroesse, platzUnterBrett } from './brettGroesse';

describe('brettGroesse', () => {
  it('nimmt die volle Breite, solange die Höhe unbekannt ist', () => {
    expect(brettGroesse(412, null)).toBe(376);
  });

  it('nimmt die volle Breite auf großen Handys', () => {
    expect(brettGroesse(412, 640)).toBe(376);
  });

  it('wird auf kleinen Handys kleiner, damit die Rückmeldung sichtbar bleibt', () => {
    const groesse = brettGroesse(360, 420);
    expect(groesse).toBeLessThan(324);
    expect(groesse + 28 + platzUnterBrett(1)).toBeLessThanOrEqual(420);
  });

  it('wird nie kleiner als 240', () => {
    expect(brettGroesse(360, 200)).toBe(240);
  });

  it('ist auf sehr schmalen Bildschirmen höchstens so breit wie der Platz', () => {
    expect(brettGroesse(250, 100)).toBe(214);
  });

  it('lässt bei großer Schrift mehr Platz unter dem Brett', () => {
    expect(platzUnterBrett(2)).toBeGreaterThan(platzUnterBrett(1));
    expect(brettGroesse(360, 500, 2)).toBeLessThan(brettGroesse(360, 500, 1));
  });
});
