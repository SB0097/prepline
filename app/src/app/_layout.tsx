import { NavigationBar } from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { DatenAnbieter } from '@/daten/DatenAnbieter';
import { StartAnimation } from '@/ui/logo/StartAnimation';
import { ThemaAnbieter, useFarben } from '@/ui/thema';

// Wurzel-Layout: Datenbank und Farbschema (hell/dunkel) für alle Bildschirme, Navigation ohne
// Kopfzeile. Beim Kaltstart liegt einmal die Start-Animation darüber.
export default function RootLayout() {
  return (
    <DatenAnbieter>
      <ThemaAnbieter>
        <Navigation />
      </ThemaAnbieter>
    </DatenAnbieter>
  );
}

function Navigation() {
  const F = useFarben();
  const [startLaeuft, setStartLaeuft] = useState(true);
  const fertig = useCallback(() => setStartLaeuft(false), []);
  // Bei „Animationen entfernen“ nur überblenden, ohne Bewegung.
  const ruhig = useReducedMotion();
  // Status- und Systemleiste: helle Symbole auf dunklem Grund, dunkle auf hellem.
  const symbole = F.dunkel ? 'light' : 'dark';
  return (
    <>
      <StatusBar style={symbole} />
      <NavigationBar style={symbole} />
      <View style={{ flex: 1, backgroundColor: F.hintergrund }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: F.hintergrund },
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
    </>
  );
}
