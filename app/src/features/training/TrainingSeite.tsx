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
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
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
import Svg, { Circle, Path } from 'react-native-svg';

import { useDatenbank } from '@/daten/DatenAnbieter';
import {
  Balken,
  Federnd,
  KARTE,
  Knopf,
  RundKnopf,
  Seitenpunkt,
  TIEFE,
  TIPPFLAECHE,
  zurueck,
} from '@/ui/bausteine';
import { DAUER, erscheinen, GLEITEN } from '@/ui/bewegung';
import { CoachBauer } from '@/ui/CoachBauer';
import { type Feldmarkierung, Schachbrett } from '@/ui/brett/Schachbrett';
import { FARBEN } from '@/ui/farben';
import { Zeichen } from '@/ui/symbole';
import { Text, ZIFFERN_GLEICH } from '@/ui/Text';

import { brettGroesse, RAHMEN } from './brettGroesse';
import { WarumBlase } from './WarumBlase';

import {
  ereignisSpeichern,
  trainingVorbereiten,
  type Trainingsteil,
  type Trainingsvorbereitung,
} from './trainingDaten';

// Trainingsbildschirm (Layout „Ruhig & groß“ 14.11.2026, Runde 18 „Ruhig mit Pfeilen“ 15.11.2026):
// runder Schließen-Knopf, Name und „Zug x von y“, dünner Fortschrittsbalken, Brett im Rahmen,
// darunter „Dein Zug“ mit der Lernphase in der kleinen Zeile und rechts ◀ ▶ zum Blättern,
// unten eine Leiste mit Tipp / Züge / Warum?.
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
  const { width: breite, fontScale } = useWindowDimensions();
  // Sichtbare Höhe zwischen Kopf und Bedienleiste, bestimmt die Brettgröße auf kleinen Handys.
  const [bereichHoehe, setBereichHoehe] = useState<number | null>(null);
  const brett = brettGroesse(breite, bereichHoehe, fontScale);
  const [vorbereitung, setVorbereitung] = useState<Trainingsvorbereitung | null>(null);
  const [ablauf, setAblauf] = useState<Ablauf>({ teilIndex: 0, runde: null, erledigtVorher: 0 });
  const [fehler, setFehler] = useState(0);
  const [anzeige, setAnzeige] = useState<Anzeige | null>(null);
  const [tippFeld, setTippFeld] = useState<Feld | null>(null);
  const [zuegeOffen, setZuegeOffen] = useState(false);
  const [warumOffen, setWarumOffen] = useState(false);
  // Zurückblättern (Runde 18): wie viele Züge der laufenden Linie gerade zu sehen sind.
  const [blick, setBlick] = useState<{ linie: readonly Schritt[]; zuege: number } | null>(null);

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
  // Zurückgeblättert: Anzahl der gezeigten Züge, sonst null. Gilt nur für die Linie, in der
  // geblättert wurde; beginnt eine neue Linie, ist man automatisch wieder beim Training.
  const blickZuege =
    runde && blick && blick.linie === runde.linie && blick.zuege < runde.index ? blick.zuege : null;

  // Gegnerzug automatisch spielen (nicht, solange man zurückblättert).
  useEffect(() => {
    if (!runde || schritt?.art !== 'gegner' || anzeige || warumOffen || blickZuege !== null) {
      return;
    }
    const zeit = setTimeout(
      () => setAblauf((a) => uebernehmen(a, gegnerZiehen(runde), teile)),
      GEGNER_PAUSE,
    );
    return () => clearTimeout(zeit);
  }, [runde, schritt, anzeige, teile, warumOffen, blickZuege]);

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

  // Lernphase klein in der Zeile unter „Dein Zug“ („Neu 2/3“, „Aus dem Kopf“), Runde 18.
  const phase = lernphase(runde);
  const phaseText = phase
    ? `${phase.art === 'neu' ? 'Neu' : 'Aus dem Kopf'}${phase.anzahl > 1 ? ` ${phase.nummer}/${phase.anzahl}` : ''}`
    : undefined;
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

  // Vor- und Zurückblättern in der laufenden Linie. Das Brett zeigt dann eine frühere Stellung
  // und ist nicht spielbar; Tipp und Warum? ruhen, der Gegner wartet.
  const blaettert = blickZuege !== null;
  const gezeigtBis = blickZuege ?? runde.index;
  const zurueckMoeglich = gezeigtBis > 0 && anzeige?.art !== 'richtig';
  const zurueckBlaettern = () => setBlick({ linie: runde.linie, zuege: gezeigtBis - 1 });
  const vorBlaettern = () =>
    setBlick(gezeigtBis + 1 >= runde.index ? null : { linie: runde.linie, zuege: gezeigtBis + 1 });
  const blickLetzter = blaettert ? runde.linie[blickZuege - 1] : undefined;
  // Beim Zurückblättern erklärt „Warum?“ den Zug, der gerade auf dem Brett zu sehen ist
  // (nur eigene Züge aus Sammlungs-Eröffnungen; vergangene Züge verraten keine Antwort).
  const warumBlickText =
    blickLetzter && blickLetzter.art !== 'gegner'
      ? erklaerungFuer(teil.rep.quelle, blickLetzter.fen, blickLetzter.san)?.de
      : undefined;
  const warumBlick =
    blickLetzter && warumBlickText ? { schritt: blickLetzter, text: warumBlickText } : null;
  const warumGezeigt = blaettert ? warumBlick : warum;
  // Zug in der Zugliste angetippt: Stellung nach diesem Zug zeigen (der letzte = aktuell).
  const zugWaehlen = (zuege: number) =>
    setBlick(zuege >= runde.index ? null : { linie: runde.linie, zuege });

  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.kopf}>
        <RundKnopf symbol="kreuz" beschriftung="Training beenden" onPress={zurueck} />
        <View style={stile.kopfMitte}>
          <Text style={stile.titel} numberOfLines={1}>
            {teil.rep.name}
          </Text>
          <Text style={[stile.zaehler, ZIFFERN_GLEICH]} testID="fortschritt">
            Zug {Math.min(erledigt + 1, gesamt)} von {gesamt}
          </Text>
        </View>
        <View style={stile.kopfPlatz} />
      </View>
      <View style={stile.balken}>
        <Balken anteil={Math.min(1, balken)} hoehe={4} />
      </View>

      <ScrollView
        contentContainerStyle={stile.inhalt}
        onLayout={(e) => setBereichHoehe(e.nativeEvent.layout.height)}
      >
        <Animated.View style={[stile.brett, wackelStil]}>
          {blaettert ? (
            <Schachbrett
              fen={runde.linie[blickZuege]?.fen ?? schritt.fen}
              groesse={brett}
              rundung={14}
              ansicht={teil.rep.seite}
              figurensatz={einstellungen.figurensatz}
              {...(blickLetzter && { letzterZug: blickLetzter.uci })}
              bedienbar={false}
            />
          ) : (
            <Schachbrett
              fen={anzeige?.art === 'richtig' ? anzeige.fen : schritt.fen}
              groesse={brett}
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
          )}
        </Animated.View>

        <View style={stile.statusZeile}>
          <View style={stile.statusText}>
            {blaettert ? (
              <View style={stile.meldung} accessibilityLiveRegion="polite">
                <View style={stile.titelZeile}>
                  <View style={stile.blickPunkt} />
                  <Text style={stile.meldungTitelGross}>
                    {blickLetzter ? `Nach ${zugText(blickLetzter)}` : 'Ausgangsstellung'}
                  </Text>
                </View>
                <Text style={stile.meldungText}>Du schaust zurück</Text>
              </View>
            ) : (
              <Meldung
                schritt={schritt}
                anzeige={anzeige}
                seite={teil.rep.seite}
                phase={phaseText}
              />
            )}
          </View>
          <View style={stile.blaettern}>
            <RundKnopf
              symbol="zurueck"
              beschriftung="Einen Zug zurück"
              aus={!zurueckMoeglich}
              onPress={zurueckBlaettern}
            />
            <RundKnopf
              symbol="weiter"
              beschriftung="Einen Zug vor"
              aus={!blaettert}
              onPress={vorBlaettern}
            />
          </View>
        </View>
        {zuegeOffen && (
          <Zugliste
            schritte={runde.linie.slice(0, runde.index)}
            gezeigt={blaettert ? gezeigtBis : null}
            aus={anzeige?.art === 'richtig'}
            onWahl={zugWaehlen}
          />
        )}
        {coachText && !blaettert && (
          <View style={stile.coach}>
            <CoachBauer groesse={54} />
            <View style={stile.coachTexte}>
              <Text style={stile.coachTitel}>Warum {zugText(schritt)}?</Text>
              <Text style={stile.coachInhalt}>{coachText}</Text>
            </View>
          </View>
        )}
        {kommentar && !blaettert ? <Text style={stile.kommentar}>{kommentar}</Text> : null}
      </ScrollView>

      {/* Beim Zurückblättern wird die Bedienleiste zum Knopf „Zurück zum Training“ (Runde 19),
          gleich hoch wie die Leiste, damit oben nichts verrutscht. */}
      {blaettert ? (
        <View style={stile.untenZurueck}>
          <View style={stile.untenZurueckKnopf}>
            <Knopf titel="Zurück zum Training" symbol="start" onPress={() => setBlick(null)} />
          </View>
          {teil.rep.quelle && (
            <View style={[KARTE, stile.untenWarum]}>
              <Aktion
                kompakt
                titel="Warum?"
                aus={!warumBlick}
                beschriftung={
                  warumBlick
                    ? `Warum ${zugText(warumBlick.schritt)}?`
                    : 'Warum? – zu diesem Zug gibt es keine Erklärung'
                }
                onPress={() => setWarumOffen(true)}
              >
                <CoachBauer groesse={22} />
              </Aktion>
            </View>
          )}
        </View>
      ) : (
        /* Bedienleiste am Daumen: Tipp, Zugliste und bei Eröffnungen aus der Sammlung „Warum?“. */
        <View style={[KARTE, stile.unten]}>
          <Aktion titel="Tipp" aus={!tippMoeglich || blaettert} onPress={tipp}>
            <Zeichen name="birne" farbe={FARBEN.text} groesse={22} />
          </Aktion>
          <Aktion
            trenner
            titel="Züge"
            aktiv={zuegeOffen}
            beschriftung={zuegeOffen ? 'Züge ausblenden' : 'Züge anzeigen'}
            onPress={() => setZuegeOffen(!zuegeOffen)}
          >
            <Zeichen name="liste" farbe={zuegeOffen ? FARBEN.akzent : FARBEN.text} groesse={22} />
          </Aktion>
          {teil.rep.quelle && (
            <Aktion
              trenner
              titel="Warum?"
              aus={!warumMoeglich || blaettert}
              beschriftung={warum ? `Warum ${zugText(warum.schritt)}?` : 'Warum?'}
              onPress={() => setWarumOffen(true)}
            >
              <CoachBauer groesse={26} />
            </Aktion>
          )}
        </View>
      )}
      {warumGezeigt?.text && (
        <WarumBlase
          sichtbar={warumOffen}
          titel={`Warum ${zugText(warumGezeigt.schritt)}?`}
          text={warumGezeigt.text}
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
  trenner = false,
  kompakt = false,
  onPress,
  children,
}: {
  titel: string;
  beschriftung?: string;
  aus?: boolean;
  aktiv?: boolean;
  /** Feine Linie links als Abgrenzung zum vorigen Knopf in der Leiste. */
  trenner?: boolean;
  /** Niedriger, z. B. neben dem Knopf „Zurück zum Training“. */
  kompakt?: boolean;
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
      style={[
        stile.aktion,
        kompakt && stile.aktionKompakt,
        trenner && stile.aktionTrenner,
        aus && { opacity: 0.35 },
      ]}
    >
      {aktiv && <View style={stile.aktionAktiv} />}
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
  phase,
}: {
  schritt: Schritt;
  anzeige: Anzeige | null;
  seite: 'weiss' | 'schwarz';
  /** Lernphase, steht vorn in der kleinen Zeile („Aus dem Kopf · Weiß am Zug“). */
  phase?: string | undefined;
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
      : schritt.art === 'abfrage' && !phase
        ? `${amZug} · ${schritt.frisch ? 'ohne Hilfe' : 'Wiederholung'}`
        : amZug;
  return (
    <View style={stile.meldung}>
      <View style={stile.titelZeile}>
        {schritt.art !== 'neu' && <Seitenpunkt seite={seite} groesse={12} />}
        <Text style={stile.meldungTitelGross}>{titel}</Text>
      </View>
      <Text style={stile.meldungText} numberOfLines={2}>
        {phase ? `${phase} · ${text}` : text}
      </Text>
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
  // Gleicher Aufbau wie „Dein Zug“ (Titelzeile + eine kleine Zeile), damit beim Wechsel nichts
  // springt (Runde 18). Der Kreis ist eine Grafik und wächst beim Erscheinen kurz auf.
  return (
    <View style={stile.meldung} accessibilityLiveRegion="polite">
      <View style={stile.titelZeile}>
        <Animated.View entering={erscheinen({ dauer: DAUER.meldung, skala: ruhig ? 1 : 0.6 })}>
          <Svg width={KREIS} height={KREIS} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={12} fill={farbe} />
            <Path
              d={pfad}
              stroke={FARBEN.hintergrund}
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
        <Animated.View entering={erscheinen({ dauer: DAUER.meldung })}>
          <Text style={[stile.meldungTitelGross, { color: farbe }]}>{titel}</Text>
        </Animated.View>
      </View>
      <Text style={stile.meldungText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

/** Kreis vor „Richtig“ / „Nicht ganz“, so groß wie der Punkt vor „Dein Zug“ plus etwas Luft. */
const KREIS = 22;

const HAKEN_LAENGE = 20;
const AnimierterPfad = Animated.createAnimatedComponent(Path);

/**
 * Bisherige Züge der Linie. Ein Zug lässt sich antippen, dann zeigt das Brett die Stellung nach
 * diesem Zug (Runde 18); der gerade gezeigte Zug ist hervorgehoben.
 */
function Zugliste({
  schritte,
  gezeigt,
  aus,
  onWahl,
}: {
  schritte: readonly Schritt[];
  /** Anzahl der gerade gezeigten Züge beim Zurückblättern, sonst null (= aktuell). */
  gezeigt: number | null;
  aus: boolean;
  onWahl: (zuege: number) => void;
}) {
  if (schritte.length === 0) return <Text style={stile.zuglisteLeer}>Noch keine Züge</Text>;
  const markiert = (gezeigt ?? schritte.length) - 1;
  return (
    <View style={stile.zugliste}>
      {schritte.map((s, i) => {
        const [, farbe] = s.fen.split(' ');
        const text = farbe === 'w' || i === 0 ? zugText(s) : sanAufDeutsch(s.san);
        const aktiv = i === markiert;
        return (
          <Pressable
            key={i}
            onPress={() => onWahl(i + 1)}
            disabled={aus}
            accessibilityRole="button"
            accessibilityLabel={`Stellung nach ${zugText(s)} zeigen`}
            accessibilityState={{ selected: aktiv }}
            style={stile.zugTippflaeche}
          >
            {({ pressed }) => (
              <View
                style={[
                  stile.zugPille,
                  aktiv && stile.zugPilleAktiv,
                  pressed && stile.zugPilleGedrueckt,
                ]}
              >
                <Text style={[stile.zugPilleText, aktiv && stile.zugPilleTextAktiv]}>{text}</Text>
              </View>
            )}
          </Pressable>
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
  // Brett in einem erhöhten Rahmen (Runde 16 „Tiefe“).
  brett: {
    alignSelf: 'center',
    marginTop: 16,
    padding: RAHMEN,
    borderRadius: 20,
    backgroundColor: FARBEN.karteHell,
    borderWidth: 1,
    borderColor: FARBEN.lichtkante,
    ...TIEFE,
  },
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
  // Status ruhiger (Runde 18): links „Dein Zug“ mit Zeile darunter, rechts ◀ ▶.
  statusZeile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
  },
  // Feste Mindesthöhe (Titel + zwei kleine Zeilen): Wechsel zwischen „Dein Zug“, „Richtig“
  // und „Nicht ganz“ verschiebt nichts darunter.
  statusText: { flex: 1, minHeight: 72, justifyContent: 'flex-start' },
  // Pfeile mittig zur Titelzeile.
  blaettern: { flexDirection: 'row', gap: 8, marginTop: -8 },
  blickPunkt: { width: 12, height: 12, borderRadius: 6, backgroundColor: FARBEN.textLeise },
  zugliste: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 17, marginTop: 6 },
  zuglisteLeer: { color: FARBEN.textLeise, fontSize: 14, marginHorizontal: 20, marginTop: 14 },
  // Sichtbar ist die kleine Pille, antippbar sind 48 dp Höhe (Android-Mindestmaß).
  zugTippflaeche: { minHeight: TIPPFLAECHE, justifyContent: 'center', paddingHorizontal: 3 },
  zugPille: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: FARBEN.karte,
  },
  zugPilleText: { color: FARBEN.text, fontSize: 14 },
  zugPilleAktiv: { backgroundColor: FARBEN.akzentFlaeche },
  zugPilleGedrueckt: { backgroundColor: FARBEN.karteHell },
  zugPilleTextAktiv: { color: FARBEN.akzentHell, fontWeight: '700' },
  meldung: { gap: 4 },
  titelZeile: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  meldungTitelGross: { color: FARBEN.text, fontSize: 20, fontWeight: '600', letterSpacing: -0.2 },
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
  // Bedienleiste als eine Fläche mit feinen Trennlinien (Runde 16).
  unten: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 24,
    paddingVertical: 4,
  },
  untenZurueck: {
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  untenZurueckKnopf: { flex: 1 },
  // So hoch wie der Knopf daneben (Knopf: 2 × 17 Innenabstand + Schrift).
  untenWarum: {
    width: 96,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  aktionKompakt: { height: 58, gap: 2 },
  aktion: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'center', gap: 6 },
  aktionTrenner: { borderLeftWidth: 1, borderLeftColor: FARBEN.rand },
  aktionAktiv: {
    ...StyleSheet.absoluteFill,
    marginHorizontal: 6,
    borderRadius: 18,
    backgroundColor: FARBEN.akzentFlaeche,
  },
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
