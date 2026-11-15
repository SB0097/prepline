import type { Seite } from '@prepline/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { einstellungenLaden } from '@/daten/einstellungen';
import { type RepertoireUebersicht, repertoireUebersicht } from '@/daten/speicher';
import type { Sql } from '@/daten/sql';
import { useGeladen } from '@/daten/useGeladen';
import {
  Federnd,
  Glanz,
  Lernbalken,
  RundKnopf,
  SeitenTitel,
  Umschalter,
  useKarte,
} from '@/ui/bausteine';
import type { Figurensatz } from '@/ui/brett/figuren';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { stileErstellen, useFarben } from '@/ui/thema';
import { Zeichen } from '@/ui/symbole';
import { Text, ZIFFERN_GLEICH } from '@/ui/Text';

// Repertoire-Seite, Runde 16 „Tiefe“ (Serkan 15.11.2026): Umschalter Weiß/Schwarz, darunter eine
// Übersicht (Stellungen, fällig, gelernt) und je Eröffnung eine Karte mit Mini-Brett, Status und
// zweifarbigem Lernbalken. Am Ende eine Karte „Eröffnung hinzufügen“ zusätzlich zum Plus oben.
const BRETT = 64;

async function laden(sql: Sql) {
  const [liste, einstellungen] = await Promise.all([
    repertoireUebersicht(sql),
    einstellungenLaden(sql),
  ]);
  return { liste, figurensatz: einstellungen.figurensatz };
}

const prozent = (teil: number, ganz: number) => (ganz === 0 ? 0 : Math.round((teil / ganz) * 100));

export function RepertoireSeite() {
  const KARTE = useKarte().karte;
  const F = useFarben();
  const stile = useStile();
  const daten = useGeladen(laden);
  const [seite, setSeite] = useState<Seite>('weiss');
  const liste = daten?.liste.filter((r) => r.seite === seite) ?? [];
  const anzahl = (s: Seite) => daten?.liste.filter((r) => r.seite === s).length;
  const hinzufuegen = () => router.push('/import');
  const summe = (feld: 'stellungen' | 'faellig' | 'gelernt') =>
    liste.reduce((n, r) => n + r.fortschritt[feld], 0);

  return (
    <ScrollView style={stile.seite} contentContainerStyle={stile.inhalt}>
      <Glanz />
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
      {daten && liste.length > 0 && (
        <View style={[KARTE, stile.uebersicht]}>
          <Kennzahl wert={String(summe('stellungen'))} titel="Stellungen" />
          <View style={stile.teiler} />
          <Kennzahl
            wert={String(summe('faellig'))}
            titel="fällig"
            farbe={summe('faellig') > 0 ? F.hinweis : F.text}
          />
          <View style={stile.teiler} />
          <Kennzahl wert={`${prozent(summe('gelernt'), summe('stellungen'))} %`} titel="gelernt" />
        </View>
      )}
      <View style={stile.liste}>
        {daten && liste.map((r) => <Karte key={r.id} rep={r} figurensatz={daten.figurensatz} />)}
        {daten && (
          <Federnd
            onPress={hinzufuegen}
            accessibilityRole="button"
            accessibilityLabel="Eröffnung hinzufügen"
            style={stile.hinzufuegen}
          >
            <Zeichen name="plus" farbe={F.akzentHell} groesse={20} />
            <Text style={stile.hinzufuegenText}>
              {liste.length === 0
                ? `Erste Eröffnung mit ${seite === 'weiss' ? 'Weiß' : 'Schwarz'} hinzufügen`
                : 'Eröffnung hinzufügen'}
            </Text>
          </Federnd>
        )}
      </View>
    </ScrollView>
  );
}

function Kennzahl({ wert, titel, farbe }: { wert: string; titel: string; farbe?: string }) {
  const F = useFarben();
  const stile = useStile();
  return (
    <View style={stile.kennzahl} accessible accessibilityLabel={`${wert} ${titel}`}>
      <Text
        style={[stile.kennzahlWert, ZIFFERN_GLEICH, { color: farbe ?? F.text }]}
        numberOfLines={1}
      >
        {wert}
      </Text>
      <Text style={stile.kennzahlTitel} numberOfLines={1} adjustsFontSizeToFit>
        {titel}
      </Text>
    </View>
  );
}

function Karte({ rep, figurensatz }: { rep: RepertoireUebersicht; figurensatz: Figurensatz }) {
  const KARTE = useKarte().karte;
  const F = useFarben();
  const stile = useStile();
  const { faellig, neu, gelernt, sicher, stellungen } = rep.fortschritt;
  const fertig = faellig + neu === 0;
  const status = faellig > 0 ? `${faellig} fällig` : neu > 0 ? `${neu} neu` : 'alles gelernt';
  const statusFarbe = faellig > 0 ? F.hinweis : neu > 0 ? F.akzentHell : F.richtig;
  const anteil = prozent(gelernt, stellungen);
  return (
    <Federnd
      onPress={() => router.push({ pathname: '/eroeffnung/[id]', params: { id: String(rep.id) } })}
      accessibilityRole="button"
      accessibilityLabel={`${rep.name}, ${status}, ${gelernt} von ${stellungen} gelernt, ${sicher} sicher`}
      style={[KARTE, stile.karte]}
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
      <View style={stile.text}>
        <Text style={stile.name} numberOfLines={1}>
          {rep.name}
        </Text>
        <Text style={stile.leise} numberOfLines={1}>
          {stellungen === 1 ? '1 Stellung' : `${stellungen} Stellungen`}
          {' · '}
          <Text style={[stile.status, { color: statusFarbe }]}>{status}</Text>
        </Text>
        <View style={stile.balkenZeile}>
          <View style={stile.balken}>
            <Lernbalken stellungen={stellungen} gelernt={gelernt} sicher={sicher} hoehe={5} />
          </View>
          <Text
            style={[stile.prozent, ZIFFERN_GLEICH, fertig && { color: F.richtig }]}
            maxFontSizeMultiplier={1.3}
          >
            {anteil} %
          </Text>
        </View>
      </View>
    </Federnd>
  );
}

const useStile = stileErstellen((F) => ({
  seite: { flex: 1, backgroundColor: F.hintergrund },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32 },
  plusKnopf: { marginBottom: 2 },
  uebersicht: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 18,
  },
  kennzahl: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 6 },
  kennzahlWert: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  kennzahlTitel: { color: F.textLeise, fontSize: 12.5 },
  teiler: { width: 1, alignSelf: 'stretch', backgroundColor: F.rand },
  liste: { marginTop: 14, gap: 12 },
  karte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    paddingRight: 16,
    borderRadius: 20,
  },
  brett: { borderRadius: 10, overflow: 'hidden' },
  text: { flex: 1, gap: 4 },
  name: { color: F.text, fontSize: 17, fontWeight: '700' },
  leise: { color: F.textLeise, fontSize: 13 },
  status: { fontWeight: '700' },
  balkenZeile: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  balken: { flex: 1 },
  prozent: {
    color: F.text,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 38,
    textAlign: 'right',
  },
  hinzufuegen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 64,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: F.linie,
  },
  hinzufuegenText: { color: F.akzentHell, fontSize: 15, fontWeight: '600', flexShrink: 1 },
}));
