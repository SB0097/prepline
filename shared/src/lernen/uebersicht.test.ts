import { pgnLesen } from '../pgn/lesen.ts';
import { zusammenfuehren } from '../pgn/zusammenfuehren.ts';
import { kartenAusBaum } from './karten.ts';
import { bewerten, gezeigt, neuerLernstand } from './lernstand.ts';
import { fortschritt, hauptlinieEnde, importVorschau, nameAusKopf } from './uebersicht.ts';

const JETZT = Date.UTC(2026, 10, 11, 10, 0);
const EVANS = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 (4... Bb6 5. a4) 5. c3 *';

describe('Übersicht', () => {
  it('findet die Stellung am Ende der Hauptlinie', () => {
    const baum = zusammenfuehren(pgnLesen(EVANS).partien)[0]!;
    expect(hauptlinieEnde(baum)).toBe(
      'r1bqk1nr/pppp1ppp/2n5/4p3/1bB1P3/2P2N2/P2P1PPP/RNBQK2R b KQkq - 0 5',
    );
  });

  it('zählt neue, fällige und sichere Stellungen', () => {
    const baum = zusammenfuehren(pgnLesen(EVANS).partien)[0]!;
    const karten = kartenAusBaum(baum, 'weiss');
    const gelernt = bewerten(gezeigt(neuerLernstand(JETZT), JETZT), true, JETZT);
    const staende = new Map([[karten[0]!.schluessel, gelernt]]);
    // Direkt nach dem Lernen ist die Karte noch nicht wieder fällig, aber auch nicht mehr neu.
    expect(fortschritt(karten, staende, JETZT)).toEqual({
      stellungen: 6,
      faellig: 0,
      neu: 5,
      angefangen: 0,
      sicher: 0,
    });
    // Gezeigt, aber noch nicht gelernt: zählt weiter als neu und zusätzlich als angefangen.
    const nurGezeigt = new Map([[karten[1]!.schluessel, gezeigt(neuerLernstand(JETZT), JETZT)]]);
    expect(fortschritt(karten, nurGezeigt, JETZT)).toMatchObject({ neu: 6, angefangen: 1 });
    expect(fortschritt(karten, staende, JETZT + 365 * 86_400_000).faellig).toBe(1);
  });

  it('schlägt einen Namen aus den Kopfzeilen vor', () => {
    const mit = (kopf: string) => nameAusKopf(pgnLesen(`${kopf}\n\n1. e4 *`).partien);
    expect(mit('[Event "?"]\n[Opening "Italian Game: Evans Gambit"]')).toBe(
      'Italian Game: Evans Gambit',
    );
    expect(mit('[Event "Study: Mein Italienisch"]')).toBe('Mein Italienisch');
    expect(mit('[Event "?"]')).toBe('');
  });

  it('fasst einen Import vorab zusammen', () => {
    const v = importVorschau(`[Event "Evans"]\n\n${EVANS}`, 'weiss');
    expect(v).toMatchObject({ name: 'Evans', stellungen: 6, linien: 2, fehler: [] });
    expect(v.baeume).toHaveLength(1);
    // Schwarz: nach e4, Sf3, Lc4 und b4 (Lxb4 und Lb6 sind zwei Antworten auf dieselbe Stellung)
    expect(importVorschau(EVANS, 'schwarz').stellungen).toBe(4);
  });
});
