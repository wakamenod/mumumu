/**
 * jest.setup.ts
 *
 * Jest 実行環境の初期化ファイル。
 * setupFilesAfterEnv で呼ばれ、各テストスイートの前に1回だけ実行される。
 */

// ─────────────────────────────────────────────────────────────
// 1. React Native Reanimated v4 のテスト環境セットアップ
//    - useSharedValue などの shared value をテスト用の同期的な実装に差し替える
//    - アニメーション (withSpring / withTiming) は即座に完了値を返す
// ─────────────────────────────────────────────────────────────
import { setUpTests } from 'react-native-reanimated';
setUpTests();

// ─────────────────────────────────────────────────────────────
// 2. expo-router のモック
//    - router.push / router.back などの遷移関数を Jest の spy に差し替える
//    - useLocalSearchParams はテストごとに上書き可能
// ─────────────────────────────────────────────────────────────
jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router');
  return {
    ...actual,
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      navigate: jest.fn(),
    },
    useLocalSearchParams: jest.fn(() => ({})),
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    })),
  };
});

// ─────────────────────────────────────────────────────────────
// 3. expo-font のモック（テスト環境ではフォント読み込みをスキップ）
// ─────────────────────────────────────────────────────────────
jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: jest.fn(() => [true, null]),
}));

// ─────────────────────────────────────────────────────────────
// 4. expo-splash-screen のモック
// ─────────────────────────────────────────────────────────────
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// ─────────────────────────────────────────────────────────────
// 5. react-native-safe-area-context のモック
//    テスト環境ではネイティブの SafeAreaProvider が不要なため
//    シンプルな View ラッパーに差し替える
// ─────────────────────────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: jest.fn(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
    useSafeAreaFrame: jest.fn(() => ({ x: 0, y: 0, width: 390, height: 844 })),
  };
});

// ─────────────────────────────────────────────────────────────
// 6. Firebase SDK のモック
//    firebase パッケージは ESM 形式のため Jest (CommonJS) では
//    そのままパースできない。テストでは実際の接続が不要なため
//    必要な API をスタブに差し替える。
// ─────────────────────────────────────────────────────────────
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  connectFunctionsEmulator: jest.fn(),
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { questions: [] } }))),
}));

jest.mock('firebase/app-check', () => ({
  initializeAppCheck: jest.fn(),
  CustomProvider: jest.fn(),
  getToken: jest.fn(),
}));
