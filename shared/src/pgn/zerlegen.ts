// Zerlegt den Text einer PGN-Datei in Bausteine (Kopfzeilen, Züge, Kommentare, Klammern …).
// Nach dem PGN-Standard, aber großzügig bei Formaten aus der Praxis (Lichess, ChessBase, Hand).

export type Baustein =
  | { typ: 'kopf'; name: string; wert: string }
  | { typ: 'zug'; san: string; nags: number[] }
  | { typ: 'kommentar'; text: string }
  | { typ: 'nag'; nummer: number }
  | { typ: 'auf' }
  | { typ: 'zu' }
  | { typ: 'ergebnis' }
  | { typ: 'kommentar_offen' }
  | { typ: 'unbekannt'; text: string };

/** Bewertungszeichen direkt am Zug ("e4!", "Nf6?!") als NAG-Nummern. */
const ZEICHEN_NAG: Record<string, number> = { '!': 1, '?': 2, '!!': 3, '??': 4, '!?': 5, '?!': 6 };

const ERGEBNISSE = new Set(['1-0', '0-1', '1/2-1/2', '½-½', '*']);

/** Grob: alles, was nach einem Zug aussieht (Figur, Feld, Schlagen, Rochade, Umwandlung, Schach). */
const ZUG = /^(?:[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=?[QRBN])?|O-O(?:-O)?|0-0(?:-0)?)[+#]?$/;

export function zerlegen(text: string): Baustein[] {
  const t = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const bausteine: Baustein[] = [];
  let i = 0;
  let zeilenanfang = true;

  while (i < t.length) {
    const c = t[i]!;

    // Escape-Zeilen ("%" am Zeilenanfang) werden laut Standard übersprungen.
    if (zeilenanfang && c === '%') {
      i = zeilenende(t, i);
      continue;
    }
    if (c === '\n') {
      zeilenanfang = true;
      i++;
      continue;
    }
    zeilenanfang = false;
    if (/\s/.test(c)) {
      i++;
      continue;
    }

    if (c === '[') {
      const ende = t.indexOf(']', i);
      const inhalt = ende === -1 ? t.slice(i + 1) : t.slice(i + 1, ende);
      const kopf = /^\s*([A-Za-z0-9_]+)\s+"((?:[^"\\]|\\.)*)"\s*$/.exec(inhalt);
      if (kopf) {
        bausteine.push({ typ: 'kopf', name: kopf[1]!, wert: kopf[2]!.replace(/\\(["\\])/g, '$1') });
      } else {
        bausteine.push({ typ: 'unbekannt', text: `[${inhalt}]` });
      }
      i = ende === -1 ? t.length : ende + 1;
      continue;
    }

    if (c === '{') {
      const ende = t.indexOf('}', i);
      if (ende === -1) {
        bausteine.push({ typ: 'kommentar_offen' });
        bausteine.push({ typ: 'kommentar', text: t.slice(i + 1) });
        break;
      }
      bausteine.push({ typ: 'kommentar', text: t.slice(i + 1, ende) });
      i = ende + 1;
      continue;
    }

    if (c === ';') {
      const ende = zeilenende(t, i);
      bausteine.push({ typ: 'kommentar', text: t.slice(i + 1, ende) });
      i = ende;
      continue;
    }

    if (c === '(') {
      bausteine.push({ typ: 'auf' });
      i++;
      continue;
    }
    if (c === ')') {
      bausteine.push({ typ: 'zu' });
      i++;
      continue;
    }

    // Ein „Wort“ bis zum nächsten Leerzeichen oder Sonderzeichen.
    let j = i;
    while (j < t.length && !/[\s{}();[\]]/.test(t[j]!)) j++;
    const wort = t.slice(i, j);
    i = j;
    bausteine.push(...wortDeuten(wort));
  }
  return bausteine;
}

function zeilenende(t: string, ab: number): number {
  const n = t.indexOf('\n', ab);
  return n === -1 ? t.length : n;
}

/** Deutet ein Wort: Zugnummer, Ergebnis, NAG, Zug (auch "12.e4" zusammengeschrieben). */
function wortDeuten(wort: string): Baustein[] {
  if (ERGEBNISSE.has(wort)) return [{ typ: 'ergebnis' }];
  if (/^\$\d+$/.test(wort)) return [{ typ: 'nag', nummer: Number(wort.slice(1)) }];
  if (ZEICHEN_NAG[wort] !== undefined) return [{ typ: 'nag', nummer: ZEICHEN_NAG[wort] }];

  // Zugnummer vorne abtrennen: "12.", "12...", "12.e4", "12…Nf6"
  const nummer = /^\d+(?:\.+|…)(.*)$/.exec(wort);
  if (nummer) {
    const rest = nummer[1]!;
    return rest === '' ? [] : wortDeuten(rest);
  }
  // Reine Zahl ohne Punkt (manche Programme lassen ihn weg)
  if (/^\d+$/.test(wort)) return [];

  // Bewertungszeichen am Zug abtrennen: "e4!?", "Nf6?"
  const zeichen = /^(.*?)([!?]{1,2})$/.exec(wort);
  const roh = zeichen ? zeichen[1]! : wort;
  const nags: number[] = [];
  if (zeichen && ZEICHEN_NAG[zeichen[2]!] !== undefined) nags.push(ZEICHEN_NAG[zeichen[2]!]!);

  const san = roh.replace(/^0-0-0/, 'O-O-O').replace(/^0-0/, 'O-O');
  if (ZUG.test(san)) return [{ typ: 'zug', san, nags }];
  return [{ typ: 'unbekannt', text: wort }];
}
