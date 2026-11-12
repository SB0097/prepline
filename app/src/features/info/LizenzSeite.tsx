import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RUNDUNG, ZurueckKopf } from '@/ui/bausteine';
import { FARBEN } from '@/ui/farben';

import { FIGUREN_LIZENZEN, LIZENZTEXTE, PAKETE } from './lizenzenDaten';

/** Titel, Lizenz und Text zu einem Paket (?paket=name) oder einem Figurensatz (?figur=0–2). */
export function lizenzFinden(
  paket: string | undefined,
  figur: string | undefined,
): { titel: string; lizenz: string; text: string } | null {
  if (figur !== undefined) {
    const f = FIGUREN_LIZENZEN[Number(figur)];
    return f ? { titel: f[0], lizenz: f[1], text: f[2] } : null;
  }
  const p = PAKETE.find((e) => e[0] === paket);
  return p ? { titel: `${p[0]} ${p[1]}`, lizenz: p[2], text: LIZENZTEXTE[p[3]] ?? '' } : null;
}

export function LizenzSeite() {
  const { paket, figur } = useLocalSearchParams<{ paket?: string; figur?: string }>();
  const lizenz = lizenzFinden(paket, figur);
  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.rand}>
        <ZurueckKopf titel={lizenz?.lizenz ?? 'Lizenz'} />
      </View>
      <ScrollView contentContainerStyle={stile.inhalt}>
        <Text style={stile.titel}>{lizenz?.titel ?? 'Unbekannt'}</Text>
        <View style={stile.karte}>
          <Text style={stile.text} selectable>
            {lizenz?.text || 'Kein Lizenztext vorhanden.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  rand: { paddingHorizontal: 20 },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  titel: { color: FARBEN.text, fontSize: 17, fontWeight: '700' },
  karte: { backgroundColor: FARBEN.karte, borderRadius: RUNDUNG, padding: 16 },
  text: { color: FARBEN.text, fontSize: 12, lineHeight: 18, fontFamily: 'monospace' },
});
