// Lernstand einer Karte und Wiederholungsplanung mit FSRS (ts-fsrs, MIT-Lizenz).
// Bewertung automatisch: richtig = „gut“, falsch = „nochmal“ (Serkan 11.11.2026).
import { type Card, createEmptyCard, fsrs, generatorParameters, Rating, State } from 'ts-fsrs';

/** Speicherbarer Lernstand (nur Zahlen, Zeiten in Millisekunden seit 1970). */
export type Lernstand = {
  /** Wann die Karte wieder dran ist. */
  faellig: number;
  stabilitaet: number;
  schwierigkeit: number;
  tageGeplant: number;
  wiederholungen: number;
  /** Wie oft die Karte nach dem Lernen wieder vergessen wurde. */
  vergessen: number;
  lernschritt: number;
  /** 0 = neu, 1 = lernen, 2 = wiederholen, 3 = neu lernen (nach Fehler). */
  zustand: 0 | 1 | 2 | 3;
  letzteWiederholung: number | null;
  /** Neue Karte wurde schon einmal gezeigt (beim ersten Mal sieht man den Zug). */
  gezeigt: boolean;
};

const planer = fsrs(generatorParameters({ enable_fuzz: false, enable_short_term: true }));

/** Lernstand einer Karte, die noch nie dran war. */
export function neuerLernstand(jetzt: number): Lernstand {
  return ausKarte(createEmptyCard(new Date(jetzt)), false);
}

/** Neue Karte zum ersten Mal gezeigt: Sie wird gleich danach abgefragt, noch ohne Bewertung. */
export function gezeigt(stand: Lernstand, jetzt: number): Lernstand {
  return { ...stand, gezeigt: true, faellig: jetzt };
}

/** Ergebnis einer Abfrage eintragen und den nächsten Termin planen. */
export function bewerten(stand: Lernstand, richtig: boolean, jetzt: number): Lernstand {
  const ergebnis = planer.next(
    zuKarte(stand),
    new Date(jetzt),
    richtig ? Rating.Good : Rating.Again,
  );
  return ausKarte(ergebnis.card, true);
}

export function istNeu(stand: Lernstand | undefined): boolean {
  return !stand || stand.zustand === 0;
}

export function istFaellig(stand: Lernstand | undefined, jetzt: number): boolean {
  return !!stand && !istNeu(stand) && stand.faellig <= jetzt;
}

/** Grobe Einordnung für Fortschrittsanzeigen. */
export function sicherheit(stand: Lernstand | undefined): 'neu' | 'lernen' | 'wackelig' | 'sicher' {
  if (istNeu(stand)) return 'neu';
  if (stand!.zustand !== 2) return 'lernen';
  return stand!.stabilitaet >= 21 ? 'sicher' : 'wackelig';
}

function zuKarte(s: Lernstand): Card {
  return {
    due: new Date(s.faellig),
    stability: s.stabilitaet,
    difficulty: s.schwierigkeit,
    scheduled_days: s.tageGeplant,
    reps: s.wiederholungen,
    lapses: s.vergessen,
    learning_steps: s.lernschritt,
    state: s.zustand as State,
    last_review: s.letzteWiederholung === null ? undefined : new Date(s.letzteWiederholung),
  } as Card;
}

function ausKarte(k: Card, gezeigtSchon: boolean): Lernstand {
  return {
    faellig: k.due.getTime(),
    stabilitaet: k.stability,
    schwierigkeit: k.difficulty,
    tageGeplant: k.scheduled_days,
    wiederholungen: k.reps,
    vergessen: k.lapses,
    lernschritt: k.learning_steps,
    zustand: k.state as Lernstand['zustand'],
    letzteWiederholung: k.last_review ? k.last_review.getTime() : null,
    gezeigt: gezeigtSchon,
  };
}
