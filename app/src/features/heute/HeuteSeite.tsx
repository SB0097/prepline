import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useGeladen } from '@/daten/useGeladen';
import { Knopf, RUNDUNG, SeitenTitel } from '@/ui/bausteine';
import { FARBEN } from '@/ui/farben';

import { heuteLaden } from './heuteDaten';

// Startseite (Skizze A, 11.11.2026): große Zahl „Züge heute“, Knopf, Fortschritt Weiß/Schwarz.
export function HeuteSeite() {
  const daten = useGeladen(heuteLaden);
  const datum = new Date().toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  if (!daten) return <View style={stile.seite} />;
  const gesamt = daten.wiederholungen + daten.neu;

  return (
    <ScrollView style={stile.seite} contentContainerStyle={stile.inhalt}>
      <SeitenTitel titel="Heute" rechts={<Text style={stile.datum}>{datum}</Text>} />
      {daten.anzahlRepertoires === 0 ? (
        <View style={stile.karte}>
          <Text style={stile.leerTitel}>Noch keine Eröffnung</Text>
          <Text style={stile.leerText}>
            Füge eine Eröffnung hinzu, dann siehst du hier jeden Tag, was dran ist.
          </Text>
          <Knopf titel="Eröffnung hinzufügen" onPress={() => router.push('/import')} />
        </View>
      ) : (
        <View style={stile.karte}>
          <Text style={stile.zahl} testID="zuege-heute">
            {gesamt}
          </Text>
          <Text style={stile.zahlText}>{gesamt === 1 ? 'Zug heute' : 'Züge heute'}</Text>
          <View style={stile.aufteilung}>
            <Text style={stile.leise}>
              {daten.wiederholungen}{' '}
              {daten.wiederholungen === 1 ? 'Wiederholung' : 'Wiederholungen'}
            </Text>
            <Text style={stile.akzent}>{daten.neu} neu</Text>
          </View>
          <Knopf
            titel={gesamt > 0 ? 'Training starten' : 'Für heute alles erledigt'}
            onPress={() => router.push('/training')}
            aus={gesamt === 0}
          />
        </View>
      )}
      <View style={stile.reihe}>
        <Seitenkarte titel="Weiß" prozent={daten.sicher.weiss} />
        <Seitenkarte titel="Schwarz" prozent={daten.sicher.schwarz} />
      </View>
    </ScrollView>
  );
}

function Seitenkarte({ titel, prozent }: { titel: string; prozent: number | null }) {
  return (
    <View style={stile.klein}>
      <Text style={stile.kleinTitel}>{titel}</Text>
      <Text style={stile.kleinWert}>{prozent === null ? '–' : `${prozent} %`}</Text>
    </View>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32 },
  datum: { color: FARBEN.textLeise, fontSize: 15 },
  karte: { backgroundColor: FARBEN.karte, borderRadius: RUNDUNG, padding: 24, gap: 6 },
  zahl: { color: FARBEN.text, fontSize: 64, fontWeight: '700', textAlign: 'center' },
  zahlText: { color: FARBEN.textLeise, fontSize: 17, textAlign: 'center' },
  aufteilung: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 14,
  },
  leise: { color: FARBEN.textLeise, fontSize: 15 },
  akzent: { color: FARBEN.akzent, fontSize: 15 },
  leerTitel: { color: FARBEN.text, fontSize: 20, fontWeight: '700' },
  leerText: { color: FARBEN.textLeise, fontSize: 15, lineHeight: 21, marginBottom: 16 },
  reihe: { flexDirection: 'row', gap: 12, marginTop: 16 },
  klein: { flex: 1, backgroundColor: FARBEN.karte, borderRadius: RUNDUNG, padding: 18, gap: 4 },
  kleinTitel: { color: FARBEN.textLeise, fontSize: 13 },
  kleinWert: { color: FARBEN.text, fontSize: 20, fontWeight: '700' },
});
