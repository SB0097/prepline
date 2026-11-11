import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { einstellungenLaden } from '@/daten/einstellungen';
import { useGeladen } from '@/daten/useGeladen';
import { Knopf } from '@/ui/bausteine';
import { FARBEN } from '@/ui/farben';

import { entwurfSetzen } from './entwurf';

// Import Schritt 3 (Skizze 11.11.2026): Bestätigung mit Weg zum Training oder zum Repertoire.
export function FertigSeite() {
  const { name, neu } = useLocalSearchParams<{ name: string; neu: string }>();
  const einstellungen = useGeladen(einstellungenLaden);
  const anzahl = Number(neu) || 0;

  const weiter = (ziel: '/' | '/repertoire') => {
    entwurfSetzen(null);
    router.dismissAll();
    router.navigate(ziel);
  };

  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.mitte}>
        <View style={stile.kreis}>
          <Svg width={54} height={54} viewBox="0 0 24 24">
            <Path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke={FARBEN.richtig}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={stile.titel}>{name} ist drin</Text>
        <Text style={stile.leise}>
          {anzahl === 0
            ? 'Nichts Neues dabei – alle Züge waren schon drin.'
            : anzahl === 1
              ? '1 neue Stellung'
              : `${anzahl} neue Stellungen`}
        </Text>
        {einstellungen && anzahl > 0 && (
          <Text style={stile.leise}>Ab heute lernst du {einstellungen.neuProTag} pro Tag.</Text>
        )}
      </View>
      <Knopf titel="Jetzt trainieren" onPress={() => weiter('/')} />
      <Knopf titel="Zum Repertoire" art="leise" onPress={() => weiter('/repertoire')} />
    </SafeAreaView>
  );
}

const stile = StyleSheet.create({
  seite: {
    flex: 1,
    backgroundColor: FARBEN.hintergrund,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  mitte: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  kreis: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(61, 214, 140, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  titel: { color: FARBEN.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  leise: { color: FARBEN.textLeise, fontSize: 15, textAlign: 'center' },
});
