import { readFileSync } from 'node:fs';

import { pgnLesen } from '../pgn/lesen.ts';
import { type Baum, zusammenfuehren } from '../pgn/zusammenfuehren.ts';
import { type Karte, kartenAusBaum, zugPruefen } from './karten.ts';
import {
  bewerten,
  gezeigt,
  istFaellig,
  istNeu,
  type Lernstand,
  neuerLernstand,
  sicherheit,
} from './lernstand.ts';
import { naechsterTermin, tagesplan } from './tagesplan.ts';
import { type Schritt, uebungslinie } from './uebung.ts';

const MINUTE = 60_000;
const TAG = 24 * 60 * MINUTE;
const JETZT = Date.UTC(2026, 10, 11, 10, 0);

function baumAus(pgn: string): Baum {
  return zusammenfuehren(pgnLesen(pgn).partien)[0]!;
}
const evans = baumAus(
  readFileSync(new URL('../../test/pgn/italienisch-evans.pgn', import.meta.url), 'utf8'),
);
const alsMap = (karten: Karte[]) => new Map(karten.map((k) => [k.schluessel, k]));
const kurz = (schritte: Schritt[]) => schritte.map((s) => `${s.art}:${s.san}`);

describe('Karten aus dem Zugbaum', () => {
  it('macht für jede Stellung mit eigenem Zug eine Karte (Weiß)', () => {
    const karten = kartenAusBaum(evans, 'weiss');
    expect(karten).toHaveLength(15);
    expect(karten.slice(0, 4).map((k) => k.zug)).toEqual(['e4', 'Nf3', 'Bc4', 'b4']);
    expect(karten[0]!.weg).toEqual([]);
    expect(karten[1]!.weg).toEqual(['e4', 'e5']);
  });

  it('macht Karten für Schwarz und merkt sich weitere eigene Züge als Alternativen', () => {
    const karten = kartenAusBaum(evans, 'schwarz');
    expect(karten).toHaveLength(12);
    const nachB4 = karten.find((k) => k.weg.join(' ') === 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4')!;
    expect(nachB4.zug).toBe('Bxb4');
    expect(nachB4.alternativen).toEqual(['Bb6']);
  });

  it('legt gleiche Stellungen über andere Zugfolgen zu einer Karte zusammen', () => {
    const baum = baumAus('1. e4 e5 2. Nf3 Nc6 3. Bc4 *\n\n1. Nf3 Nc6 2. e4 e5 3. Bb5 *');
    const karten = kartenAusBaum(baum, 'weiss');
    const italienisch = karten.filter((k) => k.zug === 'Bc4');
    expect(italienisch).toHaveLength(1);
    expect(italienisch[0]!.alternativen).toEqual(['Bb5']);
    expect(karten.filter((k) => k.zug === 'Bb5')).toHaveLength(0);
  });

  it('prüft gespielte Züge', () => {
    const karte = kartenAusBaum(evans, 'schwarz').find((k) => k.zug === 'Bxb4')!;
    expect(zugPruefen(karte, 'Bxb4')).toBe('richtig');
    expect(zugPruefen(karte, 'Bxb4+')).toBe('richtig');
    expect(zugPruefen(karte, 'Bb6')).toBe('alternative');
    expect(zugPruefen(karte, 'Nf6')).toBe('falsch');
  });
});

describe('Lernstand mit FSRS', () => {
  it('beginnt neu und wird beim Zeigen sofort fällig', () => {
    const neu = neuerLernstand(JETZT);
    expect(istNeu(neu)).toBe(true);
    expect(istFaellig(neu, JETZT)).toBe(false);
    const g = gezeigt(neu, JETZT);
    expect(g.gezeigt).toBe(true);
    expect(istNeu(g)).toBe(true);
    expect(sicherheit(g)).toBe('neu');
  });

  it('richtig: erst kurz lernen, dann wachsen die Abstände', () => {
    let s = bewerten(gezeigt(neuerLernstand(JETZT), JETZT), true, JETZT);
    expect(s.zustand).toBe(1);
    expect(s.faellig - JETZT).toBe(10 * MINUTE);

    s = bewerten(s, true, s.faellig);
    expect(s.zustand).toBe(2);
    const ersterAbstand = s.tageGeplant;
    expect(ersterAbstand).toBeGreaterThanOrEqual(1);

    s = bewerten(s, true, s.faellig);
    expect(s.tageGeplant).toBeGreaterThan(ersterAbstand);
  });

  it('falsch: kommt bald wieder und zählt als vergessen', () => {
    let s = bewerten(gezeigt(neuerLernstand(JETZT), JETZT), true, JETZT);
    s = bewerten(s, true, s.faellig);
    s = bewerten(s, true, s.faellig);
    const vorher = s.tageGeplant;
    s = bewerten(s, false, s.faellig);
    expect(s.zustand).toBe(3);
    expect(s.vergessen).toBe(1);
    expect(s.tageGeplant).toBeLessThan(vorher);
    expect(sicherheit(s)).toBe('lernen');
  });

  it('wird nach vielen richtigen Wiederholungen „sicher“', () => {
    let s = bewerten(gezeigt(neuerLernstand(JETZT), JETZT), true, JETZT);
    for (let i = 0; i < 6; i++) s = bewerten(s, true, s.faellig);
    expect(sicherheit(s)).toBe('sicher');
  });

  it('lässt sich als reine Zahlen speichern und wieder laden', () => {
    const s = bewerten(gezeigt(neuerLernstand(JETZT), JETZT), true, JETZT);
    const geladen = JSON.parse(JSON.stringify(s)) as Lernstand;
    expect(bewerten(geladen, true, s.faellig)).toEqual(bewerten(s, true, s.faellig));
  });
});

describe('Tagesplan', () => {
  const karten = kartenAusBaum(evans, 'weiss');

  it('nimmt höchstens 10 neue Karten pro Tag, in Baum-Reihenfolge', () => {
    const plan = tagesplan(karten, new Map(), JETZT);
    expect(plan.faellig).toEqual([]);
    expect(plan.neu).toEqual(karten.slice(0, 10).map((k) => k.schluessel));
  });

  it('beachtet die Einstellung (5 bis 30) und schon eingeführte Karten', () => {
    expect(tagesplan(karten, new Map(), JETZT, { neuProTag: 2 }).neu).toHaveLength(5);
    expect(tagesplan(karten, new Map(), JETZT, { neuProTag: 12 }).neu).toHaveLength(12);
    expect(
      tagesplan(karten, new Map(), JETZT, { neuProTag: 10, heuteSchonEingefuehrt: 8 }).neu,
    ).toHaveLength(2);
    expect(tagesplan(karten, new Map(), JETZT, { heuteSchonEingefuehrt: 30 }).neu).toHaveLength(0);
  });

  it('listet fällige Karten, die am längsten überfälligen zuerst', () => {
    const [a, b, c] = karten;
    const lernend = bewerten(gezeigt(neuerLernstand(JETZT), JETZT), true, JETZT);
    const staende = new Map<string, Lernstand>([
      [a!.schluessel, { ...lernend, faellig: JETZT - TAG }],
      [b!.schluessel, { ...lernend, faellig: JETZT - 3 * TAG }],
      [c!.schluessel, { ...lernend, faellig: JETZT + TAG }],
    ]);
    const plan = tagesplan(karten, staende, JETZT);
    expect(plan.faellig).toEqual([b!.schluessel, a!.schluessel]);
    expect(plan.neu).not.toContain(c!.schluessel);
    expect(naechsterTermin(karten, staende, JETZT)).toBe(JETZT + TAG);
  });

  it('führt schon gezeigte, noch nicht gelernte Karten getrennt und ohne Limit', () => {
    const letzte = karten[karten.length - 1]!;
    const staende = new Map([[letzte.schluessel, gezeigt(neuerLernstand(JETZT), JETZT)]]);
    const plan = tagesplan(karten, staende, JETZT, { heuteSchonEingefuehrt: 10 });
    expect(plan.neu).toEqual([]);
    expect(plan.angefangen).toEqual([letzte.schluessel]);
    // Auch mit freiem Limit wird die Karte nicht noch einmal als neu eingeplant.
    expect(tagesplan(karten, staende, JETZT, { neuProTag: 30 }).neu).not.toContain(
      letzte.schluessel,
    );
  });
});

describe('Übungslinie', () => {
  const karten = kartenAusBaum(evans, 'weiss');
  const map = alsMap(karten);
  const keiner = new Set<string>();

  it('spielt ab Zug 1, zeigt neue Züge und endet, wenn nichts mehr ansteht', () => {
    const neu = new Set(karten.slice(0, 3).map((k) => k.schluessel));
    const linie = uebungslinie(evans, 'weiss', map, { faellig: keiner, neu });
    expect(kurz(linie)).toEqual(['neu:e4', 'gegner:e5', 'neu:Nf3', 'gegner:Nc6', 'neu:Bc4']);
    expect(linie[0]!.karte).toBe(karten[0]!.schluessel);
    expect(linie[1]!.karte).toBeUndefined();
  });

  it('wählt die Gegnerantwort, hinter der etwas fällig ist', () => {
    const a4 = karten.find((k) => k.zug === 'a4')!;
    const linie = uebungslinie(evans, 'weiss', map, {
      faellig: new Set([a4.schluessel]),
      neu: keiner,
    });
    expect(kurz(linie)).toEqual([
      'mitspielen:e4',
      'gegner:e5',
      'mitspielen:Nf3',
      'gegner:Nc6',
      'mitspielen:Bc4',
      'gegner:Bc5',
      'mitspielen:b4',
      'gegner:Bb6',
      'abfrage:a4',
    ]);
  });

  it('entscheidet bei Gleichstand per Zufall', () => {
    const d4 = karten.filter((k) => k.zug === 'd4').map((k) => k.schluessel);
    expect(d4).toHaveLength(2);
    const auswahl = { faellig: new Set(d4), neu: keiner };
    const erste = uebungslinie(evans, 'weiss', map, auswahl, () => 0);
    const letzte = uebungslinie(evans, 'weiss', map, auswahl, () => 0.99);
    expect(kurz(erste).at(-2)).toBe('gegner:Ba5');
    expect(kurz(letzte).at(-2)).toBe('gegner:Be7');
  });

  it('endet nach einem Häppchen neuer Züge', () => {
    const neu = new Set(karten.map((k) => k.schluessel));
    const linie = uebungslinie(evans, 'weiss', map, { faellig: keiner, neu, maxNeu: 2 });
    expect(kurz(linie)).toEqual(['neu:e4', 'gegner:e5', 'neu:Nf3']);
  });

  it('geht zuerst dorthin, wo Karten Vorrang haben', () => {
    const d4 = karten.filter((k) => k.zug === 'd4').map((k) => k.schluessel);
    const auswahl = { faellig: new Set(d4), neu: keiner };
    const hinterBe7 = uebungslinie(evans, 'weiss', map, auswahl, () => 0.99).at(-1)!.karte!;
    // Ohne Vorrang entscheidet der Zufall (hier: die erste Antwort), mit Vorrang die Karte.
    const linie = uebungslinie(
      evans,
      'weiss',
      map,
      { ...auswahl, vorrang: new Set([hinterBe7]) },
      () => 0,
    );
    expect(kurz(linie).at(-2)).toBe('gegner:Be7');
  });

  it('liefert eine leere Linie, wenn heute nichts mehr dran ist', () => {
    expect(uebungslinie(evans, 'weiss', map, { faellig: keiner, neu: keiner })).toEqual([]);
  });

  it('funktioniert auch als Schwarz (erster Zug vom Gegner)', () => {
    const schwarz = kartenAusBaum(evans, 'schwarz');
    const linie = uebungslinie(evans, 'schwarz', alsMap(schwarz), {
      faellig: keiner,
      neu: new Set([schwarz[0]!.schluessel]),
    });
    expect(kurz(linie)).toEqual(['gegner:e4', 'neu:e5']);
  });
});
