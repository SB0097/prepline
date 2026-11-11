// Symbole der Reiterleiste (24er Raster), gezeichnet mit react-native-svg.
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type Symbolname = 'heute' | 'repertoire' | 'mehr';

export function Zeichen({
  name,
  farbe,
  groesse = 24,
}: {
  name: Symbolname;
  farbe: string;
  groesse?: number;
}) {
  return (
    <Svg width={groesse} height={groesse} viewBox="0 0 24 24">
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
    </Svg>
  );
}
