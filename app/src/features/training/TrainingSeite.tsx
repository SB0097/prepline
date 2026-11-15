import {
  aktuellerSchritt,
  type Brettzug,
  eigenerZug,
  type Feld,
  felderAusUci,
  gegnerZiehen,
  lernphase,
  type Runde,
  rundeFertig,
  rundenFortschritt,
  rundeStarten,
  sanAufDeutsch,
  type Schritt,
  erklaerungFuer,
  tippNehmen,
} from '@prepline/shared';
import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { type ReactNode, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useDatenbank } from '@/daten/DatenAnbieter';
import { Balken, Federnd, Knopf, RundKnopf, Seitenpunkt, zurueck } from '@/ui/bausteine';
import { DAUER, erscheinen, GLEITEN } from '@/ui/bewegung';
import { CoachBauer } from '@/ui/CoachBauer';
import { type Feldmarkierung, Schachbrett } from '@/ui/brett/Schachbrett';
import { FARBEN } from '@/ui/farben';
import { Zeichen } from '@/ui/symbole';
import { Text } from '@/ui/Text';

import { WarumBlase } from './WarumBlase';

import {
  ereignisSpeichern,
  trainingVorbereiten,
  type Trainingsteil,
  type Trainingsvorbereitung,
} from './trainingDaten';

// Trainingsbildschirm (Layout „Ruhig & groß“, Serkan 14.11.2026): runder Schließen-Knopf, Name und
// „Zug x von y“, dünner Fortschrittsbalken, Brett mit Rand, darunter „Dein Zug“ groß und unten
// eine Leiste mit drei gleich großen Knöpfen Tipp / Züge / Warum?.
// Rückmeldungen grün/rot/gelb wie am 11.11. abgestimmt.

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
  alternative: 'rgba(255, 150, 60, 0.7)',
};

/** Wo die Runde steht: welches Repertoire, welche Runde, wie viel schon erledigt ist. */
type Ablauf = { teilIndex: number; runde: Runde | null; erledigtVorher: number };

function teilStarten(teil: Trainingsteil): Runde {
  return rundeStarten(teil.rep.baum, teil.rep.seite, teil.karten, teil.plan, Math.random, {
    haeppchen: teil.haeppchen,
  });
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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const nurId = id ? Number(id) : undefined;
  const breite = useWindowDimensions().width;
  const [vorbereitung, setVorbereitung] = useState<Trainingsvorbereitung | null>(null);
  const [ablauf, setAblauf] = useState<Ablauf>({ teilIndex: 0, runde: null, erledigtVorher: 0 });
  const [fehler, setFehler] = useState(0);
  const [anzeige, setAnzeige] = useState<Anzeige | null>(null);
  const [tippFeld, setTippFeld] = useState<Feld | null>(null);
  const [zuegeOffen, setZuegeOffen] = useState(false);
  const [warumOffen, setWarumOffen] = useState(false);

  // Tagesplan laden und die erste Runde starten.
  useEffect(() => {
    if (db.status !== 'bereit') return;
    let aktiv = true;
    void trainingVorbereiten(db.sql, Date.now(), nurId).then((v) => {
      if (!aktiv) return;
      setVorbereitung(v);
      const erster = v.teile[0];
      if (erster) setAblauf({ teilIndex: 0, runde: teilStarten(erster), erledigtVorher: 0 });
    });
    return () => {
      aktiv = false;
    };
  }, [db, nurId]);

  const teile = vorbereitung?.teile ?? KEINE_TEILE;
  const { runde, teilIndex, erledigtVorher } = ablauf;
  const teil = teile[teilIndex];
  const schritt = runde ? aktuellerSchritt(runde) : null;

  // Gegnerzug automatisch spielen.
  useEffect(() => {
    if (!runde || schritt?.art !== 'gegner' || anzeige || warumOffen) return;
    const zeit = setTimeout(
      () => setAblauf((a) => uebernehmen(a, gegnerZiehen(runde), teile)),
      GEGNER_PAUSE,
    );
    return () => clearTimeout(zeit);
  }, [runde, schritt, anzeige, teile, warumOffen]);

  // Falscher Zug: das Brett ruckelt kurz wie ein Kopfschütteln (nicht bei „Animationen entfernen“).
  const ruhig = useReducedMotion();
  const wackeln = useSharedValue(0);
  useEffect(() => {
    if (anzeige?.art !== 'falsch' || ruhig) return;
    wackeln.set(
      withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(5, { duration: 70 }),
        withTiming(-3, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      ),
    );
  }, [anzeige, ruhig, wackeln]);
  const wackelStil = useAnimatedStyle(() => ({ transform: [{ translateX: wackeln.get() }] }));

  const gesamt = teile.reduce(
    (n, t) => n + t.plan.faellig.length + t.plan.neu.length + t.plan.angefangen.length,
    0,
  );
  const stand = runde ? rundenFortschritt(runde) : null;
  const erledigt = erledigtVorher + (stand?.erledigt ?? 0);
  // Der Balken wächst schon beim Zeigen und bei jeder richtigen Antwort, nicht erst pro fertiger Karte.
  const balken = gesamt ? (erledigtVorher + (stand ? stand.anteil * stand.gesamt : 0)) / gesamt : 0;

  if (!vorbereitung) return <SafeAreaView style={stile.seite} />;
  if (!runde || !teil || !schritt) {
    return (
      <FertigAnsicht
        geuebt={erledigt}
        fehler={fehler}
        vibration={vorbereitung.einstellungen.vibration}
      />
    );
  }

  const einstellungen = vorbereitung.einstellungen;
  // Vibration nur, wenn sie in „Mehr“ eingeschaltet ist; immer zusammen mit der sichtbaren Rückmeldung.
  const vibrieren = (art: 'richtig' | 'falsch') => {
    if (!einstellungen.vibration) return;
    if (art === 'richtig') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      vibrieren('richtig');
      setAnzeige({ art: 'richtig', fen: zug.fen, felder });
      setTimeout(() => {
        setAnzeige(null);
        setAblauf((a) => uebernehmen(a, ergebnis.runde, teile));
      }, RICHTIG_PAUSE);
    } else {
      if (ergebnis.rueckmeldung === 'falsch') vibrieren('falsch');
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
    ...(tippFeld ? [{ feld: tippFeld, farbe: FARBEN.brettTipp }] : []),
  ];
  const kommentar = anzeige?.art === 'richtig' ? schritt.kommentar : vorher?.kommentar;
  const eigenerSchritt = schritt.art !== 'gegner';

  // Anzeige der Lernphase („NEU · 2 VON 3“ / „AUS DEM KOPF · 1 VON 3“).
  const phase = lernphase(runde);
  const phaseText = phase
    ? `${phase.art === 'neu' ? 'NEU' : 'AUS DEM KOPF'} · ${phase.nummer} VON ${phase.anzahl}`
    : '';
  // Bei mitgelieferten Eröffnungen steht die Erklärung des Coachs direkt unter einem neuen Zug.
  const coachText =
    schritt.art === 'neu'
      ? erklaerungFuer(teil.rep.quelle, schritt.fen, schritt.san)?.de
      : undefined;

  // „Warum?“ nur, wenn der Zug schon zu sehen ist: neuer Zug, Nachspielen, gerade richtig gespielt
  // oder der zuletzt gespielte eigene Zug. So verrät die Erklärung nie die Antwort.
  const warumKandidaten: Schritt[] = [];
  if (
    eigenerSchritt &&
    (schritt.art === 'neu' || runde.nachspielen || anzeige?.art === 'richtig')
  ) {
    warumKandidaten.push(schritt);
  }
  const letzterEigener = runde.linie
    .slice(0, runde.index)
    .reverse()
    .find((s) => s.art !== 'gegner');
  if (letzterEigener) warumKandidaten.push(letzterEigener);
  const warum = warumKandidaten
    .map((s) => ({ schritt: s, text: erklaerungFuer(teil.rep.quelle, s.fen, s.san)?.de }))
    .find((w) => w.text);

  const tippMoeglich =
    eigenerSchritt &&
    schritt.art !== 'neu' &&
    !runde.nachspielen &&
    !runde.tipp &&
    anzeige?.art !== 'richtig';
  const warumMoeglich = Boolean(warum) && !coachText;

  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.kopf}>
        <RundKnopf symbol="kreuz" beschriftung="Training beenden" onPress={zurueck} />
        <View style={stile.kopfMitte}>
          <Text style={stile.titel} numberOfLines={1}>
            {teil.rep.name}
          </Text>
          <Text style={stile.zaehler} testID="fortschritt">
            Zug {Math.min(erledigt + 1, gesamt)} von {gesamt}
          </Text>
        </View>
        <View style={stile.kopfPlatz} />
      </View>
      <View style={stile.balken}>
        <Balken anteil={Math.min(1, balken)} hoehe={4} />
      </View>

      <ScrollView contentContainerStyle={stile.inhalt}>
        <Animated.View style={[stile.brett, wackelStil]}>
          <Schachbrett
            fen={anzeige?.art === 'richtig' ? anzeige.fen : schritt.fen}
            groesse={breite - 32}
            rundung={14}
            ansicht={teil.rep.seite}
            figurensatz={einstellungen.figurensatz}
            {...(anzeige?.art !== 'richtig' && vorher && { letzterZug: vorher.uci })}
            {...(anzeige?.art !== 'richtig' &&
              vorher?.art === 'gegner' && { gleitZug: vorher.uci })}
            markierungen={markierungen}
            {...(zeigtZug && { pfeil: schritt.uci })}
            bedienbar={eigenerSchritt && anzeige?.art !== 'richtig'}
            onZug={zugGespielt}
          />
        </Animated.View>

        {phase && (
          <View style={stile.phase} accessible accessibilityLabel={phaseText}>
            <Text style={stile.phaseText}>{phaseText}</Text>
          </View>
        )}
        <View style={[stile.statusZeile, phase && stile.statusZeileNah]}>
          <Meldung schritt={schritt} anzeige={anzeige} seite={teil.rep.seite} />
        </View>
        {zuegeOffen && <Zugliste schritte={runde.linie.slice(0, runde.index)} />}
        {coachText && (
          <View style={stile.coach}>
            <CoachBauer groesse={54} />
            <View style={stile.coachTexte}>
              <Text style={stile.coachTitel}>Warum {zugText(schritt)}?</Text>
              <Text style={stile.coachInhalt}>{coachText}</Text>
            </View>
          </View>
        )}
        {kommentar ? <Text style={stile.kommentar}>{kommentar}</Text> : null}
      </ScrollView>

      {/* Bedienleiste am Daumen: Tipp, Zugliste und bei Eröffnungen aus der Sammlung „Warum?“. */}
      <View style={stile.unten}>
        <Aktion titel="Tipp" aus={!tippMoeglich} onPress={tipp}>
          <Zeichen name="birne" farbe={FARBEN.text} groesse={22} />
        </Aktion>
        <Aktion
          titel="Züge"
          aktiv={zuegeOffen}
          beschriftung={zuegeOffen ? 'Züge ausblenden' : 'Züge anzeigen'}
          onPress={() => setZuegeOffen(!zuegeOffen)}
        >
          <Zeichen name="liste" farbe={zuegeOffen ? FARBEN.akzent : FARBEN.text} groesse={22} />
        </Aktion>
        {teil.rep.quelle && (
          <Aktion
            titel="Warum?"
            aus={!warumMoeglich}
            beschriftung={warum ? `Warum ${zugText(warum.schritt)}?` : 'Warum?'}
            onPress={() => setWarumOffen(true)}
          >
            <CoachBauer groesse={26} />
          </Aktion>
        )}
      </View>
      {warum?.text && (
        <WarumBlase
          sichtbar={warumOffen}
          titel={`Warum ${zugText(warum.schritt)}?`}
          text={warum.text}
          onSchliessen={() => setWarumOffen(false)}
        />
      )}
    </SafeAreaView>
  );
}

/** Gleich große Kachel in der Bedienleiste unten: Symbol über der Beschriftung. */
function Aktion({
  titel,
  beschriftung,
  aus = false,
  aktiv = false,
  onPress,
  children,
}: {
  titel: string;
  beschriftung?: string;
  aus?: boolean;
  aktiv?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Federnd
      onPress={onPress}
      disabled={aus}
      accessibilityRole="button"
      accessibilityLabel={beschriftung ?? titel}
      accessibilityState={{ disabled: aus, expanded: aktiv }}
      style={[stile.aktion, aktiv && stile.aktionAktiv, aus && { opacity: 0.35 }]}
    >
      {children}
      <Text style={[stile.aktionText, aktiv && { color: FARBEN.akzent }]}>{titel}</Text>
    </Federnd>
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
        key="richtig"
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
        key="falsch"
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
        key="alternative"
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
        <Text style={[stile.meldungTitelGross, { color: FARBEN.textLeise }]}>Gegner zieht …</Text>
      </View>
    );
  }
  const titel = schritt.art === 'neu' ? 'Neuer Zug' : 'Dein Zug';
  const text =
    schritt.art === 'neu'
      ? `Spiel ${zugText(schritt)} – der Pfeil zeigt ihn dir`
      : schritt.art === 'abfrage'
        ? `${amZug} · ${schritt.frisch ? 'ohne Hilfe' : 'Wiederholung'}`
        : amZug;
  return (
    <View style={stile.meldung}>
      <View style={stile.titelZeile}>
        {schritt.art !== 'neu' && <Seitenpunkt seite={seite} groesse={18} />}
        <Text style={stile.meldungTitelGross}>{titel}</Text>
      </View>
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
  const ruhig = useReducedMotion();
  const pfad = {
    haken: 'M6 12.5l4 4L18 8.5',
    kreuz: 'M8 8l8 8M16 8l-8 8',
    ausruf: 'M12 6.5v7M12 17.5v0.01',
  }[zeichen];
  return (
    <View style={[stile.meldung, stile.rueckmeldung]} accessibilityLiveRegion="polite">
      {/* Der Kreis wächst beim Erscheinen kurz auf (ohne Überschwingen). */}
      <Animated.View
        style={[stile.kreis, { backgroundColor: farbe }]}
        entering={erscheinen({ dauer: DAUER.meldung, skala: ruhig ? 1 : 0.6 })}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path
            d={pfad}
            stroke={FARBEN.hintergrund}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
      <Animated.View style={stile.rueckmeldungText} entering={erscheinen({ dauer: DAUER.meldung })}>
        <Text style={[stile.meldungTitel, { color: farbe }]}>{titel}</Text>
        <Text style={stile.meldungText}>{text}</Text>
      </Animated.View>
    </View>
  );
}

const HAKEN_LAENGE = 20;
const AnimierterPfad = Animated.createAnimatedComponent(Path);

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

/**
 * Ende des Trainings (Runde 14): Kreis taucht auf, der Haken zeichnet sich, der Text kommt
 * von unten. Bei „Animationen entfernen“ wird nur eingeblendet.
 */
function FertigAnsicht({
  geuebt,
  fehler,
  vibration,
}: {
  geuebt: number;
  fehler: number;
  vibration: boolean;
}) {
  const ruhig = useReducedMotion();
  const offen = useSharedValue(ruhig ? 0 : HAKEN_LAENGE);
  useEffect(() => {
    if (vibration && geuebt > 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (!ruhig) offen.set(withDelay(150, withTiming(0, { duration: 350, easing: GLEITEN })));
    // Nur einmal beim Erscheinen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const hakenProps = useAnimatedProps(() => ({ strokeDashoffset: offen.get() }));
  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.fertig}>
        <Animated.View
          style={stile.fertigKreis}
          entering={erscheinen({ dauer: 250, skala: ruhig ? 1 : 0.9 })}
        >
          <Svg width={54} height={54} viewBox="0 0 24 24">
            <AnimierterPfad
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke={FARBEN.richtig}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={HAKEN_LAENGE}
              animatedProps={hakenProps}
            />
          </Svg>
        </Animated.View>
        {/* Text kommt 8 Pixel von unten, kurz nach dem Kreis. */}
        <Animated.View
          style={stile.fertigTexte}
          entering={erscheinen({
            dauer: 250,
            verzoegerung: ruhig ? 0 : 250,
            vonY: ruhig ? 0 : 8,
          })}
        >
          <Text style={stile.fertigTitel}>
            {geuebt === 0 ? 'Heute ist nichts mehr dran' : 'Für heute geschafft'}
          </Text>
          {geuebt > 0 && (
            <Text style={stile.meldungText}>
              {geuebt === 1 ? '1 Stellung geübt' : `${geuebt} Stellungen geübt`}
              {fehler > 0 ? ` · ${fehler} Fehler` : ' · ohne Fehler'}
            </Text>
          )}
        </Animated.View>
      </View>
      <View style={stile.fertigKnopf}>
        <Knopf titel="Fertig" onPress={zurueck} />
      </View>
    </SafeAreaView>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund, paddingBottom: 16 },
  kopf: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  kopfMitte: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 8 },
  kopfPlatz: { width: 40 },
  titel: { color: FARBEN.text, fontSize: 17, fontWeight: '700' },
  zaehler: { color: FARBEN.textLeise, fontSize: 13, fontWeight: '500' },
  balken: { marginHorizontal: 20, marginTop: 16 },
  inhalt: { paddingBottom: 16 },
  brett: { marginHorizontal: 16, marginTop: 18 },
  phase: {
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: FARBEN.akzentFlaeche,
  },
  phaseText: { color: FARBEN.akzent, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  statusZeileNah: { marginTop: 10 },
  coach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    backgroundColor: FARBEN.karte,
    borderColor: FARBEN.akzentRand,
    borderWidth: 1,
  },
  coachTexte: { flex: 1, gap: 4 },
  coachTitel: { color: FARBEN.akzent, fontSize: 14, fontWeight: '700' },
  coachInhalt: { color: FARBEN.text, fontSize: 14.5, lineHeight: 21 },
  statusZeile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 22,
  },
  zugliste: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: 20, marginTop: 14 },
  zuglisteLeer: { color: FARBEN.textLeise, fontSize: 14, marginHorizontal: 20, marginTop: 14 },
  zugPille: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: FARBEN.karte,
  },
  zugPilleText: { color: FARBEN.text, fontSize: 13 },
  meldung: { gap: 4 },
  rueckmeldung: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titelZeile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meldungTitelGross: { color: FARBEN.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
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
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: FARBEN.karte,
    borderColor: FARBEN.rand,
    borderWidth: 1,
    color: FARBEN.text,
    fontSize: 14,
    lineHeight: 20,
  },
  unten: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  aktion: {
    flex: 1,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: FARBEN.karte,
    borderColor: FARBEN.rand,
    borderWidth: 1,
  },
  aktionAktiv: { backgroundColor: FARBEN.akzentFlaeche, borderColor: FARBEN.akzentRand },
  aktionText: { color: FARBEN.text, fontSize: 13, fontWeight: '700' },
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
  fertigTexte: { alignItems: 'center', gap: 10 },
  fertigTitel: { color: FARBEN.text, fontSize: 24, fontWeight: '700' },
});
