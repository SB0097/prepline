import { NEU_PRO_TAG_BEREICH } from '@prepline/shared';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { useDatenbank } from '@/daten/DatenAnbieter';
import {
  einstellungAendern,
  type Einstellungen,
  einstellungenLaden,
  neuProTagBegrenzen,
} from '@/daten/einstellungen';
import { useGeladen } from '@/daten/useGeladen';
import { Abschnitt, RUNDUNG, SeitenTitel } from '@/ui/bausteine';
import { FIGURENSAETZE, type Figurensatz } from '@/ui/brett/figuren';
import { FIGUREN_SVG } from '@/ui/brett/figurenSvg';
import { FARBEN } from '@/ui/farben';

// Mehr-Seite (Skizze M2, 11.11.2026): Figuren als Vorschau-Kacheln, darunter die Trainings-Einstellungen.
// Sicherung, „Über Prepline“ und Datenschutz kommen mit M8 dazu.
const NAMEN: Record<Figurensatz, string> = {
  klassisch: 'Klassisch',
  modern: 'Modern',
  verspielt: 'Verspielt',
};

export function MehrSeite() {
  const db = useDatenbank();
  const geladen = useGeladen(einstellungenLaden);
  const [geaendert, setGeaendert] = useState<Einstellungen | null>(null);
  const e = geaendert ?? geladen;

  const aendern = <K extends keyof Einstellungen>(schluessel: K, wert: Einstellungen[K]) => {
    if (!e || db.status !== 'bereit') return;
    setGeaendert({ ...e, [schluessel]: wert });
    void einstellungAendern(db.sql, schluessel, wert);
  };

  if (!e) return <View style={stile.seite} />;
  return (
    <ScrollView style={stile.seite} contentContainerStyle={stile.inhalt}>
      <SeitenTitel titel="Mehr" />
      <Abschnitt titel="Figuren" />
      <View style={stile.figuren}>
        {FIGURENSAETZE.map((satz) => (
          <FigurenKachel
            key={satz}
            satz={satz}
            aktiv={satz === e.figurensatz}
            onPress={() => aendern('figurensatz', satz)}
          />
        ))}
      </View>
      <Abschnitt titel="Training" />
      <View style={stile.gruppe}>
        <View style={stile.zeile}>
          <Text style={stile.zeilenText}>Neue Züge pro Tag</Text>
          <View style={stile.zaehler}>
            <Pressable
              onPress={() => aendern('neuProTag', neuProTagBegrenzen(e.neuProTag - 1))}
              disabled={e.neuProTag <= NEU_PRO_TAG_BEREICH.min}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Weniger"
            >
              <Text style={stile.zaehlerZeichen}>−</Text>
            </Pressable>
            <Text style={stile.zaehlerWert} testID="neu-pro-tag">
              {e.neuProTag}
            </Text>
            <Pressable
              onPress={() => aendern('neuProTag', neuProTagBegrenzen(e.neuProTag + 1))}
              disabled={e.neuProTag >= NEU_PRO_TAG_BEREICH.max}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mehr"
            >
              <Text style={stile.zaehlerZeichen}>+</Text>
            </Pressable>
          </View>
        </View>
        <SchalterZeile titel="Ton" wert={e.ton} onWert={(w) => aendern('ton', w)} />
        <SchalterZeile
          titel="Vibration"
          wert={e.vibration}
          onWert={(w) => aendern('vibration', w)}
        />
      </View>
    </ScrollView>
  );
}

function FigurenKachel({
  satz,
  aktiv,
  onPress,
}: {
  satz: Figurensatz;
  aktiv: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: aktiv }}
      accessibilityLabel={`Figuren ${NAMEN[satz]}`}
      style={[stile.figurKachel, aktiv && stile.figurKachelAktiv]}
    >
      <View style={stile.vorschau}>
        <View style={[stile.vorschauFeld, { backgroundColor: FARBEN.brettHell }]}>
          <SvgXml xml={FIGUREN_SVG[satz].wK} width={36} height={36} />
        </View>
        <View style={[stile.vorschauFeld, { backgroundColor: FARBEN.brettDunkel }]}>
          <SvgXml xml={FIGUREN_SVG[satz].bN} width={36} height={36} />
        </View>
      </View>
      <Text style={[stile.figurName, aktiv && stile.figurNameAktiv]}>{NAMEN[satz]}</Text>
    </Pressable>
  );
}

function SchalterZeile({
  titel,
  wert,
  onWert,
}: {
  titel: string;
  wert: boolean;
  onWert: (wert: boolean) => void;
}) {
  return (
    <View style={[stile.zeile, stile.trenner]}>
      <Text style={stile.zeilenText}>{titel}</Text>
      <Switch
        value={wert}
        onValueChange={onWert}
        accessibilityLabel={titel}
        trackColor={{ false: FARBEN.linie, true: FARBEN.akzent }}
        thumbColor={wert ? FARBEN.textAufAkzent : FARBEN.textLeise}
      />
    </View>
  );
}

const stile = StyleSheet.create({
  seite: { flex: 1, backgroundColor: FARBEN.hintergrund },
  inhalt: { paddingHorizontal: 20, paddingBottom: 32 },
  figuren: { flexDirection: 'row', gap: 8 },
  figurKachel: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: FARBEN.karte,
    borderWidth: 1,
    borderColor: FARBEN.linie,
  },
  figurKachelAktiv: { borderWidth: 2.5, borderColor: FARBEN.akzent },
  vorschau: { flexDirection: 'row' },
  vorschauFeld: { width: 36, height: 36 },
  figurName: { color: FARBEN.text, fontSize: 14 },
  figurNameAktiv: { color: FARBEN.akzent, fontWeight: '700' },
  gruppe: { backgroundColor: FARBEN.karte, borderRadius: RUNDUNG, paddingHorizontal: 20 },
  zeile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
  },
  trenner: { borderTopWidth: 1, borderTopColor: FARBEN.linie },
  zeilenText: { color: FARBEN.text, fontSize: 16 },
  zaehler: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: FARBEN.linie,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  zaehlerZeichen: { color: FARBEN.akzent, fontSize: 20 },
  zaehlerWert: {
    color: FARBEN.text,
    fontSize: 16,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
  },
});
