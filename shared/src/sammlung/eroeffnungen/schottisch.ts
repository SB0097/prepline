import type { Sammlungseintrag } from '../typen.ts';

export const SCHOTTISCH: Sammlungseintrag = {
  id: 'schottisch',
  name: { de: 'Schottisch', en: 'Scotch Game' },
  zusatz: { de: 'mit Mieses-Variante', en: 'with the Mieses Variation' },
  seite: 'weiss',
  stufe: 'einsteiger',
  beschreibung: {
    de: 'Weiß öffnet das Zentrum schon im dritten Zug. Klare Pläne, freies Figurenspiel und wenig Theorie – ideal zum Einstieg.',
    en: 'White opens the centre as early as move three. Clear plans, free piece play and little theory – ideal for getting started.',
  },
  pgn: `1. e4 e5 2. Nf3 Nc6 (2... d6 3. d4 exd4 4. Nxd4 Nf6 5. Nc3) 3. d4 exd4 4. Nxd4
    Nf6 (4... Bc5 5. Be3 Qf6 6. c3 Nge7 7. Bc4)
    5. Nxc6 bxc6 6. e5 Qe7 7. Qe2 Nd5 8. c4 Ba6 (8... Nb6 9. Nc3) 9. b3 *`,
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
      zuege: 'e4 e5 Nf3 Nc6 d4',
      de: 'Das Schottische: Weiß stellt sofort die Frage im Zentrum, statt den Läufer zuerst zu entwickeln.',
      en: 'The Scotch: White challenges the centre at once instead of developing the bishop first.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4',
      de: 'Weiß nimmt mit dem Springer zurück und steht frei im Zentrum. Der Bauer e4 bleibt stark.',
      en: 'White recaptures with the knight and stands freely in the centre. The e4 pawn stays strong.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6',
      de: 'Weiß tauscht und gibt Schwarz einen Doppelbauern. Danach greift e5 den Springer an.',
      en: 'White trades and leaves Black with doubled pawns. Next, e5 attacks the knight.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5',
      de: 'Der Springer muss weichen. Weiß gewinnt Raum und drängt Schwarz zurück.',
      en: 'The knight has to move. White gains space and pushes Black back.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2',
      de: 'Die Dame deckt e5 und steht der schwarzen Dame direkt gegenüber.',
      en: "The queen protects e5 and faces Black's queen directly.",
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4',
      de: 'Der Springer auf d5 wird vertrieben – Weiß gewinnt noch mehr Raum.',
      en: 'The d5 knight is chased away – White gains even more space.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3',
      de: 'Der Bauer c4 ist angegriffen. b3 deckt ihn sicher, ohne die Stellung zu schwächen.',
      en: 'The c4 pawn is under attack. b3 protects it safely without weakening the position.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3',
      de: 'Der Läufer stellt sich dem Läufer c5 entgegen und deckt den Springer d4.',
      en: 'The bishop opposes the c5 bishop and protects the d4 knight.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3',
      de: 'Noch einmal gedeckt: Der Springer d4 steht jetzt bombenfest.',
      en: 'Protected once more: the d4 knight is now rock solid.',
    },
    {
      zuege: 'e4 e5 Nf3 d6 d4',
      de: 'Gegen das passive d6 nimmt Weiß sofort mit d4 das Zentrum.',
      en: 'Against the passive ...d6 White grabs the centre at once with d4.',
    },
  ],
};
