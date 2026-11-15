import type { Sammlungseintrag } from '../typen.ts';

export const LONDON: Sammlungseintrag = {
  id: 'london',
  name: { de: 'Londoner System', en: 'London System' },
  zusatz: { de: 'gegen d5 und Sf6', en: 'against ...d5 and ...Nf6' },
  seite: 'weiss',
  stufe: 'einsteiger',
  beschreibung: {
    de: 'Ein ruhiges System, das gegen fast alles funktioniert. Wenig Theorie, klare Pläne – ideal zum Einstieg.',
    en: 'A calm system that works against almost anything. Little theory, clear plans – ideal for beginners.',
  },
  pgn: `1. d4 d5 (1... Nf6 2. Bf4 g6 (2... e6 3. e3 c5 4. c3 Nc6 5. Nd2 d5 6. Ngf3)
    3. e3 Bg7 4. Nf3 O-O 5. Be2 d6 6. h3)
    2. Bf4 Nf6 (2... c5 3. e3 Nc6 4. c3 Qb6 5. Qb3 c4 6. Qc2)
    3. e3 e6 4. Nf3 Bd6 5. Bg3 O-O 6. Nbd2 c5 7. c3 Nc6 8. Bd3 *`,
  erklaerungen: [
    {
      zuege: 'd4',
      de: 'Weiß nimmt mit dem Damenbauern das Zentrum. Danach baut das Londoner System fast immer gleich auf.',
      en: 'White takes the centre with the queen pawn. After that the London System uses almost the same setup every time.',
    },
    {
      zuege: 'd4 d5 Bf4',
      de: 'Der Läufer kommt früh nach f4 – vor e3, damit er nicht hinter den eigenen Bauern eingesperrt wird.',
      en: "The bishop comes out to f4 early – before e3, so it isn't locked behind its own pawns.",
    },
    {
      zuege: 'd4 d5 Bf4 Nf6 e3',
      de: 'Stabil: e3 stützt d4 und öffnet den Weg für den anderen Läufer.',
      en: 'Solid: e3 supports d4 and frees the other bishop.',
    },
    {
      zuege: 'd4 d5 Bf4 Nf6 e3 e6 Nf3 Bd6 Bg3',
      de: 'Weiß behält den Läufer auf seiner Diagonale. Tauscht Schwarz auf g3, öffnet hxg3 die h-Linie für den weißen Turm.',
      en: "White keeps the bishop on its diagonal. If Black trades on g3, hxg3 opens the h-file for White's rook.",
    },
    {
      zuege: 'd4 d5 Bf4 Nf6 e3 e6 Nf3 Bd6 Bg3 O-O Nbd2 c5 c3',
      de: 'Die typische Pyramide c3–d4–e3: Das Zentrum steht bombenfest.',
      en: 'The typical c3–d4–e3 pyramid: the centre is rock solid.',
    },
    {
      zuege: 'd4 d5 Bf4 c5 e3 Nc6 c3 Qb6 Qb3',
      de: 'Weiß stellt die eigene Dame dagegen und deckt so den Bauern b2.',
      en: 'White meets the queen with Qb3 and protects b2.',
    },
    {
      zuege: 'd4 Nf6 Bf4',
      de: 'Auch gegen Sf6 gilt: erst der Läufer nach f4, dann e3.',
      en: 'Against ...Nf6 too: bishop to f4 first, then e3.',
    },
  ],
};
