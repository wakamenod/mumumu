const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = defineConfig([
  // Expo 推奨ルール群 (TypeScript / React / React Native / expo-router 対応)
  ...expoConfig,

  // Prettier と競合する ESLint ルールを無効化 (必ず最後に置く)
  prettierConfig,

  // テストファイルに Jest グローバルを定義 (ESLint 9 flat config では eslint-env jest が使えない)
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)', '**/*.spec.[jt]s?(x)'],
    languageOptions: {
      globals: globals.jest,
    },
  },

  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'android/**', 'ios/**', 'coverage/**'],
  },
]);
