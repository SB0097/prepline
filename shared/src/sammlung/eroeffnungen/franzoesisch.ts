import type { Sammlungseintrag } from '../typen.ts';

export const FRANZOESISCH: Sammlungseintrag = {
  id: 'franzoesisch',
  name: { de: 'Französisch', en: 'French Defence' },
  zusatz: { de: 'Klassische Variante', en: 'Classical Variation' },
  seite: 'schwarz',
  stufe: 'fortgeschritten',
  beschreibung: {
    de: 'Eine solide Antwort auf 1. e4. Schwarz baut eine feste Bauernkette und greift die weiße Kette später mit c5 und f6 von der Seite an.',
    en: 'A solid answer to 1.e4. Black builds a firm pawn chain and later attacks White’s chain from the side with ...c5 and ...f6.',
  },
  pgn: `1. e4 e6 2. d4 d5
    3. Nc3 (3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. a3 c4)
    (3. Nd2 Nf6 4. e5 Nfd7 5. Bd3 c5 6. c3 Nc6)
    (3. exd5 exd5 4. Bd3 Nc6 5. c3 Bd6)
    3... Nf6 4. Bg5 (4. e5 Nfd7 5. f4 c5 6. Nf3 Nc6 7. Be3 cxd4 8. Nxd4 Bc5)
    4... Be7 5. e5 Nfd7 6. Bxe7 Qxe7 7. f4 O-O 8. Nf3 c5 *`,
  erklaerungen: [
    {
      zuege: 'e4 e6',
      de: 'Französisch: Schwarz bereitet d5 vor und greift e4 an, ohne einen Bauern zu verlieren.',
      en: 'The French: Black prepares ...d5 and attacks e4 without losing a pawn.',
    },
    {
      zuege: 'e4 e6 d4 d5',
      de: 'Der Gegenangriff auf e4. Weiß muss sich entscheiden: decken, vorbeiziehen oder tauschen.',
      en: 'The counter-attack on e4. White has to choose: defend, push past or exchange.',
    },
    {
      zuege: 'e4 e6 d4 d5 Nc3 Nf6',
      de: 'Noch ein Angriff auf e4 – Schwarz entwickelt sich mit Tempo.',
      en: 'Another attack on e4 – Black develops with tempo.',
    },
    {
      zuege: 'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7',
      de: 'Der Läufer löst die Fesselung des Springers auf.',
      en: 'The bishop breaks the pin on the knight.',
    },
    {
      zuege: 'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7',
      de: 'Der Springer weicht nach d7 aus. Von dort unterstützt er später c5 und f6.',
      en: 'The knight steps back to d7. From there it later supports ...c5 and ...f6.',
    },
    {
      zuege: 'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7 Bxe7 Qxe7',
      de: 'Mit der Dame zurücknehmen: Sie bleibt nah am König und unterstützt von e7 aus später c5.',
      en: 'Recapture with the queen: it stays close to the king and later supports ...c5 from e7.',
    },
    {
      zuege: 'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7 Bxe7 Qxe7 f4 O-O Nf3 c5',
      de: 'Der typische französische Hebel: Schwarz greift die weiße Bauernkette an ihrer Basis d4 an.',
      en: "The typical French lever: Black attacks White's pawn chain at its base on d4.",
    },
    {
      zuege: 'e4 e6 d4 d5 e5 c5',
      de: 'Gegen den Vorstoß greift Schwarz sofort die Basis der Bauernkette auf d4 an.',
      en: 'Against the Advance Variation Black hits the base of the chain on d4 at once.',
    },
    {
      zuege: 'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6',
      de: 'Drei Figuren greifen jetzt d4 an. Die Dame zielt außerdem auf b2.',
      en: 'Three pieces now attack d4. The queen also eyes b2.',
    },
    {
      zuege: 'e4 e6 d4 d5 Nd2 Nf6',
      de: 'Gegen Tarrasch greift Schwarz e4 an. Zieht Weiß mit e5 vorbei, geht der Springer nach d7 und unterstützt c5.',
      en: 'Against the Tarrasch Black hits e4. If White pushes on with e5, the knight goes to d7 and supports ...c5.',
    },
    {
      zuege: 'e4 e6 d4 d5 exd5 exd5 Bd3 Nc6',
      de: 'Nach dem Abtausch ist die Stellung offen und gleich. Schwarz entwickelt sich einfach schnell.',
      en: 'After the exchange the position is open and level. Black simply develops quickly.',
    },
  ],
};
