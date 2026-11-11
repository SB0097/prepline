import { linienAusBaum, linienKurztext } from '@prepline/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDatenbank } from '@/daten/DatenAnbieter';
import { einstellungenLaden } from '@/daten/einstellungen';
import { repertoireDetail, repertoireLoeschen, repertoireUmbenennen } from '@/daten/speicher';
import type { Sql } from '@/daten/sql';
import { useGeladen } from '@/daten/useGeladen';
import { Abschnitt, Knopf, zurueck } from '@/ui/bausteine';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { BestaetigenDialog, EingabeDialog, Menue } from '@/ui/Dialog';
import { FARBEN } from '@/ui/farben';

// Detailseite einer Eröffnung (Skizze D1, Serkan 11.11.2026): Mini-Brett, Zahlen,
// „Nur diese trainieren“, Linienliste; Menü ⋯ mit Umbenennen und Löschen.
// Eine Linie antippen öffnet den Zug-Browser (Skizze D2).
export function DetailSeite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repId = Number(id);
  const db = useDatenbank();
  const daten = useGeladen(async (sql: Sql) => {
    const [rep, einstellungen] = await Promise.all([
      repertoireDetail(sql, repId),
      einstellungenLaden(sql),
    ]);
    return { rep, figurensatz: einstellungen.figurensatz };
  });
  const [menueOffen, setMenueOffen] = useState(false);
  const [umbenennen, setUmbenennen] = useState(false);
  const [loeschen, setLoeschen] = useState(false);
  const [neuerName, setNeuerName] = useState<string | null>(null);

  if (!daten) return <SafeAreaView style={stile.seite} />;
  const { rep, figurensatz } = daten;
  if (!rep) {
    return (
      <SafeAreaView style={stile.seite}>
        <Kopf titel="" onMenue={null} />
        <Text style={stile.leise}>Diese Eröffnung gibt es nicht mehr.</Text>
      </SafeAreaView>
    );
  }
  const name = neuerName ?? rep.name;
  const { stellungen, faellig, neu, sicher } = rep.fortschritt;
  const linien = linienAusBaum(rep.baum);

  return (
    <SafeAreaView style={stile.seite}>
      <Kopf titel={name} onMenue={() => setMenueOffen(true)} />
      <ScrollView contentContainerStyle={stile.inhalt}>
        <View style={stile.brett}>
          <Schachbrett
            fen={rep.endFen}
            groesse={160}
            ansicht={rep.seite}
            figurensatz={figurensatz}
            bedienbar={false}
            koordinaten={false}
          />
        </View>
        <View style={stile.zahlen}>
          <Zahl wert={String(stellungen)} titel="Stellungen" />
          <Zahl wert={String(faellig)} titel="fällig" />
          <Zahl
            wert={stellungen ? `${Math.round((sicher / stellungen) * 100)} %` : '–'}
            titel="sicher"
          />
        </View>
        <Knopf
          titel={faellig + neu > 0 ? 'Nur diese trainieren' : 'Alles gelernt'}
          aus={faellig + neu === 0}
          onPress={() => router.push({ pathname: '/training', params: { id: String(rep.id) } })}
        />
        <Abschnitt titel={`Linien · ${linien.length}`} />
        <View style={stile.linien}>
          {linien.map((linie, i) => (
            <Pressable
              key={i}
              onPress={() =>
                router.push({
                  pathname: '/eroeffnung/[id]/zuege',
                  params: { id: String(rep.id), linie: String(i) },
                })
              }
              accessibilityRole="button"
              style={({ pressed }) => [stile.linie, pressed && { opacity: 0.8 }]}
            >
              <View style={stile.linieText}>
                <Text style={stile.linieZuege} numberOfLines={1}>
                  {linienKurztext(rep.baum, linie)}
                </Text>
                <Text style={stile.leiseKlein}>
                  {i === 0 ? 'Hauptlinie' : 'Variante'} · {linie.knoten.length} Züge
                </Text>
              </View>
              <Text style={stile.pfeil}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Menue
        sichtbar={menueOffen}
        onSchliessen={() => setMenueOffen(false)}
        punkte={[
          { titel: 'Umbenennen', onPress: () => setUmbenennen(true) },
          { titel: 'Löschen', gefaehrlich: true, onPress: () => setLoeschen(true) },
        ]}
      />
      <EingabeDialog
        sichtbar={umbenennen}
        titel="Umbenennen"
        anfangswert={name}
        onAbbrechen={() => setUmbenennen(false)}
        onSpeichern={(wert) => {
          setUmbenennen(false);
          setNeuerName(wert);
          if (db.status === 'bereit') void repertoireUmbenennen(db.sql, rep.id, wert);
        }}
      />
      <BestaetigenDialog
        sichtbar={loeschen}
        titel={`„${name}“ löschen?`}
        text="Die Züge und dein Lernstand werden entfernt. Das lässt sich nicht rückgängig machen."
        bestaetigen="Löschen"
        gefaehrlich
        onAbbrechen={() => setLoeschen(false)}
        onBestaetigen={() => {
          setLoeschen(false);
          if (db.status !== 'bereit') return;
          void repertoireLoeschen(db.sql, rep.id).then(zurueck);
        }}
      />
    </SafeAreaView>
  );
}

function Kopf({ titel, onMenue }: { titel: string; onMenue: (() => void) | null }) {
  return (
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
        {titel}
      </Text>
      <View style={[stile.kopfSeite, stile.rechts]}>
        {onMenue && (
          <Pressable
            onPress={onMenue}
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel="Mehr Aktionen"
          >
            <Text style={stile.menueKnopf}>•••</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Zahl({ wert, titel }: { wert: string; titel: string }) {
  return (
    <View style={stile.zahl}>
      <Text style={stile.zahlWert}>{wert}</Text>
      <Text style={stile.leiseKlein}>{titel}</Text>
    </View>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  kopf: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  kopfSeite: { width: 48 },
  rechts: { alignItems: 'flex-end' },
  zurueck: { color: FARBEN.textLeise, fontSize: 32, lineHeight: 34 },
  titel: { flex: 1, textAlign: 'center', color: FARBEN.text, fontSize: 17, fontWeight: '700' },
  menueKnopf: { color: FARBEN.textLeise, fontSize: 16, letterSpacing: 1 },
  brett: { alignSelf: 'center', borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  zahlen: {
    flexDirection: 'row',
    backgroundColor: FARBEN.karte,
    borderRadius: 20,
    paddingVertical: 14,
  },
  zahl: { flex: 1, alignItems: 'center', gap: 2 },
  zahlWert: { color: FARBEN.text, fontSize: 22, fontWeight: '700' },
  linien: { gap: 8, marginTop: -6 },
  linie: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FARBEN.karte,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  linieText: { flex: 1, gap: 3 },
  linieZuege: { color: FARBEN.text, fontSize: 14 },
  pfeil: { color: FARBEN.textLeise, fontSize: 20, marginLeft: 8 },
  leise: { color: FARBEN.textLeise, fontSize: 15, paddingHorizontal: 20 },
  leiseKlein: { color: FARBEN.textLeise, fontSize: 12 },
});
