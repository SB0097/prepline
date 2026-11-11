import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  BRETT,
  GITTER_PFAD,
  KOENIG,
  LOGO_BEREICH,
  LOGO_FARBEN,
  MATTZUG,
  MATTZUG_PFAD,
  RAHMEN,
} from './logoDaten';

/** Das App-Logo „Linienbrett“ ohne Hintergrund, quadratisch in der angegebenen Größe. */
export function LogoGrafik({ groesse }: { groesse: number }) {
  const [start, , ziel] = MATTZUG;
  const { x, y, breite } = LOGO_BEREICH;
  return (
    <Svg
      width={groesse}
      height={groesse}
      viewBox={`${x} ${y} ${breite} ${breite}`}
      accessibilityLabel="Prepline-Logo"
    >
      {RAHMEN.map((r) => (
        <Rect
          key={r.abstand}
          x={-r.abstand}
          y={-r.abstand}
          width={BRETT + 2 * r.abstand}
          height={BRETT + 2 * r.abstand}
          rx={r.rundung}
          fill="none"
          stroke={LOGO_FARBEN.akzent}
          strokeOpacity={r.deckkraft}
          strokeWidth={r.staerke}
        />
      ))}
      <Path d={GITTER_PFAD} fill="none" stroke={LOGO_FARBEN.gitter} strokeWidth={1.2} />
      <Path
        d={MATTZUG_PFAD}
        fill="none"
        stroke={LOGO_FARBEN.akzent}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={start[0]} cy={start[1]} r={3.5} fill={LOGO_FARBEN.hell} />
      <Circle cx={ziel[0]} cy={ziel[1]} r={5} fill={LOGO_FARBEN.akzent} />
      <Circle
        cx={KOENIG[0]}
        cy={KOENIG[1]}
        r={5}
        fill="none"
        stroke={LOGO_FARBEN.hell}
        strokeWidth={1.5}
      />
    </Svg>
  );
}
