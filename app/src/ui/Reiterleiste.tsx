// Leiste unten (Skizze T2, Serkan 11.11.2026): volle Breite, Symbol + Text, aktiv blau mit Leuchtpunkt.
// Eigene Umsetzung statt der Standardleiste: kein grauer Android-Kreis beim Antippen
// und genug Abstand zu den Systemknöpfen.
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { FARBEN } from './farben';
import { type Symbolname, Zeichen } from './symbole';

const SYMBOLE: Record<string, Symbolname> = {
  index: 'heute',
  repertoire: 'repertoire',
  mehr: 'mehr',
};

/** Kantenlänge der Zeichenfläche für den Leuchtpunkt (Punkt mit weichem Schein). */
const PUNKT = 14;

/** Abstand zwischen Leiste und Systemknöpfen. */
const ABSTAND_UNTEN = 10;

export function Reiterleiste({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  // Höhe der Systemleiste direkt vom System, die Leiste reicht farbig bis ganz nach unten.
  const unten = useSafeAreaInsets().bottom;
  return (
    <View
      style={[stile.leiste, { paddingBottom: unten + ABSTAND_UNTEN }]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const aktiv = index === state.index;
        const titel = descriptors[route.key]?.options.title ?? route.name;
        const farbe = aktiv ? FARBEN.akzent : FARBEN.textLeise;
        const druecken = () => {
          const ereignis = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!aktiv && !ereignis.defaultPrevented) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            onPress={druecken}
            accessibilityRole="tab"
            accessibilityState={{ selected: aktiv }}
            accessibilityLabel={titel}
            style={({ pressed }) => [stile.punkt, pressed && stile.gedrueckt]}
          >
            <Zeichen name={SYMBOLE[route.name] ?? 'mehr'} farbe={farbe} />
            <Text style={[stile.text, { color: farbe }, aktiv && stile.textAktiv]}>{titel}</Text>
            {/* Als Kreis gezeichnet: Eine kleine Fläche mit Schatten wird auf manchen Geräten eckig. */}
            <Svg width={PUNKT} height={PUNKT} style={stile.leuchtpunkt}>
              {aktiv && (
                <>
                  <Circle cx={PUNKT / 2} cy={PUNKT / 2} r={6} fill={FARBEN.akzent} opacity={0.25} />
                  <Circle cx={PUNKT / 2} cy={PUNKT / 2} r={2.6} fill={FARBEN.akzent} />
                </>
              )}
            </Svg>
          </Pressable>
        );
      })}
    </View>
  );
}

const stile = StyleSheet.create({
  leiste: {
    flexDirection: 'row',
    backgroundColor: FARBEN.leiste,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: FARBEN.linie,
    paddingTop: 10,
  },
  punkt: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  gedrueckt: { opacity: 0.6 },
  text: { fontSize: 12 },
  textAktiv: { fontWeight: '700' },
  // Der Schein ragt über die Zeile hinaus, ohne die Leiste höher zu machen.
  leuchtpunkt: { marginTop: -3, marginBottom: -5 },
});
