import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Knopf, RUNDUNG, ZurueckKopf } from '@/ui/bausteine';
import { stileErstellen, useFarben } from '@/ui/thema';
import { TextInput } from '@/ui/Text';

import { entwurfSetzen } from './entwurf';

// Import: kopierte Züge oder PGN-Text einfügen.
export function TextSeite() {
  const F = useFarben();
  const stile = useStile();
  const [text, setText] = useState('');
  return (
    <SafeAreaView style={stile.seite}>
      <KeyboardAvoidingView style={stile.fuellen} behavior="height">
        <ZurueckKopf titel="Text einfügen" />
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          placeholder="Züge oder PGN hier einfügen, z. B. 1. e4 e5 2. Nf3 Nc6"
          placeholderTextColor={F.textLeise}
          style={stile.eingabe}
          accessibilityLabel="Züge oder PGN"
        />
        <Knopf
          titel="Weiter"
          aus={text.trim() === ''}
          onPress={() => {
            entwurfSetzen({ text });
            router.push('/import/pruefen');
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStile = stileErstellen((F) => ({
  seite: {
    flex: 1,
    backgroundColor: F.hintergrund,
    paddingHorizontal: 20,
  },
  // Abstand unten innerhalb des Ausweichbereichs, damit „Weiter“ nicht an der Tastatur klebt.
  fuellen: { flex: 1, paddingBottom: 16 },
  eingabe: {
    flex: 1,
    marginVertical: 16,
    padding: 16,
    borderRadius: RUNDUNG,
    backgroundColor: F.karte,
    color: F.text,
    fontSize: 15,
    textAlignVertical: 'top',
  },
}));
