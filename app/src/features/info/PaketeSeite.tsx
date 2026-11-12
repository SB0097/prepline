import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RUNDUNG, ZurueckKopf } from '@/ui/bausteine';
import { FARBEN } from '@/ui/farben';

import { PAKETE } from './lizenzenDaten';
import { Zeile } from './UeberSeite';

// Alle Open-Source-Pakete, die in der App stecken (erzeugt mit `npm run lizenzen -w app`).
export function PaketeSeite() {
  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.rand}>
        <ZurueckKopf titel={`Open-Source-Pakete (${PAKETE.length})`} />
      </View>
      <FlatList
        data={PAKETE}
        keyExtractor={(p) => p[0]}
        contentContainerStyle={stile.liste}
        renderItem={({ item: [name, version, lizenz], index }) => (
          <View
            style={[
              stile.karte,
              index === 0 && stile.oben,
              index === PAKETE.length - 1 && stile.unten,
            ]}
          >
            <Zeile
              titel={`${name} ${version}`}
              rechts={lizenz}
              erste={index === 0}
              onPress={() => router.push({ pathname: '/ueber/lizenz', params: { paket: name } })}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  rand: { paddingHorizontal: 20 },
  liste: { paddingHorizontal: 20, paddingBottom: 32 },
  karte: { backgroundColor: FARBEN.karte, paddingHorizontal: 18 },
  oben: { borderTopLeftRadius: RUNDUNG, borderTopRightRadius: RUNDUNG },
  unten: { borderBottomLeftRadius: RUNDUNG, borderBottomRightRadius: RUNDUNG },
});
