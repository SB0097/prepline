// Schachbrett mit Figuren. Bedienung: Figur antippen und Zielfeld antippen – oder Figur ziehen.
// Das Brett prüft nur, ob ein Zug erlaubt ist; ob er richtig ist, entscheidet der Aufrufer (onZug).
import {
  type Brettzug,
  type Feld,
  type Seite,
  brettfelder,
  feldAusIndex,
  felderAusUci,
  indexAusFeld,
  zielfelder,
  zugAusFeldern,
} from '@prepline/shared';
import { useRef, useState } from 'react';
import { Animated, type GestureResponderEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon, SvgXml } from 'react-native-svg';

import { FARBEN } from '@/ui/farben';

import { type Figurensatz, type FigurName, FIGURENSATZ_STANDARD } from './figuren';
import { FIGUREN_SVG } from './figurenSvg';

export type Feldmarkierung = { feld: Feld; farbe: string };

type Props = {
  fen: string;
  /** Kantenlänge in Pixeln. */
  groesse: number;
  /** Von welcher Seite aus das Brett gezeigt wird (unten). */
  ansicht: Seite;
  figurensatz?: Figurensatz;
  /** Letzter Zug als UCI (z. B. "f8c5"), beide Felder werden hervorgehoben. */
  letzterZug?: string;
  /** Zusätzliche Farbflächen, z. B. grün für „richtig“. */
  markierungen?: readonly Feldmarkierung[];
  /** Pfeil als UCI, z. B. für den richtigen Zug nach einem Fehler. */
  pfeil?: string;
  /** Darf gezogen werden? */
  bedienbar?: boolean;
  /** Koordinaten a–h und 1–8 in den Ecken (aus bei Mini-Brettern). */
  koordinaten?: boolean;
  /** Rundung der vier Brettecken in Pixeln. */
  rundung?: number;
  onZug?: (zug: Brettzug) => void;
};

/** Ab so vielen Pixeln Bewegung wird aus Antippen ein Ziehen. */
const ZIEH_SCHWELLE = 6;

export function Schachbrett({
  fen,
  groesse,
  ansicht,
  figurensatz = FIGURENSATZ_STANDARD,
  letzterZug,
  markierungen = [],
  pfeil,
  bedienbar = true,
  koordinaten = true,
  rundung = 0,
  onZug,
}: Props) {
  const f = groesse / 8;
  const felder = brettfelder(fen, ansicht);
  const amZug = fen.split(' ')[1] === 'b' ? 'b' : 'w';

  const [auswahl, setAuswahl] = useState<Feld | null>(null);
  const [gezogen, setGezogen] = useState<Feld | null>(null);
  const [position] = useState(() => new Animated.ValueXY());

  // Neue Stellung: alte Auswahl verwerfen.
  const [letzteFen, setLetzteFen] = useState(fen);
  if (letzteFen !== fen) {
    setLetzteFen(fen);
    setAuswahl(null);
    setGezogen(null);
  }

  const ziele = auswahl ? zielfelder(fen, auswahl) : [];

  // Laufende Geste: Startfeld, Fingerposition beim Aufsetzen, ob schon gezogen wird.
  const geste = useRef({
    start: null as Feld | null,
    x: 0,
    y: 0,
    seiteX: 0,
    seiteY: 0,
    ziehen: false,
  });

  const feldBei = (x: number, y: number): Feld | null => {
    const spalte = Math.floor(x / f);
    const zeile = Math.floor(y / f);
    if (spalte < 0 || spalte > 7 || zeile < 0 || zeile > 7) return null;
    return feldAusIndex(zeile * 8 + spalte, ansicht);
  };
  const eigeneFigur = (feld: Feld | null): boolean =>
    !!feld && felder[indexAusFeld(feld, ansicht)]?.figur?.farbe === amZug;
  const ziehenVersuchen = (von: Feld, nach: Feld): boolean => {
    const zug = zugAusFeldern(fen, von, nach);
    if (!zug) return false;
    setAuswahl(null);
    onZug?.(zug);
    return true;
  };
  const antippen = (feld: Feld | null) => {
    if (auswahl && feld && ziele.includes(feld)) ziehenVersuchen(auswahl, feld);
    else if (eigeneFigur(feld) && feld !== auswahl) setAuswahl(feld);
    else setAuswahl(null);
  };
  const versatz = (e: GestureResponderEvent) => ({
    dx: e.nativeEvent.pageX - geste.current.seiteX,
    dy: e.nativeEvent.pageY - geste.current.seiteY,
  });
  const beenden = () => {
    geste.current = { start: null, x: 0, y: 0, seiteX: 0, seiteY: 0, ziehen: false };
    setGezogen(null);
  };
  const steuerung = {
    onStartShouldSetResponder: () => bedienbar,
    onMoveShouldSetResponder: () => bedienbar,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: GestureResponderEvent) => {
      const { locationX: x, locationY: y, pageX, pageY } = e.nativeEvent;
      geste.current = { start: feldBei(x, y), x, y, seiteX: pageX, seiteY: pageY, ziehen: false };
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const { start, x, y, ziehen } = geste.current;
      const { dx, dy } = versatz(e);
      if (!ziehen) {
        if (Math.abs(dx) + Math.abs(dy) < ZIEH_SCHWELLE || !eigeneFigur(start)) return;
        geste.current.ziehen = true;
        setGezogen(start);
        setAuswahl(start);
      }
      position.setValue({ x: x + dx - f / 2, y: y + dy - f / 2 });
    },
    onResponderRelease: (e: GestureResponderEvent) => {
      const { start, x, y, ziehen } = geste.current;
      if (ziehen && start) {
        const { dx, dy } = versatz(e);
        const ziel = feldBei(x + dx, y + dy);
        if (ziel && ziel !== start && !ziehenVersuchen(start, ziel)) setAuswahl(null);
      } else {
        antippen(start);
      }
      beenden();
    },
    onResponderTerminate: beenden,
  };

  const ecke = (feld: Feld) => {
    const index = indexAusFeld(feld, ansicht);
    return { left: (index % 8) * f, top: Math.floor(index / 8) * f, width: f, height: f };
  };
  // Nur die vier Eckfelder werden abgerundet, so wird eine gezogene Figur am Rand nicht abgeschnitten.
  const eckenRundung = (feld: Feld) => {
    const index = indexAusFeld(feld, ansicht);
    return {
      ...(index === 0 && { borderTopLeftRadius: rundung }),
      ...(index === 7 && { borderTopRightRadius: rundung }),
      ...(index === 56 && { borderBottomLeftRadius: rundung }),
      ...(index === 63 && { borderBottomRightRadius: rundung }),
    };
  };
  const hervorgehoben = [
    ...(letzterZug ? felderAusUci(letzterZug) : []),
    ...(auswahl ? [auswahl] : []),
  ];
  const gezogeneFigur = gezogen ? felder[indexAusFeld(gezogen, ansicht)]?.figur : null;
  const svg = (farbe: 'w' | 'b', typ: string) =>
    FIGUREN_SVG[figurensatz][`${farbe}${typ.toUpperCase()}` as FigurName];

  return (
    <View
      style={{ width: groesse, height: groesse }}
      accessibilityLabel="Schachbrett"
      testID="schachbrett"
      {...steuerung}
    >
      {felder.map(({ feld, hell }, index) => (
        <View
          key={feld}
          pointerEvents="none"
          style={[
            styles.feld,
            ecke(feld),
            eckenRundung(feld),
            { backgroundColor: hell ? FARBEN.brettHell : FARBEN.brettDunkel },
          ]}
        >
          {koordinaten && index % 8 === 0 && (
            <Text style={[styles.reihe, koordinate(f, hell)]}>{feld[1]}</Text>
          )}
          {koordinaten && index >= 56 && (
            <Text style={[styles.linie, koordinate(f, hell)]}>{feld[0]}</Text>
          )}
        </View>
      ))}
      {hervorgehoben.map((feld, i) => (
        <View
          key={`h${i}`}
          pointerEvents="none"
          style={[
            styles.feld,
            ecke(feld),
            eckenRundung(feld),
            { backgroundColor: FARBEN.brettMarkierung },
          ]}
        />
      ))}
      {markierungen.map(({ feld, farbe }) => (
        <View
          key={`m${feld}`}
          pointerEvents="none"
          style={[styles.feld, ecke(feld), eckenRundung(feld), { backgroundColor: farbe }]}
        />
      ))}
      {felder.map(({ feld, figur }) =>
        figur && feld !== gezogen ? (
          <View key={`f${feld}`} pointerEvents="none" style={[styles.feld, ecke(feld)]}>
            <SvgXml
              xml={svg(figur.farbe, figur.typ)}
              width={f}
              height={f}
              testID={`figur-${feld}`}
            />
          </View>
        ) : null,
      )}
      {ziele.map((feld) => {
        const schlagen = felder[indexAusFeld(feld, ansicht)]?.figur;
        return (
          <View
            key={`z${feld}`}
            pointerEvents="none"
            style={[styles.feld, styles.mitte, ecke(feld)]}
            testID={`ziel-${feld}`}
          >
            <View
              style={
                schlagen
                  ? [
                      styles.ring,
                      { width: f, height: f, borderRadius: f / 2, borderWidth: f * 0.08 },
                    ]
                  : [styles.punkt, { width: f * 0.3, height: f * 0.3, borderRadius: f * 0.15 }]
              }
            />
          </View>
        );
      })}
      {pfeil && <Pfeil uci={pfeil} f={f} ansicht={ansicht} groesse={groesse} />}
      {gezogeneFigur && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.feld,
            {
              width: f,
              height: f,
              transform: [...position.getTranslateTransform(), { scale: 1.2 }],
            },
          ]}
        >
          <SvgXml xml={svg(gezogeneFigur.farbe, gezogeneFigur.typ)} width={f} height={f} />
        </Animated.View>
      )}
    </View>
  );
}

function Pfeil({
  uci,
  f,
  ansicht,
  groesse,
}: {
  uci: string;
  f: number;
  ansicht: Seite;
  groesse: number;
}) {
  const mitte = (feld: Feld) => {
    const index = indexAusFeld(feld, ansicht);
    return { x: (index % 8) * f + f / 2, y: Math.floor(index / 8) * f + f / 2 };
  };
  const [von, nach] = felderAusUci(uci).map(mitte) as [
    { x: number; y: number },
    { x: number; y: number },
  ];
  const winkel = Math.atan2(nach.y - von.y, nach.x - von.x);
  const spitze = f * 0.38;
  const ende = { x: nach.x - Math.cos(winkel) * spitze, y: nach.y - Math.sin(winkel) * spitze };
  const seite = (richtung: number) =>
    `${ende.x + Math.cos(winkel + richtung) * spitze * 0.75},${ende.y + Math.sin(winkel + richtung) * spitze * 0.75}`;
  return (
    <Svg width={groesse} height={groesse} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Line
        x1={von.x}
        y1={von.y}
        x2={ende.x}
        y2={ende.y}
        stroke={FARBEN.akzent}
        strokeWidth={f * 0.18}
        strokeLinecap="round"
        opacity={0.9}
      />
      <Polygon
        points={`${nach.x},${nach.y} ${seite(Math.PI / 2)} ${seite(-Math.PI / 2)}`}
        fill={FARBEN.akzent}
        opacity={0.9}
      />
    </Svg>
  );
}

const koordinate = (f: number, hell: boolean) => ({
  fontSize: Math.max(9, f * 0.2),
  color: hell ? FARBEN.brettDunkel : FARBEN.brettHell,
});

const styles = StyleSheet.create({
  feld: { position: 'absolute', left: 0, top: 0 },
  mitte: { alignItems: 'center', justifyContent: 'center' },
  reihe: { position: 'absolute', left: 3, top: 1, fontWeight: '700' },
  linie: { position: 'absolute', right: 3, bottom: 0, fontWeight: '700' },
  punkt: { backgroundColor: 'rgba(13, 14, 17, 0.32)' },
  ring: { borderColor: 'rgba(13, 14, 17, 0.32)' },
});
