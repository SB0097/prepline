// Wiederkehrende Bausteine im Stil „Graphit“: Knöpfe, Umschalter, Seitenköpfe.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { FARBEN } from './farben';
import { type Symbolname, Zeichen } from './symbole';

export const RUNDUNG = 22;

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
 * `overflow: 'hidden'` und eine Rundung.
 */
export function Verlauf({ schraeg = false }: { schraeg?: boolean }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id="verlauf" x1="0" y1="0" x2="1" y2={schraeg ? '1' : '0'}>
          <Stop offset="0" stopColor={FARBEN.akzent} />
          <Stop offset="1" stopColor={FARBEN.akzentHell} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#verlauf)" />
    </Svg>
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
    <Pressable
      onPress={onPress}
      disabled={aus}
      accessibilityRole="button"
      accessibilityState={{ disabled: aus }}
      style={({ pressed }) => [
        art === 'voll' ? stile.knopfVoll : art === 'rahmen' ? stile.knopfRahmen : stile.knopfLeise,
        (pressed || aus) && { opacity: aus ? 0.4 : 0.8 },
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
      <Text
        style={
          art === 'voll'
            ? stile.knopfTextVoll
            : art === 'rahmen'
              ? stile.knopfTextRahmen
              : stile.knopfTextLeise
        }
      >
        {titel}
      </Text>
    </Pressable>
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
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={beschriftung}
      style={({ pressed }) => [
        stile.rund,
        art === 'leise' && stile.rundLeise,
        pressed && { opacity: 0.75 },
      ]}
    >
      {art === 'akzent' && <Verlauf schraeg />}
      <Zeichen
        name={symbol}
        farbe={art === 'akzent' ? FARBEN.textAufAkzent : FARBEN.textLeise}
        groesse={art === 'akzent' ? 22 : 20}
      />
    </Pressable>
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

/** Kopf für Unterseiten: Zurück-Pfeil und Titel in der Mitte. */
export function ZurueckKopf({ titel }: { titel: string }) {
  return (
    <View style={stile.zurueckZeile}>
      <Pressable
        onPress={zurueck}
        hitSlop={16}
        accessibilityRole="button"
        accessibilityLabel="Zurück"
        style={stile.zurueckKnopf}
      >
        <Text style={stile.zurueckPfeil}>‹</Text>
      </Pressable>
      <Text style={stile.zurueckTitel} accessibilityRole="header">
        {titel}
      </Text>
      <View style={stile.zurueckKnopf} />
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
    overflow: 'hidden',
  },
  knopfLeise: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
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
  },
  knopfTextRahmen: { color: FARBEN.text, fontSize: 16, fontWeight: '600' },
  knopfTextVoll: { color: FARBEN.textAufAkzent, fontSize: 18, fontWeight: '700' },
  knopfTextLeise: { color: FARBEN.akzent, fontSize: 16, fontWeight: '600' },
  rund: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: FARBEN.akzent,
  },
  rundLeise: { width: 40, height: 40, borderRadius: 20, backgroundColor: FARBEN.karte },
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
    paddingVertical: 10,
    overflow: 'hidden',
  },
  umschalterText: { color: FARBEN.textLeise, fontSize: 15, fontWeight: '700' },
  umschalterZahl: { color: FARBEN.textLeise, fontSize: 13, fontWeight: '700', opacity: 0.65 },
  umschalterTextAktiv: { color: FARBEN.textAufAkzent },
  titelZeile: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 18,
  },
  titelOben: { color: FARBEN.textLeise, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  titel: { color: FARBEN.text, fontSize: 32, fontWeight: '700' },
  zurueckZeile: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  zurueckKnopf: { width: 40 },
  zurueckPfeil: { color: FARBEN.textLeise, fontSize: 32, lineHeight: 34 },
  zurueckTitel: {
    flex: 1,
    textAlign: 'center',
    color: FARBEN.text,
    fontSize: 17,
    fontWeight: '700',
  },
  abschnitt: {
    color: FARBEN.textLeise,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 10,
  },
});
