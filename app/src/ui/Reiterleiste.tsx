// Leiste unten (Skizze T2, Serkan 11.11.2026): volle Breite, Symbol + Text, aktiv blau
// mit heller Pille hinter dem Symbol (Runde 16).
// Eigene Umsetzung statt der Standardleiste: kein grauer Android-Kreis beim Antippen
// und genug Abstand zu den Systemknöpfen.
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';
import { Text } from './Text';

import { stileErstellen, useFarben } from './thema';
import { type Symbolname, Zeichen } from './symbole';

const SYMBOLE: Record<string, Symbolname> = {
  index: 'heute',
  repertoire: 'repertoire',
  mehr: 'mehr',
};

/** Größe der Pille hinter dem aktiven Symbol. */
const PILLE = { breite: 60, hoehe: 32 };

/** Abstand zwischen Leiste und Systemknöpfen. */
const ABSTAND_UNTEN = 20;

export function Reiterleiste({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const F = useFarben();
  const stile = useStile();
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
        const farbe = aktiv ? F.akzent : F.textLeise;
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
            <View style={stile.pille}>
              {/* Als Grafik gezeichnet: Eine kleine runde Fläche wird auf manchen Samsung-Geräten eckig. */}
              {aktiv && (
                <Svg width={PILLE.breite} height={PILLE.hoehe} style={StyleSheet.absoluteFill}>
                  <Rect
                    width={PILLE.breite}
                    height={PILLE.hoehe}
                    rx={PILLE.hoehe / 2}
                    fill={F.akzentFlaeche}
                  />
                </Svg>
              )}
              <Zeichen name={SYMBOLE[route.name] ?? 'mehr'} farbe={farbe} />
            </View>
            <Text style={[stile.text, { color: farbe }, aktiv && stile.textAktiv]}>{titel}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStile = stileErstellen((F) => ({
  leiste: {
    flexDirection: 'row',
    backgroundColor: F.leiste,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: F.linie,
    paddingTop: 8,
  },
  punkt: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 2 },
  gedrueckt: { opacity: 0.6 },
  // Aktiver Reiter: Symbol auf einer hellen Pille (Runde 16).
  pille: {
    width: PILLE.breite,
    height: PILLE.hoehe,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 12 },
  textAktiv: { fontWeight: '700' },
}));
