import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useGeladen } from '@/daten/useGeladen';
import { Abschnitt, Balken, Knopf, Seitenpunkt, SeitenTitel, Verlauf } from '@/ui/bausteine';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { FARBEN } from '@/ui/farben';
import { Zeichen } from '@/ui/symbole';
import { Text } from '@/ui/Text';

import { heuteLaden } from './heuteDaten';

// Startseite (Layout „Ruhig & groß“, Serkan 14.11.2026): große Zahl der Züge für heute ohne Karte,
// darunter ein Balken aus erledigt / Wiederholungen / neu, der Knopf „Training starten“,
// „Weiter mit“ als Zeile und der Fortschritt für Weiß und Schwarz als Zeilen mit Balken.
export function HeuteSeite() {
  const daten = useGeladen(heuteLaden);
  const datum = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  if (!daten) return <View style={stile.seite} />;
  const gesamt = daten.wiederholungen + daten.neu;
  const weiter = daten.weiter;

  return (
    <ScrollView style={stile.seite} contentContainerStyle={stile.inhalt}>
      <SeitenTitel
        titel="Heute"
        oben={datum}
        rechts={
          daten.serie > 0 ? (
            <View
              style={stile.serie}
              accessible
              accessibilityLabel={`Serie: ${daten.serie} ${daten.serie === 1 ? 'Tag' : 'Tage'} in Folge`}
            >
              <Zeichen name="flamme" farbe={FARBEN.serie} groesse={18} />
              <Text style={stile.serieText} testID="serie">
                {daten.serie === 1 ? '1 Tag' : `${daten.serie} Tage`}
              </Text>
            </View>
          ) : undefined
        }
      />
      {daten.anzahlRepertoires === 0 ? (
        <View style={stile.leer}>
          <Text style={stile.leerTitel}>Noch keine Eröffnung</Text>
          <Text style={stile.leerText}>
            Füge eine Eröffnung hinzu, dann siehst du hier jeden Tag, was dran ist.
          </Text>
          <Knopf
            titel="Eröffnung hinzufügen"
            symbol="plus"
            onPress={() => router.push('/import')}
          />
        </View>
      ) : (
        <>
          <View style={stile.zahlZeile}>
            {gesamt > 0 ? (
              <Text style={stile.zahl} testID="zuege-heute">
                {gesamt}
              </Text>
            ) : (
              <View style={stile.geschafft}>
                <Zeichen name="haken" farbe={FARBEN.richtig} groesse={44} />
              </View>
            )}
            <View>
              <Text style={stile.zahlTitel}>
                {gesamt === 0 ? 'Geschafft' : gesamt === 1 ? 'Zug' : 'Züge'}
              </Text>
              <Text style={stile.zahlUnter}>für heute</Text>
            </View>
          </View>
          <Verteilung erledigt={daten.erledigt} wdh={daten.wiederholungen} neu={daten.neu} />
          <Knopf
            titel={gesamt > 0 ? 'Training starten' : 'Für heute alles erledigt'}
            {...(gesamt > 0 && { symbol: 'start' as const })}
            onPress={() => router.push('/training')}
            aus={gesamt === 0}
          />
        </>
      )}

      {weiter && (
        <>
          <Abschnitt titel="Weiter mit" />
          <Pressable
            onPress={() =>
              router.push({ pathname: '/training', params: { id: String(weiter.id) } })
            }
            accessibilityRole="button"
            accessibilityLabel={`Nur ${weiter.name} trainieren`}
            style={({ pressed }) => [stile.weiter, pressed && { opacity: 0.8 }]}
          >
            <View style={stile.miniBrett}>
              <Schachbrett
                fen={weiter.endFen}
                groesse={56}
                ansicht={weiter.seite}
                figurensatz={daten.figurensatz}
                bedienbar={false}
                koordinaten={false}
              />
            </View>
            <View style={stile.weiterText}>
              <Text style={stile.weiterName} numberOfLines={1}>
                {weiter.name}
              </Text>
              <Text style={stile.leise}>
                {weiter.seite === 'weiss' ? 'Weiß' : 'Schwarz'}
                {' · '}
                <Text style={stile.akzent}>
                  {weiter.faellig > 0 ? `${weiter.faellig} fällig` : `${weiter.neu} neu`}
                </Text>
              </Text>
            </View>
            <View style={stile.weiterKnopf}>
              <Zeichen name="start" farbe={FARBEN.text} groesse={18} />
            </View>
          </Pressable>
        </>
      )}

      {daten.anzahlRepertoires > 0 && (
        <>
          <Abschnitt titel="Fortschritt" />
          <Seitenzeile seite="weiss" prozent={daten.sicher.weiss} />
          <View style={stile.trenner} />
          <Seitenzeile seite="schwarz" prozent={daten.sicher.schwarz} />
        </>
      )}
    </ScrollView>
  );
}

/** Balken aus drei Teilen: schon erledigt (grün), Wiederholungen (hell) und neue Züge (Akzent). */
function Verteilung({ erledigt, wdh, neu }: { erledigt: number; wdh: number; neu: number }) {
  const teile = [
    { wert: erledigt, farbe: FARBEN.richtig, text: 'erledigt' },
    { wert: wdh, farbe: FARBEN.text, text: wdh === 1 ? 'Wiederholung' : 'Wiederholungen' },
    { wert: neu, farbe: FARBEN.akzent, text: 'neu' },
  ].filter((t) => t.wert > 0);
  if (teile.length === 0) return <View style={stile.verteilungLeer} />;
  return (
    <View style={stile.verteilung}>
      <View style={stile.verteilungBalken}>
        {teile.map((t) => (
          <View
            key={t.text}
            style={[stile.verteilungTeil, { flex: t.wert, backgroundColor: t.farbe }]}
          >
            {t.farbe === FARBEN.akzent && <Verlauf />}
          </View>
        ))}
      </View>
      <View style={stile.legende}>
        {teile.map((t) => (
          <View key={t.text} style={stile.legendeTeil}>
            <View style={[stile.legendePunkt, { backgroundColor: t.farbe }]} />
            <Text style={stile.leise}>
              {t.wert} {t.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Seitenzeile({ seite, prozent }: { seite: 'weiss' | 'schwarz'; prozent: number | null }) {
  const name = seite === 'weiss' ? 'Weiß' : 'Schwarz';
  return (
    <View
      style={stile.seitenzeile}
      accessible
      accessibilityLabel={`${name}: ${prozent === null ? 'noch nichts' : `${prozent} Prozent sicher`}`}
    >
      <Seitenpunkt seite={seite} groesse={12} />
      <Text style={stile.seitenName}>{name}</Text>
      <View style={stile.seitenBalken}>
        <Balken anteil={(prozent ?? 0) / 100} />
      </View>
      <Text style={[stile.seitenWert, prozent === null && { color: FARBEN.textLeise }]}>
        {prozent === null ? '–' : `${prozent} %`}
      </Text>
    </View>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32 },
  serie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FARBEN.karte,
    borderColor: FARBEN.linie,
    borderWidth: 1,
    borderRadius: 18,
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 7,
    marginBottom: 4,
  },
  serieText: { color: FARBEN.text, fontSize: 14, fontWeight: '700' },
  zahlZeile: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 8 },
  zahl: {
    color: FARBEN.text,
    fontSize: 96,
    lineHeight: 104,
    fontWeight: '800',
    letterSpacing: -4,
  },
  geschafft: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(61, 214, 140, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  zahlTitel: { color: FARBEN.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  zahlUnter: { color: FARBEN.textLeise, fontSize: 24, letterSpacing: -0.4 },
  verteilung: { marginTop: 14, marginBottom: 24, gap: 12 },
  verteilungLeer: { height: 24 },
  verteilungBalken: { flexDirection: 'row', gap: 4, height: 8 },
  verteilungTeil: { borderRadius: 4, overflow: 'hidden' },
  legende: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 6 },
  legendeTeil: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendePunkt: { width: 8, height: 8, borderRadius: 4 },
  leer: { gap: 6, paddingTop: 8 },
  leerTitel: { color: FARBEN.text, fontSize: 22, fontWeight: '700' },
  leerText: { color: FARBEN.textLeise, fontSize: 15, lineHeight: 22, marginBottom: 18 },
  weiter: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  miniBrett: { borderRadius: 10, overflow: 'hidden' },
  weiterText: { flex: 1, gap: 4 },
  weiterName: { color: FARBEN.text, fontSize: 17, fontWeight: '700' },
  weiterKnopf: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: FARBEN.karteHell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leise: { color: FARBEN.textLeise, fontSize: 14 },
  akzent: { color: FARBEN.akzent, fontWeight: '700' },
  seitenzeile: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  seitenName: { color: FARBEN.text, fontSize: 16, width: 72 },
  seitenBalken: { flex: 1 },
  seitenWert: {
    color: FARBEN.text,
    fontSize: 16,
    fontWeight: '700',
    width: 52,
    textAlign: 'right',
  },
  trenner: { height: 1, backgroundColor: FARBEN.rand },
});
