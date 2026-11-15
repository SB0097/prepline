import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Reiterleiste } from '@/ui/Reiterleiste';
import { useFarben } from '@/ui/thema';

// Reiter unten: Heute · Repertoire · Mehr (Leiste nach Skizze T2, eigene Umsetzung in Reiterleiste.tsx).
export default function ReiterLayout() {
  const oben = useSafeAreaInsets().top;
  const F = useFarben();
  return (
    <Tabs
      tabBar={(props) => <Reiterleiste {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: F.hintergrund, paddingTop: oben },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Heute' }} />
      <Tabs.Screen name="repertoire" options={{ title: 'Repertoire' }} />
      <Tabs.Screen name="mehr" options={{ title: 'Mehr' }} />
    </Tabs>
  );
}
