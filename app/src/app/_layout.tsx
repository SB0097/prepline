import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { FARBEN } from '@/ui/farben';

// Wurzel-Layout: Navigation ohne Kopfzeile auf dunklem Grund.
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: FARBEN.hintergrund },
        }}
      />
    </>
  );
}
