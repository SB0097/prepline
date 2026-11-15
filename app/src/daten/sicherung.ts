// Sicherungsdatei: alle Tabellen der App als JSON. Laden ersetzt alles (Serkan 11.11.2026).
// Ältere Sicherungen bleiben lesbar: Fehlende Spalten bekommen ihren Standardwert.
import { SCHEMA_VERSION } from './schema';
import type { Sql, SqlWert } from './sql';

export const SICHERUNG_FORMAT = 'prepline-sicherung';
const TABELLEN = ['repertoire', 'lernstand', 'tag', 'einstellung'] as const;
type Tabelle = (typeof TABELLEN)[number];

type Zeile = Record<string, SqlWert>;

export type Sicherung = {
  format: typeof SICHERUNG_FORMAT;
  /** Version des Dateiformats. */
  version: 1;
  /** Datenbank-Version beim Erstellen. */
  schema: number;
  erstellt: number;
  tabellen: Record<Tabelle, Zeile[]>;
};

export type SicherungsInhalt = { eroeffnungen: number; lernstaende: number; erstellt: number };

export async function sicherungErstellen(sql: Sql, jetzt = Date.now()): Promise<Sicherung> {
  const tabellen = {} as Record<Tabelle, Zeile[]>;
  for (const t of TABELLEN) tabellen[t] = await sql.alle<Zeile>(`SELECT * FROM ${t}`);
  return {
    format: SICHERUNG_FORMAT,
    version: 1,
    schema: SCHEMA_VERSION,
    erstellt: jetzt,
    tabellen,
  };
}

/** Dateiname mit Datum, z. B. „prepline-sicherung-2026-11-11.json“. */
export function sicherungsDateiname(jetzt = new Date()): string {
  const d = (n: number) => String(n).padStart(2, '0');
  return `prepline-sicherung-${jetzt.getFullYear()}-${d(jetzt.getMonth() + 1)}-${d(jetzt.getDate())}.json`;
}

export type Pruefung =
  | { ok: true; sicherung: Sicherung; inhalt: SicherungsInhalt }
  | { ok: false; grund: 'kein_json' | 'falsches_format' | 'zu_neu' | 'beschaedigt' };

/** Prüft eine Datei, bevor etwas ersetzt wird. */
export function sicherungPruefen(text: string): Pruefung {
  let daten: unknown;
  try {
    daten = JSON.parse(text);
  } catch {
    return { ok: false, grund: 'kein_json' };
  }
  const s = daten as Partial<Sicherung> | null;
  if (!s || typeof s !== 'object' || s.format !== SICHERUNG_FORMAT) {
    return { ok: false, grund: 'falsches_format' };
  }
  if (s.version !== 1 || typeof s.schema !== 'number' || s.schema > SCHEMA_VERSION) {
    return { ok: false, grund: 'zu_neu' };
  }
  const t = s.tabellen as Partial<Record<Tabelle, unknown>> | undefined;
  const istListe = (wert: unknown): wert is Zeile[] =>
    Array.isArray(wert) &&
    wert.every((z) => z !== null && typeof z === 'object' && !Array.isArray(z));
  if (!t || !TABELLEN.every((name) => istListe(t[name])))
    return { ok: false, grund: 'beschaedigt' };
  const tabellen = t as Record<Tabelle, Zeile[]>;
  // Jeder Zugbaum muss lesbar sein, sonst lieber gar nichts ersetzen.
  for (const r of tabellen.repertoire) {
    try {
      if (typeof r.baum !== 'string' || !Array.isArray(JSON.parse(r.baum))) throw new Error();
    } catch {
      return { ok: false, grund: 'beschaedigt' };
    }
  }
  const sicherung = s as Sicherung;
  return {
    ok: true,
    sicherung,
    inhalt: {
      eroeffnungen: tabellen.repertoire.length,
      lernstaende: tabellen.lernstand.length,
      erstellt: typeof s.erstellt === 'number' ? s.erstellt : 0,
    },
  };
}

/** Ersetzt alle Daten durch die Sicherung. Bei einem Fehler bleibt alles, wie es war. */
export async function sicherungEinspielen(sql: Sql, sicherung: Sicherung): Promise<void> {
  const spalten = new Map<Tabelle, Set<string>>();
  for (const t of TABELLEN) {
    const info = await sql.alle<{ name: string }>(`PRAGMA table_info(${t})`);
    spalten.set(t, new Set(info.map((i) => i.name)));
  }
  await sql.transaktion(async () => {
    // Lernstände hängen an Repertoires, deshalb zuerst löschen.
    for (const t of ['lernstand', 'repertoire', 'tag', 'einstellung'] as const) {
      await sql.lauf(`DELETE FROM ${t}`);
    }
    for (const t of ['repertoire', 'lernstand', 'tag', 'einstellung'] as const) {
      const erlaubt = spalten.get(t)!;
      for (const zeile of sicherung.tabellen[t]) {
        const namen = Object.keys(zeile).filter((n) => erlaubt.has(n));
        if (namen.length === 0) continue;
        await sql.lauf(
          `INSERT INTO ${t} (${namen.join(', ')}) VALUES (${namen.map(() => '?').join(', ')})`,
          namen.map((n) => zeile[n] ?? null),
        );
      }
    }
  });
}
