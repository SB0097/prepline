import { fehlerText, nameAusDatei } from './fehlerText';

describe('Texte beim Import', () => {
  it('beschreibt ungültige Züge in deutscher Notation', () => {
    expect(
      fehlerText({ art: 'zug_ungueltig', partie: 2, san: 'Bxf7', zugnummer: 12, amZug: 'weiss' }),
    ).toBe('Partie 2, Zug 12: Lxf7 ist nicht möglich');
    expect(fehlerText({ art: 'keine_zuege' })).toBe('Keine Züge gefunden');
  });

  it('macht aus dem Dateinamen einen Namensvorschlag', () => {
    expect(nameAusDatei('Italienisch Evans.pgn')).toBe('Italienisch Evans');
    expect(nameAusDatei(undefined)).toBe('');
  });
});
