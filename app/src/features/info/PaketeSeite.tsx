import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RUNDUNG, tiefe, ZurueckKopf } from '@/ui/bausteine';
import { stileErstellen } from '@/ui/thema';

import { PAKETE } from './lizenzenDaten';
import { Zeile } from './UeberSeite';

// Alle Open-Source-Pakete, die in der App stecken (erzeugt mit `npm run lizenzen -w app`).
export function PaketeSeite() {
  const stile = useStile();
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

const useStile = stileErstellen((F) => ({
  seite: { flex: 1, backgroundColor: F.hintergrund },
  rand: { paddingHorizontal: 20 },
  liste: { paddingHorizontal: 20, paddingBottom: 32 },
  karte: { backgroundColor: F.karte, ...tiefe(F), paddingHorizontal: 18, overflow: 'hidden' },
  oben: { borderTopLeftRadius: RUNDUNG, borderTopRightRadius: RUNDUNG },
  unten: { borderBottomLeftRadius: RUNDUNG, borderBottomRightRadius: RUNDUNG },
}));
