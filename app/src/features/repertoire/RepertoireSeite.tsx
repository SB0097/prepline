import type { Seite } from '@prepline/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { einstellungenLaden } from '@/daten/einstellungen';
import { type RepertoireUebersicht, repertoireUebersicht } from '@/daten/speicher';
import type { Sql } from '@/daten/sql';
import { useGeladen } from '@/daten/useGeladen';
import { RundKnopf, SeitenTitel, Umschalter } from '@/ui/bausteine';
import type { Figurensatz } from '@/ui/brett/figuren';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { FARBEN } from '@/ui/farben';
import { Text, ZIFFERN_GLEICH } from '@/ui/Text';

// Repertoire-Seite (Layout „Ruhig & groß“, Serkan 14.11.2026): Umschalter Weiß/Schwarz,
// darunter eine ruhige Liste: Mini-Brett, Name, Status, Stellungen und ein kleiner Prozent-Ring.
// Hinzugefügt wird nur über das Plus oben rechts (Serkan 12.11.2026).
const BRETT = 72;

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
      <View style={stile.liste}>
        {daten &&
          liste.map((r, i) => (
            <Zeile
              key={r.id}
              rep={r}
              figurensatz={daten.figurensatz}
              letzte={i === liste.length - 1}
            />
          ))}
      </View>
      {daten && liste.length === 0 && (
        <View style={stile.leer}>
          <Text style={stile.leerTitel}>
            Noch keine Eröffnung mit {seite === 'weiss' ? 'Weiß' : 'Schwarz'}
          </Text>
          <Text style={stile.leerText}>Tippe oben rechts auf das Plus, um eine hinzuzufügen.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function Zeile({
  rep,
  figurensatz,
  letzte,
}: {
  rep: RepertoireUebersicht;
  figurensatz: Figurensatz;
  letzte: boolean;
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
      style={({ pressed }) => [stile.zeile, pressed && { opacity: 0.75 }]}
    >
      <View style={stile.brett}>
        <Schachbrett
          fen={rep.endFen}
          groesse={BRETT}
          ansicht={rep.seite}
          figurensatz={figurensatz}
          bedienbar={false}
          koordinaten={false}
        />
      </View>
      <View style={[stile.text, !letzte && stile.trenner]}>
        <View style={stile.textSpalte}>
          <Text style={stile.name} numberOfLines={1}>
            {rep.name}
          </Text>
          <Text style={[stile.status, { color: offen ? FARBEN.akzent : FARBEN.richtig }]}>
            {status}
          </Text>
          <Text style={stile.leise}>
            {stellungen === 1 ? '1 Stellung' : `${stellungen} Stellungen`}
          </Text>
        </View>
        <ProzentRing prozent={prozent} />
      </View>
    </Pressable>
  );
}

const RING = { groesse: 40, strich: 4 };

/** Kleiner Ring mit dem Anteil sicherer Stellungen. */
function ProzentRing({ prozent }: { prozent: number }) {
  const r = (RING.groesse - RING.strich) / 2;
  const mitte = RING.groesse / 2;
  const umfang = 2 * Math.PI * r;
  return (
    <View style={stile.ring}>
      <Svg width={RING.groesse} height={RING.groesse}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={FARBEN.akzent} />
            <Stop offset="1" stopColor={FARBEN.akzentHell} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={mitte}
          cy={mitte}
          r={r}
          fill="none"
          stroke={FARBEN.karteHell}
          strokeWidth={RING.strich}
        />
        {prozent > 0 && (
          <Circle
            cx={mitte}
            cy={mitte}
            r={r}
            fill="none"
            stroke="url(#ring)"
            strokeWidth={RING.strich}
            strokeLinecap="round"
            strokeDasharray={`${(umfang * prozent) / 100} ${umfang}`}
            transform={`rotate(-90 ${mitte} ${mitte})`}
          />
        )}
      </Svg>
      <View style={stile.ringMitte}>
        {/* Der Ring hat eine feste Größe, deshalb wächst die Zahl kaum mit. */}
        <Text style={[stile.ringText, ZIFFERN_GLEICH]} maxFontSizeMultiplier={1.2}>
          {prozent}%
        </Text>
      </View>
    </View>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32 },
  plusKnopf: { marginBottom: 2 },
  liste: { marginTop: 14 },
  zeile: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  brett: { borderRadius: 12, overflow: 'hidden' },
  text: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  trenner: { borderBottomWidth: 1, borderBottomColor: FARBEN.rand },
  textSpalte: { flex: 1, gap: 3 },
  name: { color: FARBEN.text, fontSize: 17, fontWeight: '700' },
  status: { fontSize: 14, fontWeight: '700' },
  leise: { color: FARBEN.textLeise, fontSize: 13 },
  ring: { width: RING.groesse, height: RING.groesse },
  ringMitte: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  ringText: { color: FARBEN.textLeise, fontSize: 10, fontWeight: '700' },
  leer: { alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingTop: 56 },
  leerTitel: { color: FARBEN.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  leerText: { color: FARBEN.textLeise, fontSize: 15, lineHeight: 21, textAlign: 'center' },
});
