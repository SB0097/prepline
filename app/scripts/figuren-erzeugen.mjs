// Liest die Figuren-SVGs aus assets/figuren und schreibt sie als Texte nach
// src/ui/brett/figurenSvg.ts. CSS-Klassen werden dabei in style-Attribute umgewandelt,
// damit react-native-svg (SvgXml) sie ohne CSS-Unterstützung zeichnen kann.
// Aufruf: npm run figuren -w app
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const QUELLE = new URL('../assets/figuren/', import.meta.url);
const ZIEL = new URL('../src/ui/brett/figurenSvg.ts', import.meta.url);
const SAETZE = ['klassisch', 'modern', 'verspielt'];
const FIGUREN = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];

function vereinfachen(svg) {
  const regeln = new Map();
  for (const [, inhalt] of svg.matchAll(/<style>([^<]*)<\/style>/g)) {
    for (const [, namen, erklaerung] of inhalt.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      for (const name of namen.split(',')) {
        const klasse = name.trim();
        if (!klasse.startsWith('.')) throw new Error(`Unbekannte CSS-Regel: ${name}`);
        regeln.set(klasse.slice(1), erklaerung.trim());
      }
    }
  }
  return (
    svg
      .replace(/<\?xml[^>]*\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<!DOCTYPE[^>]*>/g, '')
      .replace(/<defs>\s*<style>[^<]*<\/style>\s*<\/defs>/g, '')
      .replace(/<style>[^<]*<\/style>/g, '')
      .replace(/ style="color-scheme:light only"/g, '')
      .replace(
        /<([a-z]+)([^>]*?) class="([^"]+)"([^>]*?)(\/?)>/g,
        (_, tag, vor, klassen, nach, ende) => {
          const stil = klassen
            .split(/\s+/)
            .map((k) => {
              const regel = regeln.get(k);
              if (regel === undefined) throw new Error(`Klasse ohne Regel: ${k}`);
              return regel;
            })
            .join(';');
          const rest = `${vor}${nach}`;
          const vorhanden = rest.match(/ style="([^"]*)"/);
          const ohneStil = rest.replace(/ style="[^"]*"/, '');
          const gesamt = vorhanden ? `${stil};${vorhanden[1]}` : stil;
          return `<${tag}${ohneStil} style="${gesamt}"${ende}>`;
        },
      )
      // Ohne viewBox ließe sich die Figur nicht auf Feldgröße skalieren.
      .replace(/<svg([^>]*?)\s+width="(\d+)"\s+height="(\d+)"/, (ganz, rest, b, h) =>
        ganz.includes('viewBox') ? ganz : `<svg${rest} viewBox="0 0 ${b} ${h}"`,
      )
      .replace(/\s+/g, ' ')
      .replace(/> </g, '><')
      .trim()
  );
}

let ausgabe =
  '// Automatisch erzeugt mit `npm run figuren -w app` aus assets/figuren – nicht von Hand ändern.\n' +
  '// Herkunft und Lizenzen: assets/figuren/LIZENZEN.md\n\n' +
  "import type { Figurensatz, FigurName } from './figuren';\n\n" +
  'export const FIGUREN_SVG: Record<Figurensatz, Record<FigurName, string>> = {\n';
for (const satz of SAETZE) {
  const vorhanden = readdirSync(new URL(`${satz}/`, QUELLE));
  ausgabe += `  ${satz}: {\n`;
  for (const figur of FIGUREN) {
    if (!vorhanden.includes(`${figur}.svg`)) throw new Error(`${satz}/${figur}.svg fehlt`);
    const svg = vereinfachen(readFileSync(new URL(`${satz}/${figur}.svg`, QUELLE), 'utf8'));
    ausgabe += `    ${figur}: ${JSON.stringify(svg)},\n`;
  }
  ausgabe += '  },\n';
}
ausgabe += '};\n';
writeFileSync(ZIEL, ausgabe);
console.log(`✓ ${SAETZE.length} Figurensätze → src/ui/brett/figurenSvg.ts`);
