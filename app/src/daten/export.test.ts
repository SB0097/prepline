import { pgnLesen, zusammenfuehren } from '@prepline/shared';

import { testDatenbank } from '@/test/nodeSql';

import { allePgn } from './export';
import { sammlungHinzufuegen } from './sammlung';
import { pgnImportieren, repertoireLaden } from './speicher';

describe('PGN-Export', () => {
  it('schreibt jede Eröffnung als eigene Partie, die sich wieder einlesen lässt', async () => {
    const sql = await testDatenbank();
    const { ids } = await pgnImportieren(sql, '1. e4 e5 2. Nf3 (2. Bc4) Nc6 *', {
      name: 'Mein "Spanisch"',
      seite: 'weiss',
    });
    const london = await sammlungHinzufuegen(sql, 'london');
    const pgn = await allePgn(sql);

    const { partien, fehler } = pgnLesen(pgn);
    expect(fehler).toEqual([]);
    expect(partien.map((p) => p.kopf.Event)).toEqual(['Londoner System', 'Mein "Spanisch"']);
    expect(zusammenfuehren([partien[1]!])[0]).toEqual((await repertoireLaden(sql, ids[0]!))!.baum);
    expect(zusammenfuehren([partien[0]!])[0]).toEqual((await repertoireLaden(sql, london))!.baum);
  });

  it('ist leer, wenn es keine Eröffnungen gibt', async () => {
    expect(await allePgn(await testDatenbank())).toBe('');
  });
});
