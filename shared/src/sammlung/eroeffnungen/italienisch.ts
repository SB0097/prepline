import type { Sammlungseintrag } from '../typen.ts';

export const ITALIENISCH: Sammlungseintrag = {
  id: 'italienisch-evans',
  name: { de: 'Italienisch', en: 'Italian Game' },
  zusatz: { de: 'mit Evansgambit', en: 'with the Evans Gambit' },
  seite: 'weiss',
  stufe: 'einsteiger',
  beschreibung: {
    de: 'Ein klassischer Angriff auf das Zentrum und auf f7. Mit dem Evansgambit bekommst du für einen Bauern schnelle Entwicklung und Angriff.',
    en: 'A classical attack on the centre and on f7. With the Evans Gambit you get fast development and an attack for a pawn.',
  },
  pgn: `1. e4 e5 2. Nf3 Nc6 (2... d6 3. d4) 3. Bc4 Bc5
    (3... Nf6 4. d3 Be7 5. O-O O-O 6. Re1 d6 7. c3)
    4. b4 Bxb4 (4... Bb6 5. a4 a6 6. Nc3)
    5. c3 Ba5 (5... Be7 6. d4 Na5 7. Be2) (5... Bc5 6. d4 exd4 7. O-O)
    6. d4 exd4 (6... d6 7. Qb3 Qd7 8. dxe5)
    7. O-O Nge7 8. cxd4 d5 9. exd5 Nxd5 10. Ba3 *`,
  erklaerungen: [
    {
      zuege: 'e4',
      de: 'Weiß besetzt das Zentrum und öffnet Wege für Dame und Läufer.',
      en: 'White takes the centre and opens lines for the queen and bishop.',
    },
    {
      zuege: 'e4 e5 Nf3',
      de: 'Der Springer entwickelt sich und greift gleich den Bauern auf e5 an.',
      en: 'The knight develops and attacks the e5 pawn right away.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bc4',
      de: 'Der Läufer zielt auf f7 – den schwächsten Punkt von Schwarz, nur vom König gedeckt.',
      en: "The bishop aims at f7, Black's weakest square, guarded only by the king.",
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4',
      de: 'Das Evansgambit: Weiß bietet einen Bauern an. Nimmt Schwarz, gewinnt Weiß mit c3 und d4 Zeit für ein starkes Zentrum.',
      en: 'The Evans Gambit: White offers a pawn. If Black takes, c3 and d4 gain time for a strong centre.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3',
      de: 'Der Bauer vertreibt den Läufer mit Tempo und bereitet d4 vor.',
      en: 'The pawn chases the bishop with tempo and prepares d4.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4',
      de: 'Der Hauptgedanke: Weiß öffnet das Zentrum, solange der schwarze König noch in der Mitte steht.',
      en: "The key idea: White opens the centre while Black's king is still in the middle.",
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O',
      de: 'Erst den König in Sicherheit bringen – den Bauern holt Weiß danach mit cxd4 zurück.',
      en: 'King safety first – White wins the pawn back with cxd4 afterwards.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O Nge7 cxd4 d5 exd5 Nxd5 Ba3',
      de: 'Der Läufer hält den schwarzen König in der Mitte fest: Er deckt f8, also kann Schwarz nicht kurz rochieren.',
      en: "The bishop keeps Black's king in the centre: it covers f8, so Black can't castle short.",
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bb6 a4',
      de: 'Weiß gewinnt Raum am Damenflügel und droht, den Läufer mit a5 zu vertreiben.',
      en: 'White gains queenside space and threatens to chase the bishop with a5.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bc4 Nf6 d3',
      de: 'Ruhig und solide: Weiß deckt e4 und setzt auf langsamen Aufbau statt auf scharfe Varianten.',
      en: 'Calm and solid: White protects e4 and goes for a slow build-up instead of sharp lines.',
    },
    {
      zuege: 'e4 e5 Nf3 d6 d4',
      de: 'Gegen die passive Philidor-Verteidigung nimmt Weiß sofort mit d4 das Zentrum.',
      en: 'Against the passive Philidor Defence White grabs the centre at once with d4.',
    },
  ],
};
