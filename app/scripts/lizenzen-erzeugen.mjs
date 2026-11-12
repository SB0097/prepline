// Sammelt die Lizenzen aller Pakete, die wirklich in der App landen, und schreibt sie nach
// src/features/info/lizenzenDaten.ts:
// - alle Pakete im JavaScript-Bündel (aus der Source-Map eines Android-Exports) und
// - alle direkten Abhängigkeiten von app und shared (die bringen teils nativen Code mit).
// Entwicklungswerkzeuge (Metro, Babel, …) landen nicht in der App und fehlen deshalb bewusst.
// Aufruf: npm run lizenzen -w app (nach jedem Paket-Update erneut ausführen)
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const wurzel = join(app, '..');
const ZIEL = join(app, 'src', 'features', 'info', 'lizenzenDaten.ts');
/** Nur in Entwicklungs-Builds enthalten, nicht in der Store-Version. */
const NUR_ENTWICKLUNG = new Set(['expo-dev-client', '@expo/cli', '@expo/devtools']);

function paketeImBuendel() {
  const ordner = mkdtempSync(join(tmpdir(), 'prepline-export-'));
  try {
    execSync(`npx expo export --platform android --source-maps --output-dir "${ordner}"`, {
      cwd: app,
      stdio: 'ignore',
    });
    const suche = (o) =>
      readdirSync(o, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? suche(join(o, e.name)) : e.name.endsWith('.map') ? [join(o, e.name)] : [],
      );
    const namen = new Set();
    for (const datei of suche(ordner)) {
      for (const quelle of JSON.parse(readFileSync(datei, 'utf8')).sources) {
        const pfad = quelle.replace(/\\/g, '/');
        const i = pfad.lastIndexOf('node_modules/');
        if (i < 0) continue;
        const teile = pfad.slice(i + 'node_modules/'.length).split('/');
        namen.add(teile[0].startsWith('@') ? `${teile[0]}/${teile[1]}` : teile[0]);
      }
    }
    return namen;
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
}

function direkteAbhaengigkeiten() {
  const namen = new Set();
  for (const bereich of ['app', 'shared']) {
    const pkg = JSON.parse(readFileSync(join(wurzel, bereich, 'package.json'), 'utf8'));
    for (const n of Object.keys(pkg.dependencies ?? {}))
      if (!n.startsWith('@prepline/')) namen.add(n);
  }
  return namen;
}

function paketOrdner(name) {
  for (const basis of [app, wurzel]) {
    const ordner = join(basis, 'node_modules', name);
    if (existsSync(join(ordner, 'package.json'))) return ordner;
  }
  return null;
}

function lizenztext(ordner) {
  const datei = readdirSync(ordner).find((d) => /^(licen[cs]e|copying)(\.|$)/i.test(d));
  return datei ? readFileSync(join(ordner, datei), 'utf8').replace(/\r\n/g, '\n').trim() : '';
}

/** Teilpakete ohne eigene Lizenzdatei stehen unter der Lizenz ihres Hauptprojekts. */
function hauptprojekt(name) {
  if (name.startsWith('@react-native/')) return 'react-native';
  if (name.startsWith('expo-') || name.startsWith('@expo/')) return 'expo';
  return null;
}

const MIT_TEXT = `MIT License

Copyright (c) <URHEBER>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;

const namen = new Set([...paketeImBuendel(), ...direkteAbhaengigkeiten()]);
const pakete = [];
for (const name of namen) {
  if (NUR_ENTWICKLUNG.has(name)) continue;
  const ordner = paketOrdner(name);
  if (!ordner) continue;
  const pkg = JSON.parse(readFileSync(join(ordner, 'package.json'), 'utf8'));
  const lizenz =
    typeof pkg.license === 'string'
      ? pkg.license
      : (pkg.license?.type ?? pkg.licenses?.[0]?.type ?? '?');
  let text = lizenztext(ordner);
  const haupt = hauptprojekt(name);
  if (!text && haupt && paketOrdner(haupt)) text = lizenztext(paketOrdner(haupt));
  // Ohne Datei, aber als MIT ausgewiesen: Standardtext mit dem Urheber aus package.json
  if (!text && lizenz === 'MIT') {
    const urheber = typeof pkg.author === 'string' ? pkg.author : (pkg.author?.name ?? pkg.name);
    text = MIT_TEXT.replace('<URHEBER>', urheber.replace(/s*<[^>]*>/, ''));
  }
  pakete.push({ name: pkg.name, version: pkg.version, lizenz, text });
}
pakete.sort((a, b) => a.name.localeCompare(b.name));

const texte = [];
const textIndex = new Map();
const eintraege = pakete.map((p) => {
  let i = textIndex.get(p.text);
  if (i === undefined) {
    i = texte.length;
    texte.push(p.text);
    textIndex.set(p.text, i);
  }
  return [p.name, p.version, p.lizenz, i];
});

// Figurensätze: Texte aus assets/figuren (siehe LIZENZEN.md)
const figurenOrdner = join(app, 'assets', 'figuren');
const lesen = (datei) => readFileSync(datei, 'utf8').replace(/\r\n/g, '\n');
const figurenMd = lesen(join(figurenOrdner, 'LIZENZEN.md'));
const abschnitt = (titel) => {
  const start = figurenMd.indexOf(`## ${titel}`);
  const ende = figurenMd.indexOf('\n## ', start + 3);
  return figurenMd
    .slice(start, ende < 0 ? undefined : ende)
    .split('\n')
    .slice(1)
    .join('\n')
    .trim();
};
const figuren = [
  ['Klassisch – Cburnett', 'BSD-3-Clause', abschnitt('Cburnett – BSD-3-Clause')],
  [
    'Modern – Chessnut',
    'Apache-2.0',
    `Copyright © Alexis Luengas\n\n${lesen(join(figurenOrdner, 'modern', 'LICENSE-Apache-2.0.txt')).trim()}`,
  ],
  ['Verspielt – RhosGFX', 'CC0-1.0', 'Gemeinfrei (CC0 1.0), keine Bedingungen.'],
];

writeFileSync(
  ZIEL,
  '// Automatisch erzeugt mit `npm run lizenzen -w app` – nicht von Hand ändern.\n\n' +
    '/** [Name, Version, Lizenz, Index in LIZENZTEXTE] */\n' +
    `export const PAKETE: readonly (readonly [string, string, string, number])[] = ${JSON.stringify(eintraege)};\n\n` +
    `export const LIZENZTEXTE: readonly string[] = ${JSON.stringify(texte)};\n\n` +
    '/** [Titel, Lizenz, Text] */\n' +
    `export const FIGUREN_LIZENZEN: readonly (readonly [string, string, string])[] = ${JSON.stringify(figuren)};\n`,
);
const ohneText = pakete.filter((p) => !p.text).map((p) => `${p.name} (${p.lizenz})`);
console.log(`✓ ${pakete.length} Pakete → src/features/info/lizenzenDaten.ts`);
if (ohneText.length) console.log(`  ohne Lizenzdatei: ${ohneText.join(', ')}`);
