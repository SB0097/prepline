import { StyleSheet, Text, View } from 'react-native';

import { FARBEN } from '@/ui/farben';
import { LogoGrafik } from '@/ui/logo/LogoGrafik';

// Startseite (Platzhalter für M0): Logo und App-Name.
export function StartSeite() {
  return (
    <View style={stile.seite}>
      <LogoGrafik groesse={160} />
      <Text style={stile.name}>Prepline</Text>
    </View>
  );
}

const stile = StyleSheet.create({
  seite: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    backgroundColor: FARBEN.hintergrund,
  },
  name: {
    color: FARBEN.text,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
