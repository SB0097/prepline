import { bewerten, gezeigt, neuerLernstand } from '@prepline/shared';

import { testDatenbank } from '@/test/nodeSql';

import { einstellungAendern, einstellungenLaden } from './einstellungen';
import { sammlungHinzufuegen } from './sammlung';
import {
  sicherungEinspielen,
  sicherungErstellen,
  sicherungPruefen,
  sicherungsDateiname,
} from './sicherung';
import {
  lernstaendeLaden,
  lernstandSpeichern,
  pgnImportieren,
  repertoireLaden,
  repertoireListe,
  tageszaehler,
  tageszaehlerErhoehen,
} from './speicher';

const JETZT = Date.UTC(2026, 10, 11, 10, 0);
const EVANS = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 (4... Bb6 5. a4) 5. c3 *';

async function befuellt() {
  const sql = await testDatenbank();
  const { ids } = await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
  await sammlungHinzufuegen(sql, 'london', JETZT);
  const stand = bewerten(gezeigt(neuerLernstand(JETZT), JETZT), true, JETZT);
  await lernstandSpeichern(sql, ids[0]!, 'k1', stand);
  await tageszaehlerErhoehen(sql, '2026-11-11', { neu: 3, wiederholt: 2 });
  await einstellungAendern(sql, 'figurensatz', 'modern');
  return { sql, id: ids[0]!, stand };
}

describe('Sicherung', () => {
  it('überträgt alles in eine leere App', async () => {
    const alt = await befuellt();
    const text = JSON.stringify(await sicherungErstellen(alt.sql, JETZT));

    const neu = await testDatenbank();
    const pruefung = sicherungPruefen(text);
    expect(pruefung).toMatchObject({
      ok: true,
      inhalt: { eroeffnungen: 2, lernstaende: 1, erstellt: JETZT },
    });
    if (!pruefung.ok) throw new Error('ungültig');
    await sicherungEinspielen(neu, pruefung.sicherung);

    expect((await repertoireListe(neu)).map((r) => [r.name, r.quelle])).toEqual([
      ['Italienisch', null],
      ['Londoner System', 'london'],
    ]);
    expect((await lernstaendeLaden(neu, alt.id)).get('k1')).toEqual(alt.stand);
    expect(await tageszaehler(neu, '2026-11-11')).toEqual({ neu: 3, wiederholt: 2, fehler: 0 });
    expect((await einstellungenLaden(neu)).figurensatz).toBe('modern');
    expect((await repertoireLaden(neu, alt.id))!.baum).toEqual(
      (await repertoireLaden(alt.sql, alt.id))!.baum,
    );
  });

  it('ersetzt vorhandene Daten vollständig', async () => {
    const alt = await befuellt();
    const leer = await sicherungErstellen(await testDatenbank(), JETZT);
    await sicherungEinspielen(alt.sql, leer);
    expect(await repertoireListe(alt.sql)).toEqual([]);
    expect(await alt.sql.alle('SELECT * FROM lernstand')).toEqual([]);
  });

  it('liest auch Sicherungen ohne neuere Spalten', async () => {
    const alt = await befuellt();
    const s = await sicherungErstellen(alt.sql, JETZT);
    for (const r of s.tabellen.repertoire) delete r.quelle;
    s.schema = 1;
    const neu = await testDatenbank();
    await sicherungEinspielen(neu, s);
    expect((await repertoireListe(neu)).map((r) => r.quelle)).toEqual([null, null]);
  });

  it('lehnt fremde, kaputte und zu neue Dateien ab', async () => {
    const gut = await sicherungErstellen(await testDatenbank(), JETZT);
    expect(sicherungPruefen('kein json')).toEqual({ ok: false, grund: 'kein_json' });
    expect(sicherungPruefen('{"a":1}')).toEqual({ ok: false, grund: 'falsches_format' });
    expect(sicherungPruefen(JSON.stringify({ ...gut, schema: 999 }))).toEqual({
      ok: false,
      grund: 'zu_neu',
    });
    expect(
      sicherungPruefen(JSON.stringify({ ...gut, tabellen: { ...gut.tabellen, tag: 'x' } })),
    ).toEqual({ ok: false, grund: 'beschaedigt' });
    expect(
      sicherungPruefen(
        JSON.stringify({
          ...gut,
          tabellen: { ...gut.tabellen, repertoire: [{ id: 1, baum: 'kaputt' }] },
        }),
      ),
    ).toEqual({ ok: false, grund: 'beschaedigt' });
  });

  it('lässt bei einem Fehler beim Einspielen alles beim Alten', async () => {
    const alt = await befuellt();
    const s = await sicherungErstellen(await testDatenbank(), JETZT);
    s.tabellen.repertoire.push({ id: 1, name: null });
    await expect(sicherungEinspielen(alt.sql, s)).rejects.toThrow();
    expect(await repertoireListe(alt.sql)).toHaveLength(2);
  });

  it('benennt die Datei nach dem Datum', () => {
    expect(sicherungsDateiname(new Date(2026, 10, 11))).toBe('prepline-sicherung-2026-11-11.json');
  });
});
