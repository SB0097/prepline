import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

import { useGeladen } from '@/daten/useGeladen';
import { KARTE, Knopf, Seitenpunkt, SeitenTitel } from '@/ui/bausteine';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { FARBEN } from '@/ui/farben';
import { Zeichen } from '@/ui/symbole';

import { heuteLaden } from './heuteDaten';

// Startseite (Skizze Graphit, 12.11.2026): Ring mit den Zügen für heute, Knopf „Training starten“,
// Serie oben rechts, Karte „Weiter mit“ und der Fortschritt für Weiß und Schwarz.
export function HeuteSeite() {
  const daten = useGeladen(heuteLaden);
  const datum = new Date().toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  if (!daten) return <View style={stile.seite} />;
  const gesamt = daten.wiederholungen + daten.neu;
  const anteil = gesamt === 0 ? 1 : daten.erledigt / (daten.erledigt + gesamt);
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
              <Zeichen name="flamme" farbe={FARBEN.serie} groesse={20} />
              <Text style={stile.serieText} testID="serie">
                {daten.serie === 1 ? '1 Tag' : `${daten.serie} Tage`}
              </Text>
            </View>
          ) : undefined
        }
      />
      {daten.anzahlRepertoires === 0 ? (
        <View style={[stile.haupt, stile.leer]}>
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
        <View style={stile.haupt}>
          <Ring anteil={anteil}>
            {gesamt > 0 ? (
              <>
                <Text style={stile.zahl} testID="zuege-heute">
                  {gesamt}
                </Text>
                <Text style={stile.zahlText}>{gesamt === 1 ? 'Zug heute' : 'Züge heute'}</Text>
              </>
            ) : (
              <>
                <Zeichen name="haken" farbe={FARBEN.richtig} groesse={46} />
                <Text style={stile.zahlText}>Geschafft</Text>
              </>
            )}
          </Ring>
          {gesamt > 0 && (
            <View style={stile.chips}>
              <Chip
                farbe={FARBEN.text}
                text={`${daten.wiederholungen} ${daten.wiederholungen === 1 ? 'Wiederholung' : 'Wiederholungen'}`}
              />
              <Chip farbe={FARBEN.akzent} text={`${daten.neu} neu`} />
            </View>
          )}
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
          <Text style={stile.abschnitt}>WEITER MIT</Text>
          <Pressable
            onPress={() =>
              router.push({ pathname: '/training', params: { id: String(weiter.id) } })
            }
            accessibilityRole="button"
            accessibilityLabel={`Nur ${weiter.name} trainieren`}
            style={({ pressed }) => [stile.weiter, pressed && { opacity: 0.85 }]}
          >
            <View style={stile.weiterBrett}>
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
                {'  ·  '}
                <Text style={stile.akzent}>
                  {weiter.faellig > 0 ? `${weiter.faellig} fällig` : `${weiter.neu} neu`}
                </Text>
              </Text>
            </View>
            <View style={stile.weiterKnopf}>
              <Zeichen name="start" farbe={FARBEN.akzent} groesse={18} />
            </View>
          </Pressable>
        </>
      )}

      <View style={stile.reihe}>
        <Seitenkarte seite="weiss" prozent={daten.sicher.weiss} />
        <Seitenkarte seite="schwarz" prozent={daten.sicher.schwarz} />
      </View>
    </ScrollView>
  );
}

const RING = { breite: 260, hoehe: 190, radius: 70, strich: 13 };

/** Fortschrittsring mit sanftem Leuchten dahinter; der Inhalt steht in der Mitte. */
function Ring({ anteil, children }: { anteil: number; children: ReactNode }) {
  const umfang = 2 * Math.PI * RING.radius;
  const cx = RING.breite / 2;
  const cy = RING.hoehe / 2;
  const teil = Math.max(0, Math.min(1, anteil));
  return (
    <View style={stile.ring}>
      <Svg width={RING.breite} height={RING.hoehe}>
        <Defs>
          <RadialGradient id="leuchten" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={FARBEN.akzent} stopOpacity={0.18} />
            <Stop offset="1" stopColor={FARBEN.akzent} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="bogen" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={FARBEN.akzent} />
            <Stop offset="1" stopColor={FARBEN.akzentHell} />
          </LinearGradient>
        </Defs>
        <Ellipse cx={cx} cy={cy} rx={cx} ry={cy} fill="url(#leuchten)" />
        <Circle
          cx={cx}
          cy={cy}
          r={RING.radius}
          fill="none"
          stroke={FARBEN.karteHell}
          strokeWidth={RING.strich}
        />
        {teil > 0 && (
          <Circle
            cx={cx}
            cy={cy}
            r={RING.radius}
            fill="none"
            stroke="url(#bogen)"
            strokeWidth={RING.strich}
            strokeLinecap="round"
            strokeDasharray={`${umfang * teil} ${umfang}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
      </Svg>
      <View style={stile.ringMitte}>{children}</View>
    </View>
  );
}

function Chip({ farbe, text }: { farbe: string; text: string }) {
  return (
    <View style={stile.chip}>
      <View style={[stile.chipPunkt, { backgroundColor: farbe }]} />
      <Text style={stile.chipText}>{text}</Text>
    </View>
  );
}

function Seitenkarte({ seite, prozent }: { seite: 'weiss' | 'schwarz'; prozent: number | null }) {
  return (
    <View style={stile.klein}>
      <View style={stile.kleinKopf}>
        <Seitenpunkt seite={seite} />
        <Text style={stile.kleinTitel}>{seite === 'weiss' ? 'Weiß' : 'Schwarz'}</Text>
      </View>
      <View style={stile.kleinZeile}>
        <Text style={stile.kleinWert}>{prozent === null ? '–' : `${prozent} %`}</Text>
        {prozent !== null && <Text style={stile.leise}>sicher</Text>}
      </View>
      <View style={stile.balken}>
        <View style={[stile.balkenVoll, { width: `${prozent ?? 0}%` }]} />
      </View>
    </View>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  inhalt: { paddingHorizontal: 16, paddingBottom: 32 },
  serie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FARBEN.karte,
    borderColor: FARBEN.linie,
    borderWidth: 1,
    borderRadius: 19,
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 8,
    marginBottom: 2,
  },
  serieText: { color: FARBEN.text, fontSize: 14, fontWeight: '700' },
  haupt: { ...KARTE, borderRadius: 30, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
  leer: { paddingTop: 24, paddingHorizontal: 22, gap: 6 },
  ring: { alignSelf: 'center', width: RING.breite, height: RING.hoehe },
  ringMitte: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  zahl: { color: FARBEN.text, fontSize: 56, lineHeight: 62, fontWeight: '700' },
  zahlText: { color: FARBEN.textLeise, fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 18 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: FARBEN.karteHell,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipPunkt: { width: 8, height: 8, borderRadius: 4 },
  chipText: { color: FARBEN.text, fontSize: 13, fontWeight: '600' },
  leerTitel: { color: FARBEN.text, fontSize: 20, fontWeight: '700' },
  leerText: { color: FARBEN.textLeise, fontSize: 15, lineHeight: 21, marginBottom: 16 },
  abschnitt: {
    color: FARBEN.textLeise,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 26,
    marginBottom: 10,
    marginLeft: 8,
  },
  weiter: { ...KARTE, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10 },
  weiterBrett: { borderRadius: 8, overflow: 'hidden' },
  weiterText: { flex: 1, gap: 3 },
  weiterName: { color: FARBEN.text, fontSize: 17, fontWeight: '700' },
  weiterKnopf: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 6,
    backgroundColor: FARBEN.karteHell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leise: { color: FARBEN.textLeise, fontSize: 13 },
  akzent: { color: FARBEN.akzent, fontWeight: '700' },
  reihe: { flexDirection: 'row', gap: 12, marginTop: 14 },
  klein: { ...KARTE, flex: 1, paddingHorizontal: 18, paddingVertical: 16, gap: 6 },
  kleinKopf: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kleinTitel: { color: FARBEN.textLeise, fontSize: 13, fontWeight: '600' },
  kleinZeile: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  kleinWert: { color: FARBEN.text, fontSize: 24, fontWeight: '700' },
  balken: { height: 5, borderRadius: 2.5, backgroundColor: FARBEN.karteHell, overflow: 'hidden' },
  balkenVoll: { height: 5, borderRadius: 2.5, backgroundColor: FARBEN.akzent },
});
