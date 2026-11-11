import { pgnLesen } from '../pgn/lesen.ts';
import { type Baum, zusammenfuehren } from '../pgn/zusammenfuehren.ts';
import { kartenAusBaum } from './karten.ts';
import {
  aktuellerSchritt,
  eigenerZug,
  type Ereignis,
  gegnerZiehen,
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

/** Spielt Gegnerzüge automatisch und gibt den nächsten eigenen Schritt zurück. */
function bisEigenerZug(runde: Runde): Runde {
  let r = runde;
  while (aktuellerSchritt(r)?.art === 'gegner') r = gegnerZiehen(r);
  return r;
}

function spielen(runde: Runde, san: string) {
  return eigenerZug(bisEigenerZug(runde), san);
}

describe('Trainingsrunde', () => {
  it('zeigt neue Züge zuerst und fragt sie danach ab', () => {
    let r = rundeStarten(
      EVANS,
      'weiss',
      KARTEN,
      { faellig: [], neu: [schluessel('e4'), schluessel('Nf3')] },
      immerErster,
    );
    expect(aktuellerSchritt(r)).toMatchObject({ art: 'neu', san: 'e4' });

    const alle: Ereignis[] = [];
    for (const san of ['e4', 'Nf3']) {
      const ergebnis = spielen(r, san);
      expect(ergebnis.rueckmeldung).toBe('richtig');
      alle.push(...ergebnis.ereignisse);
      r = ergebnis.runde;
    }
    expect(alle.map((e) => e.art)).toEqual(['gezeigt', 'gezeigt']);

    // Zweite Linie: jetzt werden beide abgefragt.
    expect(bisEigenerZug(r).linie.map((s) => s.art)).toEqual(['abfrage', 'gegner', 'abfrage']);
    for (const san of ['e4', 'Nf3']) {
      const ergebnis = spielen(r, san);
      expect(ergebnis.ereignisse).toEqual([
        { art: 'bewertet', karte: schluessel(san), richtig: true },
      ]);
      r = ergebnis.runde;
    }
    expect(rundeFertig(r)).toBe(true);
    expect(rundenFortschritt(r)).toEqual({ erledigt: 2, gesamt: 2 });
  });

  it('lässt nach einem Fehler nachspielen und fragt die Stellung noch einmal ab', () => {
    let r = rundeStarten(EVANS, 'weiss', KARTEN, { faellig: [schluessel('e4')], neu: [] });
    const falsch = eigenerZug(r, 'd4');
    expect(falsch.rueckmeldung).toBe('falsch');
    expect(falsch.ereignisse).toEqual([
      { art: 'bewertet', karte: schluessel('e4'), richtig: false },
    ]);
    expect(falsch.runde.nachspielen).toBe(true);

    // Nachspielen: kein weiteres Ereignis, danach kommt die Stellung noch einmal.
    const nach = eigenerZug(falsch.runde, 'e4');
    expect(nach).toMatchObject({ rueckmeldung: 'richtig', ereignisse: [] });
    r = nach.runde;
    expect(aktuellerSchritt(r)).toMatchObject({ art: 'abfrage', san: 'e4' });
    const zweiter = eigenerZug(r, 'e4');
    expect(zweiter.ereignisse).toEqual([]);
    expect(rundeFertig(zweiter.runde)).toBe(true);
    expect(rundenFortschritt(zweiter.runde)).toEqual({ erledigt: 1, gesamt: 1 });
  });

  it('nimmt einen anderen Zug aus der PGN nicht als Fehler', () => {
    const baum = baumAus('1. e4 e5 2. Nf3 (2. Bc4) Nc6 *');
    const karten = kartenAusBaum(baum, 'weiss');
    const nachE5 = karten.find((k) => k.zug === 'Nf3')!.schluessel;
    let r = rundeStarten(baum, 'weiss', karten, { faellig: [nachE5], neu: [] });
    // 1. e4 ist heute nicht dran, wird aber mitgespielt.
    expect(aktuellerSchritt(r)).toMatchObject({ art: 'mitspielen', san: 'e4' });
    r = eigenerZug(r, 'e4').runde;
    const anders = spielen(r, 'Bc4');
    expect(anders).toMatchObject({ rueckmeldung: 'alternative', ereignisse: [] });
    const richtig = eigenerZug(anders.runde, 'Nf3');
    expect(richtig.ereignisse).toEqual([{ art: 'bewertet', karte: nachE5, richtig: true }]);
  });

  it('wertet einen Tipp als nicht gewusst', () => {
    const r = rundeStarten(EVANS, 'weiss', KARTEN, { faellig: [schluessel('e4')], neu: [] });
    const tipp = tippNehmen(r)!;
    expect(tipp.feld).toBe('e2');
    const ergebnis = eigenerZug(tipp.runde, 'e4');
    expect(ergebnis.ereignisse).toEqual([
      { art: 'bewertet', karte: schluessel('e4'), richtig: false },
    ]);
    // Die Stellung kommt noch einmal.
    expect(aktuellerSchritt(ergebnis.runde)).toMatchObject({ art: 'abfrage', san: 'e4' });
  });

  it('verlangt bei neuen Zügen genau den gezeigten Zug', () => {
    const r = rundeStarten(EVANS, 'weiss', KARTEN, { faellig: [], neu: [schluessel('e4')] });
    const falsch = eigenerZug(r, 'd4');
    expect(falsch).toMatchObject({ rueckmeldung: 'falsch', ereignisse: [] });
    expect(eigenerZug(falsch.runde, 'e4').ereignisse).toEqual([
      { art: 'gezeigt', karte: schluessel('e4') },
    ]);
  });

  it('ist sofort fertig, wenn nichts ansteht', () => {
    const r = rundeStarten(EVANS, 'weiss', KARTEN, { faellig: [], neu: [] });
    expect(rundeFertig(r)).toBe(true);
    expect(rundenFortschritt(r)).toEqual({ erledigt: 0, gesamt: 0 });
  });
});
