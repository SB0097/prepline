import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDatenbank } from '@/daten/DatenAnbieter';
import { pgnTeilen, sicherungTeilen } from '@/daten/export';
import {
  type Sicherung,
  sicherungEinspielen,
  type SicherungsInhalt,
  sicherungPruefen,
} from '@/daten/sicherung';
import { Knopf, RUNDUNG, ZurueckKopf } from '@/ui/bausteine';
import { BestaetigenDialog } from '@/ui/Dialog';
import { FARBEN } from '@/ui/farben';

// Sicherung (Skizze M8, Serkan 11.11.2026): speichern/teilen, laden (ersetzt alles), PGN-Export.
const GRUND_TEXT = {
  kein_json: 'Das ist keine Prepline-Sicherung.',
  falsches_format: 'Das ist keine Prepline-Sicherung.',
  zu_neu: 'Diese Sicherung stammt aus einer neueren App-Version. Bitte Prepline aktualisieren.',
  beschaedigt: 'Die Datei ist beschädigt und kann nicht geladen werden.',
} as const;

type Meldung = { art: 'ok' | 'fehler'; text: string };

export function SicherungSeite() {
  const db = useDatenbank();
  const [beschaeftigt, setBeschaeftigt] = useState(false);
  const [meldung, setMeldung] = useState<Meldung | null>(null);
  const [laden, setLaden] = useState<{ sicherung: Sicherung; inhalt: SicherungsInhalt } | null>(
    null,
  );

  const ausfuehren = async (arbeit: () => Promise<void>) => {
    if (db.status !== 'bereit') return;
    setBeschaeftigt(true);
    setMeldung(null);
    try {
      await arbeit();
    } catch {
      setMeldung({
        art: 'fehler',
        text: 'Das hat leider nicht geklappt. Bitte noch einmal versuchen.',
      });
    } finally {
      setBeschaeftigt(false);
    }
  };

  const dateiWaehlen = () =>
    ausfuehren(async () => {
      const wahl = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      const datei = wahl.canceled ? null : wahl.assets[0];
      if (!datei) return;
      const pruefung = sicherungPruefen(await new File(datei.uri).text());
      if (!pruefung.ok) {
        setMeldung({ art: 'fehler', text: GRUND_TEXT[pruefung.grund] });
        return;
      }
      setLaden({ sicherung: pruefung.sicherung, inhalt: pruefung.inhalt });
    });

  const einspielen = () => {
    const auswahl = laden;
    setLaden(null);
    if (!auswahl || db.status !== 'bereit') return;
    void ausfuehren(async () => {
      await sicherungEinspielen(db.sql, auswahl.sicherung);
      setMeldung({
        art: 'ok',
        text: `Sicherung geladen: ${auswahl.inhalt.eroeffnungen} ${auswahl.inhalt.eroeffnungen === 1 ? 'Eröffnung' : 'Eröffnungen'}.`,
      });
    });
  };

  const datum = laden?.inhalt.erstellt
    ? new Date(laden.inhalt.erstellt).toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'unbekanntem Datum';

  return (
    <SafeAreaView style={stile.seite}>
      <View style={stile.rand}>
        <ZurueckKopf titel="Sicherung" />
      </View>
      <ScrollView contentContainerStyle={stile.inhalt}>
        <Karte
          titel="Sicherung speichern"
          text="Alle Eröffnungen, dein Lernstand und die Einstellungen in einer Datei."
        >
          <Knopf
            titel="Speichern oder teilen …"
            aus={beschaeftigt}
            onPress={() => {
              if (db.status === 'bereit') void ausfuehren(() => sicherungTeilen(db.sql));
            }}
          />
        </Karte>
        <Karte
          titel="Sicherung laden"
          text="Ersetzt alles in der App durch den Stand aus der Datei. Vorher fragt sie nach."
        >
          <Knopf
            titel="Datei wählen …"
            art="rahmen"
            aus={beschaeftigt}
            onPress={() => void dateiWaehlen()}
          />
        </Karte>
        <Karte
          titel="Eröffnungen als PGN"
          text="Alle Eröffnungen als PGN-Datei – für Lichess, ChessBase und andere Apps."
        >
          <Knopf
            titel="Exportieren …"
            art="rahmen"
            aus={beschaeftigt}
            onPress={() => {
              if (db.status === 'bereit') void ausfuehren(() => pgnTeilen(db.sql));
            }}
          />
        </Karte>
        {meldung && (
          <Text
            style={[
              stile.meldung,
              { color: meldung.art === 'ok' ? FARBEN.richtig : FARBEN.falsch },
            ]}
            accessibilityLiveRegion="polite"
          >
            {meldung.text}
          </Text>
        )}
        <Text style={stile.hinweis}>
          Prepline speichert alles nur auf deinem Handy. Die Datei legst du selbst ab, z. B. in
          Drive.
        </Text>
      </ScrollView>
      <BestaetigenDialog
        sichtbar={laden !== null}
        titel="Alles ersetzen?"
        text={`Die Sicherung vom ${datum} mit ${laden?.inhalt.eroeffnungen ?? 0} Eröffnungen ersetzt alle Eröffnungen und deinen Lernstand in der App. Das lässt sich nicht rückgängig machen.`}
        bestaetigen="Ersetzen"
        gefaehrlich
        onAbbrechen={() => setLaden(null)}
        onBestaetigen={einspielen}
      />
    </SafeAreaView>
  );
}

function Karte({
  titel,
  text,
  children,
}: {
  titel: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <View style={stile.karte}>
      <Text style={stile.titel}>{titel}</Text>
      <Text style={stile.text}>{text}</Text>
      <View style={stile.knopf}>{children}</View>
    </View>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  rand: { paddingHorizontal: 20 },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },
  karte: { backgroundColor: FARBEN.karte, borderRadius: RUNDUNG, padding: 20, gap: 6 },
  titel: { color: FARBEN.text, fontSize: 17, fontWeight: '700' },
  text: { color: FARBEN.textLeise, fontSize: 14, lineHeight: 20 },
  knopf: { marginTop: 10 },
  meldung: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  hinweis: {
    color: FARBEN.textLeise,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 4,
  },
});
