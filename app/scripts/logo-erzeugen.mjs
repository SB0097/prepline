// Erzeugt das App-Logo „Coach-Bauer“ als SVG und PNG (Icon, adaptives Android-Icon,
// einfarbiges Icon, Startbild, Store-Icon, Favicon).
//
// Aufruf (SVG → PNG mit resvg, läuft ohne Browser):
//   npm run logo -w app
// Schreibt nach app/assets/logo/ (SVG-Quellen) und app/assets/images/ bzw. app/assets/store/.
// Form und Farben kommen aus src/ui/logo/logoDaten.ts – dieselben wie in der App.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import {
  BAUER_AUGEN,
  BAUER_MUND,
  BAUER_UMRISS,
  LOGO_BEREICH,
  LOGO_FARBEN,
  STRICH,
} from '../src/ui/logo/logoDaten.ts';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Logo-Inhalt im 100er Raster. „einfarbig“: alles weiß (Android-Designsymbole). „leer“: nichts. */
function logoInhalt({ einfarbig = false, leer = false } = {}) {
  if (leer) return '';
  const akzent = einfarbig ? '#FFFFFF' : LOGO_FARBEN.akzent;
  const hell = einfarbig ? '#FFFFFF' : LOGO_FARBEN.hell;
  const fuellung = einfarbig ? 'none' : LOGO_FARBEN.hintergrund;
  return `${einfarbig ? '' : `<path d="${BAUER_UMRISS}" fill="none" stroke="${akzent}" stroke-opacity="0.28" stroke-width="${STRICH.leuchten}" stroke-linejoin="round"/>`}
    <path d="${BAUER_UMRISS}" fill="${fuellung}" stroke="${akzent}" stroke-width="${einfarbig ? 5 : STRICH.linie}" stroke-linejoin="round"/>
    ${BAUER_AUGEN.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${STRICH.augen}" fill="${hell}"/>`).join('')}
    <path d="${BAUER_MUND}" fill="none" stroke="${hell}" stroke-width="${STRICH.mund}" stroke-linecap="round"/>`;
}

/** Quadratisches SVG; „anteil“ = wie viel der Breite das Logo (inkl. Rahmen) einnimmt. */
function svg(groesse, inhalt, { anteil, hintergrund }) {
  const s = (groesse * anteil) / LOGO_BEREICH.breite;
  const mitteX = LOGO_BEREICH.x + LOGO_BEREICH.breite / 2;
  const mitteY = LOGO_BEREICH.y + LOGO_BEREICH.breite / 2;
  const tx = groesse / 2 - mitteX * s;
  const ty = groesse / 2 - mitteY * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${groesse}" height="${groesse}" viewBox="0 0 ${groesse} ${groesse}">${
    hintergrund ? `<rect width="${groesse}" height="${groesse}" fill="${hintergrund}"/>` : ''
  }<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(4)})">${inhalt}</g></svg>`;
}

const HG = LOGO_FARBEN.hintergrund;
const AUSGABEN = [
  // App-Icon (iOS/alt): volle Fläche mit Hintergrund
  { datei: 'images/icon.png', groesse: 1024, anteil: 0.74, hintergrund: HG },
  // Android adaptiv: sicher sichtbar ist nur ein Kreis mit 66 % Durchmesser.
  // Der Bauer (inkl. Leuchten) muss mit den Ecken seines Rahmens hineinpassen: ≈ 0,56.
  { datei: 'images/android-icon-foreground.png', groesse: 1024, anteil: 0.56 },
  { datei: 'images/android-icon-monochrome.png', groesse: 1024, anteil: 0.56, einfarbig: true },
  // Startbild bleibt leer: Die Start-Animation zeichnet den Bauern selbst (Serkan 11.11.2026).
  { datei: 'images/splash-icon.png', groesse: 640, anteil: 0.6, leer: true },
  // Store-Icon für die Play Console (512×512, Google rundet selbst)
  { datei: 'store/icon-512.png', groesse: 512, anteil: 0.74, hintergrund: HG },
  // Webseite/Favicon
  { datei: 'images/favicon.png', groesse: 48, anteil: 0.9, hintergrund: HG },
];

for (const ordner of ['logo', 'images', 'store']) {
  mkdirSync(join(app, 'assets', ordner), { recursive: true });
}

for (const a of AUSGABEN) {
  const quelle = svg(a.groesse, logoInhalt({ einfarbig: a.einfarbig, leer: a.leer }), a);
  const name = a.datei.split('/').pop().replace('.png', '');
  writeFileSync(join(app, 'assets', 'logo', `${name}.svg`), quelle);
  const png = new Resvg(quelle, { background: 'rgba(0,0,0,0)' }).render().asPng();
  writeFileSync(join(app, 'assets', a.datei), png);
  console.log(`✓ ${a.datei}`);
}
