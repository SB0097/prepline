import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RUNDUNG, ZurueckKopf } from '@/ui/bausteine';
import { CoachBauer } from '@/ui/CoachBauer';
import { FARBEN } from '@/ui/farben';

// Datenschutz in der App (Skizze M8, Serkan 11.11.2026). Die vollständige Erklärung liegt
// öffentlich auf GitHub Pages (docs/datenschutz.html), wie es Google Play verlangt.
export const DATENSCHUTZ_URL = 'https://sb0097.github.io/prepline/datenschutz.html';
export const KONTAKT_EMAIL = 'info@tapwerkapps.de';

const PUNKTE = [
  ['Kein Konto, keine Anmeldung', 'Du brauchst keine E-Mail und kein Passwort.'],
  ['Kein Internet nötig', 'Die App funktioniert komplett offline und sendet nichts.'],
  ['Keine Werbung, kein Tracking', 'Keine Analyse-Dienste, keine Werbe-IDs.'],
  ['Deine Dateien', 'PGN und Sicherungen öffnest du selbst – die App liest nur, was du auswählst.'],
  [
    'Android-Sicherung',
    'Android kann die App-Daten in deinem Google-Konto sichern, wenn du das am Handy eingeschaltet hast. Darauf haben wir keinen Zugriff.',
  ],
] as const;

export function DatenschutzSeite() {
  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.rand}>
        <ZurueckKopf titel="Datenschutz" />
      </View>
      <ScrollView contentContainerStyle={stile.inhalt}>
        <View style={stile.kurz}>
          <CoachBauer groesse={52} />
          <View style={stile.kurzText}>
            <Text style={stile.kurzTitel}>Kurz gesagt:</Text>
            <Text style={stile.text}>
              Prepline sammelt keine Daten. Alles bleibt auf deinem Handy.
            </Text>
          </View>
        </View>
        {PUNKTE.map(([titel, text]) => (
          <View key={titel} style={stile.punkt}>
            <View style={stile.kreis}>
              <View style={stile.innen} />
            </View>
            <View style={stile.punktText}>
              <Text style={stile.punktTitel}>{titel}</Text>
              <Text style={stile.leise}>{text}</Text>
            </View>
          </View>
        ))}
        <Text style={[stile.leise, stile.abstand]}>Vollständige Datenschutzerklärung:</Text>
        <Pressable onPress={() => void Linking.openURL(DATENSCHUTZ_URL)} accessibilityRole="link">
          <Text style={stile.link}>{DATENSCHUTZ_URL.replace('https://', '')}</Text>
        </Pressable>
        <Text style={[stile.leise, stile.abstand]}>Fragen zum Datenschutz:</Text>
        <Pressable
          onPress={() => void Linking.openURL(`mailto:${KONTAKT_EMAIL}`)}
          accessibilityRole="link"
        >
          <Text style={stile.link}>{KONTAKT_EMAIL}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  rand: { paddingHorizontal: 20 },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32, gap: 18 },
  kurz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: FARBEN.karte,
    borderRadius: RUNDUNG,
    padding: 16,
  },
  kurzText: { flex: 1, gap: 4 },
  kurzTitel: { color: FARBEN.text, fontSize: 16, fontWeight: '700' },
  text: { color: FARBEN.text, fontSize: 14, lineHeight: 20 },
  punkt: { flexDirection: 'row', gap: 12 },
  kreis: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 1,
    backgroundColor: 'rgba(61, 214, 140, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innen: { width: 8, height: 8, borderRadius: 4, backgroundColor: FARBEN.richtig },
  punktText: { flex: 1, gap: 3 },
  punktTitel: { color: FARBEN.text, fontSize: 15, fontWeight: '700' },
  leise: { color: FARBEN.textLeise, fontSize: 13, lineHeight: 19 },
  abstand: { marginTop: 8, marginBottom: -12 },
  link: { color: FARBEN.akzent, fontSize: 14 },
});
