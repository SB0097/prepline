// Start-Animation (Serkan 11.11.2026), etwa 1,5 s, nur beim Kaltstart:
// 1. der Umriss des Bauern zeichnet sich von unten nach oben,
// 2. Augen und blaues Leuchten erscheinen,
// 3. der Schriftzug „Prepline“ erscheint, dann blendet alles aus.
// Ist am Handy „Animationen entfernen“ eingestellt, wird sie übersprungen.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';

import { BauerTeile } from '@/ui/CoachBauer';

import { LOGO_FARBEN } from './logoDaten';

const HOEHE = 170;
const BREITE = HOEHE * 0.85;

export function StartAnimation({ onFertig }: { onFertig: () => void }) {
  const [phase, setPhase] = useState<'pruefen' | 'laeuft'>('pruefen');
  const [werte] = useState(() => ({
    umriss: new Animated.Value(0),
    gesicht: new Animated.Value(0),
    schrift: new Animated.Value(0),
    ausblenden: new Animated.Value(1),
  }));

  useEffect(() => {
    let aktiv = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((ruhig) => {
      if (!aktiv) return;
      if (ruhig) {
        onFertig();
        return;
      }
      setPhase('laeuft');
      const zeit = (wert: Animated.Value, dauer: number, ziel = 1) =>
        Animated.timing(wert, {
          toValue: ziel,
          duration: dauer,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        });
      Animated.sequence([
        zeit(werte.umriss, 500),
        Animated.delay(300),
        zeit(werte.gesicht, 300),
        zeit(werte.schrift, 300),
        Animated.delay(150),
        zeit(werte.ausblenden, 250, 0),
      ]).start(({ finished }) => {
        if (finished && aktiv) onFertig();
      });
    });
    return () => {
      aktiv = false;
    };
  }, [onFertig, werte]);

  const sichtbareHoehe = werte.umriss.interpolate({ inputRange: [0, 1], outputRange: [0, HOEHE] });

  return (
    <Animated.View
      style={[stile.flaeche, { opacity: werte.ausblenden }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {phase === 'laeuft' && (
        <>
          <View style={stile.bauer}>
            {/* Umriss, wächst von unten nach oben */}
            <Animated.View style={[stile.unten, { height: sichtbareHoehe }]}>
              <Svg width={BREITE} height={HOEHE} viewBox="8 0 84 102">
                <BauerTeile leuchten={false} gesicht={false} />
              </Svg>
            </Animated.View>
            {/* Fertiger Bauer mit Gesicht und Leuchten blendet darüber ein */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: werte.gesicht }]}>
              <Svg width={BREITE} height={HOEHE} viewBox="8 0 84 102">
                <BauerTeile />
              </Svg>
            </Animated.View>
          </View>
          <Animated.Text style={[stile.schrift, { opacity: werte.schrift }]}>
            Prepline
          </Animated.Text>
        </>
      )}
    </Animated.View>
  );
}

const stile = StyleSheet.create({
  flaeche: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: LOGO_FARBEN.hintergrund,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  bauer: { width: BREITE, height: HOEHE, justifyContent: 'flex-end' },
  unten: { overflow: 'hidden', justifyContent: 'flex-end' },
  schrift: { color: LOGO_FARBEN.hell, fontSize: 30, fontWeight: '700', letterSpacing: 0.5 },
});
