import type { Sammlungseintrag } from '../typen.ts';

export const SLAWISCH: Sammlungseintrag = {
  id: 'slawisch',
  name: { de: 'Slawisch', en: 'Slav Defence' },
  zusatz: { de: 'gegen 1. d4', en: 'against 1.d4' },
  seite: 'schwarz',
  stufe: 'fortgeschritten',
  beschreibung: {
    de: 'Schwarz deckt d5 mit c6 und bringt den Läufer c8 vor der Bauernkette heraus. Sehr solide und bei Weltmeistern beliebt.',
    en: 'Black protects d5 with ...c6 and develops the c8 bishop before closing the pawn chain. Very solid and popular with world champions.',
  },
  pgn: `1. d4 d5 2. c4 (2. Bf4 Nf6 3. e3 c5 4. c3 Nc6 5. Nd2 e6 6. Ngf3 Bd6)
    2... c6 3. Nf3 (3. cxd5 cxd5 4. Nc3 Nf6 5. Bf4 Nc6 6. e3 Bf5)
    3... Nf6 4. Nc3 (4. e3 Bf5 5. Bd3 Bxd3 6. Qxd3 e6)
    4... dxc4 5. a4 Bf5 6. e3 e6 7. Bxc4 Bb4 8. O-O O-O 9. Qe2 Nbd7 *`,
  erklaerungen: [
    {
      zuege: 'd4 d5',
      de: 'Schwarz besetzt ebenfalls das Zentrum und lässt Weiß nicht allein bestimmen.',
      en: "Black takes a share of the centre too and doesn't let White dictate alone.",
    },
    {
      zuege: 'd4 d5 c4 c6',
      de: 'Slawisch: c6 deckt d5, ohne den Läufer c8 einzusperren – anders als e6.',
      en: 'The Slav: ...c6 protects d5 without locking in the c8 bishop – unlike ...e6.',
    },
    {
      zuege: 'd4 d5 c4 c6 Nf3 Nf6',
      de: 'Der Springer entwickelt sich, deckt d5 und hält Weiß von e4 ab.',
      en: 'The knight develops, protects d5 and keeps White from playing e4.',
    },
    {
      zuege: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4',
      de: 'Schwarz nimmt den Bauern. Weiß holt ihn zurück, aber Schwarz gewinnt Zeit für die Entwicklung.',
      en: 'Black takes the pawn. White will win it back, but Black gains time for development.',
    },
    {
      zuege: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5',
      de: 'Der Läufer kommt vor der Bauernkette heraus – genau dafür spielt man Slawisch.',
      en: 'The bishop comes out before the pawn chain – exactly why you play the Slav.',
    },
    {
      zuege: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6',
      de: 'Jetzt darf die Kette zu: e6 deckt das Zentrum und öffnet den Läufer f8.',
      en: 'Now the chain can close: ...e6 supports the centre and frees the f8 bishop.',
    },
    {
      zuege: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4',
      de: 'Der Läufer fesselt den Springer c3 und erschwert so den Vorstoß e4.',
      en: 'The bishop pins the c3 knight and makes the e4 push harder.',
    },
    {
      zuege: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O',
      de: 'Der König ist sicher. Schwarz ist voll entwickelt und steht sehr solide.',
      en: 'The king is safe. Black is fully developed and very solid.',
    },
    {
      zuege: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O Qe2 Nbd7',
      de: 'Der letzte Springer kommt ins Spiel und bereitet die Befreiung mit e5 oder c5 vor.',
      en: 'The last knight joins and prepares freeing the position with ...e5 or ...c5.',
    },
    {
      zuege: 'd4 d5 c4 c6 Nf3 Nf6 e3 Bf5',
      de: 'Auch gegen e3 kommt der Läufer zuerst heraus, bevor e6 die Diagonale schließt.',
      en: 'Against e3 too, the bishop comes out first before ...e6 closes the diagonal.',
    },
    {
      zuege: 'd4 d5 c4 c6 cxd5 cxd5',
      de: 'Nach dem Abtausch ist die Stellung symmetrisch. Schwarz entwickelt sich einfach zügig.',
      en: 'After the exchange the position is symmetrical. Black simply develops quickly.',
    },
    {
      zuege: 'd4 d5 Bf4 Nf6 e3 c5',
      de: 'Gegen das Londoner System greift Schwarz sofort mit c5 an und stellt d4 in Frage.',
      en: 'Against the London System Black strikes at once with ...c5 and challenges d4.',
    },
  ],
};
