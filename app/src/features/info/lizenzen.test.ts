import { lizenzFinden } from './LizenzSeite';
import { FIGUREN_LIZENZEN, LIZENZTEXTE, PAKETE } from './lizenzenDaten';

describe('Lizenzen', () => {
  it('enthält die wichtigsten Bibliotheken mit Lizenztext', () => {
    for (const name of ['chess.js', 'ts-fsrs', 'react-native', 'expo', 'react']) {
      const paket = PAKETE.find((p) => p[0] === name);
      expect(paket).toBeDefined();
      expect(LIZENZTEXTE[paket![3]]!.length).toBeGreaterThan(100);
    }
  });

  it('hat für jedes Paket einen Lizenztext', () => {
    for (const [, , , i] of PAKETE) expect(LIZENZTEXTE[i]!.length).toBeGreaterThan(20);
  });

  it('enthält keine Entwicklungswerkzeuge', () => {
    const namen = PAKETE.map((p) => p[0]);
    expect(namen).not.toContain('expo-dev-client');
    expect(namen).not.toContain('jest');
    expect(namen).not.toContain('metro');
  });

  it('nennt alle drei Figurensätze', () => {
    expect(FIGUREN_LIZENZEN.map((f) => f[1])).toEqual(['BSD-3-Clause', 'Apache-2.0', 'CC0-1.0']);
    expect(lizenzFinden(undefined, '0')?.text).toContain('Colin M.L. Burnett');
    expect(lizenzFinden('chess.js', undefined)?.lizenz).toBe('BSD-2-Clause');
    expect(lizenzFinden('gibt-es-nicht', undefined)).toBeNull();
  });
});
