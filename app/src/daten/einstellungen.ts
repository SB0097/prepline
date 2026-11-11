// Einstellungen der App mit Standardwerten (Serkan 11.11.2026: Ton und Vibration anfangs aus).
import { NEU_PRO_TAG_BEREICH, NEU_PRO_TAG_STANDARD } from '@prepline/shared';

import { type Figurensatz, FIGURENSATZ_STANDARD, istFigurensatz } from '@/ui/brett/figuren';

import { einstellungLesen, einstellungSchreiben } from './speicher';
import type { Sql } from './sql';

export type Einstellungen = {
  figurensatz: Figurensatz;
  neuProTag: number;
  ton: boolean;
  vibration: boolean;
};

export const EINSTELLUNGEN_STANDARD: Einstellungen = {
  figurensatz: FIGURENSATZ_STANDARD,
  neuProTag: NEU_PRO_TAG_STANDARD,
  ton: false,
  vibration: false,
};

export async function einstellungenLaden(sql: Sql): Promise<Einstellungen> {
  const s = EINSTELLUNGEN_STANDARD;
  const figurensatz = await einstellungLesen<unknown>(sql, 'figurensatz', s.figurensatz);
  const neuProTag = await einstellungLesen<unknown>(sql, 'neuProTag', s.neuProTag);
  const ton = await einstellungLesen<unknown>(sql, 'ton', s.ton);
  const vibration = await einstellungLesen<unknown>(sql, 'vibration', s.vibration);
  return {
    figurensatz: istFigurensatz(figurensatz) ? figurensatz : s.figurensatz,
    neuProTag: typeof neuProTag === 'number' ? neuProTagBegrenzen(neuProTag) : s.neuProTag,
    ton: typeof ton === 'boolean' ? ton : s.ton,
    vibration: typeof vibration === 'boolean' ? vibration : s.vibration,
  };
}

export async function einstellungAendern<K extends keyof Einstellungen>(
  sql: Sql,
  schluessel: K,
  wert: Einstellungen[K],
): Promise<void> {
  await einstellungSchreiben(sql, schluessel, wert);
}

export function neuProTagBegrenzen(wert: number): number {
  return Math.min(NEU_PRO_TAG_BEREICH.max, Math.max(NEU_PRO_TAG_BEREICH.min, Math.round(wert)));
}
