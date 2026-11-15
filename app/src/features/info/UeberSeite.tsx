import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Abschnitt, RUNDUNG, Zeilenknopf, ZurueckKopf } from '@/ui/bausteine';
import { CoachBauer } from '@/ui/CoachBauer';
import { FARBEN } from '@/ui/farben';
import { Zeichen } from '@/ui/symbole';
import { Text } from '@/ui/Text';

import { FIGUREN_LIZENZEN, PAKETE, SCHRIFT_LIZENZ } from './lizenzenDaten';

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

        <Abschnitt titel="Schrift" />
        <View style={stile.gruppe}>
          <Zeile
            titel={SCHRIFT_LIZENZ[0]}
            rechts={SCHRIFT_LIZENZ[1]}
            erste
            onPress={() => router.push({ pathname: '/ueber/lizenz', params: { schrift: '1' } })}
          />
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

/** Zeile auf einer Karte; `einzug` = seitlicher Innenabstand der Karte. */
export function Zeile({
  titel,
  rechts,
  erste = false,
  einzug = GRUPPE_EINZUG,
  onPress,
}: {
  titel: string;
  rechts?: string;
  erste?: boolean;
  einzug?: number;
  onPress: () => void;
}) {
  return (
    <Zeilenknopf
      onPress={onPress}
      accessibilityRole="button"
      einzug={einzug}
      flaeche={FARBEN.karteHell}
      rund={0}
    >
      <View style={[stile.zeile, !erste && stile.trenner]}>
        <Text style={stile.zeilenText} numberOfLines={1}>
          {titel}
        </Text>
        {rechts ? <Text style={stile.rechts}>{rechts}</Text> : null}
        <Zeichen name="weiter" farbe={FARBEN.textLeise} groesse={16} />
      </View>
    </Zeilenknopf>
  );
}

const GRUPPE_EINZUG = 18;

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  rand: { paddingHorizontal: 20 },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32 },
  kopf: { alignItems: 'center', gap: 6, marginTop: 8 },
  name: { color: FARBEN.text, fontSize: 24, fontWeight: '700', marginTop: 8 },
  leise: { color: FARBEN.textLeise, fontSize: 13 },
  satz: { color: FARBEN.text, fontSize: 14, marginTop: 8, textAlign: 'center' },
  gruppe: {
    backgroundColor: FARBEN.karte,
    borderRadius: RUNDUNG,
    paddingHorizontal: GRUPPE_EINZUG,
    overflow: 'hidden',
  },
  zeile: { flexDirection: 'row', alignItems: 'center', minHeight: 50, gap: 10 },
  trenner: { borderTopWidth: 1, borderTopColor: FARBEN.linie },
  zeilenText: { flex: 1, color: FARBEN.text, fontSize: 15 },
  rechts: { color: FARBEN.textLeise, fontSize: 12 },
  hinweis: { color: FARBEN.textLeise, fontSize: 12, textAlign: 'center', marginTop: 14 },
});
