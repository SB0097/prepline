import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RUNDUNG, ZurueckKopf } from '@/ui/bausteine';
import { stileErstellen } from '@/ui/thema';
import { Text } from '@/ui/Text';

import { FIGUREN_LIZENZEN, LIZENZTEXTE, PAKETE, SCHRIFT_LIZENZ } from './lizenzenDaten';

/**
 * Titel, Lizenz und Text zu einem Paket (?paket=name), einem Figurensatz (?figur=0–2)
 * oder zur Schrift (?schrift=1).
 */
export function lizenzFinden(
  paket: string | undefined,
  figur: string | undefined,
  schrift?: string,
): { titel: string; lizenz: string; text: string } | null {
  if (schrift !== undefined) {
    const [titel, lizenz, text] = SCHRIFT_LIZENZ;
    return { titel, lizenz, text };
  }
  if (figur !== undefined) {
    const f = FIGUREN_LIZENZEN[Number(figur)];
    return f ? { titel: f[0], lizenz: f[1], text: f[2] } : null;
  }
  const p = PAKETE.find((e) => e[0] === paket);
  return p ? { titel: `${p[0]} ${p[1]}`, lizenz: p[2], text: LIZENZTEXTE[p[3]] ?? '' } : null;
}

export function LizenzSeite() {
  const stile = useStile();
  const { paket, figur, schrift } = useLocalSearchParams<{
    paket?: string;
    figur?: string;
    schrift?: string;
  }>();
  const lizenz = lizenzFinden(paket, figur, schrift);
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

const useStile = stileErstellen((F) => ({
  seite: { flex: 1, backgroundColor: F.hintergrund },
  rand: { paddingHorizontal: 20 },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  titel: { color: F.text, fontSize: 17, fontWeight: '700' },
  karte: { backgroundColor: F.karte, borderRadius: RUNDUNG, padding: 16 },
  text: { color: F.text, fontSize: 12, lineHeight: 18, fontFamily: 'monospace' },
}));
