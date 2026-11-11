import { istNeu } from '@prepline/shared';

import { einstellungAendern } from '@/daten/einstellungen';
import {
  lernstaendeLaden,
  pgnImportieren,
  tagSchluessel,
  tageszaehler,
  tageszaehlerErhoehen,
} from '@/daten/speicher';
import { testDatenbank } from '@/test/nodeSql';

import { ereignisSpeichern, trainingVorbereiten } from './trainingDaten';

const JETZT = Date.UTC(2026, 10, 11, 10, 0);
const EVANS = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 (4... Bb6 5. a4) 5. c3 *';
const CARO = '1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nf3 e6 *';

describe('Training vorbereiten', () => {
  it('teilt das Tageslimit für neue Züge auf alle Repertoires auf', async () => {
    const sql = await testDatenbank();
    await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    await pgnImportieren(sql, CARO, { name: 'Caro-Kann', seite: 'schwarz' });
    await einstellungAendern(sql, 'neuProTag', 8);
    const { teile } = await trainingVorbereiten(sql, JETZT);
    // Schwarz kommt in der Liste zuerst (sortiert nach Seite): 4 Stellungen, dann 4 von Weiß.
    expect(teile.map((t) => [t.rep.name, t.plan.neu.length])).toEqual([
      ['Caro-Kann', 4],
      ['Italienisch', 4],
    ]);
  });

  it('lässt Repertoires weg, in denen heute nichts dran ist', async () => {
    const sql = await testDatenbank();
    await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    await einstellungAendern(sql, 'neuProTag', 5);
    await tageszaehlerErhoehen(sql, tagSchluessel(JETZT), { neu: 5 });
    expect((await trainingVorbereiten(sql, JETZT)).teile).toEqual([]);
  });
});

describe('Ergebnisse speichern', () => {
  it('speichert gezeigte und bewertete Züge und zählt den Tag', async () => {
    const sql = await testDatenbank();
    const { ids } = await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    const [teil] = (await trainingVorbereiten(sql, JETZT)).teile;
    const karte = teil!.plan.neu[0]!;

    await ereignisSpeichern(sql, teil!, { art: 'gezeigt', karte }, JETZT);
    expect((await lernstaendeLaden(sql, ids[0]!)).get(karte)).toMatchObject({ gezeigt: true });

    await ereignisSpeichern(sql, teil!, { art: 'bewertet', karte, richtig: false }, JETZT + 1000);
    const stand = (await lernstaendeLaden(sql, ids[0]!)).get(karte)!;
    expect(istNeu(stand)).toBe(false);
    expect(await tageszaehler(sql, tagSchluessel(JETZT))).toEqual({
      neu: 1,
      wiederholt: 1,
      fehler: 1,
    });
  });
});
