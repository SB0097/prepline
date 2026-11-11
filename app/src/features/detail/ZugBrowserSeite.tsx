import {
  amZug,
  erklaerungFuer,
  linienAusBaum,
  type Zugknoten,
  zugfolgeText,
} from '@prepline/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { einstellungenLaden } from '@/daten/einstellungen';
import { repertoireDetail } from '@/daten/speicher';
import type { Sql } from '@/daten/sql';
import { useGeladen } from '@/daten/useGeladen';
import { Knopf, zurueck } from '@/ui/bausteine';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { CoachBauer } from '@/ui/CoachBauer';
import { FARBEN } from '@/ui/farben';

// Zug-Browser (Skizze D2, Serkan 11.11.2026): eine Linie Zug für Zug ansehen.
// Startet kurz vor der Stelle, an der die gewählte Linie abzweigt.
export function ZugBrowserSeite() {
  const { id, linie } = useLocalSearchParams<{ id: string; linie?: string }>();
  const repId = Number(id);
  const breite = useWindowDimensions().width;
  const daten = useGeladen(async (sql: Sql) => {
    const [rep, einstellungen] = await Promise.all([
      repertoireDetail(sql, repId),
      einstellungenLaden(sql),
    ]);
    return { rep, figurensatz: einstellungen.figurensatz };
  });
  const [gewaehlterPfad, setPfad] = useState<Zugknoten[] | null>(null);

  if (!daten?.rep) return <SafeAreaView style={stile.seite} />;
  const { rep, figurensatz } = daten;
  const linien = linienAusBaum(rep.baum);
  const ziel = linien[Number(linie ?? 0)] ?? linien[0];
  const pfad = gewaehlterPfad ?? ziel?.knoten.slice(0, ziel.abzweig) ?? [];

  const letzter = pfad.at(-1);
  const fen = letzter?.fen ?? rep.baum.startFen;
  const kinder = letzter ? letzter.kinder : rep.baum.zuege;
  const eigenerZug = amZug(fen) === rep.seite;
  // „weiter“ folgt der gewählten Linie, solange man auf ihr bleibt.
  const aufLinie = ziel && pfad.every((k, i) => ziel.knoten[i] === k);
  const naechster = (aufLinie && ziel?.knoten[pfad.length]) || kinder[0];

  const zugText = (k: Zugknoten) => zugfolgeText(fen, [k]);
  // Erklärung des Coach-Bauern zum zuletzt gezeigten Zug (nur bei Eröffnungen aus der Sammlung)
  const fenVorLetztem = pfad.length > 1 ? pfad[pfad.length - 2]!.fen : rep.baum.startFen;
  const erklaerung = letzter && erklaerungFuer(rep.quelle, fenVorLetztem, letzter.san);

  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.kopf}>
        <Pressable
          onPress={zurueck}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Zurück"
          style={stile.kopfSeite}
        >
          <Text style={stile.zurueck}>‹</Text>
        </Pressable>
        <Text style={stile.titel} numberOfLines={1} accessibilityRole="header">
          {rep.name}
        </Text>
        <View style={stile.kopfSeite} />
      </View>
      <ScrollView contentContainerStyle={stile.inhalt}>
        <View style={stile.brett}>
          <Schachbrett
            fen={fen}
            groesse={breite - 20}
            ansicht={rep.seite}
            figurensatz={figurensatz}
            {...(letzter && { letzterZug: letzter.uci })}
            bedienbar={false}
          />
        </View>
        <Text style={stile.zugfolge}>
          {pfad.length ? zugfolgeText(rep.baum.startFen, pfad) : 'Ausgangsstellung'}
        </Text>
        {erklaerung && letzter ? (
          <View style={stile.coach}>
            <CoachBauer groesse={36} />
            <View style={stile.coachText}>
              <Text style={stile.coachTitel}>Warum {zugfolgeText(fenVorLetztem, [letzter])}?</Text>
              <Text style={stile.coachErklaerung}>{erklaerung.de}</Text>
            </View>
          </View>
        ) : null}
        {letzter?.kommentar ? <Text style={stile.kommentar}>{letzter.kommentar}</Text> : null}

        {kinder.length > 0 ? (
          <>
            <Text style={stile.abschnitt}>{eigenerZug ? 'DEIN ZUG' : 'GEGNER'}</Text>
            <View style={stile.chips}>
              {kinder.map((k, i) => {
                const haupt = eigenerZug ? i === 0 : k === naechster;
                return (
                  <Pressable
                    key={k.uci}
                    onPress={() => setPfad([...pfad, k])}
                    accessibilityRole="button"
                    style={[stile.chip, haupt && stile.chipAktiv]}
                  >
                    <Text style={[stile.chipText, haupt && stile.chipTextAktiv]}>
                      {zugText(k)}
                      {eigenerZug && i > 0 ? ' · auch spielbar' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={stile.abschnitt}>ENDE DER LINIE</Text>
        )}
      </ScrollView>
      <View style={stile.fuss}>
        <View style={stile.navigation}>
          <Pressable
            onPress={() => setPfad(pfad.slice(0, -1))}
            disabled={pfad.length === 0}
            accessibilityRole="button"
            style={[stile.navKnopf, pfad.length === 0 && stile.aus]}
          >
            <Text style={stile.navText}>‹ zurück</Text>
          </Pressable>
          <Pressable
            onPress={() => naechster && setPfad([...pfad, naechster])}
            disabled={!naechster}
            accessibilityRole="button"
            style={[stile.navKnopf, !naechster && stile.aus]}
          >
            <Text style={stile.navText}>weiter ›</Text>
          </Pressable>
        </View>
        <View style={stile.unten}>
          <Knopf
            titel="Nur diese trainieren"
            aus={rep.fortschritt.faellig + rep.fortschritt.neu === 0}
            onPress={() => router.push({ pathname: '/training', params: { id: String(rep.id) } })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  kopf: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  kopfSeite: { width: 48 },
  zurueck: { color: FARBEN.textLeise, fontSize: 32, lineHeight: 34 },
  titel: { flex: 1, textAlign: 'center', color: FARBEN.text, fontSize: 17, fontWeight: '700' },
  inhalt: { paddingBottom: 16 },
  brett: { marginHorizontal: 10 },
  zugfolge: {
    color: FARBEN.textLeise,
    fontSize: 14,
    lineHeight: 20,
    marginHorizontal: 20,
    marginTop: 14,
  },
  kommentar: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: FARBEN.karte,
    color: FARBEN.text,
    fontSize: 14,
    lineHeight: 20,
  },
  coach: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: FARBEN.karte,
    borderColor: 'rgba(108, 140, 255, 0.4)',
    borderWidth: 1,
  },
  coachText: { flex: 1, gap: 4 },
  coachTitel: { color: FARBEN.akzent, fontSize: 14, fontWeight: '700' },
  coachErklaerung: { color: FARBEN.text, fontSize: 14, lineHeight: 20 },
  abschnitt: {
    color: FARBEN.textLeise,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20 },
  chip: {
    backgroundColor: FARBEN.karte,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipAktiv: { backgroundColor: FARBEN.akzent },
  chipText: { color: FARBEN.text, fontSize: 15 },
  chipTextAktiv: { color: FARBEN.textAufAkzent, fontWeight: '700' },
  fuss: {
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: FARBEN.linie,
  },
  navigation: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 12 },
  navKnopf: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: FARBEN.karte,
    borderRadius: 20,
    paddingVertical: 13,
  },
  navText: { color: FARBEN.text, fontSize: 17 },
  aus: { opacity: 0.4 },
  unten: { marginHorizontal: 20, marginTop: 12 },
});
