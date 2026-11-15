import { gegenseite, SEITEN, seiteAusFen } from './seite.ts';

describe('Seite', () => {
  it('kennt beide Seiten', () => {
    expect(SEITEN).toEqual(['weiss', 'schwarz']);
  });

  it('liefert den Gegner', () => {
    expect(gegenseite('weiss')).toBe('schwarz');
    expect(gegenseite('schwarz')).toBe('weiss');
  });

  it('übersetzt die FEN-Schreibweise', () => {
    expect(seiteAusFen('w')).toBe('weiss');
    expect(seiteAusFen('b')).toBe('schwarz');
  });
});
