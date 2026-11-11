// Lesen und Schreiben der App-Daten: Repertoires, Lernstände, Tageszähler, Einstellungen.
import {
  type Baum,
  type Fortschritt,
  fortschritt,
  hauptlinieEnde,
  kartenAusBaum,
  type Lernstand,
  type PgnFehler,
  pgnLesen,
  type Seite,
  stellungOhneZaehler,
  type Zugknoten,
  zusammenfuehren,
} from '@prepline/shared';

import type { Sql } from './sql';

export type RepertoireKopf = {
  id: number;
  name: string;
  seite: Seite;
  offiziell: boolean;
  erstellt: number;
};

export type Repertoire = RepertoireKopf & { baum: Baum };

type RepertoireZeile = {
  id: number;
  name: string;
  seite: Seite;
  offiziell: number;
  start_fen: string;
  baum: string;
  erstellt: number;
};

// --- Repertoires ---

export async function repertoireAnlegen(
  sql: Sql,
  daten: { name: string; seite: Seite; baum: Baum; offiziell?: boolean },
  jetzt = Date.now(),
): Promise<number> {
  const r = await sql.lauf(
    `INSERT INTO repertoire (name, seite, offiziell, start_fen, baum, erstellt, geaendert)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      daten.name,
      daten.seite,
      daten.offiziell ? 1 : 0,
      daten.baum.startFen,
      JSON.stringify(daten.baum.zuege),
      jetzt,
      jetzt,
    ],
  );
  return r.neueId;
}

export async function repertoireListe(sql: Sql): Promise<RepertoireKopf[]> {
  const zeilen = await sql.alle<Omit<RepertoireZeile, 'start_fen' | 'baum'>>(
    'SELECT id, name, seite, offiziell, erstellt FROM repertoire ORDER BY seite, name COLLATE NOCASE',
  );
  return zeilen.map((z) => ({ ...z, offiziell: z.offiziell === 1 }));
}

export async function repertoireLaden(sql: Sql, id: number): Promise<Repertoire | null> {
  const z = await sql.erste<RepertoireZeile>('SELECT * FROM repertoire WHERE id = ?', [id]);
  if (!z) return null;
  return {
    id: z.id,
    name: z.name,
    seite: z.seite,
    offiziell: z.offiziell === 1,
    erstellt: z.erstellt,
    baum: { startFen: z.start_fen, zuege: JSON.parse(z.baum) as Zugknoten[] },
  };
}

export async function repertoireUmbenennen(sql: Sql, id: number, name: string): Promise<void> {
  await sql.lauf('UPDATE repertoire SET name = ?, geaendert = ? WHERE id = ?', [
    name,
    Date.now(),
    id,
  ]);
}

/** Löscht das Repertoire samt Lernständen. */
export async function repertoireLoeschen(sql: Sql, id: number): Promise<void> {
  await sql.lauf('DELETE FROM repertoire WHERE id = ?', [id]);
}

/** Neue Züge in ein bestehendes Repertoire einfügen. Lernstände bleiben erhalten. */
export async function repertoireErgaenzen(sql: Sql, id: number, neu: Baum): Promise<boolean> {
  const alt = await repertoireLaden(sql, id);
  if (!alt) return false;
  const teile = [alt.baum, neu].map((b) => ({ kopf: {}, startFen: b.startFen, zuege: b.zuege }));
  const [zusammen, ...andere] = zusammenfuehren(teile);
  if (andere.length > 0) return false; // andere Startstellung passt nicht dazu
  await sql.lauf('UPDATE repertoire SET baum = ?, geaendert = ? WHERE id = ?', [
    JSON.stringify(zusammen!.zuege),
    Date.now(),
    id,
  ]);
  return true;
}

/** Repertoires gleicher Seite und Startstellung – an diese kann ein Import angehängt werden. */
export async function passendeRepertoires(
  sql: Sql,
  seite: Seite,
  startFen: string,
): Promise<RepertoireKopf[]> {
  const zeilen = await sql.alle<RepertoireZeile>(
    'SELECT * FROM repertoire WHERE seite = ? ORDER BY name COLLATE NOCASE',
    [seite],
  );
  const ziel = stellungOhneZaehler(startFen);
  return zeilen
    .filter((z) => stellungOhneZaehler(z.start_fen) === ziel)
    .map((z) => ({
      id: z.id,
      name: z.name,
      seite: z.seite,
      offiziell: z.offiziell === 1,
      erstellt: z.erstellt,
    }));
}

export type RepertoireUebersicht = RepertoireKopf & {
  /** Stellung am Ende der Hauptlinie (Mini-Brett). */
  endFen: string;
  fortschritt: Fortschritt;
};

/** Alle Repertoires mit Fortschritt, sortiert nach Seite und Name. */
export async function repertoireUebersicht(
  sql: Sql,
  jetzt = Date.now(),
): Promise<RepertoireUebersicht[]> {
  const liste = await repertoireListe(sql);
  const ergebnis: RepertoireUebersicht[] = [];
  for (const kopf of liste) {
    const rep = await repertoireLaden(sql, kopf.id);
    if (!rep) continue;
    const karten = kartenAusBaum(rep.baum, rep.seite);
    const staende = await lernstaendeLaden(sql, kopf.id);
    ergebnis.push({
      ...kopf,
      endFen: hauptlinieEnde(rep.baum),
      fortschritt: fortschritt(karten, staende, jetzt),
    });
  }
  return ergebnis;
}

export type RepertoireDetail = Repertoire & {
  endFen: string;
  fortschritt: Fortschritt;
};

/** Ein Repertoire mit Zugbaum und Fortschritt für die Detailseite. */
export async function repertoireDetail(
  sql: Sql,
  id: number,
  jetzt = Date.now(),
): Promise<RepertoireDetail | null> {
  const rep = await repertoireLaden(sql, id);
  if (!rep) return null;
  const karten = kartenAusBaum(rep.baum, rep.seite);
  const staende = await lernstaendeLaden(sql, id);
  return {
    ...rep,
    endFen: hauptlinieEnde(rep.baum),
    fortschritt: fortschritt(karten, staende, jetzt),
  };
}

// --- PGN-Import ---

export type ImportErgebnis = {
  /** Angelegte oder ergänzte Repertoires (eins pro Startstellung, meist genau eins). */
  ids: number[];
  fehler: PgnFehler[];
  /** Wie viele Stellungen zum Lernen dazugekommen sind. */
  neueStellungen: number;
};

/**
 * Liest PGN-Text und legt daraus ein Repertoire an (bei mehreren Startstellungen mehrere).
 * Mit `ziel` werden die Züge an ein bestehendes Repertoire angehängt, wenn die Startstellung passt.
 */
export async function pgnImportieren(
  sql: Sql,
  text: string,
  daten: { name: string; seite: Seite; ziel?: number },
  jetzt = Date.now(),
): Promise<ImportErgebnis> {
  const { partien, fehler } = pgnLesen(text);
  const baeume = zusammenfuehren(partien);
  const ids: number[] = [];
  let neueStellungen = 0;
  await sql.transaktion(async () => {
    const [einziger] = baeume;
    if (daten.ziel !== undefined && baeume.length === 1 && einziger) {
      const alt = await repertoireLaden(sql, daten.ziel);
      if (alt && (await repertoireErgaenzen(sql, daten.ziel, einziger))) {
        const neu = (await repertoireLaden(sql, daten.ziel))!;
        neueStellungen =
          kartenAusBaum(neu.baum, neu.seite).length - kartenAusBaum(alt.baum, alt.seite).length;
        ids.push(daten.ziel);
        return;
      }
    }
    for (const [i, baum] of baeume.entries()) {
      const name = baeume.length > 1 ? `${daten.name} (${i + 1})` : daten.name;
      ids.push(await repertoireAnlegen(sql, { name, seite: daten.seite, baum }, jetzt));
      neueStellungen += kartenAusBaum(baum, daten.seite).length;
    }
  });
  return { ids, fehler, neueStellungen };
}

// --- Lernstände ---

type LernstandZeile = {
  schluessel: string;
  faellig: number;
  stabilitaet: number;
  schwierigkeit: number;
  tage_geplant: number;
  wiederholungen: number;
  vergessen: number;
  lernschritt: number;
  zustand: number;
  letzte_wiederholung: number | null;
  gezeigt: number;
};

export async function lernstaendeLaden(
  sql: Sql,
  repertoireId: number,
): Promise<Map<string, Lernstand>> {
  const zeilen = await sql.alle<LernstandZeile>('SELECT * FROM lernstand WHERE repertoire_id = ?', [
    repertoireId,
  ]);
  return new Map(
    zeilen.map((z) => [
      z.schluessel,
      {
        faellig: z.faellig,
        stabilitaet: z.stabilitaet,
        schwierigkeit: z.schwierigkeit,
        tageGeplant: z.tage_geplant,
        wiederholungen: z.wiederholungen,
        vergessen: z.vergessen,
        lernschritt: z.lernschritt,
        zustand: z.zustand as Lernstand['zustand'],
        letzteWiederholung: z.letzte_wiederholung,
        gezeigt: z.gezeigt === 1,
      },
    ]),
  );
}

export async function lernstandSpeichern(
  sql: Sql,
  repertoireId: number,
  schluessel: string,
  s: Lernstand,
): Promise<void> {
  await sql.lauf(
    `INSERT INTO lernstand (repertoire_id, schluessel, faellig, stabilitaet, schwierigkeit,
       tage_geplant, wiederholungen, vergessen, lernschritt, zustand, letzte_wiederholung, gezeigt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (repertoire_id, schluessel) DO UPDATE SET
       faellig = excluded.faellig, stabilitaet = excluded.stabilitaet,
       schwierigkeit = excluded.schwierigkeit, tage_geplant = excluded.tage_geplant,
       wiederholungen = excluded.wiederholungen, vergessen = excluded.vergessen,
       lernschritt = excluded.lernschritt, zustand = excluded.zustand,
       letzte_wiederholung = excluded.letzte_wiederholung, gezeigt = excluded.gezeigt`,
    [
      repertoireId,
      schluessel,
      s.faellig,
      s.stabilitaet,
      s.schwierigkeit,
      s.tageGeplant,
      s.wiederholungen,
      s.vergessen,
      s.lernschritt,
      s.zustand,
      s.letzteWiederholung,
      s.gezeigt ? 1 : 0,
    ],
  );
}

/** Fortschritt eines Repertoires zurücksetzen (alle Karten wieder neu). */
export async function lernstaendeLoeschen(sql: Sql, repertoireId: number): Promise<void> {
  await sql.lauf('DELETE FROM lernstand WHERE repertoire_id = ?', [repertoireId]);
}

// --- Tageszähler ---

/** Kalendertag in Ortszeit als „JJJJ-MM-TT“ (der Tag wechselt um Mitternacht auf dem Handy). */
export function tagSchluessel(zeit: number | Date = Date.now()): string {
  const d = new Date(zeit);
  const zwei = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

export type Tageszaehler = { neu: number; wiederholt: number; fehler: number };

export async function tageszaehler(sql: Sql, tag: string): Promise<Tageszaehler> {
  const z = await sql.erste<Tageszaehler>('SELECT neu, wiederholt, fehler FROM tag WHERE tag = ?', [
    tag,
  ]);
  return z ?? { neu: 0, wiederholt: 0, fehler: 0 };
}

export async function tageszaehlerErhoehen(
  sql: Sql,
  tag: string,
  plus: Partial<Tageszaehler>,
): Promise<void> {
  await sql.lauf(
    `INSERT INTO tag (tag, neu, wiederholt, fehler) VALUES (?, ?, ?, ?)
     ON CONFLICT (tag) DO UPDATE SET neu = neu + excluded.neu,
       wiederholt = wiederholt + excluded.wiederholt, fehler = fehler + excluded.fehler`,
    [tag, plus.neu ?? 0, plus.wiederholt ?? 0, plus.fehler ?? 0],
  );
}

// --- Einstellungen ---

export async function einstellungLesen<T>(sql: Sql, schluessel: string, standard: T): Promise<T> {
  const z = await sql.erste<{ wert: string }>('SELECT wert FROM einstellung WHERE schluessel = ?', [
    schluessel,
  ]);
  return z ? (JSON.parse(z.wert) as T) : standard;
}

export async function einstellungSchreiben(sql: Sql, schluessel: string, wert: unknown) {
  await sql.lauf(
    `INSERT INTO einstellung (schluessel, wert) VALUES (?, ?)
     ON CONFLICT (schluessel) DO UPDATE SET wert = excluded.wert`,
    [schluessel, JSON.stringify(wert)],
  );
}
