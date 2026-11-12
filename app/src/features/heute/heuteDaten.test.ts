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

import { heuteLaden, serieZaehlen } from './heuteDaten';

const JETZT = Date.UTC(2026, 10, 11, 10, 0);
const TAG = 86_400_000;
const EVANS = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 (4... Bb6 5. a4) 5. c3 *';

describe('Zahlen für „Heute“', () => {
  it('ist ohne Repertoire leer', async () => {
    const sql = await testDatenbank();
    expect(await heuteLaden(sql, JETZT)).toEqual({
      anzahlRepertoires: 0,
      wiederholungen: 0,
      neu: 0,
      erledigt: 0,
      serie: 0,
      weiter: null,
      figurensatz: 'klassisch',
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
    expect((await heuteLaden(sql, JETZT + 365 * TAG)).wiederholungen).toBe(1);
  });

  it('zählt, was heute schon geübt wurde', async () => {
    const sql = await testDatenbank();
    await tageszaehlerErhoehen(sql, tagSchluessel(JETZT), { neu: 2, wiederholt: 3 });
    await tageszaehlerErhoehen(sql, tagSchluessel(JETZT - TAG), { wiederholt: 9 });
    expect((await heuteLaden(sql, JETZT)).erledigt).toBe(5);
  });

  it('schlägt die Eröffnung mit den meisten fälligen Zügen vor', async () => {
    const sql = await testDatenbank();
    await pgnImportieren(sql, '1. d4 d5 2. Bf4 *', { name: 'London', seite: 'weiss' });
    const { ids } = await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    const rep = (await repertoireLaden(sql, ids[0]!))!;
    const karte = kartenAusBaum(rep.baum, 'weiss')[0]!;
    const stand = bewerten(gezeigt(neuerLernstand(JETZT), JETZT), true, JETZT);
    await lernstandSpeichern(sql, ids[0]!, karte.schluessel, stand);
    const heute = await heuteLaden(sql, JETZT + 365 * TAG);
    expect(heute.weiter).toMatchObject({ name: 'Italienisch', seite: 'weiss', faellig: 1 });
  });

  it('schlägt nichts vor, wenn das Tageslimit für Neues erreicht ist', async () => {
    const sql = await testDatenbank();
    await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    await einstellungAendern(sql, 'neuProTag', 5);
    await tageszaehlerErhoehen(sql, tagSchluessel(JETZT), { neu: 5 });
    expect((await heuteLaden(sql, JETZT)).weiter).toBeNull();
  });

  it('zählt angefangene Züge auch über dem Tageslimit mit', async () => {
    const sql = await testDatenbank();
    const { ids } = await pgnImportieren(sql, EVANS, { name: 'Italienisch', seite: 'weiss' });
    const rep = (await repertoireLaden(sql, ids[0]!))!;
    const karte = kartenAusBaum(rep.baum, 'weiss')[0]!;
    // Gezeigt, aber die Runde wurde abgebrochen, bevor der Zug gelernt war.
    await lernstandSpeichern(sql, ids[0]!, karte.schluessel, gezeigt(neuerLernstand(JETZT), JETZT));
    await einstellungAendern(sql, 'neuProTag', 5);
    await tageszaehlerErhoehen(sql, tagSchluessel(JETZT), { neu: 5 });
    const heute = await heuteLaden(sql, JETZT);
    expect(heute.neu).toBe(1);
    expect(heute.weiter).toMatchObject({ name: 'Italienisch', neu: 1 });
  });

  it('liest die Serie aus den Tageszählern', async () => {
    const sql = await testDatenbank();
    for (const zurueck of [0, 1, 2, 4]) {
      await tageszaehlerErhoehen(sql, tagSchluessel(JETZT - zurueck * TAG), { wiederholt: 1 });
    }
    expect((await heuteLaden(sql, JETZT)).serie).toBe(3);
  });
});

describe('Serie', () => {
  it('ist ohne Training null', () => {
    expect(serieZaehlen([], '2026-11-12')).toBe(0);
  });

  it('zählt Tage in Folge bis heute', () => {
    expect(serieZaehlen(['2026-11-12', '2026-11-11', '2026-11-10'], '2026-11-12')).toBe(3);
  });

  it('bleibt bestehen, solange heute noch nicht geübt wurde', () => {
    expect(serieZaehlen(['2026-11-11', '2026-11-10'], '2026-11-12')).toBe(2);
  });

  it('reißt nach einem ausgelassenen Tag ab', () => {
    expect(serieZaehlen(['2026-11-10', '2026-11-09'], '2026-11-12')).toBe(0);
    expect(serieZaehlen(['2026-11-12', '2026-11-10'], '2026-11-12')).toBe(1);
  });

  it('zählt über Monats- und Jahreswechsel hinweg', () => {
    expect(serieZaehlen(['2027-01-01', '2026-12-31', '2026-12-30'], '2027-01-01')).toBe(3);
    expect(serieZaehlen(['2026-03-01', '2026-02-28'], '2026-03-01')).toBe(2);
  });
});
