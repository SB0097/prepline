import {
  hauptlinieEnde,
  kartenAusBaum,
  SAMMLUNG,
  type Sammlungseintrag,
  sammlungsBaum,
  type Seite,
  type Stufe,
  STUFEN,
} from '@prepline/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { einstellungenLaden } from '@/daten/einstellungen';
import { sammlungImRepertoire } from '@/daten/sammlung';
import type { Sql } from '@/daten/sql';
import { useGeladen } from '@/daten/useGeladen';
import { Abschnitt, ZurueckKopf } from '@/ui/bausteine';
import type { Figurensatz } from '@/ui/brett/figuren';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { FARBEN } from '@/ui/farben';
import { STUFE_TEXT } from '@/ui/stufen';

import { Stufenetikett } from './Stufenetikett';

// Sammlung (Skizze 2, Serkan 11.11.2026): Filter nach Stufe, Abschnitte Weiß/Schwarz,
// ✓ wenn die Eröffnung schon im Repertoire ist.
async function laden(sql: Sql) {
  const [drin, einstellungen] = await Promise.all([
    sammlungImRepertoire(sql),
    einstellungenLaden(sql),
  ]);
  return { drin, figurensatz: einstellungen.figurensatz };
}

export function SammlungSeite() {
  const daten = useGeladen(laden);
  const [filter, setFilter] = useState<Stufe | null>(null);
  const sichtbar = SAMMLUNG.filter((e) => filter === null || e.stufe === filter);
  const abschnitt = (seite: Seite, titel: string) => {
    const liste = sichtbar.filter((e) => e.seite === seite);
    if (liste.length === 0) return null;
    return (
      <>
        <Abschnitt titel={titel} />
        <View style={stile.liste}>
          {liste.map((e) => (
            <Eintrag
              key={e.id}
              eintrag={e}
              drin={daten?.drin.has(e.id) ?? false}
              figurensatz={daten?.figurensatz ?? 'klassisch'}
            />
          ))}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.rand}>
        <ZurueckKopf titel="Sammlung" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={stile.filter}
        style={stile.filterLeiste}
      >
        <Filterknopf titel="Alle" aktiv={filter === null} onPress={() => setFilter(null)} />
        {STUFEN.map((s) => (
          <Filterknopf
            key={s}
            titel={STUFE_TEXT[s]}
            aktiv={filter === s}
            onPress={() => setFilter(s)}
          />
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={stile.inhalt}>
        {abschnitt('weiss', 'Mit Weiß')}
        {abschnitt('schwarz', 'Mit Schwarz')}
      </ScrollView>
    </SafeAreaView>
  );
}

function Filterknopf({
  titel,
  aktiv,
  onPress,
}: {
  titel: string;
  aktiv: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: aktiv }}
      style={[stile.chip, aktiv && stile.chipAktiv]}
    >
      <Text style={[stile.chipText, aktiv && stile.chipTextAktiv]}>{titel}</Text>
    </Pressable>
  );
}

function Eintrag({
  eintrag,
  drin,
  figurensatz,
}: {
  eintrag: Sammlungseintrag;
  drin: boolean;
  figurensatz: Figurensatz;
}) {
  const baum = sammlungsBaum(eintrag);
  const stellungen = kartenAusBaum(baum, eintrag.seite).length;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/sammlung/[id]', params: { id: eintrag.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${eintrag.name.de}, ${STUFE_TEXT[eintrag.stufe]}${drin ? ', schon im Repertoire' : ''}`}
      style={({ pressed }) => [stile.eintrag, pressed && { opacity: 0.85 }]}
    >
      <View style={stile.brett}>
        <Schachbrett
          fen={hauptlinieEnde(baum)}
          groesse={64}
          ansicht={eintrag.seite}
          figurensatz={figurensatz}
          bedienbar={false}
          koordinaten={false}
        />
      </View>
      <View style={stile.text}>
        <Text style={stile.name}>{eintrag.name.de}</Text>
        <Text style={stile.leise} numberOfLines={1}>
          {eintrag.zusatz.de} · {stellungen} Stellungen
        </Text>
        <Stufenetikett stufe={eintrag.stufe} />
      </View>
      <View style={[stile.zeichen, drin ? stile.zeichenDrin : { backgroundColor: FARBEN.akzent }]}>
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            d={drin ? 'M5 12.5l4.5 4.5L19 7.5' : 'M12 5v14M5 12h14'}
            fill="none"
            stroke={drin ? FARBEN.richtig : FARBEN.textAufAkzent}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Pressable>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  rand: { paddingHorizontal: 20 },
  filterLeiste: { flexGrow: 0 },
  filter: { gap: 6, paddingHorizontal: 20, paddingVertical: 4 },
  chip: {
    backgroundColor: FARBEN.karte,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipAktiv: { backgroundColor: FARBEN.akzent },
  chipText: { color: FARBEN.text, fontSize: 13 },
  chipTextAktiv: { color: FARBEN.textAufAkzent, fontWeight: '700' },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32 },
  liste: { gap: 8 },
  eintrag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: FARBEN.karte,
    borderRadius: 20,
    padding: 10,
  },
  brett: { borderRadius: 8, overflow: 'hidden' },
  text: { flex: 1, gap: 3, alignItems: 'flex-start' },
  name: { color: FARBEN.text, fontSize: 16, fontWeight: '700' },
  leise: { color: FARBEN.textLeise, fontSize: 12 },
  zeichen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zeichenDrin: { backgroundColor: 'rgba(61, 214, 140, 0.16)' },
});
