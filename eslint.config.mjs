// Gemeinsame ESLint-Konfiguration für das ganze Monorepo (Flat Config).
// App: Expo-Regeln. shared: TypeScript-Regeln. Formatierung macht Prettier.
import js from '@eslint/js';
import expoConfig from 'eslint-config-expo/flat.js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const nurIn = (ordner, configs) =>
  configs.map((c) => ({ ...c, files: c.files ?? [`${ordner}/**/*.{ts,tsx,js,mjs,cjs}`] }));

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.expo/**',
      'app/android/**',
      'app/ios/**',
      'app/expo-env.d.ts',
    ],
  },

  // --- App (Expo / React Native) ---
  ...nurIn('app', expoConfig),
  {
    // Damit der "@/..."-Kurzpfad aus app/tsconfig.json beim Lint vom Wurzelordner aus gefunden wird.
    files: ['app/**/*.{ts,tsx}'],
    settings: {
      'import/resolver': { typescript: { project: 'app/tsconfig.json' } },
    },
  },

  // --- shared (reine Logik, TypeScript) ---
  ...nurIn('shared', [js.configs.recommended, ...tseslint.configs.recommended]),
  {
    files: ['shared/**/*.{ts,js,mjs}', 'app/scripts/**/*.mjs', '*.{js,mjs,cjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Konfigurationsdateien im CommonJS-Format (z. B. jest.config.cjs).
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    languageOptions: { globals: { ...globals.jest } },
  },

  {
    // Eingebaute Namen nicht überschreiben: Eine eigene Komponente "Symbol" bringt den
    // React-Compiler durcheinander, weil er Symbol.for(...) braucht.
    files: ['**/*.{ts,tsx,js,mjs}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            ':matches(FunctionDeclaration, ClassDeclaration, VariableDeclarator) > Identifier.id[name=/^(Symbol|Map|Set|WeakMap|WeakSet|Promise|Proxy|Reflect|Object|Array|String|Number|Boolean|BigInt|Error|Date|JSON|Math|RegExp)$/]',
          message: 'Eingebauten Namen nicht überschreiben – anders benennen.',
        },
      ],
    },
  },

  // Muss zuletzt kommen: schaltet Regeln ab, die mit Prettier kollidieren.
  prettier,
];
