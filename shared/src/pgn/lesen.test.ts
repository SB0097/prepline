import { readFileSync } from 'node:fs';

import { pgnLesen } from './lesen.ts';
import type { Zugknoten } from './typen.ts';
import { alleKnoten, alleLinien, zusammenfuehren } from './zusammenfuehren.ts';

const datei = (name: string) =>
  readFileSync(new URL(`../../test/pgn/${name}`, import.meta.url), 'utf8');

/** Hauptlinie (immer das erste Kind) als SAN-Liste. */
function hauptlinie(liste: Zugknoten[]): string[] {
  const zuege: string[] = [];
  let k = liste[0];
  while (k) {
    zuege.push(k.san);
    k = k.kinder[0];
  }
  return zuege;
}

/** Knoten über einen Weg aus SAN-Zügen finden. */
function knoten(liste: Zugknoten[], weg: string[]): Zugknoten {
  let aktuell: Zugknoten | undefined;
  let kinder = liste;
  for (const san of weg) {
    aktuell = kinder.find((k) => k.san === san);
    if (!aktuell) throw new Error(`Zug ${san} nicht gefunden`);
    kinder = aktuell.kinder;
  }
  return aktuell!;
}

describe('PGN mit Varianten (von Hand geschrieben)', () => {
  const { partien, fehler } = pgnLesen(datei('italienisch-evans.pgn'));
  const partie = partien[0]!;

  it('liest ohne Fehler genau eine Partie mit Kopfzeilen', () => {
    expect(fehler).toEqual([]);
    expect(partien).toHaveLength(1);
    expect(partie.kopf.Event).toBe('Italienisch mit Evansgambit');
    expect(partie.kopf.ECO).toBe('C51');
  });

  it('hat die Hauptlinie bis zum Ende', () => {
    expect(hauptlinie(partie.zuege)).toEqual(
      'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O Nge7 cxd4 d5 exd5 Nxd5'.split(' '),
    );
  });

  it('hängt Varianten als Geschwister an den richtigen Zug', () => {
    const nachB4 = knoten(partie.zuege, ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4']);
    expect(nachB4.kinder.map((k) => k.san)).toEqual(['Bxb4', 'Bb6']);
    expect(hauptlinie(nachB4.kinder[1]!.kinder)).toEqual(['a4', 'a6', 'Nc3']);

    const nachC3 = knoten(nachB4.kinder, ['Bxb4', 'c3']);
    expect(nachC3.kinder.map((k) => k.san)).toEqual(['Ba5', 'Be7']);
  });

  it('zählt alle Linien bis zum Ende', () => {
    expect(alleLinien(partie.zuege)).toHaveLength(4);
  });

  it('behält Kommentare und Bewertungszeichen', () => {
    expect(partie.kommentar).toBe('Weiß spielt auf schnelle Entwicklung und Angriff auf f7.');
    const b4 = knoten(partie.zuege, ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4']);
    expect(b4.kommentar).toBe('Das Evansgambit: Weiß gibt einen Bauern für Zeit und Zentrum.');
    const rochade = [...alleKnoten(partie.zuege)].find((k) => k.san === 'O-O')!;
    expect(rochade.nags).toEqual([1]);
  });

  it('speichert Stellung und Zug als Felder', () => {
    const e4 = partie.zuege[0]!;
    expect(e4.uci).toBe('e2e4');
    expect(e4.fen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
  });
});

describe('Lichess-Studie mit mehreren Kapiteln', () => {
  const { partien, fehler } = pgnLesen(datei('lichess-studie.pgn'));

  it('liest jedes Kapitel als eigene Partie', () => {
    expect(fehler).toEqual([]);
    expect(partien.map((p) => p.kopf.ChapterName)).toEqual([
      'Evans angenommen',
      'Evans abgelehnt',
      'Sizilianisch',
    ]);
    expect(partien[0]!.kopf.Orientation).toBe('white');
  });

  it('entfernt Lichess-Befehle aus Kommentaren', () => {
    const d4 = knoten(partien[0]!.zuege, 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4'.split(' '));
    expect(d4.kommentar).toBe('Zentrum!');
    // Nur Pfeile/Uhrzeit ohne Text: gar kein Kommentar
    const nc3 = knoten(partien[1]!.zuege, 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bb6 a4 a6 Nc3'.split(' '));
    expect(nc3.kommentar).toBeUndefined();
    expect(partien[2]!.zuege[0]!.kommentar).toBeUndefined();
  });

  it('führt die Kapitel zu einem Baum zusammen', () => {
    const baeume = zusammenfuehren(partien);
    expect(baeume).toHaveLength(1);
    const baum = baeume[0]!;
    expect(baum.zuege.map((k) => k.san)).toEqual(['e4']);
    expect(baum.zuege[0]!.kinder.map((k) => k.san)).toEqual(['e5', 'c5']);
    expect(alleLinien(baum.zuege)).toHaveLength(3);
    // Der Kommentar bleibt beim Zusammenführen erhalten
    const d4 = knoten(baum.zuege, 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4'.split(' '));
    expect(d4.kommentar).toBe('Zentrum!');
  });
});

describe('ChessBase-Stil (Windows-Zeilenenden, BOM, 12.e4, $-Zeichen, 0-0)', () => {
  const { partien, fehler } = pgnLesen(datei('chessbase-stil.pgn'));
  const partie = partien[0]!;

  it('liest alles ohne Fehler', () => {
    expect(fehler).toEqual([]);
    expect(partie.kopf.Event).toBe('Training');
    expect(hauptlinie(partie.zuege)).toEqual(
      'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O dxc3 Qb3 Qf6 e5 Qg6 Nxc3 Nge7 Ba3 O-O Rad1'.split(
        ' ',
      ),
    );
  });

  it('übernimmt Bewertungen aus Zeichen und $-Nummern', () => {
    const alle = [...alleKnoten(partie.zuege)];
    expect(alle.find((k) => k.san === 'b4')!.nags).toEqual([5]);
    expect(alle.find((k) => k.san === 'dxc3')!.nags).toEqual([6]);
    expect(alle.find((k) => k.san === 'Ba3' && k.nags.includes(14))).toBeDefined();
    expect(alle.find((k) => k.san === 'Rad1')!.nags).toEqual([1]);
  });

  it('liest Zeilen-Kommentare mit Semikolon', () => {
    const rochaden = [...alleKnoten(partie.zuege)].filter((k) => k.san === 'O-O');
    expect(rochaden.some((k) => k.kommentar === 'Rochade ins Ungewisse')).toBe(true);
  });
});

describe('Eigene Startstellung (FEN im Kopf)', () => {
  it('beginnt in der angegebenen Stellung', () => {
    const { partien, fehler } = pgnLesen(datei('eigene-startstellung.pgn'));
    expect(fehler).toEqual([]);
    expect(partien[0]!.startFen).toBe(
      'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    );
    expect(hauptlinie(partien[0]!.zuege)).toEqual(['b4', 'Bxb4', 'c3']);
  });

  it('meldet eine kaputte FEN', () => {
    const { partien, fehler } = pgnLesen('[FEN "das ist keine stellung"]\n\n1. e4 *');
    expect(partien).toEqual([]);
    expect(fehler).toContainEqual({
      art: 'fen_ungueltig',
      partie: 1,
      fen: 'das ist keine stellung',
    });
  });
});

describe('Fehlerhafte Dateien', () => {
  const { partien, fehler } = pgnLesen(datei('kaputt.pgn'));
  const partie = partien[0]!;

  it('meldet jede Stelle verständlich und der Reihe nach', () => {
    expect(fehler).toEqual([
      { art: 'zug_ungueltig', partie: 1, san: 'Ke3', zugnummer: 2, amZug: 'weiss' },
      { art: 'unbekannter_text', partie: 1, text: 'hallo' },
      { art: 'zug_ungueltig', partie: 1, san: 'Bxe8', zugnummer: 4, amZug: 'weiss' },
      { art: 'klammer_nicht_geschlossen', partie: 1 },
    ]);
  });

  it('behält alles Gültige', () => {
    expect(hauptlinie(partie.zuege)).toEqual('e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4'.split(' '));
    const nachE5 = knoten(partie.zuege, ['e4', 'e5']);
    expect(nachE5.kinder.map((k) => k.san)).toEqual(['Nf3']);
    const nachNc6 = knoten(partie.zuege, ['e4', 'e5', 'Nf3', 'Nc6']);
    expect(nachNc6.kinder.map((k) => k.san)).toEqual(['Bc4', 'Bb5']);
    expect(hauptlinie(nachNc6.kinder[1]!.kinder)).toEqual(['a6']);
    const nachB4 = knoten(partie.zuege, 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4'.split(' '));
    expect(alleLinien(nachB4.kinder)).toEqual([['Bxb4'], ['Bb6', 'a4']]);
  });

  it('meldet leere Dateien und Dateien ohne Züge', () => {
    expect(pgnLesen('')).toEqual({ partien: [], fehler: [{ art: 'keine_zuege' }] });
    expect(pgnLesen('[Event "Nur Kopf"]\n\n*').fehler).toEqual([{ art: 'keine_zuege' }]);
  });

  it('meldet Klammern ohne Anfang und Varianten ohne Zug', () => {
    expect(pgnLesen('1. e4 ) e5 *').fehler).toEqual([{ art: 'klammer_ohne_anfang', partie: 1 }]);
    expect(pgnLesen('(1. d4) 1. e4 *').fehler).toEqual([{ art: 'variante_ohne_zug', partie: 1 }]);
  });

  it('meldet einen nicht geschlossenen Kommentar', () => {
    const ergebnis = pgnLesen('1. e4 e5 {offen');
    expect(ergebnis.fehler).toEqual([{ art: 'kommentar_nicht_geschlossen', partie: 1 }]);
    expect(hauptlinie(ergebnis.partien[0]!.zuege)).toEqual(['e4', 'e5']);
  });
});

describe('Kleinigkeiten aus der Praxis', () => {
  it('legt doppelte Züge zusammen statt sie doppelt anzulegen', () => {
    const { partien } = pgnLesen('1. e4 (1. e4 c5) e5 *');
    expect(partien[0]!.zuege.map((k) => k.san)).toEqual(['e4']);
    expect(partien[0]!.zuege[0]!.kinder.map((k) => k.san)).toEqual(['e5', 'c5']);
  });

  it('liest verschachtelte Varianten', () => {
    const { partien, fehler } = pgnLesen('1. e4 e5 (1... c5 2. Nf3 (2. c3 d5) 2... d6) 2. Nf3 *');
    expect(fehler).toEqual([]);
    const c5 = knoten(partien[0]!.zuege, ['e4', 'c5']);
    expect(c5.kinder.map((k) => k.san)).toEqual(['Nf3', 'c3']);
    expect(c5.kinder[1]!.kinder.map((k) => k.san)).toEqual(['d5']);
  });

  it('hängt einen Kommentar am Anfang einer Variante an deren ersten Zug', () => {
    const { partien } = pgnLesen('1. e4 e5 ({Sizilianisch:} 1... c5) *');
    expect(knoten(partien[0]!.zuege, ['e4', 'c5']).kommentar).toBe('Sizilianisch:');
  });

  it('versteht Umwandlung und Zugnummern ohne Leerzeichen', () => {
    const fen = '8/P7/8/8/8/8/8/k6K w - - 0 1';
    const { partien, fehler } = pgnLesen(`[FEN "${fen}"]\n\n1.a8=Q+ Kb2 *`);
    expect(fehler).toEqual([]);
    expect(partien[0]!.zuege[0]!.uci).toBe('a7a8q');
  });

  it('liest auch Remis mit ½-½ als Ende der Partie', () => {
    const { partien } = pgnLesen('1. e4 e5 ½-½\n\n1. d4 d5 *');
    expect(partien).toHaveLength(2);
  });
});
