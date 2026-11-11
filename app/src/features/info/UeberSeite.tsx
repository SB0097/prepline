import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Abschnitt, RUNDUNG, ZurueckKopf } from '@/ui/bausteine';
import { CoachBauer } from '@/ui/CoachBauer';
import { FARBEN } from '@/ui/farben';

import { FIGUREN_LIZENZEN, PAKETE } from './lizenzenDaten';

// Über Prepline (Skizze M8, Serkan 11.11.2026): Version, verwendete Figuren und Bibliotheken.
// Antippen zeigt den vollständigen Lizenztext.
export const APP_VERSION = Constants.expoConfig?.version ?? '–';

/** Wichtigste Bibliotheken zuerst; der Rest steht unter „Alle Open-Source-Pakete“. */
const HERVORGEHOBEN = ['chess.js', 'ts-fsrs', 'react-native', 'expo'];

export function UeberSeite() {
  const wichtig = HERVORGEHOBEN.map((n) => PAKETE.find((p) => p[0] === n)).filter(
    (p): p is (typeof PAKETE)[number] => p !== undefined,
  );
  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.rand}>
        <ZurueckKopf titel="Über Prepline" />
      </View>
      <ScrollView contentContainerStyle={stile.inhalt}>
        <View style={stile.kopf}>
          <CoachBauer groesse={72} />
          <Text style={stile.name}>Prepline</Text>
          <Text style={stile.leise}>Version {APP_VERSION} · Tapwerk</Text>
          <Text style={stile.satz}>Eröffnungen lernen, die du wirklich spielst.</Text>
        </View>

        <Abschnitt titel="Figuren" />
        <View style={stile.gruppe}>
          {FIGUREN_LIZENZEN.map(([titel, lizenz], i) => (
            <Zeile
              key={titel}
              titel={titel}
              rechts={lizenz}
              erste={i === 0}
              onPress={() =>
                router.push({ pathname: '/ueber/lizenz', params: { figur: String(i) } })
              }
            />
          ))}
        </View>

        <Abschnitt titel="Verwendet" />
        <View style={stile.gruppe}>
          {wichtig.map(([name, , lizenz], i) => (
            <Zeile
              key={name}
              titel={name}
              rechts={lizenz}
              erste={i === 0}
              onPress={() => router.push({ pathname: '/ueber/lizenz', params: { paket: name } })}
            />
          ))}
          <Zeile
            titel="Alle Open-Source-Pakete"
            rechts={String(PAKETE.length)}
            onPress={() => router.push('/ueber/pakete')}
          />
        </View>
        <Text style={stile.hinweis}>Antippen zeigt den vollständigen Lizenztext.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Zeile({
  titel,
  rechts,
  erste = false,
  onPress,
}: {
  titel: string;
  rechts?: string;
  erste?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [stile.zeile, !erste && stile.trenner, pressed && { opacity: 0.7 }]}
    >
      <Text style={stile.zeilenText} numberOfLines={1}>
        {titel}
      </Text>
      {rechts ? <Text style={stile.rechts}>{rechts}</Text> : null}
      <Text style={stile.pfeil}>›</Text>
    </Pressable>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  rand: { paddingHorizontal: 20 },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32 },
  kopf: { alignItems: 'center', gap: 6, marginTop: 8 },
  name: { color: FARBEN.text, fontSize: 24, fontWeight: '700', marginTop: 8 },
  leise: { color: FARBEN.textLeise, fontSize: 13 },
  satz: { color: FARBEN.text, fontSize: 14, marginTop: 8, textAlign: 'center' },
  gruppe: { backgroundColor: FARBEN.karte, borderRadius: RUNDUNG, paddingHorizontal: 18 },
  zeile: { flexDirection: 'row', alignItems: 'center', minHeight: 50, gap: 10 },
  trenner: { borderTopWidth: 1, borderTopColor: FARBEN.linie },
  zeilenText: { flex: 1, color: FARBEN.text, fontSize: 15 },
  rechts: { color: FARBEN.textLeise, fontSize: 12 },
  pfeil: { color: FARBEN.textLeise, fontSize: 18 },
  hinweis: { color: FARBEN.textLeise, fontSize: 12, textAlign: 'center', marginTop: 14 },
});
