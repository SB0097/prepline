import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  bewerten,
  gezeigt,
  kartenAusBaum,
  neuerLernstand,
  pgnLesen,
  zusammenfuehren,
} from '@prepline/shared';

import { nodeSql, testDatenbank } from '@/test/nodeSql';

import { migrieren, SCHEMA_VERSION } from './schema';
import {
  einstellungLesen,
  einstellungSchreiben,
  lernstaendeLaden,
  lernstaendeLoeschen,
  lernstandSpeichern,
  pgnImportieren,
  repertoireAnlegen,
  repertoireErgaenzen,
  repertoireLaden,
  repertoireListe,
  repertoireLoeschen,
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
