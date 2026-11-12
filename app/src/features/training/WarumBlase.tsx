import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachBauer } from '@/ui/CoachBauer';
import { FARBEN } from '@/ui/farben';

/** Platz für die Knopfreihe des Trainings, damit der Bauer nicht darüber liegt. */
const ABSTAND_UNTEN = 96;

// „Warum?“ als Sprechblase (Skizze W2, Serkan 11.11.2026): der Coach-Bauer unten links
// erklärt den Zug in einer Blase darüber. Tippen irgendwo schließt sie.
export function WarumBlase({
  sichtbar,
  titel,
  text,
  onSchliessen,
}: {
  sichtbar: boolean;
  titel: string;
  text: string;
  onSchliessen: () => void;
}) {
  const unten = useSafeAreaInsets().bottom;
  return (
    <Modal
      visible={sichtbar}
      transparent
      animationType="fade"
      onRequestClose={onSchliessen}
      statusBarTranslucent
    >
      <Pressable
        style={[stile.hintergrund, { paddingBottom: unten + ABSTAND_UNTEN }]}
        onPress={onSchliessen}
        accessibilityRole="button"
        accessibilityLabel="Erklärung schließen"
      >
        <View style={stile.blase} accessibilityLiveRegion="polite">
          <Text style={stile.titel}>{titel}</Text>
          <Text style={stile.text}>{text}</Text>
        </View>
        <View style={stile.spitze} />
        <View style={stile.bauerZeile}>
          <CoachBauer groesse={64} />
          <Text style={stile.hinweis}>Tippen zum Schließen</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const stile = StyleSheet.create({
  hintergrund: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  blase: {
    backgroundColor: FARBEN.karte,
    borderColor: FARBEN.akzentRand,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 8,
  },
  spitze: {
    width: 18,
    height: 18,
    marginLeft: 34,
    marginTop: -10,
    backgroundColor: FARBEN.karte,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: FARBEN.akzentRand,
    transform: [{ rotate: '45deg' }],
  },
  titel: { color: FARBEN.akzent, fontSize: 16, fontWeight: '700' },
  text: { color: FARBEN.text, fontSize: 15, lineHeight: 22 },
  bauerZeile: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8, marginLeft: 12 },
  hinweis: { color: FARBEN.textLeise, fontSize: 14 },
});
