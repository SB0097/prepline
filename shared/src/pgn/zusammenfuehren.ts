// Führt mehrere Partien (z. B. Kapitel einer Lichess-Studie) zu einem Zugbaum zusammen.
// Gleiche Züge an derselben Stelle werden zu einem Knoten, Kommentare und Bewertungen bleiben erhalten.
import type { Partie, Zugknoten } from './typen.ts';

export type Baum = {
  startFen: string;
  zuege: Zugknoten[];
};

/**
 * Fasst alle Partien mit derselben Startstellung zusammen.
 * Ergebnis: ein Baum pro Startstellung, in der Reihenfolge des ersten Auftretens.
 */
export function zusammenfuehren(partien: Partie[]): Baum[] {
  const baeume = new Map<string, Baum>();
  for (const partie of partien) {
    const schluessel = stellungOhneZaehler(partie.startFen);
    let baum = baeume.get(schluessel);
    if (!baum) {
      baum = { startFen: partie.startFen, zuege: [] };
      baeume.set(schluessel, baum);
    }
    listeEinfuegen(baum.zuege, partie.zuege);
  }
  return [...baeume.values()];
}

function listeEinfuegen(ziel: Zugknoten[], quelle: Zugknoten[]): void {
  for (const knoten of quelle) {
    const vorhanden = ziel.find((k) => k.san === knoten.san);
    if (!vorhanden) {
      ziel.push(kopieren(knoten));
      continue;
    }
    if (knoten.kommentar && !vorhanden.kommentar?.includes(knoten.kommentar)) {
      vorhanden.kommentar = vorhanden.kommentar
        ? `${vorhanden.kommentar} ${knoten.kommentar}`
        : knoten.kommentar;
    }
    for (const n of knoten.nags) if (!vorhanden.nags.includes(n)) vorhanden.nags.push(n);
    listeEinfuegen(vorhanden.kinder, knoten.kinder);
  }
}

function kopieren(k: Zugknoten): Zugknoten {
  return { ...k, nags: [...k.nags], kinder: k.kinder.map(kopieren) };
}

/** FEN ohne Halbzug- und Zugzähler: gleiche Stellung, egal über welche Zugfolge erreicht. */
export function stellungOhneZaehler(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

/** Alle Knoten des Baums der Reihe nach (Tiefensuche), z. B. zum Zählen. */
export function* alleKnoten(liste: Zugknoten[]): Generator<Zugknoten> {
  for (const k of liste) {
    yield k;
    yield* alleKnoten(k.kinder);
  }
}

/** Alle Linien vom Anfang bis zu einem Blatt, jeweils als Liste von SAN-Zügen. */
export function alleLinien(liste: Zugknoten[]): string[][] {
  const linien: string[][] = [];
  const gehe = (knoten: Zugknoten[], bisher: string[]) => {
    for (const k of knoten) {
      const weg = [...bisher, k.san];
      if (k.kinder.length === 0) linien.push(weg);
      else gehe(k.kinder, weg);
    }
  };
  gehe(liste, []);
  return linien;
}
