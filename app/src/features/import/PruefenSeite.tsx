import { hauptlinieEnde, importVorschau, type Seite } from '@prepline/shared';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDatenbank } from '@/daten/DatenAnbieter';
import { einstellungenLaden } from '@/daten/einstellungen';
import { passendeRepertoires, pgnImportieren, type RepertoireKopf } from '@/daten/speicher';
import { Knopf, RUNDUNG, Umschalter, ZurueckKopf } from '@/ui/bausteine';
import { type Figurensatz, FIGURENSATZ_STANDARD } from '@/ui/brett/figuren';
import { Schachbrett } from '@/ui/brett/Schachbrett';
import { FARBEN } from '@/ui/farben';

import { entwurfHolen } from './entwurf';
import { fehlerText, nameAusDatei } from './fehlerText';

// Import Schritt 2 (Skizze 11.11.2026): Vorschau, Name, Seite, Hinweise; bei passendem
// Repertoire die Frage „Neu anlegen“ oder „Zu … hinzufügen“.
const SEITEN = [
  { wert: 'weiss', titel: 'Weiß' },
  { wert: 'schwarz', titel: 'Schwarz' },
] as const;

/** So viele Hinweise werden einzeln gezeigt, der Rest nur gezählt. */
const MAX_HINWEISE = 3;

export function PruefenSeite() {
  const db = useDatenbank();
  const [figurensatz, setFigurensatz] = useState<Figurensatz>(FIGURENSATZ_STANDARD);
  const [entwurf] = useState(entwurfHolen);
  const [seite, setSeite] = useState<Seite>('weiss');
  const vorschau = importVorschau(entwurf?.text ?? '', seite);
  const [name, setName] = useState(
    () => vorschau.name || nameAusDatei(entwurf?.dateiname) || 'Neue Eröffnung',
  );
  const [passend, setPassend] = useState<RepertoireKopf[]>([]);
  const [ziel, setZiel] = useState<number | null>(null);
  const [speichert, setSpeichert] = useState(false);

  const [baum] = vorschau.baeume;
  const einBaum = vorschau.baeume.length === 1 ? baum : undefined;
  const startFen = einBaum?.startFen;

  useEffect(() => {
    if (db.status !== 'bereit') return;
    let aktiv = true;
    void einstellungenLaden(db.sql).then((e) => aktiv && setFigurensatz(e.figurensatz));
    return () => {
      aktiv = false;
    };
  }, [db]);

  useEffect(() => {
    if (db.status !== 'bereit' || !startFen) return;
    let aktiv = true;
    void passendeRepertoires(db.sql, seite, startFen).then((liste) => {
      if (!aktiv) return;
      setPassend(liste);
      setZiel(null);
    });
    return () => {
      aktiv = false;
    };
  }, [db, seite, startFen]);

  const hinzufuegen = async () => {
    if (db.status !== 'bereit' || !entwurf) return;
    setSpeichert(true);
    const ergebnis = await pgnImportieren(db.sql, entwurf.text, {
      name: name.trim() || 'Neue Eröffnung',
      seite,
      ...(ziel === null ? {} : { ziel }),
    });
    const zielName = passend.find((r) => r.id === ziel)?.name;
    router.replace({
      pathname: '/import/fertig',
      params: { name: zielName ?? name.trim(), neu: String(ergebnis.neueStellungen) },
    });
  };

  const hinweise = vorschau.fehler.filter((f) => f.art !== 'keine_zuege');
  const varianten = Math.max(0, vorschau.linien - vorschau.baeume.length);

  return (
    <SafeAreaView style={stile.seite}>
      <ZurueckKopf titel="Prüfen" />
      {!baum ? (
        <View style={stile.leer}>
          <Text style={stile.leerTitel}>Keine Züge gefunden</Text>
          <Text style={stile.leise}>
            Prüfe, ob der Text Schachzüge enthält, z. B. „1. e4 e5 2. Nf3“.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={stile.inhalt} keyboardShouldPersistTaps="handled">
            <View style={stile.brett}>
              <Schachbrett
                fen={hauptlinieEnde(baum)}
                groesse={150}
                ansicht={seite}
                figurensatz={figurensatz}
                bedienbar={false}
                koordinaten={false}
              />
            </View>
            <Text style={[stile.leise, stile.mitte]}>
              {vorschau.stellungen} {vorschau.stellungen === 1 ? 'Stellung' : 'Stellungen'} für dich
              {varianten > 0 ? ` · ${varianten} ${varianten === 1 ? 'Variante' : 'Varianten'}` : ''}
            </Text>

            <Text style={stile.label}>Ich spiele mit</Text>
            <Umschalter werte={SEITEN} wert={seite} onWahl={setSeite} />

            {passend.length > 0 && (
              <>
                <Text style={stile.label}>Diese Eröffnung gibt es schon</Text>
                <View style={stile.gruppe}>
                  <Auswahl
                    titel="Neu anlegen"
                    aktiv={ziel === null}
                    onPress={() => setZiel(null)}
                  />
                  {passend.map((r) => (
                    <Auswahl
                      key={r.id}
                      titel={`Zu „${r.name}“ hinzufügen`}
                      aktiv={ziel === r.id}
                      onPress={() => setZiel(r.id)}
                    />
                  ))}
                </View>
              </>
            )}

            {ziel === null && (
              <>
                <Text style={stile.label}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={stile.eingabe}
                  accessibilityLabel="Name"
                  maxLength={60}
                />
              </>
            )}

            {hinweise.length > 0 && (
              <View style={stile.warnung}>
                <Text style={stile.warnungTitel}>
                  {hinweise.length === 1 ? '1 Stelle' : `${hinweise.length} Stellen`} übersprungen
                </Text>
                {hinweise.slice(0, MAX_HINWEISE).map((f, i) => (
                  <Text key={i} style={stile.leiseKlein}>
                    {fehlerText(f)}
                  </Text>
                ))}
                {hinweise.length > MAX_HINWEISE && (
                  <Text style={stile.leiseKlein}>und {hinweise.length - MAX_HINWEISE} weitere</Text>
                )}
              </View>
            )}
          </ScrollView>
          <Knopf
            titel="Hinzufügen"
            onPress={() => void hinzufuegen()}
            aus={speichert || vorschau.stellungen === 0}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function Auswahl({
  titel,
  aktiv,
  onPress,
}: {
  titel: string;
  aktiv: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: aktiv }}
      style={stile.auswahl}
    >
      <View style={[stile.kreis, aktiv && stile.kreisAktiv]} />
      <Text style={stile.auswahlText} numberOfLines={2}>
        {titel}
      </Text>
    </Pressable>
  );
}

const stile = StyleSheet.create({
  seite: {
    flex: 1,
    backgroundColor: FARBEN.hintergrund,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  inhalt: { paddingBottom: 24 },
  brett: { alignSelf: 'center', borderRadius: 10, overflow: 'hidden', marginTop: 8 },
  mitte: { textAlign: 'center', marginTop: 12 },
  leise: { color: FARBEN.textLeise, fontSize: 14, lineHeight: 20 },
  leiseKlein: { color: FARBEN.textLeise, fontSize: 13, lineHeight: 19 },
  label: { color: FARBEN.textLeise, fontSize: 13, marginTop: 22, marginBottom: 8 },
  eingabe: {
    backgroundColor: FARBEN.karte,
    borderColor: FARBEN.linie,
    borderWidth: 1,
    borderRadius: 16,
    color: FARBEN.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  gruppe: { backgroundColor: FARBEN.karte, borderRadius: RUNDUNG, paddingHorizontal: 16 },
  auswahl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 50,
    paddingVertical: 8,
  },
  kreis: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: FARBEN.textLeise },
  kreisAktiv: { borderWidth: 6, borderColor: FARBEN.akzent },
  auswahlText: { flex: 1, color: FARBEN.text, fontSize: 15 },
  warnung: {
    marginTop: 22,
    padding: 16,
    gap: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 181, 74, 0.5)',
    backgroundColor: 'rgba(245, 181, 74, 0.12)',
  },
  warnungTitel: { color: FARBEN.hinweis, fontSize: 14, fontWeight: '700' },
  leer: { marginTop: 40, gap: 8 },
  leerTitel: { color: FARBEN.text, fontSize: 20, fontWeight: '700' },
});
