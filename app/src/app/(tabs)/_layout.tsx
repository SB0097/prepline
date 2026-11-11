import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FARBEN } from '@/ui/farben';

// Leiste unten (Skizze A, 11.11.2026): Heute · Repertoire · Mehr, aktiver Reiter mit kleinem Balken.
function Balken({ aktiv }: { aktiv: boolean }) {
  return (
    <View
      style={{
        width: 32,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: aktiv ? FARBEN.akzent : 'transparent',
      }}
    />
  );
}

export default function ReiterLayout() {
  const oben = useSafeAreaInsets().top;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: FARBEN.hintergrund, borderTopColor: FARBEN.linie },
        tabBarActiveTintColor: FARBEN.akzent,
        tabBarInactiveTintColor: FARBEN.textLeise,
        tabBarLabelStyle: { fontSize: 14, fontWeight: '600' },
        tabBarIcon: ({ focused }) => <Balken aktiv={focused} />,
        sceneStyle: { backgroundColor: FARBEN.hintergrund, paddingTop: oben },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Heute' }} />
      <Tabs.Screen name="repertoire" options={{ title: 'Repertoire' }} />
      <Tabs.Screen name="mehr" options={{ title: 'Mehr' }} />
    </Tabs>
  );
}
