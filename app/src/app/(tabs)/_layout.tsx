import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FARBEN } from '@/ui/farben';
import { Reiterleiste } from '@/ui/Reiterleiste';

// Reiter unten: Heute · Repertoire · Mehr (Leiste nach Skizze T2, eigene Umsetzung in Reiterleiste.tsx).
export default function ReiterLayout() {
  const oben = useSafeAreaInsets().top;
  return (
    <Tabs
      tabBar={(props) => <Reiterleiste {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: FARBEN.hintergrund, paddingTop: oben },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Heute' }} />
      <Tabs.Screen name="repertoire" options={{ title: 'Repertoire' }} />
      <Tabs.Screen name="mehr" options={{ title: 'Mehr' }} />
    </Tabs>
  );
}
