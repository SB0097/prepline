import {
  aktuellerSchritt,
  type Brettzug,
  eigenerZug,
  type Feld,
  felderAusUci,
  gegnerZiehen,
  type Runde,
  rundeFertig,
  rundenFortschritt,
  rundeStarten,
  sanAufDeutsch,
  type Schritt,
  tippNehmen,
} from '@prepline/shared';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useDatenbank } from '@/daten/DatenAnbieter';
import { Knopf, RUNDUNG, zurueck } from '@/ui/bausteine';
import { type Feldmarkierung, Schachbrett } from '@/ui/brett/Schachbrett';
import { FARBEN } from '@/ui/farben';

import {
  ereignisSpeichern,
  trainingVorbereiten,
  type Trainingsteil,
  type Trainingsvorbereitung,
} from './trainingDaten';

// Trainingsbildschirm (Skizze Variante 1 + Zugliste auf Antippen, Rückmeldungen grün/rot/gelb,
// Tipp-Knopf; Serkan 11.11.2026). Der „Warum?“-Knopf kommt mit den offiziellen Eröffnungen (M7).

type Anzeige =
  | { art: 'richtig'; fen: string; felder: [Feld, Feld] }
  | { art: 'falsch' | 'alternative'; felder: [Feld, Feld]; san: string };

/** So lange bleibt „Richtig“ stehen, bevor es weitergeht. */
const RICHTIG_PAUSE = 700;
const KEINE_TEILE: readonly Trainingsteil[] = [];

/** Kurze Pause, bevor der Gegner zieht. */
const GEGNER_PAUSE = 450;

const MARKIERUNG = {
  richtig: 'rgba(61, 214, 140, 0.55)',
  falsch: 'rgba(255, 107, 107, 0.6)',
  alternative: 'rgba(245, 181, 74, 0.6)',
};

/** Wo die Runde steht: welches Repertoire, welche Runde, wie viel schon erledigt ist. */
type Ablauf = { teilIndex: number; runde: Runde | null; erledigtVorher: number };

function teilStarten(teil: Trainingsteil): Runde {
  return rundeStarten(teil.rep.baum, teil.rep.seite, teil.karten, teil.plan);
}

/** Neue Runde übernehmen; ist sie fertig, geht es mit dem nächsten Repertoire weiter. */
function uebernehmen(ablauf: Ablauf, runde: Runde, teile: readonly Trainingsteil[]): Ablauf {
  if (!rundeFertig(runde)) return { ...ablauf, runde };
  const erledigtVorher = ablauf.erledigtVorher + rundenFortschritt(runde).erledigt;
  const naechster = teile[ablauf.teilIndex + 1];
  if (!naechster) return { teilIndex: ablauf.teilIndex, runde: null, erledigtVorher };
  return { teilIndex: ablauf.teilIndex + 1, runde: teilStarten(naechster), erledigtVorher };
}

export function TrainingSeite() {
  const db = useDatenbank();
  const breite = useWindowDimensions().width;
  const [vorbereitung, setVorbereitung] = useState<Trainingsvorbereitung | null>(null);
  const [ablauf, setAblauf] = useState<Ablauf>({ teilIndex: 0, runde: null, erledigtVorher: 0 });
  const [fehler, setFehler] = useState(0);
  const [anzeige, setAnzeige] = useState<Anzeige | null>(null);
  const [tippFeld, setTippFeld] = useState<Feld | null>(null);
  const [zuegeOffen, setZuegeOffen] = useState(false);

  // Tagesplan laden und die erste Runde starten.
  useEffect(() => {
    if (db.status !== 'bereit') return;
    let aktiv = true;
    void trainingVorbereiten(db.sql).then((v) => {
      if (!aktiv) return;
      setVorbereitung(v);
      const erster = v.teile[0];
      if (erster) setAblauf({ teilIndex: 0, runde: teilStarten(erster), erledigtVorher: 0 });
    });
    return () => {
      aktiv = false;
    };
  }, [db]);

  const teile = vorbereitung?.teile ?? KEINE_TEILE;
  const { runde, teilIndex, erledigtVorher } = ablauf;
  const teil = teile[teilIndex];
  const schritt = runde ? aktuellerSchritt(runde) : null;

  // Gegnerzug automatisch spielen.
  useEffect(() => {
    if (!runde || schritt?.art !== 'gegner' || anzeige) return;
    const zeit = setTimeout(
      () => setAblauf((a) => uebernehmen(a, gegnerZiehen(runde), teile)),
      GEGNER_PAUSE,
    );
    return () => clearTimeout(zeit);
  }, [runde, schritt, anzeige, teile]);

  const gesamt = teile.reduce((n, t) => n + t.plan.faellig.length + t.plan.neu.length, 0);
  const erledigt = erledigtVorher + (runde ? rundenFortschritt(runde).erledigt : 0);

  if (!vorbereitung) return <SafeAreaView style={stile.seite} />;
  if (!runde || !teil || !schritt) {
    return <FertigAnsicht geuebt={erledigt} fehler={fehler} />;
  }

  const einstellungen = vorbereitung.einstellungen;
  const vibrieren = (muster: number | number[]) => {
    if (einstellungen.vibration) Vibration.vibrate(muster);
  };

  const zugGespielt = (zug: Brettzug) => {
    if (db.status !== 'bereit') return;
    const ergebnis = eigenerZug(runde, zug.san);
    for (const e of ergebnis.ereignisse) {
      void ereignisSpeichern(db.sql, teil, e);
      if (e.art === 'bewertet' && !e.richtig) setFehler((n) => n + 1);
    }
    setTippFeld(null);
    const felder = felderAusUci(zug.uci);
    if (ergebnis.rueckmeldung === 'richtig') {
      vibrieren(20);
      setAnzeige({ art: 'richtig', fen: zug.fen, felder });
      setTimeout(() => {
        setAnzeige(null);
        setAblauf((a) => uebernehmen(a, ergebnis.runde, teile));
      }, RICHTIG_PAUSE);
    } else {
      if (ergebnis.rueckmeldung === 'falsch') vibrieren([0, 40, 80, 40]);
      setAnzeige({ art: ergebnis.rueckmeldung, felder, san: zug.san });
      setAblauf((a) => uebernehmen(a, ergebnis.runde, teile));
    }
  };

  const tipp = () => {
    const ergebnis = tippNehmen(runde);
    if (!ergebnis) return;
    setAblauf((a) => ({ ...a, runde: ergebnis.runde }));
    setTippFeld(ergebnis.feld as Feld);
  };

  const vorher = runde.linie[runde.index - 1];
  const zeigtZug = (schritt.art === 'neu' || runde.nachspielen) && anzeige?.art !== 'richtig';
  const markierungen: Feldmarkierung[] = [
    ...(anzeige ? anzeige.felder.map((feld) => ({ feld, farbe: MARKIERUNG[anzeige.art] })) : []),
    ...(tippFeld ? [{ feld: tippFeld, farbe: FARBEN.brettMarkierung }] : []),
  ];
  const kommentar = anzeige?.art === 'richtig' ? schritt.kommentar : vorher?.kommentar;
  const eigenerSchritt = schritt.art !== 'gegner';

  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.kopf}>
        <Pressable
          onPress={zurueck}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Training beenden"
          style={stile.kopfSeite}
        >
          <Text style={stile.schliessen}>×</Text>
        </Pressable>
        <Text style={stile.titel} numberOfLines={1}>
          {teil.rep.name}
        </Text>
        <Text style={[stile.kopfSeite, stile.zaehler]} testID="fortschritt">
          {Math.min(erledigt + 1, gesamt)} / {gesamt}
        </Text>
      </View>
      <View style={stile.balken}>
        <View style={[stile.balkenVoll, { width: `${gesamt ? (erledigt / gesamt) * 100 : 0}%` }]} />
      </View>

      <ScrollView contentContainerStyle={stile.inhalt}>
        <View style={stile.brett}>
          <Schachbrett
            fen={anzeige?.art === 'richtig' ? anzeige.fen : schritt.fen}
            groesse={breite - 20}
            ansicht={teil.rep.seite}
            figurensatz={einstellungen.figurensatz}
            {...(anzeige?.art !== 'richtig' && vorher && { letzterZug: vorher.uci })}
            markierungen={markierungen}
            {...(zeigtZug && { pfeil: schritt.uci })}
            bedienbar={eigenerSchritt && anzeige?.art !== 'richtig'}
            onZug={zugGespielt}
          />
        </View>

        <Pressable
          onPress={() => setZuegeOffen(!zuegeOffen)}
          accessibilityRole="button"
          style={stile.zuegeKnopf}
        >
          <Text style={stile.zuegeKnopfText}>
            {zuegeOffen ? 'Züge ausblenden ▴' : 'Züge anzeigen ▾'}
          </Text>
        </Pressable>
        {zuegeOffen && <Zugliste schritte={runde.linie.slice(0, runde.index)} />}

        <Meldung schritt={schritt} anzeige={anzeige} seite={teil.rep.seite} />
        {kommentar ? <Text style={stile.kommentar}>{kommentar}</Text> : null}
      </ScrollView>

      <View style={stile.unten}>
        {eigenerSchritt && schritt.art !== 'neu' && !runde.nachspielen && (
          <Pressable
            onPress={tipp}
            disabled={runde.tipp || anzeige?.art === 'richtig'}
            accessibilityRole="button"
            style={[stile.tipp, runde.tipp && { opacity: 0.4 }]}
          >
            <Text style={stile.tippText}>Tipp</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

/** Zug mit Nummer in deutscher Notation, z. B. „4. b4“ oder „3… Lc5“. */
function zugText(schritt: Schritt): string {
  const [, farbe, , , , nummer] = schritt.fen.split(' ');
  return `${nummer ?? ''}${farbe === 'b' ? '…' : '.'} ${sanAufDeutsch(schritt.san)}`;
}

function Meldung({
  schritt,
  anzeige,
  seite,
}: {
  schritt: Schritt;
  anzeige: Anzeige | null;
  seite: 'weiss' | 'schwarz';
}) {
  const amZug = seite === 'weiss' ? 'Weiß am Zug' : 'Schwarz am Zug';
  if (anzeige?.art === 'richtig') {
    return (
      <Rueckmeldung
        farbe={FARBEN.richtig}
        zeichen="haken"
        titel="Richtig"
        text="Weiter geht’s gleich automatisch"
      />
    );
  }
  if (anzeige?.art === 'falsch') {
    return (
      <Rueckmeldung
        farbe={FARBEN.falsch}
        zeichen="kreuz"
        titel="Nicht ganz"
        text={`Richtig ist ${zugText(schritt)} · zieh ihn jetzt nach`}
      />
    );
  }
  if (anzeige?.art === 'alternative') {
    return (
      <Rueckmeldung
        farbe={FARBEN.hinweis}
        zeichen="ausruf"
        titel="Nicht dein Hauptzug"
        text={`${sanAufDeutsch(anzeige.san)} ist auch spielbar · versuch’s nochmal`}
      />
    );
  }
  if (schritt.art === 'gegner') {
    return (
      <View style={stile.meldung}>
        <Text style={[stile.meldungTitel, { color: FARBEN.textLeise }]}>Gegner zieht …</Text>
      </View>
    );
  }
  const titel = schritt.art === 'neu' ? 'Neuer Zug' : 'Dein Zug';
  const text =
    schritt.art === 'neu'
      ? `Spiel ${zugText(schritt)} – der Pfeil zeigt ihn dir`
      : schritt.art === 'abfrage'
        ? `${amZug} · Wiederholung`
        : amZug;
  return (
    <View style={stile.meldung}>
      <Text style={stile.meldungTitel}>{titel}</Text>
      <Text style={stile.meldungText}>{text}</Text>
    </View>
  );
}

function Rueckmeldung({
  farbe,
  zeichen,
  titel,
  text,
}: {
  farbe: string;
  zeichen: 'haken' | 'kreuz' | 'ausruf';
  titel: string;
  text: string;
}) {
  const pfad = {
    haken: 'M6 12.5l4 4L18 8.5',
    kreuz: 'M8 8l8 8M16 8l-8 8',
    ausruf: 'M12 6.5v7M12 17.5v0.01',
  }[zeichen];
  return (
    <View style={[stile.meldung, stile.rueckmeldung]} accessibilityLiveRegion="polite">
      <View style={[stile.kreis, { backgroundColor: farbe }]}>
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path
            d={pfad}
            stroke={FARBEN.hintergrund}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
      <View style={stile.rueckmeldungText}>
        <Text style={[stile.meldungTitel, { color: farbe }]}>{titel}</Text>
        <Text style={stile.meldungText}>{text}</Text>
      </View>
    </View>
  );
}

function Zugliste({ schritte }: { schritte: readonly Schritt[] }) {
  if (schritte.length === 0) return <Text style={stile.zuglisteLeer}>Noch keine Züge</Text>;
  return (
    <View style={stile.zugliste}>
      {schritte.map((s, i) => {
        const [, farbe] = s.fen.split(' ');
        const text = farbe === 'w' || i === 0 ? zugText(s) : sanAufDeutsch(s.san);
        return (
          <View key={i} style={stile.zugPille}>
            <Text style={stile.zugPilleText}>{text}</Text>
          </View>
        );
      })}
    </View>
  );
}

function FertigAnsicht({ geuebt, fehler }: { geuebt: number; fehler: number }) {
  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.fertig}>
        <View style={stile.fertigKreis}>
          <Svg width={54} height={54} viewBox="0 0 24 24">
            <Path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke={FARBEN.richtig}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={stile.fertigTitel}>
          {geuebt === 0 ? 'Heute ist nichts mehr dran' : 'Für heute geschafft'}
        </Text>
        {geuebt > 0 && (
          <Text style={stile.meldungText}>
            {geuebt === 1 ? '1 Stellung geübt' : `${geuebt} Stellungen geübt`}
            {fehler > 0 ? ` · ${fehler} Fehler` : ' · ohne Fehler'}
          </Text>
        )}
      </View>
      <View style={stile.fertigKnopf}>
        <Knopf titel="Fertig" onPress={zurueck} />
      </View>
    </SafeAreaView>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund, paddingBottom: 16 },
  kopf: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  kopfSeite: { width: 56 },
  schliessen: { color: FARBEN.textLeise, fontSize: 30, lineHeight: 32 },
  titel: { flex: 1, textAlign: 'center', color: FARBEN.text, fontSize: 17, fontWeight: '700' },
  zaehler: { color: FARBEN.textLeise, fontSize: 14, textAlign: 'right' },
  balken: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: FARBEN.linie,
    marginHorizontal: 20,
    marginTop: 12,
    overflow: 'hidden',
  },
  balkenVoll: { height: 5, borderRadius: 2.5, backgroundColor: FARBEN.akzent },
  inhalt: { paddingBottom: 16 },
  brett: { marginHorizontal: 10, marginTop: 16 },
  zuegeKnopf: {
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: FARBEN.karte,
  },
  zuegeKnopfText: { color: FARBEN.textLeise, fontSize: 13 },
  zugliste: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: 20, marginTop: 10 },
  zuglisteLeer: { color: FARBEN.textLeise, fontSize: 14, marginHorizontal: 20, marginTop: 10 },
  zugPille: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: FARBEN.karte,
  },
  zugPilleText: { color: FARBEN.text, fontSize: 13 },
  meldung: { marginHorizontal: 24, marginTop: 20, gap: 4 },
  rueckmeldung: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20 },
  rueckmeldungText: { flex: 1, gap: 2 },
  kreis: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meldungTitel: { color: FARBEN.text, fontSize: 22, fontWeight: '700' },
  meldungText: { color: FARBEN.textLeise, fontSize: 14 },
  kommentar: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: FARBEN.karte,
    color: FARBEN.text,
    fontSize: 14,
    lineHeight: 20,
  },
  unten: { flexDirection: 'row', paddingHorizontal: 20, minHeight: 44 },
  tipp: {
    borderWidth: 2,
    borderColor: FARBEN.linie,
    borderRadius: RUNDUNG,
    paddingHorizontal: 26,
    paddingVertical: 10,
  },
  tippText: { color: FARBEN.text, fontSize: 15 },
  fertig: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  fertigKreis: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(61, 214, 140, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  fertigKnopf: { marginHorizontal: 20 },
  fertigTitel: { color: FARBEN.text, fontSize: 24, fontWeight: '700' },
});
