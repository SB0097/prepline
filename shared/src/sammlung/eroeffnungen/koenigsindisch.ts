import type { Sammlungseintrag } from '../typen.ts';

export const KOENIGSINDISCH: Sammlungseintrag = {
  id: 'koenigsindisch',
  name: { de: 'Königsindisch', en: "King's Indian Defence" },
  zusatz: { de: 'Klassische Variante', en: 'Classical Variation' },
  seite: 'schwarz',
  stufe: 'profi',
  beschreibung: {
    de: 'Schwarz überlässt Weiß zuerst das Zentrum und schlägt dann mit e5 und f5 zurück. Scharf, dynamisch und voller Angriffschancen am Königsflügel.',
    en: 'Black lets White take the centre first, then strikes back with ...e5 and ...f5. Sharp, dynamic and full of kingside attacking chances.',
  },
  pgn: `1. d4 Nf6 2. c4 (2. Nf3 g6 3. Bf4 Bg7 4. e3 O-O 5. Be2 d6 6. h3)
    2... g6 3. Nc3 (3. Nf3 Bg7 4. g3 O-O 5. Bg2 d6 6. O-O Nbd7 7. Nc3 e5)
    3... Bg7 4. e4 d6 5. Nf3 (5. f3 O-O 6. Be3 e5 7. d5 c6)
    5... O-O 6. Be2 e5 7. O-O (7. d5 a5 8. Bg5 h6 9. Bh4)
    7... Nc6 8. d5 Ne7 9. Ne1 Nd7 10. Nd3 f5 *`,
  erklaerungen: [
    {
      zuege: 'd4 Nf6',
      de: 'Ein flexibler Start: Der Springer hält e4 unter Kontrolle und legt sich noch nicht fest.',
      en: 'A flexible start: the knight controls e4 and commits to nothing yet.',
    },
    {
      zuege: 'd4 Nf6 c4 g6',
      de: 'Königsindisch: Der Läufer kommt nach g7 und wird auf der langen Diagonale sehr stark.',
      en: "The King's Indian: the bishop goes to g7 and becomes very strong on the long diagonal.",
    },
    {
      zuege: 'd4 Nf6 c4 g6 Nc3 Bg7',
      de: 'Der Läufer zielt auf d4 und das Zentrum. Weiß darf das Zentrum erst einmal besetzen.',
      en: 'The bishop aims at d4 and the centre. White is allowed to occupy the centre for now.',
    },
    {
      zuege: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6',
      de: 'd6 hält e5 unter Kontrolle und bereitet den Gegenschlag e5 vor.',
      en: '...d6 controls e5 and prepares the counter-strike ...e5.',
    },
    {
      zuege: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O',
      de: 'Erst den König in Sicherheit bringen, dann im Zentrum zurückschlagen.',
      en: 'King safety first, then strike back in the centre.',
    },
    {
      zuege: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5',
      de: 'Der Gegenschlag im Zentrum: e5 greift d4 an und gibt dem Läufer g7 Bedeutung.',
      en: 'The central counter-strike: ...e5 attacks d4 and gives the g7 bishop a purpose.',
    },
    {
      zuege: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6',
      de: 'Noch mehr Druck auf d4. Weiß muss sich entscheiden, ob er tauscht oder mit d5 schließt.',
      en: 'Even more pressure on d4. White has to decide whether to trade or close with d5.',
    },
    {
      zuege: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7',
      de: 'Das Zentrum ist zu. Der Springer geht Richtung Königsflügel, wo Schwarz angreifen wird.',
      en: 'The centre is closed. The knight heads for the kingside, where Black will attack.',
    },
    {
      zuege: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7',
      de: 'Der Springer macht den Weg frei für den Bauern f – der Angriff beginnt.',
      en: 'The knight clears the way for the f-pawn – the attack begins.',
    },
    {
      zuege: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7 Nd3 f5',
      de: 'Der typische Königsinder-Plan: Weiß greift am Damenflügel an, Schwarz mit f5 am Königsflügel.',
      en: "The typical King's Indian plan: White attacks on the queenside, Black with ...f5 on the kingside.",
    },
    {
      zuege: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 d5 a5',
      de: 'a5 bremst den weißen Vorstoß b4 am Damenflügel.',
      en: "...a5 slows down White's b4 push on the queenside.",
    },
    {
      zuege: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5',
      de: 'Auch gegen den Sämisch-Aufbau schlägt Schwarz mit e5 im Zentrum zurück.',
      en: 'Against the Sämisch set-up too, Black strikes back in the centre with ...e5.',
    },
    {
      zuege: 'd4 Nf6 c4 g6 Nf3 Bg7 g3 O-O Bg2 d6 O-O Nbd7 Nc3 e5',
      de: 'Gegen den Fianchetto-Aufbau bereitet der Springer d7 den Gegenschlag e5 vor.',
      en: 'Against the fianchetto set-up the d7 knight prepares the ...e5 counter-strike.',
    },
    {
      zuege: 'd4 Nf6 Nf3 g6',
      de: 'Auch ohne c4 bleibt Schwarz beim Königsinder-Aufbau mit Lg7 und kurzer Rochade.',
      en: "Even without c4 Black sticks to the King's Indian set-up with ...Bg7 and short castling.",
    },
  ],
};
