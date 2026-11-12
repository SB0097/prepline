// Dialoge im Stil „Mitternacht“: Rückfrage (z. B. vor dem Löschen), Texteingabe und ein kleines Menü.
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FARBEN } from './farben';

function Huelle({
  sichtbar,
  onSchliessen,
  children,
}: {
  sichtbar: boolean;
  onSchliessen: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={sichtbar}
      transparent
      animationType="fade"
      onRequestClose={onSchliessen}
      statusBarTranslucent
    >
      <Pressable style={stile.hintergrund} onPress={onSchliessen} accessibilityLabel="Schließen">
        <Pressable style={stile.karte} onPress={() => undefined}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Knoepfe({
  abbrechen,
  bestaetigen,
  gefaehrlich,
  aus,
  onAbbrechen,
  onBestaetigen,
}: {
  abbrechen: string;
  bestaetigen: string;
  gefaehrlich?: boolean;
  aus?: boolean;
  onAbbrechen: () => void;
  onBestaetigen: () => void;
}) {
  return (
    <View style={stile.knoepfe}>
      <Pressable
        onPress={onAbbrechen}
        accessibilityRole="button"
        style={[stile.knopf, stile.knopfLeise]}
      >
        <Text style={stile.knopfLeiseText}>{abbrechen}</Text>
      </Pressable>
      <Pressable
        onPress={onBestaetigen}
        disabled={aus}
        accessibilityRole="button"
        style={[
          stile.knopf,
          { backgroundColor: gefaehrlich ? FARBEN.falsch : FARBEN.akzent },
          aus && { opacity: 0.4 },
        ]}
      >
        <Text style={stile.knopfText}>{bestaetigen}</Text>
      </Pressable>
    </View>
  );
}

export function BestaetigenDialog({
  sichtbar,
  titel,
  text,
  bestaetigen,
  gefaehrlich = false,
  onAbbrechen,
  onBestaetigen,
}: {
  sichtbar: boolean;
  titel: string;
  text: string;
  bestaetigen: string;
  gefaehrlich?: boolean;
  onAbbrechen: () => void;
  onBestaetigen: () => void;
}) {
  return (
    <Huelle sichtbar={sichtbar} onSchliessen={onAbbrechen}>
      <Text style={stile.titel}>{titel}</Text>
      <Text style={stile.text}>{text}</Text>
      <Knoepfe
        abbrechen="Abbrechen"
        bestaetigen={bestaetigen}
        gefaehrlich={gefaehrlich}
        onAbbrechen={onAbbrechen}
        onBestaetigen={onBestaetigen}
      />
    </Huelle>
  );
}

export function EingabeDialog({
  sichtbar,
  titel,
  anfangswert,
  onAbbrechen,
  onSpeichern,
}: {
  sichtbar: boolean;
  titel: string;
  anfangswert: string;
  onAbbrechen: () => void;
  onSpeichern: (wert: string) => void;
}) {
  const [wert, setWert] = useState(anfangswert);
  // Beim Öffnen mit dem aktuellen Wert anfangen.
  const [warSichtbar, setWarSichtbar] = useState(sichtbar);
  if (sichtbar !== warSichtbar) {
    setWarSichtbar(sichtbar);
    if (sichtbar) setWert(anfangswert);
  }
  return (
    <Huelle sichtbar={sichtbar} onSchliessen={onAbbrechen}>
      <Text style={stile.titel}>{titel}</Text>
      <TextInput
        value={wert}
        onChangeText={setWert}
        autoFocus
        selectTextOnFocus
        maxLength={60}
        style={stile.eingabe}
        accessibilityLabel={titel}
        onSubmitEditing={() => wert.trim() && onSpeichern(wert.trim())}
      />
      <Knoepfe
        abbrechen="Abbrechen"
        bestaetigen="Speichern"
        aus={wert.trim() === ''}
        onAbbrechen={onAbbrechen}
        onBestaetigen={() => onSpeichern(wert.trim())}
      />
    </Huelle>
  );
}

export type Menuepunkt = { titel: string; gefaehrlich?: boolean; onPress: () => void };

/** Kleines Menü oben rechts (für den ⋯-Knopf). */
export function Menue({
  sichtbar,
  punkte,
  onSchliessen,
}: {
  sichtbar: boolean;
  punkte: readonly Menuepunkt[];
  onSchliessen: () => void;
}) {
  const oben = useSafeAreaInsets().top;
  return (
    <Modal
      visible={sichtbar}
      transparent
      animationType="fade"
      onRequestClose={onSchliessen}
      statusBarTranslucent
    >
      <Pressable
        style={stile.menueHintergrund}
        onPress={onSchliessen}
        accessibilityLabel="Menü schließen"
      >
        <View style={[stile.menue, { top: oben + 52 }]} accessibilityRole="menu">
          {punkte.map((p, i) => (
            <Pressable
              key={p.titel}
              onPress={() => {
                onSchliessen();
                p.onPress();
              }}
              accessibilityRole="menuitem"
              style={[stile.menuepunkt, i > 0 && stile.trenner]}
            >
              <Text style={[stile.menueText, p.gefaehrlich && { color: FARBEN.falsch }]}>
                {p.titel}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const stile = StyleSheet.create({
  hintergrund: {
    flex: 1,
    backgroundColor: FARBEN.schleier,
    justifyContent: 'center',
    padding: 30,
  },
  karte: { backgroundColor: FARBEN.karte, borderRadius: 26, padding: 22, gap: 12 },
  titel: { color: FARBEN.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  text: { color: FARBEN.textLeise, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  eingabe: {
    backgroundColor: FARBEN.hintergrund,
    borderColor: FARBEN.linie,
    borderWidth: 1,
    borderRadius: 16,
    color: FARBEN.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  knoepfe: { flexDirection: 'row', gap: 12, marginTop: 8 },
  knopf: { flex: 1, borderRadius: 20, paddingVertical: 13, alignItems: 'center' },
  knopfLeise: { borderWidth: 2, borderColor: FARBEN.linie },
  knopfLeiseText: { color: FARBEN.text, fontSize: 15 },
  knopfText: { color: FARBEN.hintergrund, fontSize: 15, fontWeight: '700' },
  menueHintergrund: { flex: 1 },
  menue: {
    position: 'absolute',
    right: 14,
    minWidth: 170,
    backgroundColor: FARBEN.karteHell,
    borderColor: FARBEN.linie,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuepunkt: { paddingHorizontal: 18, paddingVertical: 14 },
  trenner: { borderTopWidth: 1, borderTopColor: FARBEN.linie },
  menueText: { color: FARBEN.text, fontSize: 15 },
});
