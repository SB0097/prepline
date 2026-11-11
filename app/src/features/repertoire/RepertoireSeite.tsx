import type { Seite } from '@prepline/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { einstellungenLaden } from '@/daten/einstellungen';
import { repertoireUebersicht, type RepertoireUebersicht } from '@/daten/speicher';
import type { Sql } from '@/daten/sql';
import { useGeladen } from '@/daten/useGeladen';
import { RUNDUNG, SeitenTitel, Umschalter } from '@/ui/bausteine';
import type { Figurensatz } from '@/ui/brett/figuren';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { FARBEN } from '@/ui/farben';

// Repertoire-Seite (Skizze R3, 11.11.2026): Umschalter Weiß/Schwarz, Kacheln mit Mini-Brett.
const SEITEN = [
  { wert: 'weiss', titel: 'Weiß' },
  { wert: 'schwarz', titel: 'Schwarz' },
] as const;

const RAND = 20;
const ABSTAND = 12;

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
  const breite = (useWindowDimensions().width - 2 * RAND - ABSTAND) / 2;
  const liste = daten?.liste.filter((r) => r.seite === seite) ?? [];

  return (
    <ScrollView style={stile.seite} contentContainerStyle={stile.inhalt}>
      <SeitenTitel titel="Repertoire" />
      <Umschalter werte={SEITEN} wert={seite} onWahl={setSeite} />
      <View style={stile.raster}>
        {daten &&
          liste.map((r) => (
            <Kachel key={r.id} rep={r} breite={breite} figurensatz={daten.figurensatz} />
          ))}
        <Pressable
          onPress={() => router.push('/import')}
          accessibilityRole="button"
          accessibilityLabel="Eröffnung hinzufügen"
          style={[stile.neu, { width: breite, height: breite + 66 }]}
        >
          <Text style={stile.plus}>+</Text>
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
  const { faellig, neu } = rep.fortschritt;
  const status = faellig > 0 ? `${faellig} fällig` : neu > 0 ? `${neu} neu` : 'alles gut';
  const brett = breite - 24;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/eroeffnung/[id]', params: { id: String(rep.id) } })}
      accessibilityRole="button"
      accessibilityLabel={`${rep.name}, ${status}`}
      style={({ pressed }) => [stile.kachel, { width: breite }, pressed && { opacity: 0.85 }]}
    >
      <View style={stile.brett}>
        <Schachbrett
          fen={rep.endFen}
          groesse={brett}
          ansicht={rep.seite}
          figurensatz={figurensatz}
          bedienbar={false}
          koordinaten={false}
        />
      </View>
      <Text style={stile.name} numberOfLines={1}>
        {rep.name}
      </Text>
      <Text style={[stile.status, faellig + neu > 0 && stile.statusAktiv]}>{status}</Text>
    </Pressable>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  inhalt: { paddingHorizontal: RAND, paddingBottom: 32 },
  raster: { flexDirection: 'row', flexWrap: 'wrap', gap: ABSTAND, marginTop: 20 },
  kachel: { backgroundColor: FARBEN.karte, borderRadius: RUNDUNG, padding: 12, gap: 4 },
  brett: { borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  name: { color: FARBEN.text, fontSize: 15, fontWeight: '700' },
  status: { color: FARBEN.textLeise, fontSize: 12 },
  statusAktiv: { color: FARBEN.akzent },
  neu: {
    borderRadius: RUNDUNG,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: FARBEN.linie,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  plus: { color: FARBEN.akzent, fontSize: 36 },
  neuText: { color: FARBEN.textLeise, fontSize: 14 },
});
