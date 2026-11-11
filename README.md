# Schach-Eröffnungstrainer

Android-App zum Lernen des eigenen Eröffnungsrepertoires im Schach.
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

## Aufbau

| Ordner    | Inhalt                                                       |
| --------- | ------------------------------------------------------------ |
| `app/`    | Expo / React Native App (TypeScript, expo-router)            |
| `shared/` | Plattformunabhängige Logik: PGN-Parser, Repertoire, Lernplan |

## Technik

- Expo SDK 58, React Native 0.88, TypeScript 6
- Lokale Datenhaltung mit SQLite
- npm-Workspaces als Monorepo
- ESLint, Prettier, Jest, GitHub Actions

## Entwicklung

Voraussetzungen: Node.js 24 (siehe `.nvmrc`), Android Studio mit SDK, JDK 21.

| Befehl                | Was passiert                                             |
| --------------------- | -------------------------------------------------------- |
| `npm install`         | Alle Pakete installieren (im Wurzelordner)               |
| `npm run check`       | Typecheck + Lint + Formatierung + Tests (vor jedem Push) |
| `npm run format`      | Code automatisch formatieren                             |
| `npm start -w app`    | Metro-Server für die Debug-App starten                   |
| `npm run logo -w app` | App-Icons aus `app/src/ui/logo/logoDaten.ts` erzeugen    |

### Debug-App lokal bauen (Windows)

Das Projekt sollte unter Windows in einem kurzen Pfad ohne Leerzeichen liegen (z. B. `C:\dev\prepline`).
Der native Build braucht CMake 4.1.2 oder neuer (Android Studio → SDK Tools).

```powershell
$env:ANDROID_HOME = "C:\Users\Public\android-sdk"   # Verweis ohne Leerzeichen auf das SDK
$env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=C:\Users\Public\java-tmp"
$env:CMAKE_POLICY_VERSION_MINIMUM = "3.5"
cd app
npx expo prebuild --platform android --no-install   # nur nach nativen Änderungen nötig
# app/android/local.properties: sdk.dir und cmake.dir eintragen
cd android; .\gradlew.bat app:assembleDebug -PreactNativeArchitectures=x86_64; cd ..   # Emulator
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
npm start
adb reverse tcp:8081 tcp:8081
```

Für ein echtes Gerät `-PreactNativeArchitectures=arm64-v8a` verwenden und per USB oder WLAN-Debugging
(`adb connect <IP:Port>`) installieren. Store-Versionen werden mit EAS Build erstellt.

## Lizenz

Proprietär – alle Rechte vorbehalten. Siehe [`LICENSE`](LICENSE).
