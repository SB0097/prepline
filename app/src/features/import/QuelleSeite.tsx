import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { RUNDUNG, ZurueckKopf } from '@/ui/bausteine';
import { CoachBauer } from '@/ui/CoachBauer';
import { FARBEN } from '@/ui/farben';

import { entwurfSetzen } from './entwurf';

// Import Schritt 1 (Skizze 11.11.2026): aus der Sammlung, PGN-Datei oder Text einfügen.
export function QuelleSeite() {
  const [fehler, setFehler] = useState<string | null>(null);

  const dateiWaehlen = async () => {
    setFehler(null);
    // PGN-Dateien haben auf Android oft keinen eindeutigen Typ, deshalb alle Dateien zulassen.
    const wahl = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    const datei = wahl.canceled ? null : wahl.assets[0];
    if (!datei) return;
    try {
      const text = await new File(datei.uri).text();
      entwurfSetzen({ text, dateiname: datei.name });
      router.push('/import/pruefen');
    } catch {
      setFehler('Die Datei konnte nicht gelesen werden.');
    }
  };

  return (
    <SafeAreaView style={stile.seite}>
      <ZurueckKopf titel="Eröffnung hinzufügen" />
      <View style={stile.inhalt}>
        <Wahl
          symbol={<CoachBauer groesse={30} />}
          titel="Aus der Sammlung"
          text="fertige Eröffnungen mit Erklärungen"
          hervorgehoben
          onPress={() => router.push('/sammlung')}
        />
        <Wahl
          symbol={<DateiSymbol />}
          titel="PGN-Datei wählen"
          text="aus Downloads, Drive, …"
          onPress={() => void dateiWaehlen()}
        />
        <Wahl
          symbol={<TextSymbol />}
          titel="Text einfügen"
          text="kopierte Züge oder PGN"
          onPress={() => router.push('/import/text')}
        />
        {fehler && <Text style={stile.fehler}>{fehler}</Text>}
        <Text style={stile.hinweis}>
          Funktioniert mit Dateien aus Lichess, ChessBase und anderen Schach-Apps. Varianten werden
          mit übernommen.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Wahl({
  symbol,
  titel,
  text,
  hervorgehoben = false,
  onPress,
}: {
  symbol: ReactNode;
  titel: string;
  text: string;
  hervorgehoben?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        stile.wahl,
        hervorgehoben && stile.hervorgehoben,
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={stile.symbol}>{symbol}</View>
      <View style={stile.wahlText}>
        <Text style={stile.wahlTitel}>{titel}</Text>
        <Text style={stile.wahlUnter}>{text}</Text>
      </View>
    </Pressable>
  );
}

function DateiSymbol() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Path d="M5 2h7l4 4v12H5z" fill={FARBEN.akzent} />
      <Path d="M12 2v4h4" fill={FARBEN.textAufAkzent} opacity={0.4} />
    </Svg>
  );
}

function TextSymbol() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Rect x={4} y={3} width={12} height={15} rx={2} fill={FARBEN.akzent} />
      <Rect x={7} y={1.5} width={6} height={3.5} rx={1} fill={FARBEN.textAufAkzent} />
    </Svg>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund, paddingHorizontal: 20 },
  inhalt: { gap: 14, marginTop: 24 },
  wahl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: FARBEN.karte,
    borderRadius: RUNDUNG,
    padding: 20,
  },
  hervorgehoben: { borderWidth: 2, borderColor: FARBEN.akzent },
  symbol: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: FARBEN.akzentFlaeche,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wahlText: { flex: 1, gap: 4 },
  wahlTitel: { color: FARBEN.text, fontSize: 17, fontWeight: '700' },
  wahlUnter: { color: FARBEN.textLeise, fontSize: 13 },
  fehler: { color: FARBEN.falsch, fontSize: 14 },
  hinweis: { color: FARBEN.textLeise, fontSize: 14, lineHeight: 21, marginTop: 16 },
});
