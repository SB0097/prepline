import { DUNKEL, type Farben, HELL } from './farben';
import { farbenFuer } from './thema';

describe('Farbschema', () => {
  it('folgt automatisch dem Handy', () => {
    expect(farbenFuer('automatisch', 'light')).toBe(HELL);
    expect(farbenFuer('automatisch', 'dark')).toBe(DUNKEL);
    // Ohne Angabe des Handys bleibt die App dunkel wie bisher.
    expect(farbenFuer('automatisch', null)).toBe(DUNKEL);
  });

  it('nimmt eine feste Wahl unabhängig vom Handy', () => {
    expect(farbenFuer('hell', 'dark')).toBe(HELL);
    expect(farbenFuer('dunkel', 'light')).toBe(DUNKEL);
  });

  it('hat in beiden Schemata dieselben Farben', () => {
    expect(Object.keys(HELL).sort()).toEqual(Object.keys(DUNKEL).sort());
  });
});

/** Relative Helligkeit nach WCAG 2.1 für #RRGGBB. */
function helligkeit(hex: string): number {
  const kanal = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * kanal(1) + 0.7152 * kanal(3) + 0.0722 * kanal(5);
}

function kontrast(a: string, b: string): number {
  const [hell, dunkel] = [helligkeit(a), helligkeit(b)].sort((x, y) => y - x) as [number, number];
  return (hell + 0.05) / (dunkel + 0.05);
}

describe.each([
  ['dunkel', DUNKEL],
  ['hell', HELL],
] as [string, Farben][])('Kontrast im Schema %s', (_, F) => {
  it.each([
    ['Text auf Grund', F.text, F.hintergrund],
    ['Text auf Karte', F.text, F.karte],
    ['leiser Text auf Grund', F.textLeise, F.hintergrund],
    ['leiser Text auf Karte', F.textLeise, F.karte],
    ['Akzent-Text auf Karte', F.akzentHell, F.karte],
    ['Akzent auf Grund', F.akzent, F.hintergrund],
    ['Grün (gelernt, richtig) auf Karte', F.richtig, F.karte],
    ['Gelb (fällig) auf Karte', F.hinweis, F.karte],
    ['Rot (falsch) auf Karte', F.falsch, F.karte],
  ])('%s mindestens 4,5:1', (_name, vorne, hinten) => {
    expect(kontrast(vorne, hinten)).toBeGreaterThanOrEqual(4.5);
  });

  it('Schrift auf dem Hauptknopf mindestens 3:1 (große, fette Schrift)', () => {
    expect(kontrast(F.textAufKnopf, F.knopfBis)).toBeGreaterThanOrEqual(3);
  });
});
