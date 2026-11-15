import type { Sammlungseintrag } from '../typen.ts';

export const SPANISCH: Sammlungseintrag = {
  id: 'spanisch',
  name: { de: 'Spanisch', en: 'Ruy Lopez' },
  zusatz: { de: 'Geschlossene Variante', en: 'Closed Variation' },
  seite: 'weiss',
  stufe: 'fortgeschritten',
  beschreibung: {
    de: 'Eine der ältesten und besten Eröffnungen überhaupt. Weiß übt lange Druck auf e5 aus und spielt mit einem kleinen, aber dauerhaften Vorteil.',
    en: 'One of the oldest and best openings of all. White keeps long-term pressure on e5 and plays with a small but lasting edge.',
  },
  pgn: `1. e4 e5 2. Nf3 Nc6 3. Bb5
    a6 (3... Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8)
    (3... d6 4. d4 Bd7 5. Nc3)
    4. Ba4 Nf6 5. O-O Be7 (5... Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6)
    6. Re1 b5 7. Bb3 d6 (7... O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6)
    8. c3 O-O 9. h3 *`,
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
      zuege: 'e4 e5 Nf3 Nc6 Bb5',
      de: 'Der Spanische Läufer greift den Verteidiger von e5 an. So steht e5 dauerhaft unter Druck.',
      en: 'The Spanish bishop attacks the defender of e5, so e5 stays under lasting pressure.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4',
      de: 'Weiß behält den Druck auf den Springer c6. Sofort zu tauschen gewinnt e5 noch nicht.',
      en: 'White keeps the pressure on the c6 knight. Taking at once does not win e5 yet.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O',
      de: 'Erst den König in Sicherheit bringen. Nimmt Schwarz auf e4, holt Weiß den Bauern später zurück.',
      en: 'King safety first. If Black takes on e4, White wins the pawn back later.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1',
      de: 'Der Turm deckt e4. Jetzt droht Weiß wirklich, auf c6 zu tauschen und e5 zu gewinnen.',
      en: 'The rook guards e4. Now White really threatens to take on c6 and win e5.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3',
      de: 'Der Läufer zieht sich zurück und zielt weiter auf f7.',
      en: 'The bishop retreats and keeps aiming at f7.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3',
      de: 'c3 bereitet d4 vor und gibt dem Läufer ein Rückzugsfeld auf c2.',
      en: 'c3 prepares d4 and gives the bishop a retreat square on c2.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3',
      de: 'Ein kleiner, wichtiger Zug: h3 verhindert Lg4, danach kommt d4 ohne Fesselung.',
      en: 'A small but important move: h3 stops ...Bg4, so d4 can follow without a pin.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4',
      de: 'Gegen die Berliner Verteidigung öffnet Weiß sofort das Zentrum und holt den Bauern zurück.',
      en: 'Against the Berlin Defence White opens the centre at once and regains the pawn.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+',
      de: 'Das Berliner Endspiel: Schwarz kann nicht mehr rochieren, Weiß hat die bessere Bauernstruktur.',
      en: 'The Berlin endgame: Black can no longer castle, and White has the better pawn structure.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3',
      de: 'Ruhig weiter. Spielt Schwarz jetzt d5, ist das das Marshall-Gambit.',
      en: 'Calmly on. If Black now plays ...d5, that is the Marshall Gambit.',
    },
    {
      zuege: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4 d4',
      de: 'Gegen die Offene Variante greift Weiß sofort im Zentrum an, statt den Bauern zu jagen.',
      en: 'Against the Open Variation White strikes in the centre at once instead of chasing the pawn.',
    },
  ],
};
