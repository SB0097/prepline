import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { DatenAnbieter } from '@/daten/DatenAnbieter';
import { FARBEN } from '@/ui/farben';
import { StartAnimation } from '@/ui/logo/StartAnimation';

// Wurzel-Layout: Datenbank für alle Bildschirme, Navigation ohne Kopfzeile auf dunklem Grund.
// Beim Kaltstart liegt einmal die Start-Animation darüber.
export default function RootLayout() {
  const [startLaeuft, setStartLaeuft] = useState(true);
  const fertig = useCallback(() => setStartLaeuft(false), []);
  return (
    <DatenAnbieter>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: FARBEN.hintergrund }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: FARBEN.hintergrund },
          }}
        />
        {startLaeuft && <StartAnimation onFertig={fertig} />}
      </View>
    </DatenAnbieter>
  );
}
