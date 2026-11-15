import type { Sammlungseintrag } from '../typen.ts';

export const ENGLISCH: Sammlungseintrag = {
  id: 'englisch',
  name: { de: 'Englisch', en: 'English Opening' },
  zusatz: { de: 'mit Fianchetto-Aufbau', en: 'with the fianchetto set-up' },
  seite: 'weiss',
  stufe: 'fortgeschritten',
  beschreibung: {
    de: 'Weiß kontrolliert d5 von der Seite und baut ruhig mit g3 und Lg2 auf. Flexibel, positionell und mit wenig Risiko.',
    en: 'White controls d5 from the side and builds up calmly with g3 and Bg2. Flexible, positional and low-risk.',
  },
  pgn: `1. c4 e5 (1... c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. Nf3 Nf6 6. O-O O-O 7. d4)
    (1... Nf6 2. Nc3 g6 3. g3 Bg7 4. Bg2 O-O 5. e4 d6 6. Nge2)
    2. Nc3 Nf6 (2... Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6 6. e4)
    3. g3 d5 4. cxd5 Nxd5 5. Bg2 Nb6 6. Nf3 Nc6 7. O-O Be7 8. d3 O-O 9. a3 *`,
  erklaerungen: [
    {
      zuege: 'c4',
      de: 'Das Englische: Weiß kämpft von der Seite um das Feld d5, ohne sich im Zentrum festzulegen.',
      en: 'The English: White fights for d5 from the side without committing in the centre.',
    },
    {
      zuege: 'c4 e5 Nc3',
      de: 'Der Springer verstärkt die Kontrolle über d5.',
      en: 'The knight strengthens the control of d5.',
    },
    {
      zuege: 'c4 e5 Nc3 Nf6 g3',
      de: 'Weiß bereitet Lg2 vor. Der Läufer wird auf der langen Diagonale sehr stark.',
      en: 'White prepares Bg2. The bishop will be very strong on the long diagonal.',
    },
    {
      zuege: 'c4 e5 Nc3 Nf6 g3 d5 cxd5',
      de: 'Weiß tauscht, damit Schwarz keinen starken Bauern auf d5 behält.',
      en: 'White trades so Black keeps no strong pawn on d5.',
    },
    {
      zuege: 'c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2',
      de: 'Der Läufer greift über die lange Diagonale den Springer d5 an.',
      en: 'The bishop attacks the d5 knight along the long diagonal.',
    },
    {
      zuege: 'c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2 Nb6 Nf3',
      de: 'Der Springer greift e5 an und macht die kurze Rochade möglich.',
      en: 'The knight attacks e5 and makes short castling possible.',
    },
    {
      zuege: 'c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2 Nb6 Nf3 Nc6 O-O Be7 d3',
      de: 'Ruhiger Aufbau: d3 öffnet den Läufer c1 und hält e4 unter Kontrolle.',
      en: 'A calm set-up: d3 frees the c1 bishop and keeps e4 under control.',
    },
    {
      zuege: 'c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2 Nb6 Nf3 Nc6 O-O Be7 d3 O-O a3',
      de: 'a3 bereitet b4 vor: Weiß spielt am Damenflügel, wo ihm die halboffene c-Linie hilft.',
      en: 'a3 prepares b4: White plays on the queenside, where the half-open c-file helps.',
    },
    {
      zuege: 'c4 e5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6 e4',
      de: 'Der Botwinnik-Aufbau: Die Bauern c4 und e4 nehmen Schwarz das Feld d5 dauerhaft weg.',
      en: 'The Botvinnik set-up: the pawns on c4 and e4 take d5 away from Black for good.',
    },
    {
      zuege: 'c4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 Nf3 Nf6 O-O O-O d4',
      de: 'Gegen das symmetrische Englisch öffnet Weiß im richtigen Moment das Zentrum.',
      en: 'Against the Symmetrical English White opens the centre at the right moment.',
    },
    {
      zuege: 'c4 Nf6 Nc3 g6 g3 Bg7 Bg2 O-O e4',
      de: 'Auch gegen den Königsinder nimmt Weiß mit e4 Raum und hält d5 fest im Griff.',
      en: 'Against the King’s Indian set-up too, White takes space with e4 and keeps a firm grip on d5.',
    },
  ],
};
