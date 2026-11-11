// Der Coach-Bauer (Skizze A, Serkan 11.11.2026) – zugleich das App-Logo (L1).
import Svg, { Circle, Path } from 'react-native-svg';

import { BAUER_AUGEN, BAUER_MUND, BAUER_UMRISS, LOGO_FARBEN, STRICH } from './logo/logoDaten';

/** `groesse` ist die Höhe; die Breite ergibt sich aus der Form. */
export function CoachBauer({ groesse }: { groesse: number }) {
  return (
    <Svg
      width={groesse * 0.85}
      height={groesse}
      viewBox="8 0 84 102"
      accessibilityLabel="Coach-Bauer"
    >
      <BauerTeile />
    </Svg>
  );
}

/** Die Bauteile des Bauern, einzeln ein- und ausblendbar (für die Start-Animation). */
export function BauerTeile({
  umriss = true,
  leuchten = true,
  gesicht = true,
}: {
  umriss?: boolean;
  leuchten?: boolean;
  gesicht?: boolean;
}) {
  return (
    <>
      {leuchten && (
        <Path
          d={BAUER_UMRISS}
          fill="none"
          stroke={LOGO_FARBEN.akzent}
          strokeOpacity={0.28}
          strokeWidth={STRICH.leuchten}
          strokeLinejoin="round"
        />
      )}
      {umriss && (
        <Path
          d={BAUER_UMRISS}
          fill={LOGO_FARBEN.hintergrund}
          stroke={LOGO_FARBEN.akzent}
          strokeWidth={STRICH.linie}
          strokeLinejoin="round"
        />
      )}
      {gesicht && (
        <>
          {BAUER_AUGEN.map(([x, y]) => (
            <Circle key={x} cx={x} cy={y} r={STRICH.augen} fill={LOGO_FARBEN.hell} />
          ))}
          <Path
            d={BAUER_MUND}
            fill="none"
            stroke={LOGO_FARBEN.hell}
            strokeWidth={STRICH.mund}
            strokeLinecap="round"
          />
        </>
      )}
    </>
  );
}
