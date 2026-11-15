import type { Sammlungseintrag } from '../typen.ts';

export const CARO_KANN: Sammlungseintrag = {
  id: 'caro-kann',
  name: { de: 'Caro-Kann', en: 'Caro-Kann Defence' },
  zusatz: { de: 'Vorstoß, Klassisch und Abtausch', en: 'Advance, Classical and Exchange' },
  seite: 'schwarz',
  stufe: 'fortgeschritten',
  beschreibung: {
    de: 'Eine solide Verteidigung gegen 1. e4 mit festen Bauern und wenig Schwächen. Du lernst hier die wichtigsten Antworten von Weiß.',
    en: "A solid defence against 1.e4 with sturdy pawns and few weaknesses. You'll learn White's most important tries.",
  },
  pgn: `1. e4 c6 2. d4 (2. Nc3 d5 3. Nf3 Bg4 4. h3 Bxf3 5. Qxf3 e6) 2... d5
    3. e5 (3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3)
    (3. exd5 cxd5 4. Bd3 Nc6 5. c3 Nf6 6. Bf4 Bg4 7. Qb3 Qd7)
    3... Bf5 4. Nf3 e6 5. Be2 c5 6. Be3 cxd4 7. Nxd4 Ne7 *`,
  erklaerungen: [
    {
      zuege: 'e4 c6',
      de: 'Schwarz bereitet d5 vor. Dank c6 kann Schwarz auf d5 später mit einem Bauern zurückschlagen.',
      en: 'Black prepares ...d5. Thanks to ...c6, Black can later recapture on d5 with a pawn.',
    },
    {
      zuege: 'e4 c6 d4 d5',
      de: 'Jetzt wird e4 angegriffen, und Schwarz hat seinen Anteil am Zentrum.',
      en: 'Now e4 is attacked and Black has a share of the centre.',
    },
    {
      zuege: 'e4 c6 d4 d5 e5 Bf5',
      de: 'Der Läufer kommt vor e6 heraus – das ist der große Vorteil gegenüber der Französischen Verteidigung.',
      en: 'The bishop gets out before ...e6 – the big advantage over the French Defence.',
    },
    {
      zuege: 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5',
      de: 'Schwarz greift die weiße Bauernkette an ihrer Basis d4 an.',
      en: "Black strikes at the base of White's pawn chain on d4.",
    },
    {
      zuege: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5',
      de: 'Der Läufer entwickelt sich mit Angriff auf den Springer.',
      en: 'The bishop develops with an attack on the knight.',
    },
    {
      zuege: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6',
      de: 'Schafft dem Läufer ein Rückzugsfeld auf h7, damit h5 ihn nicht fängt.',
      en: "Makes room on h7 for the bishop, so h5 doesn't trap it.",
    },
    {
      zuege: 'e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6',
      de: 'Schwarz entwickelt sich und behält das Feld d4 im Blick.',
      en: 'Black develops and keeps an eye on d4.',
    },
    {
      zuege: 'e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4',
      de: 'Der Läufer wird aktiv, bevor e6 ihn einschließt.',
      en: 'The bishop becomes active before ...e6 shuts it in.',
    },
  ],
};
