import { linienAusBaum, linienKurztext } from '@prepline/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDatenbank } from '@/daten/DatenAnbieter';
import { einstellungenLaden } from '@/daten/einstellungen';
import { repertoireDetail, repertoireLoeschen, repertoireUmbenennen } from '@/daten/speicher';
import type { Sql } from '@/daten/sql';
import { useGeladen } from '@/daten/useGeladen';
import { Abschnitt, Knopf, RundKnopf, zurueck, Zeilenknopf, ZurueckKopf } from '@/ui/bausteine';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { BestaetigenDialog, EingabeDialog, Menue } from '@/ui/Dialog';
import { FARBEN } from '@/ui/farben';
import { Zeichen } from '@/ui/symbole';
import { Text } from '@/ui/Text';

// Detailseite einer Eröffnung (Inhalt nach Skizze D1, Layout „Ruhig & groß“ 14.11.2026):
// großer Titel, großes Brett, Zahlen ohne Kasten, „Nur diese trainieren“, Linien als Liste;
// Menü ⋯ mit Umbenennen und Löschen. Eine Linie antippen öffnet den Zug-Browser (Skizze D2).
export function DetailSeite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repId = Number(id);
  const breite = useWindowDimensions().width;
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
        <View style={stile.rand}>
          <ZurueckKopf titel="" />
          <Text style={stile.leise}>Diese Eröffnung gibt es nicht mehr.</Text>
        </View>
      </SafeAreaView>
    );
  }
  const name = neuerName ?? rep.name;
  const { stellungen, faellig, neu, sicher } = rep.fortschritt;
  const linien = linienAusBaum(rep.baum);
  const unter = [
    rep.seite === 'weiss' ? 'Weiß' : 'Schwarz',
    linien.length === 1 ? '1 Linie' : `${linien.length} Linien`,
    ...(rep.quelle ? ['aus der Sammlung'] : []),
  ].join(' · ');

  return (
    <SafeAreaView style={stile.seite}>
      <ScrollView contentContainerStyle={stile.inhalt}>
        <ZurueckKopf
          titel={name}
          unter={unter}
          rechts={
            <RundKnopf
              symbol="mehr"
              beschriftung="Mehr Aktionen"
              onPress={() => setMenueOffen(true)}
            />
          }
        />
        <Schachbrett
          fen={rep.endFen}
          groesse={breite - 40}
          rundung={16}
          ansicht={rep.seite}
          figurensatz={figurensatz}
          bedienbar={false}
        />
        <View style={stile.zahlen}>
          <Zahl wert={String(stellungen)} titel="Stellungen" />
          <Zahl wert={String(faellig)} titel="fällig" akzent={faellig > 0} />
          <Zahl
            wert={stellungen ? `${Math.round((sicher / stellungen) * 100)} %` : '–'}
            titel="sicher"
          />
        </View>
        <Knopf
          titel={faellig + neu > 0 ? 'Nur diese trainieren' : 'Alles gelernt'}
          {...(faellig + neu > 0 && { symbol: 'start' as const })}
          aus={faellig + neu === 0}
          onPress={() => router.push({ pathname: '/training', params: { id: String(rep.id) } })}
        />
        <Abschnitt titel={`Linien · ${linien.length}`} />
        {linien.map((linie, i) => (
          <Zeilenknopf
            key={i}
            onPress={() =>
              router.push({
                pathname: '/eroeffnung/[id]/zuege',
                params: { id: String(rep.id), linie: String(i) },
              })
            }
            accessibilityRole="button"
          >
            <View style={[stile.linie, i < linien.length - 1 && stile.trenner]}>
              <View style={stile.linieText}>
                <Text style={stile.linieZuege} numberOfLines={1}>
                  {linienKurztext(rep.baum, linie)}
                </Text>
                <Text style={stile.leiseKlein}>
                  {i === 0 ? 'Hauptlinie' : 'Variante'} · {linie.knoten.length} Züge
                </Text>
              </View>
              <Zeichen name="weiter" farbe={FARBEN.textLeise} groesse={18} />
            </View>
          </Zeilenknopf>
        ))}
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

function Zahl({ wert, titel, akzent = false }: { wert: string; titel: string; akzent?: boolean }) {
  return (
    <View style={stile.zahl}>
      <Text style={[stile.zahlWert, akzent && { color: FARBEN.akzent }]}>{wert}</Text>
      <Text style={stile.leiseKlein} numberOfLines={1} adjustsFontSizeToFit>
        {titel}
      </Text>
    </View>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  rand: { paddingHorizontal: 20 },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32 },
  zahlen: { flexDirection: 'row', columnGap: 12, marginTop: 22, marginBottom: 22 },
  zahl: { flex: 1, gap: 2 },
  zahlWert: { color: FARBEN.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  linie: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  trenner: { borderBottomWidth: 1, borderBottomColor: FARBEN.rand },
  linieText: { flex: 1, gap: 4 },
  linieZuege: { color: FARBEN.text, fontSize: 15, fontWeight: '500' },
  leise: { color: FARBEN.textLeise, fontSize: 15 },
  leiseKlein: { color: FARBEN.textLeise, fontSize: 12.5 },
});
