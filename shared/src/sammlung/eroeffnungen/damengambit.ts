import type { Sammlungseintrag } from '../typen.ts';

export const DAMENGAMBIT: Sammlungseintrag = {
  id: 'damengambit',
  name: { de: 'Damengambit', en: "Queen's Gambit" },
  zusatz: { de: 'gegen Abgelehnt, Angenommen und Slawisch', en: 'vs. Declined, Accepted and Slav' },
  seite: 'weiss',
  stufe: 'fortgeschritten',
  beschreibung: {
    de: 'Der Klassiker unter den Eröffnungen mit d4. Weiß bekommt ein starkes Zentrum und langfristigen Druck – ein Repertoire fürs ganze Schachleben.',
    en: 'The classic d4 opening. White gets a strong centre and long-term pressure – a repertoire for life.',
  },
  pgn: `1. d4 d5 2. c4 e6
    (2... dxc4 3. e3 Nf6 4. Bxc4 e6 5. Nf3 c5 6. O-O a6 7. a4)
    (2... c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. e3 e6 7. Bxc4 Bb4 8. O-O)
    3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. cxd5 Nxd5
    9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 *`,
  erklaerungen: [
    {
      zuege: 'd4',
      de: 'Der Damenbauer ist von der Dame gedeckt – Weiß baut ein festes Zentrum.',
      en: 'The queen pawn is protected by the queen – White builds a firm centre.',
    },
    {
      zuege: 'd4 d5 c4',
      de: 'Das Damengambit: c4 lockt den Bauern d5 aus dem Zentrum. Kein echtes Opfer – den Bauern holt Weiß meist zurück.',
      en: "The Queen's Gambit: c4 tempts the d5 pawn away from the centre. Not a real sacrifice – White usually wins it back.",
    },
    {
      zuege: 'd4 d5 c4 e6 Nc3',
      de: 'Mehr Druck auf d5 – der Springer steht hier ideal.',
      en: 'More pressure on d5 – the knight is ideally placed here.',
    },
    {
      zuege: 'd4 d5 c4 e6 Nc3 Nf6 Bg5',
      de: 'Der Läufer fesselt den Springer, der d5 verteidigt.',
      en: 'The bishop pins the knight that defends d5.',
    },
    {
      zuege: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6 cxd5',
      de: 'Weiß löst die Spannung im Zentrum und bereitet den Abtausch auf e7 vor.',
      en: 'White resolves the central tension and prepares the trade on e7.',
    },
    {
      zuege: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6 cxd5 Nxd5 Bxe7 Qxe7 Nxd5 exd5 Rc1',
      de: 'Der Turm nutzt die halboffene c-Linie – dort spielt Weiß in den nächsten Zügen.',
      en: 'The rook uses the half-open c-file – this is where White plays next.',
    },
    {
      zuege: 'd4 d5 c4 dxc4 e3',
      de: 'Weiß bereitet Lxc4 vor und holt den Bauern ganz einfach zurück.',
      en: 'White prepares Bxc4 and simply wins the pawn back.',
    },
    {
      zuege: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4',
      de: 'Verhindert b5, mit dem Schwarz den Mehrbauern auf c4 halten möchte.',
      en: 'Stops ...b5, which Black would use to hold the extra pawn on c4.',
    },
  ],
};
