// Liest PGN-Text (auch mehrere Partien/Kapitel) in Zugbäume mit allen Varianten ein.
// chess.js prüft jeden Zug. Ungültige Stellen werden übersprungen und als Fehler gemeldet,
// damit eine einzelne kaputte Variante nicht den ganzen Import verhindert.
import { Chess } from 'chess.js';

import type { Partie, PgnErgebnis, PgnFehler, Zugknoten } from './typen.ts';
import { type Baustein, zerlegen } from './zerlegen.ts';

export const GRUNDSTELLUNG = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function pgnLesen(text: string): PgnErgebnis {
  const fehler: PgnFehler[] = [];
  const partien: Partie[] = [];

  for (const [index, bausteine] of inPartienTeilen(zerlegen(text)).entries()) {
    const nummer = index + 1;
    const partie = partieLesen(bausteine, nummer, fehler);
    if (partie) partien.push(partie);
  }

  if (!partien.some((p) => p.zuege.length > 0)) {
    return { partien: [], fehler: [...fehler, { art: 'keine_zuege' }] };
  }
  return { partien: partien.filter((p) => p.zuege.length > 0), fehler };
}

/** Teilt die Bausteine in Partien: Eine neue beginnt nach einem Ergebnis oder mit neuen Kopfzeilen. */
function inPartienTeilen(bausteine: Baustein[]): Baustein[][] {
  const teile: Baustein[][] = [];
  let aktuell: Baustein[] = [];
  let hatZuege = false;
  for (const b of bausteine) {
    if (b.typ === 'kopf' && hatZuege) {
      teile.push(aktuell);
      aktuell = [];
      hatZuege = false;
    }
    aktuell.push(b);
    if (b.typ === 'zug') hatZuege = true;
    if (b.typ === 'ergebnis') {
      teile.push(aktuell);
      aktuell = [];
      hatZuege = false;
    }
  }
  if (aktuell.some((b) => b.typ !== 'kommentar')) teile.push(aktuell);
  return teile;
}

function partieLesen(bausteine: Baustein[], nummer: number, fehler: PgnFehler[]): Partie | null {
  const kopf: Record<string, string> = {};
  for (const b of bausteine) if (b.typ === 'kopf') kopf[b.name] = b.wert;

  let startFen = GRUNDSTELLUNG;
  if (kopf.FEN) {
    try {
      startFen = new Chess(kopf.FEN).fen();
    } catch {
      fehler.push({ art: 'fen_ungueltig', partie: nummer, fen: kopf.FEN });
      return null;
    }
  }

  const partie: Partie = { kopf, startFen, zuege: [] };
  const leser = new Leser(
    bausteine.filter((b) => b.typ !== 'kopf'),
    nummer,
    fehler,
  );
  leser.linie(startFen, partie.zuege, true, (text) => {
    partie.kommentar = anhaengen(partie.kommentar, text);
  });
  return partie;
}

class Leser {
  private pos = 0;
  private tiefe = 0;
  private readonly bausteine: Baustein[];
  private readonly partie: number;
  private readonly fehler: PgnFehler[];

  constructor(bausteine: Baustein[], partie: number, fehler: PgnFehler[]) {
    this.bausteine = bausteine;
    this.partie = partie;
    this.fehler = fehler;
  }

  /**
   * Liest eine Zugfolge ab der Stellung „fen“ und hängt sie an „liste“.
   * Endet am Ende der Partie oder an der schließenden Klammer der eigenen Variante.
   * „vorKommentar“ nimmt Kommentare auf, die vor dem ersten Zug stehen.
   * „hauptlinie“: Züge dieser Linie gehören in „liste“ nach vorne (erstes Kind = Hauptlinie).
   */
  linie(
    fen: string,
    liste: Zugknoten[],
    hauptlinie: boolean,
    vorKommentar: (text: string) => void,
  ): void {
    // Ein Brett pro Linie, auf dem die Züge weitergespielt werden (schneller als jedes Mal neu aus FEN).
    const brett = new Chess(fen);
    let aktuelleListe = liste;
    let istHaupt = hauptlinie;
    let letzter: Zugknoten | null = null;
    // Für Varianten: Stellung und Geschwisterliste VOR dem letzten Zug.
    let fenVorLetztem = fen;
    let listeVorLetztem = liste;
    let wartenderKommentar: string | undefined;

    while (this.pos < this.bausteine.length) {
      const b = this.bausteine[this.pos++]!;
      switch (b.typ) {
        case 'zug': {
          const fenVorher = brett.fen();
          const ergebnis = this.zugAnwenden(brett, aktuelleListe, istHaupt, b.san, b.nags);
          if (!ergebnis) {
            this.restDerVarianteUeberspringen();
            return;
          }
          const { knoten, neu } = ergebnis;
          // Wer einen Zug neu anlegt, bestimmt dessen Hauptfortsetzung. Trifft eine Variante
          // nur einen schon vorhandenen Zug, hängen ihre Fortsetzungen hinten an.
          istHaupt = neu || knoten.kinder.length === 0;
          if (wartenderKommentar) {
            knoten.kommentar = knoten.kommentar
              ? anhaengen(wartenderKommentar, knoten.kommentar)
              : wartenderKommentar;
            wartenderKommentar = undefined;
          }
          fenVorLetztem = fenVorher;
          listeVorLetztem = aktuelleListe;
          letzter = knoten;
          aktuelleListe = knoten.kinder;
          break;
        }
        case 'kommentar': {
          const text = kommentarSaeubern(b.text);
          if (!text) break;
          if (letzter) letzter.kommentar = anhaengen(letzter.kommentar, text);
          else if (this.tiefe === 0) vorKommentar(text);
          else wartenderKommentar = anhaengen(wartenderKommentar, text);
          break;
        }
        case 'nag':
          if (letzter && !letzter.nags.includes(b.nummer)) letzter.nags.push(b.nummer);
          break;
        case 'auf':
          this.tiefe++;
          if (letzter) {
            this.linie(fenVorLetztem, listeVorLetztem, false, () => {});
          } else {
            this.fehler.push({ art: 'variante_ohne_zug', partie: this.partie });
            this.restDerVarianteUeberspringen();
          }
          break;
        case 'zu':
          if (this.tiefe === 0) {
            this.fehler.push({ art: 'klammer_ohne_anfang', partie: this.partie });
            break;
          }
          this.tiefe--;
          return;
        case 'kommentar_offen':
          this.fehler.push({ art: 'kommentar_nicht_geschlossen', partie: this.partie });
          break;
        case 'unbekannt':
          this.fehler.push({ art: 'unbekannter_text', partie: this.partie, text: b.text });
          break;
        case 'ergebnis':
        case 'kopf':
          break;
      }
    }
    if (this.tiefe > 0) {
      this.fehler.push({ art: 'klammer_nicht_geschlossen', partie: this.partie });
      this.tiefe = 0;
    }
  }

  /** Spielt den Zug; gleiche Züge an derselben Stelle werden zusammengelegt. */
  private zugAnwenden(
    brett: Chess,
    liste: Zugknoten[],
    vorne: boolean,
    san: string,
    nags: number[],
  ): { knoten: Zugknoten; neu: boolean } | null {
    let zug;
    try {
      zug = brett.move(san);
    } catch {
      const [, farbe, , , , zahl] = brett.fen().split(' ');
      this.fehler.push({
        art: 'zug_ungueltig',
        partie: this.partie,
        san,
        zugnummer: Number(zahl),
        amZug: farbe === 'b' ? 'schwarz' : 'weiss',
      });
      return null;
    }
    const vorhanden = liste.find((k) => k.san === zug.san);
    if (vorhanden) {
      for (const n of nags) if (!vorhanden.nags.includes(n)) vorhanden.nags.push(n);
      return { knoten: vorhanden, neu: false };
    }
    const knoten: Zugknoten = {
      san: zug.san,
      uci: zug.from + zug.to + (zug.promotion ?? ''),
      fen: brett.fen(),
      nags: [...nags],
      kinder: [],
    };
    if (vorne) liste.unshift(knoten);
    else liste.push(knoten);
    return { knoten, neu: true };
  }

  /** Nach einem ungültigen Zug: den Rest dieser Variante (samt Untervarianten) auslassen. */
  private restDerVarianteUeberspringen(): void {
    const startTiefe = this.tiefe;
    let offen = 0;
    while (this.pos < this.bausteine.length) {
      const b = this.bausteine[this.pos++]!;
      if (b.typ === 'auf') offen++;
      if (b.typ === 'zu') {
        if (offen === 0) {
          if (startTiefe > 0) this.tiefe--;
          return;
        }
        offen--;
      }
    }
    if (startTiefe > 0) {
      this.fehler.push({ art: 'klammer_nicht_geschlossen', partie: this.partie });
      this.tiefe = 0;
    }
  }
}

/** Entfernt Lichess-/ChessBase-Befehle wie [%clk 0:05:00], [%cal Ge2e4], [%evp …] und Leerraum. */
export function kommentarSaeubern(text: string): string {
  return text
    .replace(/\[%[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function anhaengen(alt: string | undefined, neu: string): string {
  if (!alt) return neu;
  if (alt === neu || alt.includes(neu)) return alt;
  return `${alt} ${neu}`;
}
