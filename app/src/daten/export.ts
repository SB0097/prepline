// Dateien aus der App heraus teilen (Android-Teilen-Menü): Sicherung und PGN.
import { pgnSchreiben } from '@prepline/shared';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { sicherungErstellen, sicherungsDateiname } from './sicherung';
import { einstellungSchreiben, repertoireLaden, repertoireListe } from './speicher';
import type { Sql } from './sql';

async function teilen(name: string, inhalt: string, mimeType: string, titel: string) {
  const datei = new File(Paths.cache, name);
  if (datei.exists) datei.delete();
  datei.create();
  await datei.write(inhalt);
  await Sharing.shareAsync(datei.uri, { mimeType, dialogTitle: titel });
}

/** Erstellt die Sicherungsdatei, öffnet das Teilen-Menü und merkt sich den Zeitpunkt. */
export async function sicherungTeilen(sql: Sql, jetzt = Date.now()): Promise<void> {
  const sicherung = await sicherungErstellen(sql, jetzt);
  await teilen(
    sicherungsDateiname(new Date(jetzt)),
    JSON.stringify(sicherung),
    'application/json',
    'Prepline-Sicherung speichern',
  );
  await einstellungSchreiben(sql, 'letzteSicherung', jetzt);
}

/** Alle Eröffnungen als eine PGN-Datei (je Eröffnung eine Partie). */
export async function allePgn(sql: Sql): Promise<string> {
  const teile: string[] = [];
  for (const kopf of await repertoireListe(sql)) {
    const rep = await repertoireLaden(sql, kopf.id);
    if (!rep) continue;
    teile.push(
      pgnSchreiben(rep.baum, {
        event: rep.name,
        white: rep.seite === 'weiss' ? 'Prepline' : '?',
        black: rep.seite === 'schwarz' ? 'Prepline' : '?',
      }),
    );
  }
  return teile.join('\n');
}

export async function pgnTeilen(sql: Sql): Promise<void> {
  await teilen(
    'prepline-eroeffnungen.pgn',
    await allePgn(sql),
    'application/x-chess-pgn',
    'Eröffnungen als PGN',
  );
}
