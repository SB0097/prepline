// Tagesplan: Was ist heute dran? Fällige Wiederholungen plus neue Karten bis zum Tageslimit.
import type { Karte } from './karten.ts';
import { istFaellig, istNeu, type Lernstand } from './lernstand.ts';

/** Standard: höchstens 10 neue Stellungen pro Tag (in den Einstellungen 5–30). */
export const NEU_PRO_TAG_STANDARD = 10;
export const NEU_PRO_TAG_BEREICH = { min: 5, max: 30 } as const;

export type Tagesplan = {
  /** Fällige Karten, die am längsten überfälligen zuerst. */
  faellig: string[];
  /** Neue Karten für heute, in Baum-Reihenfolge (Hauptlinie zuerst). */
  neu: string[];
  /**
   * Neue Karten, die schon einmal gezeigt, aber noch nicht gelernt wurden (z. B. Runde abgebrochen).
   * Sie werden abgefragt statt noch einmal gezeigt und zählen nicht gegen das Tageslimit.
   */
  angefangen: string[];
};

export function tagesplan(
  karten: readonly Karte[],
  staende: ReadonlyMap<string, Lernstand>,
  jetzt: number,
  optionen: { neuProTag?: number; heuteSchonEingefuehrt?: number } = {},
): Tagesplan {
  const limit = Math.min(
    NEU_PRO_TAG_BEREICH.max,
    Math.max(NEU_PRO_TAG_BEREICH.min, optionen.neuProTag ?? NEU_PRO_TAG_STANDARD),
  );
  const nochFrei = Math.max(0, limit - (optionen.heuteSchonEingefuehrt ?? 0));

  const faellig = karten
    .filter((k) => istFaellig(staende.get(k.schluessel), jetzt))
    .sort((a, b) => staende.get(a.schluessel)!.faellig - staende.get(b.schluessel)!.faellig)
    .map((k) => k.schluessel);

  const neueKarten = karten.filter((k) => istNeu(staende.get(k.schluessel)));
  const angefangen = neueKarten
    .filter((k) => staende.get(k.schluessel)?.gezeigt)
    .map((k) => k.schluessel);
  const neu = neueKarten
    .filter((k) => !staende.get(k.schluessel)?.gezeigt)
    .slice(0, nochFrei)
    .map((k) => k.schluessel);

  return { faellig, neu, angefangen };
}

/** Nächster Zeitpunkt, an dem wieder etwas fällig wird (für „Nächste Wiederholung um …“). */
export function naechsterTermin(
  karten: readonly Karte[],
  staende: ReadonlyMap<string, Lernstand>,
  jetzt: number,
): number | null {
  let naechster: number | null = null;
  for (const k of karten) {
    const s = staende.get(k.schluessel);
    if (!s || istNeu(s) || s.faellig <= jetzt) continue;
    if (naechster === null || s.faellig < naechster) naechster = s.faellig;
  }
  return naechster;
}
