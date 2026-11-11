# Prepline

Schach-Eröffnungstrainer für Android: Mit Prepline lernt man das eigene Eröffnungsrepertoire.
Eröffnungen werden als PGN importiert, die App spielt die Züge des Gegners und fragt die eigenen Züge ab.
Wiederholt wird nach dem Prinzip der verteilten Wiederholung (Spaced Repetition): Fehler kommen öfter dran, sichere Züge seltener.

## Funktionen (geplant)

- PGN-Import aus Datei oder Zwischenablage, inklusive Varianten und Nebenvarianten
- Getrenntes Repertoire für Weiß und Schwarz
- Training: Die App spielt den Gegner, gesucht ist der eigene Zug
- Wiederholungsplan pro Zug mit täglicher Übersicht
- Fortschritt pro Eröffnung und Variante
- Vollständig offline: kein Konto, kein Server, alle Daten bleiben auf dem Gerät

## Status

In Entwicklung. Noch keine veröffentlichte Version.

## Branches

- `main` – veröffentlichter Stand
- `test` – Stand für den Gerätetest
- `feature/<name>`, `fix/<name>` – zweigen von `test` ab, Pull Request → `test`

## Aufbau (geplant)

| Ordner    | Inhalt                                                       |
| --------- | ------------------------------------------------------------ |
| `app/`    | Expo / React Native App (TypeScript, expo-router)            |
| `shared/` | Plattformunabhängige Logik: PGN-Parser, Repertoire, Lernplan |
| `docs/`   | Dokumentation, Datenschutz, Store-Texte                      |

## Technik

- Expo, React Native, TypeScript
- Lokale Datenhaltung mit SQLite
- npm-Workspaces als Monorepo
- ESLint, Prettier, Jest, GitHub Actions

## Lizenz

Proprietär – alle Rechte vorbehalten. Siehe [`LICENSE`](LICENSE).
