import type { Sammlungseintrag } from '../typen.ts';

export const NAJDORF: Sammlungseintrag = {
  id: 'sizilianisch-najdorf',
  name: { de: 'Sizilianisch', en: 'Sicilian Defence' },
  zusatz: { de: 'Najdorf-Variante', en: 'Najdorf Variation' },
  seite: 'schwarz',
  stufe: 'profi',
  beschreibung: {
    de: 'Die kämpferischste Antwort auf 1. e4. Viel Theorie und scharfe Stellungen – für alle, die mit Schwarz auf Sieg spielen wollen.',
    en: 'The most combative answer to 1.e4. Lots of theory and sharp positions – for those who play for a win with Black.',
  },
  pgn: `1. e4 c5 2. Nf3 (2. c3 Nf6 3. e5 Nd5 4. d4 cxd4 5. Nf3 Nc6 6. cxd4 d6)
    (2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6) 2... d6
    3. d4 (3. Bb5+ Bd7 4. Bxd7+ Qxd7 5. O-O Nc6 6. c3 Nf6) 3... cxd4 4. Nxd4 Nf6 5. Nc3 a6
    6. Be3 (6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7) (6. Be2 e5 7. Nb3 Be7 8. O-O O-O)
    6... e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7 *`,
  erklaerungen: [
    {
      zuege: 'e4 c5',
      de: 'Sizilianisch: Schwarz kämpft von der Seite um d4 und sorgt für ein unausgeglichenes Spiel mit Gewinnchancen.',
      en: 'The Sicilian: Black fights for d4 from the side and creates an unbalanced game with winning chances.',
    },
    {
      zuege: 'e4 c5 Nf3 d6 d4 cxd4',
      de: 'Schwarz tauscht einen Flügelbauern gegen einen Zentrumsbauern – langfristig ein Vorteil.',
      en: 'Black trades a wing pawn for a centre pawn – a long-term plus.',
    },
    {
      zuege: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6',
      de: 'Der Springer greift e4 an und zwingt Weiß zu Sc3.',
      en: 'The knight attacks e4 and forces Nc3.',
    },
    {
      zuege: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6',
      de: 'Der Najdorf-Zug: a6 hält weiße Figuren von b5 fern und bereitet e5 oder b5 vor.',
      en: "The Najdorf move: ...a6 keeps White's pieces off b5 and prepares ...e5 or ...b5.",
    },
    {
      zuege: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5',
      de: 'Schwarz vertreibt den Springer aus dem Zentrum und gewinnt Raum.',
      en: 'Black kicks the knight out of the centre and gains space.',
    },
    {
      zuege: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6',
      de: 'Der Läufer deckt d5 – das wichtigste Feld in dieser Stellung.',
      en: 'The bishop guards d5 – the key square in this structure.',
    },
    {
      zuege: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6',
      de: 'Ruhig und stabil: e6 hält das Zentrum und macht den Weg für den Läufer f8 frei.',
      en: 'Calm and solid: ...e6 holds the centre and frees the f8 bishop.',
    },
    {
      zuege: 'e4 c5 c3 Nf6',
      de: 'Gegen c3 greift Schwarz sofort e4 an, damit Weiß nicht ungestört d4 spielen kann.',
      en: "Against c3 Black hits e4 at once, so White can't play d4 undisturbed.",
    },
    {
      zuege: 'e4 c5 Nf3 d6 Bb5+ Bd7',
      de: 'Schwarz stellt den Läufer dazwischen und bietet den Abtausch an.',
      en: 'Black blocks with the bishop and offers a trade.',
    },
    {
      zuege: 'e4 c5 Nc3 Nc6',
      de: 'Gegen das Geschlossene Sizilianisch entwickelt Schwarz sich einfach und kontrolliert d4.',
      en: 'Against the Closed Sicilian Black develops simply and controls d4.',
    },
  ],
};
