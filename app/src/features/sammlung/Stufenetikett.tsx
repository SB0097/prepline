import type { Stufe } from '@prepline/shared';
import { StyleSheet, Text, View } from 'react-native';

import { STUFE_FARBE, STUFE_TEXT } from '@/ui/stufen';

/** Kleines farbiges Etikett: Einsteiger (grün), Fortgeschritten (gelb), Profi (rot). */
export function Stufenetikett({ stufe }: { stufe: Stufe }) {
  const farbe = STUFE_FARBE[stufe];
  return (
    <View style={[stile.etikett, { backgroundColor: `${farbe}29` }]}>
      <Text style={[stile.text, { color: farbe }]}>{STUFE_TEXT[stufe]}</Text>
    </View>
  );
}

const stile = StyleSheet.create({
  etikett: { borderRadius: 11, paddingHorizontal: 9, paddingVertical: 3 },
  text: { fontSize: 11, fontWeight: '700' },
});
