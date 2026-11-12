import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  bewerten,
  gezeigt,
  GRUNDSTELLUNG,
  kartenAusBaum,
  neuerLernstand,
  pgnLesen,
  zusammenfuehren,
} from '@prepline/shared';

import { nodeSql, testDatenbank } from '@/test/nodeSql';

import {
  einstellungAendern,
  einstellungenLaden,
  EINSTELLUNGEN_STANDARD,
  neuProTagBegrenzen,
} from './einstellungen';
import { migrieren, SCHEMA_VERSION } from './schema';
import {
  einstellungLesen,
  einstellungSchreiben,
  lernstaendeLaden,
  lernstaendeLoeschen,
  lernstandSpeichern,
  passendeRepertoires,
  pgnImportieren,
  repertoireAnlegen,
  repertoireDetail,
  repertoireErgaenzen,
  repertoireLaden,
  repertoireListe,
  repertoireLoeschen,
  repertoireUebersicht,
  repertoireUmbenennen,
  tagSchluessel,
  tageszaehler,
  tageszaehlerErhoehen,
} from './speicher';

const JETZT = Date.UTC(2026, 10, 11, 10, 0);
const EVANS = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 (4... Bb6 5. a4) 5. c3 *';

describe('Datenbank-Schema', () => {
  it('legt alle Tabellen an und merkt sich die Version', async () => {
    const sql = await testDatenbank();
    const tabellen = await sql.alle<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tabellen.map((t) => t.name)).toEqual(
      expect.arrayContaining(['einstellung', 'lernstand', 'repertoire', 'tag']),
    );
    expect(await sql.erste('PRAGMA user_version')).toEqual({ user_version: SCHEMA_VERSION });
  });

  it('kann mehrfach migrieren, ohne etwas kaputt zu machen', async () => {
    const sql = await testDatenbank();
    await repertoireAnlegen(sql, {
      name: 'A',
      seite: 'weiss',
      baum: zusammenfuehren(pgnLesen(EVANS).partien)[0]!,
    });
    await migrieren(sql);
    expect(await repertoireListe(sql)).toHaveLength(1);
  });
});

describe('Repertoires', () => {
  it('speichert einen PGN-Import und lädt den Zugbaum vollständig wieder', async () => {
    const sql = await testDatenbank();
    const { ids, fehler } = await pgnImportieren(
      sql,
      EVANS,
      { name: 'Evansgambit', seite: 'weiss' },
      JETZT,
    );
    expect(fehler).toEqual([]);
    expect(ids).toHaveLength(1);

    const rep = (await repertoireLaden(sql, ids[0]!))!;
    expect(rep).toMatchObject({ name: 'Evansgambit', seite: 'weiss', offiziell: false });
    expect(rep.baum).toEqual(zusammenfuehren(pgnLesen(EVANS).partien)[0]);
    expect(kartenAusBaum(rep.baum, 'weiss').map((k) => k.zug)).toEqual([
      'e4',
      'Nf3',
      'Bc4',
      'b4',
      'c3',
      'a4',
    ]);
  });

  it('legt bei verschiedenen Startstellungen getrennte Repertoires an', async () => {
    const sql = await testDatenbank();
    const pgn = `1. e4 e5 *\n\n[FEN "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"]\n\n4. b4 *`;
    const { ids } = await pgnImportieren(sql, pgn, { name: 'Mix', seite: 'weiss' });
    expect(ids).toHaveLength(2);
    expect((await repertoireListe(sql)).map((r) => r.name)).toEqual(['Mix (1)', 'Mix (2)']);
  });

  it('legt bei einer Datei ohne Züge nichts an', async () => {
    const sql = await testDatenbank();
    const ergebnis = await pgnImportieren(sql, 'kein schach', { name: 'X', seite: 'weiss' });
    expect(ergebnis.ids).toEqual([]);
    expect(ergebnis.fehler).toContainEqual({ art: 'keine_zuege' });
    expect(await repertoireListe(sql)).toEqual([]);
  });

  it('sortiert nach Seite und Name, benennt um und löscht', async () => {
    const sql = await testDatenbank();
    const baum = zusammenfuehren(pgnLesen(EVANS).partien)[0]!;
    const b = await repertoireAnlegen(sql, { name: 'b', seite: 'weiss', baum });
    await repertoireAnlegen(sql, { name: 'Sizilianisch', seite: 'schwarz', baum });
    await repertoireAnlegen(sql, { name: 'A', seite: 'weiss', baum, offiziell: true });
    expect((await repertoireListe(sql)).map((r) => `${r.seite}:${r.name}`)).toEqual([
      'schwarz:Sizilianisch',
      'weiss:A',
      'weiss:b',
    ]);
    await repertoireUmbenennen(sql, b, 'Italienisch');
    expect((await repertoireLaden(sql, b))!.name).toBe('Italienisch');
    await repertoireLoeschen(sql, b);
    expect(await repertoireLaden(sql, b)).toBeNull();
  });

  it('ergänzt ein Repertoire um neue Züge und behält den Lernstand', async () => {
    const sql = await testDatenbank();
    const { ids } = await pgnImportieren(sql, EVANS, { name: 'E', seite: 'weiss' });
    const id = ids[0]!;
    await lernstandSpeichern(sql, id, 'x', neuerLernstand(JETZT));
    const neu = zusammenfuehren(pgnLesen('1. e4 e5 2. Nf3 Nc6 3. Bb5 *').partien)[0]!;
    expect(await repertoireErgaenzen(sql, id, neu)).toBe(true);
    const rep = (await repertoireLaden(sql, id))!;
    const nachNc6 = rep.baum.zuege[0]!.kinder[0]!.kinder[0]!.kinder[0]!;
    expect(nachNc6.kinder.map((k) => k.san)).toEqual(['Bc4', 'Bb5']);
    expect((await lernstaendeLaden(sql, id)).size).toBe(1);
  });
});

describe('Lernstände', () => {
  it('speichert, überschreibt und lädt Lernstände pro Repertoire', async () => {
    const sql = await testDatenbank();
    const { ids } = await pgnImportieren(sql, EVANS, { name: 'E', seite: 'weiss' });
    const id = ids[0]!;
    const erst = gezeigt(neuerLernstand(JETZT), JETZT);
    await lernstandSpeichern(sql, id, 'k1', erst);
    const danach = bewerten(erst, true, JETZT);
    await lernstandSpeichern(sql, id, 'k1', danach);
    await lernstandSpeichern(sql, id, 'k2', erst);

    const staende = await lernstaendeLaden(sql, id);
    expect(staende.size).toBe(2);
    expect(staende.get('k1')).toEqual(danach);
    expect(staende.get('k2')).toEqual(erst);

    await lernstaendeLoeschen(sql, id);
    expect((await lernstaendeLaden(sql, id)).size).toBe(0);
  });

  it('löscht Lernstände mit dem Repertoire', async () => {
    const sql = await testDatenbank();
    const { ids } = await pgnImportieren(sql, EVANS, { name: 'E', seite: 'weiss' });
    await lernstandSpeichern(sql, ids[0]!, 'k1', neuerLernstand(JETZT));
    await repertoireLoeschen(sql, ids[0]!);
    expect(await sql.alle('SELECT * FROM lernstand')).toEqual([]);
  });
});

describe('Tageszähler und Einstellungen', () => {
  it('zählt pro Tag hoch', async () => {
    const sql = await testDatenbank();
    const tag = tagSchluessel(new Date(2026, 10, 11, 23, 59));
    expect(tag).toBe('2026-11-11');
    expect(tagSchluessel(new Date(2026, 10, 12, 0, 1))).toBe('2026-11-12');
    await tageszaehlerErhoehen(sql, tag, { neu: 1 });
    await tageszaehlerErhoehen(sql, tag, { neu: 2, wiederholt: 5, fehler: 1 });
    expect(await tageszaehler(sql, tag)).toEqual({ neu: 3, wiederholt: 5, fehler: 1 });
    expect(await tageszaehler(sql, '2026-11-12')).toEqual({ neu: 0, wiederholt: 0, fehler: 0 });
  });

  it('liest Standardwerte und speichert Einstellungen', async () => {
    const sql = await testDatenbank();
    expect(await einstellungLesen(sql, 'neuProTag', 10)).toBe(10);
    await einstellungSchreiben(sql, 'neuProTag', 15);
    await einstellungSchreiben(sql, 'neuProTag', 20);
    expect(await einstellungLesen(sql, 'neuProTag', 10)).toBe(20);
  });
});

describe('Daten bleiben erhalten', () => {
  it('überstehen das Schließen und Wiederöffnen der Datei (wie ein App-Neustart)', async () => {
    const datei = join(mkdtempSync(join(tmpdir(), 'prepline-')), 'test.db');
    const erste = nodeSql(datei);
    await migrieren(erste);
    const { ids } = await pgnImportieren(erste, EVANS, { name: 'Bleibt', seite: 'weiss' });
    await lernstandSpeichern(erste, ids[0]!, 'k1', neuerLernstand(JETZT));
    erste.schliessen();

    const zweite = nodeSql(datei);
    await migrieren(zweite);
    expect((await repertoireListe(zweite)).map((r) => r.name)).toEqual(['Bleibt']);
    expect((await lernstaendeLaden(zweite, ids[0]!)).size).toBe(1);
    zweite.schliessen();
  });
});

describe('Import an bestehendes Repertoire und Übersicht', () => {
  it('findet passende Repertoires nach Seite und Startstellung', async () => {
    const sql = await testDatenbank();
    const { ids } = await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    await pgnImportieren(sql, EVANS, { name: 'Gegen Italienisch', seite: 'schwarz' });
    const passend = await passendeRepertoires(sql, 'weiss', GRUNDSTELLUNG);
    expect(passend.map((r) => r.id)).toEqual(ids);
  });

  it('hängt einen Import an und zählt nur die neuen Stellungen', async () => {
    const sql = await testDatenbank();
    const erst = await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    expect(erst.neueStellungen).toBe(6);
    const dazu = await pgnImportieren(sql, '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 *', {
      name: 'egal',
      seite: 'weiss',
      ziel: erst.ids[0]!,
    });
    // Lb5 ist nur eine zweite Antwort in einer bekannten Stellung; neu ist die Stellung nach 3...a6.
    expect(dazu).toEqual({ ids: erst.ids, fehler: [], neueStellungen: 1 });
    expect(await repertoireListe(sql)).toHaveLength(1);
  });

  it('zeigt Fortschritt und Endstellung jedes Repertoires', async () => {
    const sql = await testDatenbank();
    const { ids } = await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    const [rep] = await repertoireUebersicht(sql, JETZT);
    expect(rep).toMatchObject({
      id: ids[0],
      name: 'Italienisch',
      fortschritt: { stellungen: 6, faellig: 0, neu: 6, sicher: 0 },
    });
    expect(rep!.endFen).toMatch(/^r1bqk1nr\/pppp1ppp\/2n5\/4p3\/1bB1P3\/2P2N2/);
  });
});

describe('Einstellungen der App', () => {
  it('liefert Standardwerte und speichert Änderungen', async () => {
    const sql = await testDatenbank();
    expect(await einstellungenLaden(sql)).toEqual(EINSTELLUNGEN_STANDARD);
    expect(EINSTELLUNGEN_STANDARD).toMatchObject({ ton: false, vibration: false, haeppchen: 3 });
    await einstellungAendern(sql, 'figurensatz', 'modern');
    await einstellungAendern(sql, 'ton', true);
    expect(await einstellungenLaden(sql)).toMatchObject({ figurensatz: 'modern', ton: true });
  });

  it('ignoriert kaputte Werte und begrenzt neue Züge pro Tag', async () => {
    const sql = await testDatenbank();
    await einstellungSchreiben(sql, 'figurensatz', 'gibtsnicht');
    await einstellungSchreiben(sql, 'neuProTag', 99);
    expect(await einstellungenLaden(sql)).toMatchObject({
      figurensatz: 'klassisch',
      neuProTag: 30,
    });
    expect(neuProTagBegrenzen(1)).toBe(5);
  });
});

describe('Detailseite', () => {
  it('liefert Zugbaum, Endstellung und Fortschritt eines Repertoires', async () => {
    const sql = await testDatenbank();
    const { ids } = await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    const detail = await repertoireDetail(sql, ids[0]!, JETZT);
    expect(detail).toMatchObject({ name: 'Italienisch', fortschritt: { stellungen: 6 } });
    expect(detail!.baum.zuege[0]!.san).toBe('e4');
    expect(await repertoireDetail(sql, 999, JETZT)).toBeNull();
  });
});
