import type { Sammlungseintrag } from '../typen.ts';

export const SKANDINAVISCH: Sammlungseintrag = {
  id: 'skandinavisch',
  name: { de: 'Skandinavisch', en: 'Scandinavian Defence' },
  zusatz: { de: 'mit Da5', en: 'with ...Qa5' },
  seite: 'schwarz',
  stufe: 'einsteiger',
  beschreibung: {
    de: 'Schwarz greift e4 sofort an und bekommt eine klare, leicht zu lernende Stellung. Perfekt, um schnell eine Antwort auf 1. e4 zu haben.',
    en: 'Black attacks e4 at once and gets a clear, easy-to-learn position. Perfect for a quick answer to 1.e4.',
  },
  pgn: `1. e4 d5 2. exd5 (2. e5 Bf5 3. d4 e6) 2... Qxd5
    3. Nc3 (3. Nf3 Bg4 4. Be2 Nc6 5. O-O O-O-O) 3... Qa5
    4. d4 Nf6 5. Nf3 c6 6. Bc4 Bf5 7. Bd2 e6 *`,
  erklaerungen: [
    {
      zuege: 'e4 d5',
      de: 'Schwarz greift e4 sofort an und stellt sich dem Zentrum direkt entgegen.',
      en: 'Black attacks e4 at once and challenges the centre immediately.',
    },
    {
      zuege: 'e4 d5 exd5 Qxd5',
      de: 'Die Dame schlägt zurück. Sie kommt früh heraus, aber Schwarz bekommt ein einfaches, klares Spiel.',
      en: 'The queen recaptures. She comes out early, but Black gets easy, clear play.',
    },
    {
      zuege: 'e4 d5 exd5 Qxd5 Nc3 Qa5',
      de: 'Auf a5 steht die Dame sicher – und nach d4 fesselt sie den Springer c3.',
      en: 'On a5 the queen is safe – and after d4 she pins the knight on c3.',
    },
    {
      zuege: 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6',
      de: 'Schwarz entwickelt sich und schützt den Königsflügel.',
      en: 'Black develops and protects the kingside.',
    },
    {
      zuege: 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6',
      de: 'Gibt der Dame ein Rückzugsfeld auf c7 und festigt die Stellung.',
      en: 'Gives the queen a retreat square on c7 and steadies the position.',
    },
    {
      zuege: 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5',
      de: 'Der Läufer kommt vor e6 heraus – sonst wäre er hinter den eigenen Bauern eingesperrt.',
      en: 'The bishop gets out before ...e6 – otherwise it would be locked behind its own pawns.',
    },
    {
      zuege: 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5 Bd2 e6',
      de: 'Jetzt kann der Läufer f8 heraus und der König bald rochieren.',
      en: 'Now the f8 bishop can come out and the king can castle soon.',
    },
    {
      zuege: 'e4 d5 exd5 Qxd5 Nf3 Bg4',
      de: 'Der Läufer fesselt den Springer an die Dame.',
      en: 'The bishop pins the knight to the queen.',
    },
    {
      zuege: 'e4 d5 e5 Bf5',
      de: 'Gegen e5 kommt der Läufer sofort heraus, bevor e6 ihn einsperrt.',
      en: 'Against e5 the bishop comes out at once, before ...e6 shuts it in.',
    },
  ],
};
