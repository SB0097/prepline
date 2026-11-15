// Dialoge im Stil „Mitternacht“: Rückfrage (z. B. vor dem Löschen), Texteingabe und ein kleines Menü.
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput } from './Text';

import { stileErstellen, useFarben } from './thema';

function Huelle({
  sichtbar,
  onSchliessen,
  children,
}: {
  sichtbar: boolean;
  onSchliessen: () => void;
  children: React.ReactNode;
}) {
  const stile = useStile();
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
  const F = useFarben();
  const stile = useStile();
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
          { backgroundColor: gefaehrlich ? F.falsch : F.akzent },
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
  const stile = useStile();
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
  const stile = useStile();
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
  const F = useFarben();
  const stile = useStile();
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
        {/* Außen der Schatten, innen die Rundung: so schneidet die Rundung den Schatten nicht ab. */}
        <View style={[stile.menueSchatten, { top: oben + 60 }]}>
          <View style={stile.menue} accessibilityRole="menu">
            {punkte.map((p, i) => (
              <Pressable
                key={p.titel}
                onPress={() => {
                  onSchliessen();
                  p.onPress();
                }}
                accessibilityRole="menuitem"
                style={({ pressed }) => [
                  stile.menuepunkt,
                  i > 0 && stile.trenner,
                  pressed && stile.menuepunktGedrueckt,
                ]}
              >
                <Text style={[stile.menueText, p.gefaehrlich && { color: F.falsch }]}>
                  {p.titel}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const useStile = stileErstellen((F) => ({
  hintergrund: {
    flex: 1,
    backgroundColor: F.schleier,
    justifyContent: 'center',
    padding: 30,
  },
  karte: { backgroundColor: F.karte, borderRadius: 26, padding: 22, gap: 12 },
  titel: { color: F.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  text: { color: F.textLeise, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  eingabe: {
    backgroundColor: F.hintergrund,
    borderColor: F.linie,
    borderWidth: 1,
    borderRadius: 16,
    color: F.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  knoepfe: { flexDirection: 'row', gap: 12, marginTop: 8 },
  knopf: { flex: 1, borderRadius: 20, paddingVertical: 13, alignItems: 'center' },
  knopfLeise: { borderWidth: 2, borderColor: F.linie },
  knopfLeiseText: { color: F.text, fontSize: 15 },
  knopfText: { color: F.hintergrund, fontSize: 15, fontWeight: '700' },
  // Menü (Runde 18): Seite leicht abgedunkelt, Menü mit Schatten, damit es sich klar abhebt.
  menueHintergrund: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  menueSchatten: {
    position: 'absolute',
    right: 16,
    minWidth: 200,
    borderRadius: 18,
    boxShadow: `0px 12px 32px ${F.schatten}`,
  },
  menue: {
    backgroundColor: F.karteHell,
    borderColor: F.linie,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  menuepunkt: { paddingHorizontal: 20, minHeight: 52, justifyContent: 'center' },
  menuepunktGedrueckt: { backgroundColor: F.linie },
  trenner: { borderTopWidth: 1, borderTopColor: F.linie },
  menueText: { color: F.text, fontSize: 16 },
}));
