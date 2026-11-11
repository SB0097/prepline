import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DatenAnbieter } from '@/daten/DatenAnbieter';
import { FARBEN } from '@/ui/farben';

// Wurzel-Layout: Datenbank für alle Bildschirme, Navigation ohne Kopfzeile auf dunklem Grund.
export default function RootLayout() {
  return (
    <DatenAnbieter>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: FARBEN.hintergrund },
        }}
      />
    </DatenAnbieter>
  );
}
