import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Knopf, RUNDUNG, ZurueckKopf } from '@/ui/bausteine';
import { FARBEN } from '@/ui/farben';

import { entwurfSetzen } from './entwurf';

// Import: kopierte Züge oder PGN-Text einfügen.
export function TextSeite() {
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
          placeholderTextColor={FARBEN.textLeise}
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

const stile = StyleSheet.create({
  seite: {
    flex: 1,
    backgroundColor: FARBEN.hintergrund,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  fuellen: { flex: 1 },
  eingabe: {
    flex: 1,
    marginVertical: 16,
    padding: 16,
    borderRadius: RUNDUNG,
    backgroundColor: FARBEN.karte,
    color: FARBEN.text,
    fontSize: 15,
    textAlignVertical: 'top',
  },
});
