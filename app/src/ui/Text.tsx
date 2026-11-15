// Text und Eingabefeld in der App-Schrift Inter. Die Schnitte 400–800 sind über das
// expo-font-Plugin unter dem Namen „Inter“ eingebettet, die Stärke kommt aus fontWeight.
import type { ComponentProps } from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';

export const SCHRIFT = 'Inter';

export function Text({ style, ...rest }: ComponentProps<typeof RNText>) {
  return <RNText style={[{ fontFamily: SCHRIFT }, style]} {...rest} />;
}

export function TextInput({ style, ...rest }: ComponentProps<typeof RNTextInput>) {
  return <RNTextInput style={[{ fontFamily: SCHRIFT }, style]} {...rest} />;
}
