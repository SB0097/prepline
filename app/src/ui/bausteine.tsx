// Wiederkehrende Bausteine im Stil „Graphit“, Layout „Ruhig & groß“ (Serkan 14.11.2026):
// Knöpfe, Umschalter, Seitenköpfe mit großem Titel, Fortschrittsbalken.
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import {
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { CSS_AUSKLINGEN, DAUER } from './bewegung';
import { FARBEN } from './farben';
import { type Symbolname, Zeichen } from './symbole';
import { Text } from './Text';

const AnimiertDrueckbar = Animated.createAnimatedComponent(Pressable);

/**
 * Drückbare Fläche, die beim Aufsetzen des Fingers leicht nachgibt (96 %) und beim Loslassen
 * zurückfedert (Runde 14). Bei „Animationen entfernen“ wird sie stattdessen kurz blasser.
 */
export function Federnd({
  style,
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  const [gedrueckt, setGedrueckt] = useState(false);
  const ruhig = useReducedMotion();
  return (
    <AnimiertDrueckbar
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        setGedrueckt(true);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setGedrueckt(false);
        onPressOut?.(e);
      }}
      style={[
        style,
        gedrueckt && ruhig && { opacity: 0.75 },
        {
          transform: [{ scale: gedrueckt && !ruhig ? 0.96 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: DAUER.druck,
          transitionTimingFunction: CSS_AUSKLINGEN,
        },
      ]}
    />
  );
}

/**
 * Listenzeile zum Antippen (Runde 15): beim Drücken leicht hell hinterlegt statt zu federn.
 * Die Fläche reicht `einzug` über den Inhalt hinaus, der Inhalt bleibt an seinem Platz.
 * Auf Karten: `einzug` = Innenabstand der Karte, `flaeche` = FARBEN.karteHell, `rund` = 0
 * und die Karte braucht `overflow: 'hidden'`.
 */
export function Zeilenknopf({
  einzug = 12,
  flaeche = FARBEN.karte,
  rund = 14,
  style,
  ...rest
}: Omit<PressableProps, 'style'> & {
  einzug?: number;
  flaeche?: string;
  rund?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [
        { marginHorizontal: -einzug, paddingHorizontal: einzug, borderRadius: rund },
        pressed && { backgroundColor: flaeche },
        style,
      ]}
    />
  );
}

export const RUNDUNG = 22;

/** Kleinste Tippfläche nach den Android-Richtlinien (48 dp). */
export const TIPPFLAECHE = 48;
const RUND_AKZENT = 44;
const RUND_LEISE = 40;

/** Grundform einer Karte: Fläche mit feinem Rand. */
export const KARTE = {
  backgroundColor: FARBEN.karte,
  borderRadius: RUNDUNG,
  borderWidth: 1,
  borderColor: FARBEN.rand,
} as const;

/** Zurück zur vorigen Seite; gibt es keine (z. B. nach einem Neustart), zur Startseite. */
export function zurueck(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/**
 * Farbverlauf in der Akzentfarbe als Hintergrund. Das Elternelement braucht
 * `overflow: 'hidden'` und eine Rundung. Die Fläche wird gemessen, weil das SVG
 * eine feste Größe in Pixeln braucht.
 */
export function Verlauf({ schraeg = false }: { schraeg?: boolean }) {
  const [flaeche, setFlaeche] = useState({ breite: 0, hoehe: 0 });
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) =>
        setFlaeche({ breite: e.nativeEvent.layout.width, hoehe: e.nativeEvent.layout.height })
      }
    >
      {flaeche.breite > 0 && (
        <Svg width={flaeche.breite} height={flaeche.hoehe}>
          <Defs>
            <LinearGradient id="verlauf" x1="0" y1="0" x2="1" y2={schraeg ? '1' : '0'}>
              <Stop offset="0" stopColor={FARBEN.akzent} />
              <Stop offset="1" stopColor={FARBEN.akzentHell} />
            </LinearGradient>
          </Defs>
          <Rect width={flaeche.breite} height={flaeche.hoehe} fill="url(#verlauf)" />
        </Svg>
      )}
    </View>
  );
}

export function Knopf({
  titel,
  onPress,
  art = 'voll',
  aus = false,
  symbol,
}: {
  titel: string;
  onPress: () => void;
  art?: 'voll' | 'leise' | 'rahmen';
  aus?: boolean;
  symbol?: Symbolname;
}) {
  return (
    <Federnd
      onPress={onPress}
      disabled={aus}
      accessibilityRole="button"
      accessibilityState={{ disabled: aus }}
      style={[
        art === 'voll' ? stile.knopfVoll : art === 'rahmen' ? stile.knopfRahmen : stile.knopfLeise,
        aus && { opacity: 0.4 },
      ]}
    >
      {art === 'voll' && <Verlauf />}
      {symbol && (
        <Zeichen
          name={symbol}
          farbe={art === 'voll' ? FARBEN.textAufAkzent : FARBEN.text}
          groesse={20}
        />
      )}
      {/* Bei großer Systemschrift wird die Beschriftung kleiner statt abgeschnitten. */}
      <Text
        style={[
          art === 'voll'
            ? stile.knopfTextVoll
            : art === 'rahmen'
              ? stile.knopfTextRahmen
              : stile.knopfTextLeise,
          { flexShrink: 1 },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {titel}
      </Text>
    </Federnd>
  );
}

/** Runder Knopf mit Symbol, z. B. „+“ oben rechts oder „×“ im Training. */
export function RundKnopf({
  symbol,
  onPress,
  beschriftung,
  art = 'leise',
}: {
  symbol: Symbolname;
  onPress: () => void;
  beschriftung: string;
  art?: 'akzent' | 'leise';
}) {
  // Sichtbar bleibt der Kreis (40/44 dp), antippbar sind immer 48 dp (Android-Mindestmaß).
  // Der negative Rand gleicht die größere Fläche aus, das Layout bleibt gleich.
  const kreis = art === 'akzent' ? RUND_AKZENT : RUND_LEISE;
  const ueberstand = -(TIPPFLAECHE - kreis) / 2;
  return (
    <Federnd
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={beschriftung}
      style={[stile.rundFlaeche, { margin: ueberstand }]}
    >
      <View style={[stile.rund, art === 'leise' && stile.rundLeise]}>
        {art === 'akzent' && <Verlauf schraeg />}
        <Zeichen
          name={symbol}
          farbe={art === 'akzent' ? FARBEN.textAufAkzent : FARBEN.text}
          groesse={art === 'akzent' ? 22 : 20}
        />
      </View>
    </Federnd>
  );
}

/**
 * Fortschrittsbalken; der gefüllte Teil zeigt den Akzent-Verlauf. Die Füllung ist immer so
 * breit wie der Balken und wird nur verschoben, so wächst sie flüssig, ohne Layout pro Bild.
 */
export function Balken({
  anteil,
  hoehe = 6,
  farbe,
}: {
  anteil: number;
  hoehe?: number;
  /** Feste Farbe statt Verlauf, z. B. Grün für „alles gut“. */
  farbe?: string;
}) {
  const [breite, setBreite] = useState(0);
  const teil = Math.max(0, Math.min(1, anteil));
  const rund = { height: hoehe, borderRadius: hoehe / 2 };
  return (
    <View
      style={[stile.balken, rund]}
      onLayout={(e) => setBreite(e.nativeEvent.layout.width)}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(teil * 100) }}
    >
      {/* Erst nach dem Messen zeigen, sonst wächst der Balken beim Öffnen der Seite sichtbar an. */}
      {breite > 0 && (
        <Animated.View
          style={[
            stile.balkenVoll,
            rund,
            {
              width: breite,
              transform: [{ translateX: -(1 - teil) * breite }],
              transitionProperty: 'transform',
              transitionDuration: DAUER.balken,
              transitionTimingFunction: CSS_AUSKLINGEN,
            },
            farbe ? { backgroundColor: farbe } : null,
          ]}
        >
          {!farbe && <Verlauf />}
        </Animated.View>
      )}
    </View>
  );
}

/** Kleiner Kreis in der Farbe einer Seite (weiße oder schwarze Figuren). */
export function Seitenpunkt({
  seite,
  groesse = 13,
}: {
  seite: 'weiss' | 'schwarz';
  groesse?: number;
}) {
  return (
    <View
      style={{
        width: groesse,
        height: groesse,
        borderRadius: groesse / 2,
        backgroundColor: seite === 'weiss' ? '#FFFFFF' : '#0A0A0A',
        borderWidth: seite === 'weiss' ? 0 : 1.5,
        borderColor: FARBEN.textLeise,
      }}
    />
  );
}

export function Umschalter<T extends string>({
  werte,
  wert,
  onWahl,
}: {
  werte: readonly {
    wert: T;
    titel: string;
    seite?: 'weiss' | 'schwarz';
    anzahl?: number | undefined;
  }[];
  wert: T;
  onWahl: (wert: T) => void;
}) {
  return (
    <View style={stile.umschalter} accessibilityRole="tablist">
      {werte.map((w) => {
        const aktiv = w.wert === wert;
        return (
          <Pressable
            key={w.wert}
            onPress={() => onWahl(w.wert)}
            accessibilityRole="tab"
            accessibilityState={{ selected: aktiv }}
            accessibilityLabel={w.titel}
            style={stile.umschalterTeil}
          >
            {aktiv && <Verlauf />}
            {w.seite && <Seitenpunkt seite={w.seite} />}
            <Text style={[stile.umschalterText, aktiv && stile.umschalterTextAktiv]}>
              {w.titel}
            </Text>
            {w.anzahl !== undefined && (
              <Text style={[stile.umschalterZahl, aktiv && stile.umschalterTextAktiv]}>
                {w.anzahl}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Großer Titel oben auf einer Reiter-Seite, darüber optional eine kleine Zeile (z. B. das Datum). */
export function SeitenTitel({
  titel,
  oben,
  rechts,
}: {
  titel: string;
  oben?: string;
  rechts?: ReactNode;
}) {
  return (
    <View style={stile.titelZeile}>
      <View>
        {oben ? <Text style={stile.titelOben}>{oben}</Text> : null}
        <Text style={stile.titel} accessibilityRole="header">
          {titel}
        </Text>
      </View>
      {rechts}
    </View>
  );
}

/**
 * Kopf für Unterseiten: oben ein runder Zurück-Knopf (rechts optional ein weiterer Knopf),
 * darunter der Titel groß und linksbündig, optional mit einer leisen Zeile darunter.
 */
export function ZurueckKopf({
  titel,
  unter,
  rechts,
}: {
  titel: string;
  unter?: string | undefined;
  rechts?: ReactNode;
}) {
  return (
    <View style={stile.unterKopf}>
      <View style={stile.unterLeiste}>
        <RundKnopf symbol="zurueck" beschriftung="Zurück" onPress={zurueck} />
        {rechts}
      </View>
      {titel ? (
        <Text style={stile.unterTitel} numberOfLines={2} accessibilityRole="header">
          {titel}
        </Text>
      ) : null}
      {unter ? <Text style={stile.unterZeile}>{unter}</Text> : null}
    </View>
  );
}

export function Abschnitt({ titel }: { titel: string }) {
  return <Text style={stile.abschnitt}>{titel.toUpperCase()}</Text>;
}

const stile = StyleSheet.create({
  knopfVoll: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: FARBEN.akzent,
    borderRadius: 29,
    paddingVertical: 17,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  knopfLeise: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  knopfRahmen: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: FARBEN.linie,
    borderRadius: 29,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  knopfTextRahmen: { color: FARBEN.text, fontSize: 16, fontWeight: '600' },
  knopfTextVoll: { color: FARBEN.textAufAkzent, fontSize: 18, fontWeight: '700' },
  knopfTextLeise: { color: FARBEN.akzent, fontSize: 16, fontWeight: '600' },
  rundFlaeche: {
    width: TIPPFLAECHE,
    height: TIPPFLAECHE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rund: {
    width: RUND_AKZENT,
    height: RUND_AKZENT,
    borderRadius: RUND_AKZENT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: FARBEN.akzent,
  },
  rundLeise: {
    width: RUND_LEISE,
    height: RUND_LEISE,
    borderRadius: RUND_LEISE / 2,
    backgroundColor: FARBEN.karte,
    borderWidth: 1,
    borderColor: FARBEN.rand,
  },
  balken: { backgroundColor: FARBEN.karteHell, overflow: 'hidden' },
  balkenVoll: { backgroundColor: FARBEN.akzent, overflow: 'hidden' },
  umschalter: {
    flexDirection: 'row',
    backgroundColor: FARBEN.karte,
    borderColor: FARBEN.rand,
    borderWidth: 1,
    borderRadius: 25,
    padding: 4,
  },
  umschalterTeil: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 21,
    minHeight: TIPPFLAECHE,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  umschalterText: { color: FARBEN.textLeise, fontSize: 15, fontWeight: '700' },
  umschalterZahl: { color: FARBEN.textLeise, fontSize: 13, fontWeight: '700', opacity: 0.65 },
  umschalterTextAktiv: { color: FARBEN.textAufAkzent },
  // Bei großer Systemschrift rutscht das Element rechts (z. B. die Serie) unter den Titel.
  titelZeile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    columnGap: 12,
    rowGap: 10,
    paddingTop: 16,
    paddingBottom: 18,
  },
  titelOben: { color: FARBEN.textLeise, fontSize: 14, fontWeight: '500', marginBottom: 2 },
  titel: { color: FARBEN.text, fontSize: 34, fontWeight: '700', letterSpacing: -0.8 },
  unterKopf: { paddingTop: 10, paddingBottom: 14 },
  unterLeiste: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  unterTitel: { color: FARBEN.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  unterZeile: { color: FARBEN.textLeise, fontSize: 14, marginTop: 4 },
  abschnitt: {
    color: FARBEN.textLeise,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 10,
  },
});
