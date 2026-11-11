import { bewerten, gezeigt, kartenAusBaum, neuerLernstand } from '@prepline/shared';

import { einstellungAendern } from '@/daten/einstellungen';
import {
  lernstandSpeichern,
  pgnImportieren,
  repertoireLaden,
  tagSchluessel,
  tageszaehlerErhoehen,
} from '@/daten/speicher';
import { testDatenbank } from '@/test/nodeSql';

import { heuteLaden } from './heuteDaten';

const JETZT = Date.UTC(2026, 10, 11, 10, 0);
const EVANS = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 (4... Bb6 5. a4) 5. c3 *';

describe('Zahlen für „Heute“', () => {
  it('ist ohne Repertoire leer', async () => {
    const sql = await testDatenbank();
    expect(await heuteLaden(sql, JETZT)).toEqual({
      anzahlRepertoires: 0,
      wiederholungen: 0,
      neu: 0,
      sicher: { weiss: null, schwarz: null },
    });
  });

  it('begrenzt neue Stellungen auf das Tageslimit', async () => {
    const sql = await testDatenbank();
    await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    await einstellungAendern(sql, 'neuProTag', 5);
    expect(await heuteLaden(sql, JETZT)).toMatchObject({ neu: 5, sicher: { weiss: 0 } });
    await tageszaehlerErhoehen(sql, tagSchluessel(JETZT), { neu: 3 });
    expect((await heuteLaden(sql, JETZT)).neu).toBe(2);
  });

  it('zählt fällige Wiederholungen', async () => {
    const sql = await testDatenbank();
    const { ids } = await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    const rep = (await repertoireLaden(sql, ids[0]!))!;
    // Eine gelernte Karte ist nach einem Jahr sicher fällig.
    const karte = kartenAusBaum(rep.baum, 'weiss')[0]!;
    const stand = bewerten(gezeigt(neuerLernstand(JETZT), JETZT), true, JETZT);
    await lernstandSpeichern(sql, ids[0]!, karte.schluessel, stand);
    expect((await heuteLaden(sql, JETZT + 365 * 86_400_000)).wiederholungen).toBe(1);
  });
});
