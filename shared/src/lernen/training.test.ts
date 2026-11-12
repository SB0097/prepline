import { readFileSync } from 'node:fs';

import { pgnLesen } from '../pgn/lesen.ts';
import { type Baum, zusammenfuehren } from '../pgn/zusammenfuehren.ts';
import { kartenAusBaum } from './karten.ts';
import {
  aktuellerSchritt,
  eigenerZug,
  type Ereignis,
  gegnerZiehen,
  lernphase,
  type Runde,
  rundeFertig,
  rundenFortschritt,
  rundeStarten,
  tippNehmen,
} from './training.ts';

function baumAus(pgn: string): Baum {
  return zusammenfuehren(pgnLesen(pgn).partien)[0]!;
}
const EVANS = baumAus('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 (4... Bb6 5. a4) 5. c3 *');
const KARTEN = kartenAusBaum(EVANS, 'weiss');
const schluessel = (san: string) => KARTEN.find((k) => k.zug === san)!.schluessel;
const immerErster = () => 0;
const plan = (teile: { faellig?: string[]; neu?: string[]; angefangen?: string[] }) => ({
  faellig: teile.faellig ?? [],
  neu: teile.neu ?? [],
  angefangen: teile.angefangen ?? [],
});

/** Spielt Gegnerzüge automatisch und gibt den nächsten eigenen Schritt zurück. */
function bisEigenerZug(runde: Runde): Runde {
  let r = runde;
  while (aktuellerSchritt(r)?.art === 'gegner') r = gegnerZiehen(r);
  return r;
}

function spielen(runde: Runde, san: string) {
  return eigenerZug(bisEigenerZug(runde), san);
}

/** Spielt mehrere eigene Züge richtig und sammelt, was gespeichert würde. */
function alleSpielen(runde: Runde, zuege: string[]): { runde: Runde; ereignisse: Ereignis[] } {
  let r = runde;
  const ereignisse: Ereignis[] = [];
  for (const san of zuege) {
    const ergebnis = spielen(r, san);
    expect(ergebnis.rueckmeldung).toBe('richtig');
    ereignisse.push(...ergebnis.ereignisse);
    r = ergebnis.runde;
  }
  return { runde: r, ereignisse };
}

const arten = (runde: Runde) => bisEigenerZug(runde).linie.map((s) => `${s.art}:${s.san}`);
const bewertet = (san: string, richtig: boolean): Ereignis => ({
  art: 'bewertet',
  karte: schluessel(san),
  richtig,
});

describe('Neue Züge lernen', () => {
  const DREI_NEUE = plan({ neu: [schluessel('e4'), schluessel('Nf3'), schluessel('Bc4')] });
  const starten = () =>
    rundeStarten(EVANS, 'weiss', KARTEN, DREI_NEUE, immerErster, { haeppchen: 2 });

  it('zeigt ein Häppchen, ruft es sofort ab und baut die Linie dann weiter auf', () => {
    let r = starten();
    // 1. Durchgang: nur zwei neue Züge, dann ist Schluss.
    expect(arten(r)).toEqual(['neu:e4', 'gegner:e5', 'neu:Nf3']);
    let schritt = alleSpielen(r, ['e4', 'Nf3']);
    expect(schritt.ereignisse.map((e) => e.art)).toEqual(['gezeigt', 'gezeigt']);
    r = schritt.runde;

    // 2. Durchgang: beide aus dem Kopf, danach kommt der dritte neue Zug dazu.
    expect(arten(r)).toEqual(['abfrage:e4', 'gegner:e5', 'abfrage:Nf3', 'gegner:Nc6', 'neu:Bc4']);
    schritt = alleSpielen(r, ['e4', 'Nf3', 'Bc4']);
    // Einmal richtig reicht noch nicht für eine Bewertung.
    expect(schritt.ereignisse).toEqual([{ art: 'gezeigt', karte: schluessel('Bc4') }]);
    r = schritt.runde;

    // 3. Durchgang: zweiter Treffer für die ersten beiden, erster für den dritten.
    expect(arten(r).filter((a) => !a.startsWith('gegner'))).toEqual([
      'abfrage:e4',
      'abfrage:Nf3',
      'abfrage:Bc4',
    ]);
    schritt = alleSpielen(r, ['e4', 'Nf3', 'Bc4']);
    expect(schritt.ereignisse).toEqual([bewertet('e4', true), bewertet('Nf3', true)]);
    r = schritt.runde;

    // 4. Durchgang: Gelerntes wird nur noch mitgespielt, der dritte Zug bekommt seinen zweiten Treffer.
    expect(arten(r).filter((a) => !a.startsWith('gegner'))).toEqual([
      'mitspielen:e4',
      'mitspielen:Nf3',
      'abfrage:Bc4',
    ]);
    schritt = alleSpielen(r, ['e4', 'Nf3', 'Bc4']);
    expect(schritt.ereignisse).toEqual([bewertet('Bc4', true)]);
    expect(rundeFertig(schritt.runde)).toBe(true);
    expect(rundenFortschritt(schritt.runde)).toEqual({ erledigt: 3, gesamt: 3, anteil: 1 });
  });

  it('festigt nach einem Fehler erst, bevor weitere neue Züge kommen', () => {
    let r = alleSpielen(starten(), ['e4', 'Nf3']).runde;
    const falsch = spielen(r, 'd4');
    expect(falsch).toMatchObject({ rueckmeldung: 'falsch', ereignisse: [] });
    expect(falsch.runde.nachspielen).toBe(true);
    // Der dritte neue Zug ist aus diesem Durchgang verschwunden.
    expect(arten(falsch.runde)).toEqual(['abfrage:e4', 'gegner:e5', 'abfrage:Nf3']);

    // Nachspielen zählt nicht als Treffer.
    r = alleSpielen(falsch.runde, ['e4', 'Nf3']).runde;
    // Nächster Durchgang: wieder von vorn, jetzt kommt auch der dritte Zug.
    let schritt = alleSpielen(r, ['e4', 'Nf3', 'Bc4']);
    expect(schritt.ereignisse).toEqual([
      bewertet('Nf3', true),
      { art: 'gezeigt', karte: schluessel('Bc4') },
    ]);
    // Der Zug mit dem Fehler braucht zwei Treffer nach dem Fehler und wird als „falsch“ bewertet.
    schritt = alleSpielen(schritt.runde, ['e4', 'Nf3', 'Bc4']);
    expect(schritt.ereignisse).toEqual([bewertet('e4', false)]);
  });

  it('wertet einen Tipp beim Abrufen als nicht gewusst', () => {
    let r = rundeStarten(EVANS, 'weiss', KARTEN, plan({ neu: [schluessel('e4')] }));
    r = alleSpielen(r, ['e4']).runde;
    const mitTipp = eigenerZug(tippNehmen(r)!.runde, 'e4');
    expect(mitTipp).toMatchObject({ rueckmeldung: 'richtig', ereignisse: [] });
    const schritt = alleSpielen(mitTipp.runde, ['e4', 'e4']);
    expect(schritt.ereignisse).toEqual([bewertet('e4', false)]);
    expect(rundeFertig(schritt.runde)).toBe(true);
  });

  it('verlangt beim Zeigen genau den gezeigten Zug', () => {
    const r = rundeStarten(EVANS, 'weiss', KARTEN, plan({ neu: [schluessel('e4')] }));
    const falsch = eigenerZug(r, 'd4');
    expect(falsch).toMatchObject({ rueckmeldung: 'falsch', ereignisse: [] });
    expect(eigenerZug(falsch.runde, 'e4').ereignisse).toEqual([
      { art: 'gezeigt', karte: schluessel('e4') },
    ]);
  });

  it('fragt schon früher gezeigte Züge ab, statt sie noch einmal zu zeigen', () => {
    // Runde gestern abgebrochen: e4 wurde gezeigt, aber noch nicht gelernt.
    const r = rundeStarten(EVANS, 'weiss', KARTEN, plan({ angefangen: [schluessel('e4')] }));
    expect(aktuellerSchritt(r)).toMatchObject({ art: 'abfrage', san: 'e4' });
    const schritt = alleSpielen(r, ['e4', 'e4']);
    expect(schritt.ereignisse).toEqual([bewertet('e4', true)]);
    expect(rundeFertig(schritt.runde)).toBe(true);
  });

  it('nennt die Lernphase mit Zählung im laufenden Durchgang', () => {
    let r = starten();
    expect(lernphase(r)).toEqual({ art: 'neu', nummer: 1, anzahl: 2 });
    r = bisEigenerZug(spielen(r, 'e4').runde);
    expect(lernphase(r)).toEqual({ art: 'neu', nummer: 2, anzahl: 2 });
    // Nächster Durchgang: erst zwei Züge aus dem Kopf, dann ein neuer.
    r = bisEigenerZug(spielen(r, 'Nf3').runde);
    expect(aktuellerSchritt(r)).toMatchObject({ art: 'abfrage', frisch: true });
    expect(lernphase(r)).toEqual({ art: 'abrufen', nummer: 1, anzahl: 2 });
    r = bisEigenerZug(alleSpielen(r, ['e4', 'Nf3']).runde);
    expect(lernphase(r)).toEqual({ art: 'neu', nummer: 1, anzahl: 1 });
  });

  it('nennt bei fälligen Wiederholungen und Gegnerzügen keine Lernphase', () => {
    const r = rundeStarten(
      EVANS,
      'weiss',
      KARTEN,
      plan({ faellig: [schluessel('Nf3')] }),
      immerErster,
    );
    // 1. e4 wird nur mitgespielt, dann zieht der Gegner, dann kommt die Wiederholung.
    expect(lernphase(r)).toBeNull();
    const nachE4 = eigenerZug(r, 'e4').runde;
    expect(aktuellerSchritt(nachE4)?.art).toBe('gegner');
    expect(lernphase(nachE4)).toBeNull();
    const wiederholung = bisEigenerZug(nachE4);
    expect(aktuellerSchritt(wiederholung)).toMatchObject({ art: 'abfrage', san: 'Nf3' });
    expect(aktuellerSchritt(wiederholung)?.frisch).toBeUndefined();
    expect(lernphase(wiederholung)).toBeNull();
  });

  it('lässt den Balken schon beim Zeigen und Abrufen wachsen', () => {
    let r = rundeStarten(EVANS, 'weiss', KARTEN, plan({ neu: [schluessel('e4')] }));
    expect(rundenFortschritt(r)).toEqual({ erledigt: 0, gesamt: 1, anteil: 0 });
    r = alleSpielen(r, ['e4']).runde;
    expect(rundenFortschritt(r).anteil).toBeCloseTo(1 / 3);
    r = alleSpielen(r, ['e4']).runde;
    expect(rundenFortschritt(r).anteil).toBeCloseTo(2 / 3);
    expect(rundenFortschritt(r).erledigt).toBe(0);
  });
});

describe('Fällige Wiederholungen', () => {
  it('bewertet die erste Antwort', () => {
    const r = rundeStarten(EVANS, 'weiss', KARTEN, plan({ faellig: [schluessel('e4')] }));
    const ergebnis = eigenerZug(r, 'e4');
    expect(ergebnis.ereignisse).toEqual([bewertet('e4', true)]);
    expect(rundeFertig(ergebnis.runde)).toBe(true);
  });

  it('lässt nach einem Fehler nachspielen und fragt die Stellung noch einmal ab', () => {
    let r = rundeStarten(EVANS, 'weiss', KARTEN, plan({ faellig: [schluessel('e4')] }));
    const falsch = eigenerZug(r, 'd4');
    expect(falsch.rueckmeldung).toBe('falsch');
    expect(falsch.ereignisse).toEqual([bewertet('e4', false)]);
    expect(falsch.runde.nachspielen).toBe(true);

    // Nachspielen: kein weiteres Ereignis, danach kommt die Stellung noch einmal.
    const nach = eigenerZug(falsch.runde, 'e4');
    expect(nach).toMatchObject({ rueckmeldung: 'richtig', ereignisse: [] });
    r = nach.runde;
    expect(aktuellerSchritt(r)).toMatchObject({ art: 'abfrage', san: 'e4' });
    const zweiter = eigenerZug(r, 'e4');
    expect(zweiter.ereignisse).toEqual([]);
    expect(rundeFertig(zweiter.runde)).toBe(true);
    expect(rundenFortschritt(zweiter.runde)).toMatchObject({ erledigt: 1, gesamt: 1 });
  });

  it('nimmt einen anderen Zug aus der PGN nicht als Fehler', () => {
    const baum = baumAus('1. e4 e5 2. Nf3 (2. Bc4) Nc6 *');
    const karten = kartenAusBaum(baum, 'weiss');
    const nachE5 = karten.find((k) => k.zug === 'Nf3')!.schluessel;
    let r = rundeStarten(baum, 'weiss', karten, plan({ faellig: [nachE5] }));
    // 1. e4 ist heute nicht dran, wird aber mitgespielt.
    expect(aktuellerSchritt(r)).toMatchObject({ art: 'mitspielen', san: 'e4' });
    r = eigenerZug(r, 'e4').runde;
    const anders = spielen(r, 'Bc4');
    expect(anders).toMatchObject({ rueckmeldung: 'alternative', ereignisse: [] });
    const richtig = eigenerZug(anders.runde, 'Nf3');
    expect(richtig.ereignisse).toEqual([{ art: 'bewertet', karte: nachE5, richtig: true }]);
  });

  it('wertet einen Tipp als nicht gewusst', () => {
    const r = rundeStarten(EVANS, 'weiss', KARTEN, plan({ faellig: [schluessel('e4')] }));
    const tipp = tippNehmen(r)!;
    expect(tipp.feld).toBe('e2');
    const ergebnis = eigenerZug(tipp.runde, 'e4');
    expect(ergebnis.ereignisse).toEqual([bewertet('e4', false)]);
    // Die Stellung kommt noch einmal.
    expect(aktuellerSchritt(ergebnis.runde)).toMatchObject({ art: 'abfrage', san: 'e4' });
  });

  it('kommt vor neuen Zügen dran, die dahinter liegen', () => {
    const r = rundeStarten(
      EVANS,
      'weiss',
      KARTEN,
      plan({ faellig: [schluessel('e4')], neu: [schluessel('Nf3')] }),
    );
    expect(arten(r)).toEqual(['abfrage:e4', 'gegner:e5', 'neu:Nf3']);
  });

  it('ist sofort fertig, wenn nichts ansteht', () => {
    const r = rundeStarten(EVANS, 'weiss', KARTEN, plan({}));
    expect(rundeFertig(r)).toBe(true);
    expect(rundenFortschritt(r)).toEqual({ erledigt: 0, gesamt: 0, anteil: 1 });
  });
});

describe('Ganze Eröffnung mit Varianten', () => {
  const baum = baumAus(
    readFileSync(new URL('../../test/pgn/italienisch-evans.pgn', import.meta.url), 'utf8'),
  );

  /** Gleichmäßiger, wiederholbarer Zufall für die Wahl der Gegnerantworten. */
  function zufallAus(start: number): () => number {
    let wert = start;
    return () => {
      wert = (wert * 1103515245 + 12345) % 2147483648;
      return wert / 2147483648;
    };
  }

  it.each([
    ['weiss', 1],
    ['weiss', 7],
    ['schwarz', 3],
  ] as const)('lernt jede Karte genau einmal (%s, Zufall %i)', (seite, start) => {
    const karten = kartenAusBaum(baum, seite);
    let r = rundeStarten(
      baum,
      seite,
      karten,
      plan({ neu: karten.map((k) => k.schluessel) }),
      zufallAus(start),
    );
    const gezeigt = new Map<string, number>();
    const gelernt = new Map<string, boolean>();
    let neuInDieserLinie = 0;
    let schritte = 0;
    while (!rundeFertig(r)) {
      // Sicherung gegen Endlosschleifen: weit mehr Schritte, als je nötig sind.
      expect(++schritte).toBeLessThan(20_000);
      const schritt = aktuellerSchritt(r)!;
      if (r.index === 0) neuInDieserLinie = 0;
      if (schritt.art === 'gegner') {
        r = gegnerZiehen(r);
        continue;
      }
      if (schritt.art === 'neu') expect(++neuInDieserLinie).toBeLessThanOrEqual(3);
      const ergebnis = eigenerZug(r, schritt.san);
      expect(ergebnis.rueckmeldung).toBe('richtig');
      for (const e of ergebnis.ereignisse) {
        if (e.art === 'gezeigt') gezeigt.set(e.karte, (gezeigt.get(e.karte) ?? 0) + 1);
        else {
          expect(gelernt.has(e.karte)).toBe(false);
          gelernt.set(e.karte, e.richtig);
        }
      }
      r = ergebnis.runde;
    }
    expect([...gezeigt.values()].every((n) => n === 1)).toBe(true);
    expect(gelernt.size).toBe(gezeigt.size);
    expect([...gelernt.values()].every(Boolean)).toBe(true);
    // Als Schwarz enthält diese PGN eigene Alternativzüge; Linien dahinter werden nicht geübt
    // (bekannte Grenze), deshalb sind dort nicht alle Karten erreichbar.
    if (seite === 'weiss') {
      expect(gezeigt.size).toBe(karten.length);
      expect(rundenFortschritt(r)).toEqual({
        erledigt: karten.length,
        gesamt: karten.length,
        anteil: 1,
      });
    } else {
      expect(gezeigt.size).toBeGreaterThan(0);
    }
  });
});
