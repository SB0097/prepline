import { schriftWachstum } from './Text';

describe('schriftWachstum', () => {
  it('lässt normalen Text voll mitwachsen', () => {
    expect(schriftWachstum(undefined)).toBeUndefined();
    expect(schriftWachstum(15)).toBeUndefined();
    expect(schriftWachstum(19.5)).toBeUndefined();
  });

  it('bremst große Schrift', () => {
    expect(schriftWachstum(20)).toBe(1.6);
    expect(schriftWachstum(24)).toBe(1.6);
    expect(schriftWachstum(28)).toBe(1.3);
    expect(schriftWachstum(96)).toBe(1.3);
  });
});
