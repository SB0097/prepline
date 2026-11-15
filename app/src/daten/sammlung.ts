// Eröffnungen aus der mitgelieferten Sammlung ins eigene Repertoire übernehmen.
import { sammlungsBaum, sammlungsEintrag } from '@prepline/shared';

import { repertoireAnlegen } from './speicher';
import type { Sql } from './sql';

/** Welche Sammlungseinträge schon im Repertoire sind: Schlüssel → Repertoire-ID. */
export async function sammlungImRepertoire(sql: Sql): Promise<Map<string, number>> {
  const zeilen = await sql.alle<{ id: number; quelle: string }>(
    'SELECT id, quelle FROM repertoire WHERE quelle IS NOT NULL',
  );
  return new Map(zeilen.map((z) => [z.quelle, z.id]));
}

/** Legt den Eintrag als offizielles Repertoire an; gibt es ihn schon, kommt dessen ID zurück. */
export async function sammlungHinzufuegen(
  sql: Sql,
  id: string,
  jetzt = Date.now(),
): Promise<number> {
  const vorhanden = (await sammlungImRepertoire(sql)).get(id);
  if (vorhanden !== undefined) return vorhanden;
  const eintrag = sammlungsEintrag(id);
  if (!eintrag) throw new Error(`Unbekannter Sammlungseintrag: ${id}`);
  return repertoireAnlegen(
    sql,
    {
      name: eintrag.name.de,
      seite: eintrag.seite,
      baum: sammlungsBaum(eintrag),
      offiziell: true,
      quelle: eintrag.id,
    },
    jetzt,
  );
}
