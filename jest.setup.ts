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
// 2. @react-navigation/elements のモック
//    - HeaderBackButton をテスト用 Pressable に差し替える
//    - label / onPress props を保持し、testID で取得可能にする
// ─────────────────────────────────────────────────────────────
jest.mock('@react-navigation/elements', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, Text } = require('react-native');

  function MockHeaderBackButton(props: { label?: string; onPress?: () => void }) {
    return React.createElement(
      Pressable,
      { testID: 'header-back-button', onPress: props.onPress, accessibilityRole: 'button' },
      React.createElement(Text, null, props.label ?? 'Back')
    );
  }
  MockHeaderBackButton.displayName = 'HeaderBackButton';

  return {
    HeaderBackButton: MockHeaderBackButton,
  };
});

// ─────────────────────────────────────────────────────────────
// 3. expo-router のモック
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
    useNavigation: jest.fn(() => ({
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      dispatch: jest.fn(),
    })),
  };
});

// ─────────────────────────────────────────────────────────────
// 3.5. expo-localization のモック
//    テスト環境では日本語ロケールを返すようにする。
// ─────────────────────────────────────────────────────────────
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [
    {
      languageTag: 'ja-JP',
      languageCode: 'ja',
      regionCode: 'JP',
      currencyCode: 'JPY',
      currencySymbol: '¥',
      decimalSeparator: '.',
      digitGroupingSeparator: ',',
      textDirection: 'ltr',
      measurementSystem: 'metric',
      temperatureUnit: 'celsius',
    },
  ]),
  getCalendars: jest.fn(() => [
    { calendar: 'gregory', timeZone: 'Asia/Tokyo', uses24hourClock: true },
  ]),
}));

// ─────────────────────────────────────────────────────────────
// 4. expo-font のモック（テスト環境ではフォント読み込みをスキップ）
// ─────────────────────────────────────────────────────────────
jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: jest.fn(() => [true, null]),
}));

// ─────────────────────────────────────────────────────────────
// 5. expo-splash-screen のモック
// ─────────────────────────────────────────────────────────────
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// ─────────────────────────────────────────────────────────────
// 6. @react-native-async-storage/async-storage のモック
//    ネイティブモジュールは Jest 環境では存在しないため、
//    インメモリのストレージに差し替える。
// ─────────────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store = {};
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
      multiGet: jest.fn((keys: string[]) =>
        Promise.resolve(keys.map((k) => [k, store[k] ?? null]))
      ),
      multiSet: jest.fn((pairs: [string, string][]) => {
        pairs.forEach(([k, v]) => {
          store[k] = v;
        });
        return Promise.resolve();
      }),
      multiRemove: jest.fn((keys: string[]) => {
        keys.forEach((k) => delete store[k]);
        return Promise.resolve();
      }),
      // テスト間でストアをリセットするためのヘルパー
      __resetStore: () => {
        store = {};
      },
    },
  };
});

// ─────────────────────────────────────────────────────────────
// 7. react-native-safe-area-context のモック
//    テスト環境ではネイティブの SafeAreaProvider が不要なため
//    シンプルな View ラッパーに差し替える。
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
// 8. react-native-google-mobile-ads のモック
//    ネイティブモジュール（RNGoogleMobileAdsModule）は Jest (Node.js) 環境
//    では存在しないため、BannerAd 等をダミーコンポーネントに差し替える。
// ─────────────────────────────────────────────────────────────
jest.mock('react-native-google-mobile-ads', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native');

  // BannerAd のモック: unitId / size を表示し、testID で検索可能にする。
  // jest.setup.ts は .ts ファイルのため JSX が使えず React.createElement を使用。
  function MockBannerAd(props: Record<string, unknown>) {
    return React.createElement(
      View,
      { testID: 'mock-banner-ad' },
      React.createElement(Text, { testID: 'mock-banner-ad-unit-id' }, props.unitId),
      React.createElement(Text, { testID: 'mock-banner-ad-size' }, props.size)
    );
  }
  MockBannerAd.displayName = 'BannerAd';

  return {
    BannerAd: MockBannerAd,
    BannerAdSize: {
      ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
      BANNER: 'BANNER',
      LARGE_BANNER: 'LARGE_BANNER',
      MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
    },
    TestIds: {
      ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/9214589741',
      BANNER: 'ca-app-pub-3940256099942544/2934735716',
    },
  };
});

// ─────────────────────────────────────────────────────────────
// 9. @react-native-firebase のモック
//    ネイティブモジュール（RNFBAppModule 等）は Jest (Node.js) 環境では
//    存在しないため、必要な API をスタブに差し替える。
// ─────────────────────────────────────────────────────────────
const mockHttpsCallable = jest.fn(() =>
  jest.fn(() => Promise.resolve({ data: { questions: [] } }))
);
const mockFunctionsInstance = {
  httpsCallable: mockHttpsCallable,
  useEmulator: jest.fn(),
};
jest.mock('@react-native-firebase/functions', () => jest.fn(() => mockFunctionsInstance));

const mockProvider = {
  configure: jest.fn(),
};
const mockAppCheckInstance = {
  newReactNativeFirebaseAppCheckProvider: jest.fn(() => mockProvider),
  initializeAppCheck: jest.fn(() => Promise.resolve()),
};
jest.mock('@react-native-firebase/app-check', () => jest.fn(() => mockAppCheckInstance));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: {},
}));

// ─────────────────────────────────────────────────────────────
// 10. lib/firebase のモック
//    lib/firebase.ts は import 時に initializeAppCheck() を実行し、
//    その非同期処理が Jest ワーカーに残留して open handle 警告を引き起こす。
//    グローバルモックとして差し替えることで非同期処理の残留を防ぐ。
//    ※ QuizScreen.test.tsx など個別テストで上書きする場合は
//       各ファイル内で jest.mock('@/lib/firebase', ...) を再定義する。
// ─────────────────────────────────────────────────────────────
jest.mock('@/lib/firebase', () => ({
  functions: {
    httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { questions: [] } }))),
    useEmulator: jest.fn(),
  },
  firebase: {},
}));
