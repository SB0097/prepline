import { SAMMLUNG } from '@prepline/shared';

import { testDatenbank } from '@/test/nodeSql';

import { sammlungHinzufuegen, sammlungImRepertoire } from './sammlung';
import { repertoireLaden, repertoireListe } from './speicher';

describe('Sammlung im Repertoire', () => {
  it('legt einen Eintrag als offizielles Repertoire mit Herkunft an', async () => {
    const sql = await testDatenbank();
    const id = await sammlungHinzufuegen(sql, 'london');
    const rep = (await repertoireLaden(sql, id))!;
    expect(rep).toMatchObject({
      name: 'Londoner System',
      seite: 'weiss',
      offiziell: true,
      quelle: 'london',
    });
    expect(rep.baum.zuege[0]!.san).toBe('d4');
  });

  it('legt denselben Eintrag nicht doppelt an', async () => {
    const sql = await testDatenbank();
    const erst = await sammlungHinzufuegen(sql, 'caro-kann');
    expect(await sammlungHinzufuegen(sql, 'caro-kann')).toBe(erst);
    expect(await repertoireListe(sql)).toHaveLength(1);
    expect(await sammlungImRepertoire(sql)).toEqual(new Map([['caro-kann', erst]]));
  });

  it('kann jeden Eintrag der Sammlung anlegen', async () => {
    const sql = await testDatenbank();
    for (const e of SAMMLUNG) await sammlungHinzufuegen(sql, e.id);
    expect((await repertoireListe(sql)).map((r) => r.quelle).sort()).toEqual(
      SAMMLUNG.map((e) => e.id).sort(),
    );
  });

  it('wirft bei unbekanntem Eintrag', async () => {
    const sql = await testDatenbank();
    await expect(sammlungHinzufuegen(sql, 'gibt-es-nicht')).rejects.toThrow();
  });
});
