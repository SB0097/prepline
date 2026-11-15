// Text und Eingabefeld in der App-Schrift Inter. Die Schnitte 400–800 sind über das
// expo-font-Plugin unter dem Namen „Inter“ eingebettet, die Stärke kommt aus fontWeight.
import type { ComponentProps } from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';

export const SCHRIFT = 'Inter';

/**
 * Wie stark Text mit der Systemschrift (Einstellungen → Schriftgröße) wachsen darf.
 * Wie bei Android 14: Große Schrift ist schon gut lesbar und wächst nur gebremst mit,
 * sonst sprengen Titel und große Zahlen die Seite. Normaler Text wächst voll mit.
 */
export function schriftWachstum(groesse: number | undefined): number | undefined {
  if (groesse === undefined) return undefined;
  if (groesse >= 28) return 1.3;
  if (groesse >= 20) return 1.6;
  return undefined;
}

export function Text({ style, maxFontSizeMultiplier, ...rest }: ComponentProps<typeof RNText>) {
  return (
    <RNText
      style={[{ fontFamily: SCHRIFT }, style]}
      maxFontSizeMultiplier={
        maxFontSizeMultiplier ?? schriftWachstum(StyleSheet.flatten(style)?.fontSize)
      }
      {...rest}
    />
  );
}

export function TextInput({ style, ...rest }: ComponentProps<typeof RNTextInput>) {
  return <RNTextInput style={[{ fontFamily: SCHRIFT }, style]} {...rest} />;
}

/** Ziffern gleich breit, damit Zähler beim Hochzählen nicht springen. */
export const ZIFFERN_GLEICH = { fontVariant: ['tabular-nums'] } as const;
