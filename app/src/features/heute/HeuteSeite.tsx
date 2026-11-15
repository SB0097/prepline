import type { Seite } from '@prepline/shared';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useGeladen } from '@/daten/useGeladen';
import {
  Abschnitt,
  Federnd,
  Glanz,
  KARTE,
  Knopf,
  Lernbalken,
  RUNDUNG,
  Seitenpunkt,
  SeitenTitel,
  Verlauf,
} from '@/ui/bausteine';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { FARBEN } from '@/ui/farben';
import { Zeichen } from '@/ui/symbole';
import { Text, ZIFFERN_GLEICH } from '@/ui/Text';

import { heuteLaden, type Seitenstand } from './heuteDaten';

// Startseite, Runde 16 „Tiefe“ (Serkan 15.11.2026): Hauptkarte mit der Zahl der Züge für heute,
// Ring für den Lernfortschritt, Wiederholungen/neu und dem Knopf „Training starten“.
// Darunter „Weiter mit“, „Diese Woche“ (Übungstage) und der Fortschritt für Weiß und Schwarz.
const WOCHENTAGE = ['M', 'D', 'M', 'D', 'F', 'S', 'S'];
const WOCHENTAGE_LANG = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
];

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
  const beide = zusammen(daten.stand.weiss, daten.stand.schwarz);

  return (
    <ScrollView style={stile.seite} contentContainerStyle={stile.inhalt}>
      <Glanz />
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
        <View style={[KARTE, stile.leer]}>
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
        <View style={[KARTE, stile.haupt]}>
          {/* Verlauf von oben hell nach unten dunkel, darüber die Lichtkante. */}
          <View style={stile.hauptVerlauf} pointerEvents="none">
            <Verlauf senkrecht von={FARBEN.karteOben} bis={FARBEN.karte} />
          </View>
          <View style={stile.lichtkante} pointerEvents="none" />
          <View style={stile.hauptZeile}>
            <View style={stile.hauptLinks}>
              <Text style={stile.marke}>HEUTE DRAN</Text>
              {gesamt > 0 ? (
                <Text style={[stile.zahl, ZIFFERN_GLEICH]} testID="zuege-heute">
                  {gesamt}
                </Text>
              ) : (
                <View style={stile.geschafft}>
                  <Zeichen name="haken" farbe={FARBEN.richtig} groesse={40} />
                </View>
              )}
              <Text style={stile.zahlUnter}>
                {gesamt === 0
                  ? 'Geschafft für heute'
                  : gesamt === 1
                    ? 'Zug für heute'
                    : 'Züge für heute'}
              </Text>
            </View>
            {beide && <LernRing stand={beide} />}
          </View>
          <View style={stile.pillen}>
            {daten.wiederholungen > 0 && (
              <Pille farbe={FARBEN.hinweis} text={`${daten.wiederholungen} wiederholen`} />
            )}
            {daten.neu > 0 && <Pille farbe={FARBEN.akzent} text={`${daten.neu} neu`} />}
            {daten.erledigt > 0 && (
              <Pille farbe={FARBEN.richtig} text={`${daten.erledigt} erledigt`} />
            )}
          </View>
          <Knopf
            titel={gesamt > 0 ? 'Training starten' : 'Für heute alles erledigt'}
            {...(gesamt > 0 && { symbol: 'start' as const })}
            onPress={() => router.push('/training')}
            aus={gesamt === 0}
          />
        </View>
      )}

      {weiter && (
        <>
          <Abschnitt titel="Weiter mit" />
          <Federnd
            onPress={() =>
              router.push({ pathname: '/training', params: { id: String(weiter.id) } })
            }
            accessibilityRole="button"
            accessibilityLabel={`Nur ${weiter.name} trainieren`}
            style={[KARTE, stile.weiter]}
          >
            <View style={stile.miniBrett}>
              <Schachbrett
                fen={weiter.endFen}
                groesse={52}
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
              <Zeichen name="start" farbe={FARBEN.text} groesse={16} />
            </View>
          </Federnd>
        </>
      )}

      {daten.anzahlRepertoires > 0 && (
        <>
          <Abschnitt titel="Diese Woche" />
          <Woche woche={daten.woche} wochentag={daten.wochentag} />
          <Abschnitt titel="Fortschritt" />
          <View style={stile.seiten}>
            <Seitenkarte seite="weiss" stand={daten.stand.weiss} />
            <Seitenkarte seite="schwarz" stand={daten.stand.schwarz} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function zusammen(a: Seitenstand | null, b: Seitenstand | null): Seitenstand | null {
  if (!a) return b;
  if (!b) return a;
  return {
    stellungen: a.stellungen + b.stellungen,
    gelernt: a.gelernt + b.gelernt,
    sicher: a.sicher + b.sicher,
  };
}

const prozent = (teil: number, ganz: number) => (ganz === 0 ? 0 : Math.round((teil / ganz) * 100));

function Pille({ farbe, text }: { farbe: string; text: string }) {
  return (
    <View style={stile.pille}>
      <View style={[stile.pillePunkt, { backgroundColor: farbe }]} />
      <Text style={stile.pilleText}>{text}</Text>
    </View>
  );
}

const RING = { groesse: 92, strich: 9 };

/** Ring wie der Lernbalken: hell = gelernt, kräftig = sicher. In der Mitte der Anteil gelernt. */
function LernRing({ stand }: { stand: Seitenstand }) {
  const r = (RING.groesse - RING.strich) / 2;
  const mitte = RING.groesse / 2;
  const umfang = 2 * Math.PI * r;
  const gelernt = prozent(stand.gelernt, stand.stellungen);
  const sicher = prozent(stand.sicher, stand.stellungen);
  const bogen = (anteil: number, farbe: string) =>
    anteil > 0 && (
      <Circle
        cx={mitte}
        cy={mitte}
        r={r}
        fill="none"
        stroke={farbe}
        strokeWidth={RING.strich}
        strokeLinecap="round"
        strokeDasharray={`${(umfang * anteil) / 100} ${umfang}`}
        transform={`rotate(-90 ${mitte} ${mitte})`}
      />
    );
  return (
    <View
      style={stile.ring}
      accessible
      accessibilityLabel={`${stand.gelernt} von ${stand.stellungen} Zügen gelernt, ${stand.sicher} sicher`}
    >
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
        {bogen(gelernt, FARBEN.gelernt)}
        {bogen(sicher, 'url(#ring)')}
      </Svg>
      <View style={stile.ringMitte}>
        <Text style={[stile.ringZahl, ZIFFERN_GLEICH]} maxFontSizeMultiplier={1.2}>
          {gelernt} %
        </Text>
        <Text style={stile.ringText} maxFontSizeMultiplier={1.2}>
          gelernt
        </Text>
      </View>
    </View>
  );
}

function Woche({ woche, wochentag }: { woche: boolean[]; wochentag: number }) {
  const geuebt = woche.filter(Boolean).length;
  return (
    <View
      style={[KARTE, stile.woche]}
      accessible
      accessibilityLabel={`Diese Woche an ${geuebt} von ${wochentag + 1} Tagen geübt: ${woche
        .map((g, i) => (g ? WOCHENTAGE_LANG[i] : null))
        .filter(Boolean)
        .join(', ')}`}
    >
      {WOCHENTAGE.map((tag, i) => {
        const heute = i === wochentag;
        const geuebtAnTag = woche[i];
        return (
          <View key={i} style={stile.tag}>
            <Text style={[stile.tagName, heute && { color: FARBEN.text }]}>{tag}</Text>
            <View
              style={[
                stile.tagKreis,
                heute && !geuebtAnTag && stile.tagHeute,
                i > wochentag && stile.tagSpaeter,
              ]}
            >
              {geuebtAnTag && (
                <>
                  <Verlauf schraeg />
                  <Zeichen name="haken" farbe={FARBEN.textAufAkzent} groesse={16} />
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Seitenkarte({ seite, stand }: { seite: Seite; stand: Seitenstand | null }) {
  const name = seite === 'weiss' ? 'Weiß' : 'Schwarz';
  return (
    <View
      style={[KARTE, stile.seitenkarte]}
      accessible
      accessibilityLabel={
        stand
          ? `${name}: ${stand.gelernt} von ${stand.stellungen} gelernt, ${stand.sicher} sicher`
          : `${name}: noch keine Eröffnung`
      }
    >
      <View style={stile.seitenKopf}>
        <Seitenpunkt seite={seite} groesse={11} />
        <Text style={stile.seitenName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[stile.seitenWert, ZIFFERN_GLEICH, !stand && { color: FARBEN.textLeise }]}>
          {stand ? `${prozent(stand.gelernt, stand.stellungen)} %` : '–'}
        </Text>
      </View>
      <Lernbalken
        stellungen={stand?.stellungen ?? 0}
        gelernt={stand?.gelernt ?? 0}
        sicher={stand?.sicher ?? 0}
        hoehe={5}
      />
      <Text style={stile.seitenUnter} numberOfLines={1} adjustsFontSizeToFit>
        {stand ? `${stand.gelernt} von ${stand.stellungen} gelernt` : 'noch nichts'}
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
  haupt: { padding: 20, gap: 16, marginTop: 4 },
  hauptVerlauf: { ...StyleSheet.absoluteFill, borderRadius: RUNDUNG, overflow: 'hidden' },
  lichtkante: {
    position: 'absolute',
    top: 0,
    left: RUNDUNG,
    right: RUNDUNG,
    height: 1,
    backgroundColor: FARBEN.lichtkante,
  },
  hauptZeile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hauptLinks: { flex: 1 },
  marke: { color: FARBEN.akzentHell, fontSize: 12, fontWeight: '700', letterSpacing: 1.3 },
  zahl: {
    color: FARBEN.text,
    fontSize: 64,
    lineHeight: 72,
    fontWeight: '800',
    letterSpacing: -2.5,
    marginTop: 2,
  },
  geschafft: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(61, 214, 140, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  zahlUnter: { color: FARBEN.textLeise, fontSize: 16 },
  ring: { width: RING.groesse, height: RING.groesse },
  ringMitte: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  ringZahl: { color: FARBEN.text, fontSize: 17, fontWeight: '800' },
  ringText: { color: FARBEN.textLeise, fontSize: 11 },
  pillen: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pille: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  pillePunkt: { width: 7, height: 7, borderRadius: 3.5 },
  pilleText: { color: FARBEN.text, fontSize: 13, fontWeight: '600' },
  leer: { gap: 6, padding: 20, marginTop: 4 },
  leerTitel: { color: FARBEN.text, fontSize: 22, fontWeight: '700' },
  leerText: { color: FARBEN.textLeise, fontSize: 15, lineHeight: 22, marginBottom: 18 },
  weiter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    paddingRight: 14,
    borderRadius: 18,
  },
  miniBrett: { borderRadius: 10, overflow: 'hidden' },
  weiterText: { flex: 1, gap: 4 },
  weiterName: { color: FARBEN.text, fontSize: 17, fontWeight: '700' },
  weiterKnopf: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FARBEN.karteHell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leise: { color: FARBEN.textLeise, fontSize: 14 },
  akzent: { color: FARBEN.akzentHell, fontWeight: '700' },
  woche: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
  },
  tag: { alignItems: 'center', gap: 8, flex: 1 },
  tagName: { color: FARBEN.textLeise, fontSize: 12, fontWeight: '600' },
  tagKreis: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: FARBEN.karteHell,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tagHeute: { borderWidth: 2, borderColor: FARBEN.akzent, backgroundColor: 'transparent' },
  tagSpaeter: { opacity: 0.5 },
  seiten: { flexDirection: 'row', gap: 12 },
  seitenkarte: { flex: 1, padding: 14, gap: 10, borderRadius: 18 },
  seitenKopf: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seitenName: { flex: 1, color: FARBEN.text, fontSize: 15, fontWeight: '600' },
  seitenWert: { color: FARBEN.text, fontSize: 15, fontWeight: '800' },
  seitenUnter: { color: FARBEN.textLeise, fontSize: 12.5 },
});
