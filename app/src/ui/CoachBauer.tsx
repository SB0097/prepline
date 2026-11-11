// Der Coach-Bauer (Skizze A, Serkan 11.11.2026): Linien-Bauer mit blauem Leuchten wie das Logo.
import Svg, { Circle, Path } from 'react-native-svg';

import { FARBEN } from './farben';

const UMRISS =
  'M50 8a17 17 0 1 1 0 34a17 17 0 1 1 0-34zM36 44h28l-4 8h-20zM38 54h24c2 14 6 24 14 32h-52c8-8 12-18 14-32zM20 88h60a4 4 0 0 1 4 4v4h-68v-4a4 4 0 0 1 4-4z';

/** `groesse` ist die Höhe; die Breite ergibt sich aus der Form. */
export function CoachBauer({ groesse }: { groesse: number }) {
  return (
    <Svg
      width={groesse * 0.85}
      height={groesse}
      viewBox="8 0 84 102"
      accessibilityLabel="Coach-Bauer"
    >
      <Path
        d={UMRISS}
        fill="none"
        stroke={FARBEN.akzent}
        strokeOpacity={0.25}
        strokeWidth={10}
        strokeLinejoin="round"
      />
      <Path
        d={UMRISS}
        fill={FARBEN.hintergrund}
        stroke={FARBEN.akzent}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Circle cx={44} cy={25} r={3} fill={FARBEN.text} />
      <Circle cx={56} cy={25} r={3} fill={FARBEN.text} />
      <Path
        d="M45 32q5 4 10 0"
        fill="none"
        stroke={FARBEN.text}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
