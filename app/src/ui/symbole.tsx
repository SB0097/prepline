// Symbole der App (24er Raster), gezeichnet mit react-native-svg.
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type Symbolname =
  | 'heute'
  | 'repertoire'
  | 'mehr'
  | 'flamme'
  | 'start'
  | 'birne'
  | 'haken'
  | 'plus'
  | 'kreuz'
  | 'pfeilUnten'
  | 'pfeilOben';

/** Symbole aus einer einzelnen Linie. */
const LINIEN: Partial<Record<Symbolname, string>> = {
  haken: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  kreuz: 'M6 6l12 12M18 6L6 18',
  pfeilUnten: 'M6 9l6 6l6-6',
  pfeilOben: 'M6 15l6-6l6 6',
};

export function Zeichen({
  name,
  farbe,
  groesse = 24,
}: {
  name: Symbolname;
  farbe: string;
  groesse?: number;
}) {
  const linie = LINIEN[name];
  return (
    <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
      {linie && (
        <Path
          d={linie}
          fill="none"
          stroke={farbe}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === 'heute' && (
        <>
          <Rect
            x={4}
            y={5}
            width={16}
            height={15}
            rx={3}
            fill="none"
            stroke={farbe}
            strokeWidth={2}
          />
          <Path d="M4 10h16M9 3v4M15 3v4" stroke={farbe} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={12} cy={15} r={2} fill={farbe} />
        </>
      )}
      {name === 'repertoire' && (
        <>
          <Rect
            x={4}
            y={4}
            width={16}
            height={16}
            rx={3}
            fill="none"
            stroke={farbe}
            strokeWidth={2}
          />
          <Rect x={4} y={4} width={8} height={8} rx={1} fill={farbe} opacity={0.9} />
          <Rect x={12} y={12} width={8} height={8} rx={1} fill={farbe} opacity={0.9} />
        </>
      )}
      {name === 'mehr' && (
        <>
          <Circle cx={6} cy={12} r={2} fill={farbe} />
          <Circle cx={12} cy={12} r={2} fill={farbe} />
          <Circle cx={18} cy={12} r={2} fill={farbe} />
        </>
      )}
      {name === 'flamme' && (
        <>
          <Path
            d="M12.2 2.2c.5 3.4 5.3 5.6 5.3 11A5.5 5.5 0 0 1 12 18.8a5.5 5.5 0 0 1-5.5-5.6c0-2.2.9-3.9 2-5.1c.3 1.4 1 2.3 2.1 2.8c-.3-3 .2-6.2 1.6-8.7z"
            fill={farbe}
          />
          <Path d="M8 22h8" stroke={farbe} strokeWidth={2} strokeLinecap="round" />
        </>
      )}
      {name === 'start' && (
        <Path
          d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"
          fill={farbe}
        />
      )}
      {name === 'birne' && (
        <>
          <Path
            d="M12 3a6.2 6.2 0 0 0-3.6 11.2V16h7.2v-1.8A6.2 6.2 0 0 0 12 3z"
            fill="none"
            stroke={farbe}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Path
            d="M9.6 19.2h4.8M10.8 21.8h2.4"
            stroke={farbe}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}
