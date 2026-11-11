// Wiederkehrende Bausteine im Stil „Mitternacht“: Knöpfe, Umschalter, Seitenköpfe.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FARBEN } from './farben';

export const RUNDUNG = 22;

export function Knopf({
  titel,
  onPress,
  art = 'voll',
  aus = false,
}: {
  titel: string;
  onPress: () => void;
  art?: 'voll' | 'leise';
  aus?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={aus}
      accessibilityRole="button"
      accessibilityState={{ disabled: aus }}
      style={({ pressed }) => [
        art === 'voll' ? stile.knopfVoll : stile.knopfLeise,
        (pressed || aus) && { opacity: aus ? 0.4 : 0.8 },
      ]}
    >
      <Text style={art === 'voll' ? stile.knopfTextVoll : stile.knopfTextLeise}>{titel}</Text>
    </Pressable>
  );
}

export function Umschalter<T extends string>({
  werte,
  wert,
  onWahl,
}: {
  werte: readonly { wert: T; titel: string }[];
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
            style={[stile.umschalterTeil, aktiv && stile.umschalterAktiv]}
          >
            <Text style={[stile.umschalterText, aktiv && stile.umschalterTextAktiv]}>
              {w.titel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Großer Titel oben auf einer Reiter-Seite. */
export function SeitenTitel({ titel, rechts }: { titel: string; rechts?: ReactNode }) {
  return (
    <View style={stile.titelZeile}>
      <Text style={stile.titel} accessibilityRole="header">
        {titel}
      </Text>
      {rechts}
    </View>
  );
}

/** Kopf für Unterseiten: Zurück-Pfeil und Titel in der Mitte. */
export function ZurueckKopf({ titel }: { titel: string }) {
  return (
    <View style={stile.zurueckZeile}>
      <Pressable
        onPress={() => router.back()}
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
    backgroundColor: FARBEN.akzent,
    borderRadius: RUNDUNG,
    paddingVertical: 16,
    alignItems: 'center',
  },
  knopfLeise: { paddingVertical: 14, alignItems: 'center' },
  knopfTextVoll: { color: FARBEN.textAufAkzent, fontSize: 18, fontWeight: '700' },
  knopfTextLeise: { color: FARBEN.akzent, fontSize: 16 },
  umschalter: {
    flexDirection: 'row',
    backgroundColor: FARBEN.karte,
    borderRadius: 21,
    padding: 4,
  },
  umschalterTeil: { flex: 1, borderRadius: 17, paddingVertical: 8, alignItems: 'center' },
  umschalterAktiv: { backgroundColor: FARBEN.akzent },
  umschalterText: { color: FARBEN.textLeise, fontSize: 15, fontWeight: '700' },
  umschalterTextAktiv: { color: FARBEN.textAufAkzent },
  titelZeile: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  titel: { color: FARBEN.text, fontSize: 28, fontWeight: '700' },
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
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
  },
});
