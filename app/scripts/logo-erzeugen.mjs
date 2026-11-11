// Erzeugt das App-Logo „Linienbrett“ als SVG und PNG (Icon, adaptives Android-Icon,
// einfarbiges Icon, Startbild, Store-Icon, Favicon).
//
// Aufruf (SVG → PNG mit resvg, läuft ohne Browser):
//   npm run logo -w app
// Schreibt nach app/assets/logo/ (SVG-Quellen) und app/assets/images/ bzw. app/assets/store/.
// Maße und Farben kommen aus src/ui/logo/logoDaten.ts – dieselben wie in der App.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import {
  BRETT,
  GITTER_PFAD,
  KOENIG,
  LOGO_BEREICH,
  LOGO_FARBEN,
  MATTZUG,
  MATTZUG_PFAD,
  RAHMEN,
} from '../src/ui/logo/logoDaten.ts';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const [start, , ziel] = MATTZUG;

/** Logo-Inhalt in Brett-Einheiten. „einfarbig“: alles weiß (Android-Designsymbole). */
function logoInhalt({ einfarbig = false } = {}) {
  const akzent = einfarbig ? '#FFFFFF' : LOGO_FARBEN.akzent;
  const gitter = einfarbig ? '#FFFFFF' : LOGO_FARBEN.gitter;
  const hell = einfarbig ? '#FFFFFF' : LOGO_FARBEN.hell;
  const rahmen = RAHMEN.map(
    (r) =>
      `<rect x="${-r.abstand}" y="${-r.abstand}" width="${BRETT + 2 * r.abstand}" height="${BRETT + 2 * r.abstand}" rx="${r.rundung}" fill="none" stroke="${akzent}" stroke-opacity="${r.deckkraft}" stroke-width="${r.staerke}"/>`,
  ).join('');
  return `${rahmen}
    <path d="${GITTER_PFAD}" fill="none" stroke="${gitter}" stroke-opacity="${einfarbig ? 0.5 : 1}" stroke-width="${einfarbig ? 1.6 : 1.2}"/>
    <path d="${MATTZUG_PFAD}" fill="none" stroke="${akzent}" stroke-width="${einfarbig ? 5.5 : 4.5}" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${start[0]}" cy="${start[1]}" r="3.5" fill="${hell}"/>
    <circle cx="${ziel[0]}" cy="${ziel[1]}" r="5" fill="${akzent}"/>
    <circle cx="${KOENIG[0]}" cy="${KOENIG[1]}" r="5" fill="none" stroke="${hell}" stroke-width="1.5"/>`;
}

/** Quadratisches SVG; „anteil“ = wie viel der Breite das Logo (inkl. Rahmen) einnimmt. */
function svg(groesse, inhalt, { anteil, hintergrund }) {
  const s = (groesse * anteil) / LOGO_BEREICH.breite;
  const mitte = LOGO_BEREICH.x + LOGO_BEREICH.breite / 2;
  const t = groesse / 2 - mitte * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${groesse}" height="${groesse}" viewBox="0 0 ${groesse} ${groesse}">${
    hintergrund ? `<rect width="${groesse}" height="${groesse}" fill="${hintergrund}"/>` : ''
  }<g transform="translate(${t.toFixed(2)} ${t.toFixed(2)}) scale(${s.toFixed(4)})">${inhalt}</g></svg>`;
}

const HG = LOGO_FARBEN.hintergrund;
const AUSGABEN = [
  // App-Icon (iOS/alt): volle Fläche mit Hintergrund
  { datei: 'images/icon.png', groesse: 1024, anteil: 0.74, hintergrund: HG },
  // Android adaptiv: sicher sichtbar ist nur ein Kreis mit 66 % Durchmesser.
  // Das quadratische Brett muss mit den Ecken hineinpassen: 0,66 / √2 ≈ 0,46.
  { datei: 'images/android-icon-foreground.png', groesse: 1024, anteil: 0.46 },
  { datei: 'images/android-icon-monochrome.png', groesse: 1024, anteil: 0.46, einfarbig: true },
  // Startbild (Android 12+ zeigt es im Kreis, deshalb mit Rand)
  { datei: 'images/splash-icon.png', groesse: 640, anteil: 0.6 },
  // Store-Icon für die Play Console (512×512, Google rundet selbst)
  { datei: 'store/icon-512.png', groesse: 512, anteil: 0.74, hintergrund: HG },
  // Webseite/Favicon
  { datei: 'images/favicon.png', groesse: 48, anteil: 0.9, hintergrund: HG },
];

for (const ordner of ['logo', 'images', 'store']) {
  mkdirSync(join(app, 'assets', ordner), { recursive: true });
}

for (const a of AUSGABEN) {
  const quelle = svg(a.groesse, logoInhalt({ einfarbig: a.einfarbig }), a);
  const name = a.datei.split('/').pop().replace('.png', '');
  writeFileSync(join(app, 'assets', 'logo', `${name}.svg`), quelle);
  const png = new Resvg(quelle, { background: 'rgba(0,0,0,0)' }).render().asPng();
  writeFileSync(join(app, 'assets', a.datei), png);
  console.log(`✓ ${a.datei}`);
}
