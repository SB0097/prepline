import { linienAusBaum, linienKurztext } from '@prepline/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDatenbank } from '@/daten/DatenAnbieter';
import { einstellungenLaden } from '@/daten/einstellungen';
import { repertoireDetail, repertoireLoeschen, repertoireUmbenennen } from '@/daten/speicher';
import type { Sql } from '@/daten/sql';
import { useGeladen } from '@/daten/useGeladen';
import {
  Abschnitt,
  Knopf,
  Lernbalken,
  RundKnopf,
  tiefe,
  useKarte,
  Zeilenknopf,
  zurueck,
  ZurueckKopf,
} from '@/ui/bausteine';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { BestaetigenDialog, EingabeDialog, Menue } from '@/ui/Dialog';
import { stileErstellen, useFarben } from '@/ui/thema';
import { Zeichen } from '@/ui/symbole';
import { Text, ZIFFERN_GLEICH } from '@/ui/Text';

// Detailseite einer Eröffnung (Inhalt nach Skizze D1, Runde 16 „Tiefe“ 15.11.2026):
// großer Titel, Brett im Rahmen, Karte mit Zahlen und Lernbalken, „Nur diese trainieren“,
// Linien in einer Karte; Menü ⋯ mit Umbenennen und Löschen. Eine Linie antippen öffnet den
// Zug-Browser (Skizze D2).
export function DetailSeite() {
  const KARTE = useKarte().karte;
  const F = useFarben();
  const stile = useStile();
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
  const { stellungen, faellig, neu, gelernt, sicher } = rep.fortschritt;
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
        <View style={stile.rahmen}>
          <Schachbrett
            fen={rep.endFen}
            groesse={breite - 2 * (20 + RAHMEN)}
            rundung={14}
            ansicht={rep.seite}
            figurensatz={figurensatz}
            bedienbar={false}
          />
        </View>
        <View style={[KARTE, stile.zahlenKarte]}>
          <View style={stile.zahlen}>
            <Zahl wert={String(stellungen)} titel="Stellungen" />
            <View style={stile.teiler} />
            <Zahl
              wert={String(faellig)}
              titel="fällig"
              farbe={faellig > 0 ? F.hinweis : undefined}
            />
            <View style={stile.teiler} />
            <Zahl
              wert={stellungen ? `${Math.round((gelernt / stellungen) * 100)} %` : '–'}
              titel="gelernt"
            />
          </View>
          <Lernbalken stellungen={stellungen} gelernt={gelernt} sicher={sicher} hoehe={6} />
          <Text style={stile.leiseKlein}>
            {gelernt} von {stellungen} gelernt · {sicher} sicher
          </Text>
        </View>
        <Knopf
          titel={faellig + neu > 0 ? 'Nur diese trainieren' : 'Alles gelernt'}
          {...(faellig + neu > 0 && { symbol: 'start' as const })}
          aus={faellig + neu === 0}
          onPress={() => router.push({ pathname: '/training', params: { id: String(rep.id) } })}
        />
        <Abschnitt titel={`Linien · ${linien.length}`} />
        <View style={[KARTE, stile.linien]}>
          {linien.map((linie, i) => (
            <Zeilenknopf
              key={i}
              einzug={16}
              flaeche={F.karteHell}
              rund={0}
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
                <Zeichen name="weiter" farbe={F.textLeise} groesse={18} />
              </View>
            </Zeilenknopf>
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

/** Innenabstand des Rahmens um das Brett. */
const RAHMEN = 6;

function Zahl({ wert, titel, farbe }: { wert: string; titel: string; farbe?: string | undefined }) {
  const stile = useStile();
  return (
    <View style={stile.zahl}>
      <Text style={[stile.zahlWert, ZIFFERN_GLEICH, farbe !== undefined && { color: farbe }]}>
        {wert}
      </Text>
      <Text style={stile.leiseKlein} numberOfLines={1} adjustsFontSizeToFit>
        {titel}
      </Text>
    </View>
  );
}

const useStile = stileErstellen((F) => ({
  seite: { flex: 1, backgroundColor: F.hintergrund },
  rand: { paddingHorizontal: 20 },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32 },
  rahmen: {
    alignSelf: 'center',
    padding: RAHMEN,
    borderRadius: 20,
    backgroundColor: F.karteHell,
    borderWidth: 1,
    borderColor: F.lichtkante,
    ...tiefe(F),
  },
  zahlenKarte: { marginTop: 18, marginBottom: 20, padding: 16, gap: 12, borderRadius: 18 },
  zahlen: { flexDirection: 'row', alignItems: 'center' },
  zahl: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  teiler: { width: 1, alignSelf: 'stretch', backgroundColor: F.rand },
  zahlWert: { color: F.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  linien: { paddingHorizontal: 16, overflow: 'hidden', borderRadius: 18 },
  linie: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  trenner: { borderBottomWidth: 1, borderBottomColor: F.rand },
  linieText: { flex: 1, gap: 4 },
  linieZuege: { color: F.text, fontSize: 15, fontWeight: '500' },
  leise: { color: F.textLeise, fontSize: 15 },
  leiseKlein: { color: F.textLeise, fontSize: 12.5 },
}));
