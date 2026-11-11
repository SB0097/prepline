import type { Seite } from '@prepline/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { einstellungenLaden } from '@/daten/einstellungen';
import { type RepertoireUebersicht, repertoireUebersicht } from '@/daten/speicher';
import type { Sql } from '@/daten/sql';
import { useGeladen } from '@/daten/useGeladen';
import { RundKnopf, RUNDUNG, SeitenTitel, Umschalter } from '@/ui/bausteine';
import type { Figurensatz } from '@/ui/brett/figuren';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { FARBEN } from '@/ui/farben';
import { Zeichen } from '@/ui/symbole';

// Repertoire-Seite (Skizze Graphit, 12.11.2026): Umschalter Weiß/Schwarz mit Anzahl,
// Kacheln mit randlosem Mini-Brett, Status, Prozent und Fortschrittsbalken.
const RAND = 16;
const ABSTAND = 12;
/** Höhe des Textbereichs unter dem Mini-Brett. */
const FUSS = 65;

async function laden(sql: Sql) {
  const [liste, einstellungen] = await Promise.all([
    repertoireUebersicht(sql),
    einstellungenLaden(sql),
  ]);
  return { liste, figurensatz: einstellungen.figurensatz };
}

export function RepertoireSeite() {
  const daten = useGeladen(laden);
  const [seite, setSeite] = useState<Seite>('weiss');
  const breite = Math.floor((useWindowDimensions().width - 2 * RAND - ABSTAND) / 2);
  const liste = daten?.liste.filter((r) => r.seite === seite) ?? [];
  const anzahl = (s: Seite) => daten?.liste.filter((r) => r.seite === s).length;
  const hinzufuegen = () => router.push('/import');

  return (
    <ScrollView style={stile.seite} contentContainerStyle={stile.inhalt}>
      <SeitenTitel
        titel="Repertoire"
        rechts={
          <View style={stile.plusKnopf}>
            <RundKnopf
              symbol="plus"
              art="akzent"
              beschriftung="Eröffnung hinzufügen"
              onPress={hinzufuegen}
            />
          </View>
        }
      />
      <Umschalter
        werte={[
          { wert: 'weiss', titel: 'Weiß', seite: 'weiss', anzahl: anzahl('weiss') },
          { wert: 'schwarz', titel: 'Schwarz', seite: 'schwarz', anzahl: anzahl('schwarz') },
        ]}
        wert={seite}
        onWahl={setSeite}
      />
      <View style={stile.raster}>
        {daten &&
          liste.map((r) => (
            <Kachel key={r.id} rep={r} breite={breite} figurensatz={daten.figurensatz} />
          ))}
        <Pressable
          onPress={hinzufuegen}
          accessibilityRole="button"
          accessibilityLabel="Eröffnung hinzufügen"
          style={({ pressed }) => [
            stile.neu,
            { width: breite, height: breite + FUSS },
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={stile.neuKreis}>
            <Zeichen name="plus" farbe={FARBEN.akzent} />
          </View>
          <Text style={stile.neuText}>Hinzufügen</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Kachel({
  rep,
  breite,
  figurensatz,
}: {
  rep: RepertoireUebersicht;
  breite: number;
  figurensatz: Figurensatz;
}) {
  const { faellig, neu, sicher, stellungen } = rep.fortschritt;
  const offen = faellig + neu > 0;
  const status = faellig > 0 ? `${faellig} fällig` : neu > 0 ? `${neu} neu` : 'alles gut';
  const prozent = stellungen === 0 ? 0 : Math.round((sicher / stellungen) * 100);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/eroeffnung/[id]', params: { id: String(rep.id) } })}
      accessibilityRole="button"
      accessibilityLabel={`${rep.name}, ${status}, ${prozent} Prozent sicher`}
      style={({ pressed }) => [stile.kachel, { width: breite }, pressed && { opacity: 0.85 }]}
    >
      {/* Der Rand der Kachel liegt innen, deshalb ist das Brett zwei Pixel schmaler. */}
      <Schachbrett
        fen={rep.endFen}
        groesse={breite - 2}
        ansicht={rep.seite}
        figurensatz={figurensatz}
        bedienbar={false}
        koordinaten={false}
      />
      <View style={stile.fuss}>
        <Text style={stile.name} numberOfLines={1}>
          {rep.name}
        </Text>
        <View style={stile.statusZeile}>
          {!offen && <Zeichen name="haken" farbe={FARBEN.richtig} groesse={15} />}
          <Text style={[stile.status, { color: offen ? FARBEN.akzent : FARBEN.richtig }]}>
            {status}
          </Text>
          <Text style={stile.prozent}>{prozent} %</Text>
        </View>
      </View>
      <View style={stile.balken}>
        <View style={[stile.balkenVoll, { width: `${prozent}%` }]} />
      </View>
    </Pressable>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  inhalt: { paddingHorizontal: RAND, paddingBottom: 32 },
  plusKnopf: { marginBottom: 2 },
  raster: { flexDirection: 'row', flexWrap: 'wrap', gap: ABSTAND, marginTop: 18 },
  kachel: {
    backgroundColor: FARBEN.karte,
    borderColor: FARBEN.rand,
    borderWidth: 1,
    borderRadius: RUNDUNG,
    overflow: 'hidden',
  },
  fuss: { paddingHorizontal: 14, paddingTop: 11, paddingBottom: 12, gap: 3 },
  name: { color: FARBEN.text, fontSize: 15.5, fontWeight: '700' },
  statusZeile: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  status: { flex: 1, fontSize: 13, fontWeight: '700' },
  prozent: { color: FARBEN.textLeise, fontSize: 12, fontWeight: '600' },
  balken: { height: 5, backgroundColor: FARBEN.karteHell },
  balkenVoll: { height: 5, backgroundColor: FARBEN.akzent },
  neu: {
    borderRadius: RUNDUNG,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: FARBEN.linie,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  neuKreis: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: FARBEN.karteHell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neuText: { color: FARBEN.textLeise, fontSize: 14, fontWeight: '600' },
});
