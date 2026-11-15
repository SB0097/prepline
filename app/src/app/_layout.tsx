import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { DatenAnbieter } from '@/daten/DatenAnbieter';
import { FARBEN } from '@/ui/farben';
import { StartAnimation } from '@/ui/logo/StartAnimation';

// Wurzel-Layout: Datenbank für alle Bildschirme, Navigation ohne Kopfzeile auf dunklem Grund.
// Beim Kaltstart liegt einmal die Start-Animation darüber.
export default function RootLayout() {
  const [startLaeuft, setStartLaeuft] = useState(true);
  const fertig = useCallback(() => setStartLaeuft(false), []);
  // Bei „Animationen entfernen“ nur überblenden, ohne Bewegung.
  const ruhig = useReducedMotion();
  return (
    <DatenAnbieter>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: FARBEN.hintergrund }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: FARBEN.hintergrund },
            animation: ruhig ? 'fade' : 'default',
          }}
        >
          {/* Training ist ein eigener Modus mit Schließen-Kreuz: steigt von unten auf. */}
          <Stack.Screen
            name="training"
            options={{ animation: ruhig ? 'fade' : 'fade_from_bottom' }}
          />
        </Stack>
        {startLaeuft && <StartAnimation onFertig={fertig} />}
      </View>
    </DatenAnbieter>
  );
}
