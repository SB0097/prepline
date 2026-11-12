// Gemeinsame Jest-Einstellungen für die Node-Pakete (shared).
// Der Code ist ESM (wie in der App). Jest läuft deshalb im ESM-Modus
// (Start mit "node --experimental-vm-modules", siehe "test"-Skripte).
// ts-jest übersetzt jede Datei einzeln, Typen prüft "npm run typecheck".
module.exports = {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: { isolatedModules: true } }],
  },
};
