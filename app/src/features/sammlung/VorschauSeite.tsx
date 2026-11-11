import {
  hauptlinieEnde,
  kartenAusBaum,
  linienAusBaum,
  linienKurztext,
  sammlungsBaum,
  sammlungsEintrag,
} from '@prepline/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDatenbank } from '@/daten/DatenAnbieter';
import { einstellungenLaden } from '@/daten/einstellungen';
import { sammlungHinzufuegen, sammlungImRepertoire } from '@/daten/sammlung';
import type { Sql } from '@/daten/sql';
import { useGeladen } from '@/daten/useGeladen';
import { Abschnitt, Knopf, ZurueckKopf } from '@/ui/bausteine';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { CoachBauer } from '@/ui/CoachBauer';
import { FARBEN } from '@/ui/farben';

import { Stufenetikett } from './Stufenetikett';

// Vorschau einer Eröffnung aus der Sammlung (Skizze 3, Serkan 11.11.2026).
async function laden(sql: Sql) {
  const [drin, einstellungen] = await Promise.all([
    sammlungImRepertoire(sql),
    einstellungenLaden(sql),
  ]);
  return { drin, figurensatz: einstellungen.figurensatz };
}

export function VorschauSeite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDatenbank();
  const daten = useGeladen(laden);
  const [speichert, setSpeichert] = useState(false);
  const eintrag = sammlungsEintrag(id);

  if (!eintrag) {
    return (
      <SafeAreaView style={stile.seite}>
        <View style={stile.rand}>
          <ZurueckKopf titel="" />
          <Text style={stile.leise}>Diese Eröffnung gibt es nicht.</Text>
        </View>
      </SafeAreaView>
    );
  }
  const baum = sammlungsBaum(eintrag);
  const linien = linienAusBaum(baum);
  const stellungen = kartenAusBaum(baum, eintrag.seite).length;
  const repId = daten?.drin.get(eintrag.id);

  const hinzufuegen = async () => {
    if (db.status !== 'bereit') return;
    setSpeichert(true);
    const neueId = await sammlungHinzufuegen(db.sql, eintrag.id);
    router.replace({ pathname: '/eroeffnung/[id]', params: { id: String(neueId) } });
  };

  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.rand}>
        <ZurueckKopf titel={eintrag.name.de} />
      </View>
      <ScrollView contentContainerStyle={stile.inhalt}>
        <View style={stile.brett}>
          <Schachbrett
            fen={hauptlinieEnde(baum)}
            groesse={180}
            ansicht={eintrag.seite}
            figurensatz={daten?.figurensatz ?? 'klassisch'}
            bedienbar={false}
            koordinaten={false}
          />
        </View>
        <View style={stile.mitte}>
          <Stufenetikett stufe={eintrag.stufe} />
          <Text style={stile.leise}>
            {eintrag.seite === 'weiss' ? 'mit Weiß' : 'mit Schwarz'} · {stellungen} Stellungen ·{' '}
            {linien.length} Linien
          </Text>
        </View>
        <View style={stile.karte}>
          <View style={stile.kartenKopf}>
            <CoachBauer groesse={40} />
            <Text style={stile.kartenTitel}>Darum geht’s</Text>
          </View>
          <Text style={stile.text}>{eintrag.beschreibung.de}</Text>
        </View>
        <Abschnitt titel="Enthalten" />
        <View style={stile.linien}>
          {linien.map((l, i) => (
            <Text key={i} style={stile.linie} numberOfLines={1}>
              {linienKurztext(baum, l, 8)}
            </Text>
          ))}
        </View>
      </ScrollView>
      <View style={stile.fuss}>
        {repId === undefined ? (
          <Knopf
            titel="Zu meinem Repertoire"
            aus={speichert || !daten}
            onPress={() => void hinzufuegen()}
          />
        ) : (
          <Knopf
            titel="Schon in deinem Repertoire – öffnen"
            onPress={() =>
              router.replace({ pathname: '/eroeffnung/[id]', params: { id: String(repId) } })
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  rand: { paddingHorizontal: 20 },
  inhalt: { paddingHorizontal: 20, paddingBottom: 24 },
  brett: { alignSelf: 'center', borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  mitte: { alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 18 },
  karte: { backgroundColor: FARBEN.karte, borderRadius: 22, padding: 18, gap: 10 },
  kartenKopf: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kartenTitel: { color: FARBEN.text, fontSize: 16, fontWeight: '700' },
  text: { color: FARBEN.text, fontSize: 15, lineHeight: 22 },
  linien: { gap: 6, marginTop: -4 },
  linie: { color: FARBEN.text, fontSize: 14 },
  leise: { color: FARBEN.textLeise, fontSize: 14 },
  fuss: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
});
