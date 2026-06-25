import { ExpoConfig, ConfigContext } from 'expo/config';

// GoogleService-Info.plist / google-services.json のパス解決
//   - EAS Build: シークレットファイルが環境変数のパスに展開される
//   - ローカル:  プロジェクトルートのファイルを直接参照（.gitignore 済み）
const iosGoogleServicesFile = process.env.GOOGLE_SERVICES_IOS ?? './GoogleService-Info.plist';
const androidGoogleServicesFile = process.env.GOOGLE_SERVICES_ANDROID ?? './google-services.json';

// AdMob App ID（.env.local の ADMOB_IOS_APP_ID から取得）
// 未設定の場合は Google 公式のサンプル App ID にフォールバック（テスト広告のみ配信）
const admobIosAppId = process.env.ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'mumumu',
  slug: 'mumumu',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon-female.png',
  scheme: 'mumumu',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon-female.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.wakamenod.mumumu',
    googleServicesFile: iosGoogleServicesFile,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    // App Attest エンタイトルメント
    // Apple Developer Console で App Attest capability を有効にしただけでは不十分で、
    // アプリの entitlements にも明示する必要がある。
    // "production" = App Store / TestFlight / 通常の配布（preview も含む）
    // "development" = デバッグビルド専用（Xcode から直接インストール）
    entitlements: {
      'com.apple.developer.devicecheck.appattest-environment': 'production',
    },
  },
  android: {
    package: 'com.wakamenod.mumumu',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    googleServicesFile: androidGoogleServicesFile,
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    '@react-native-firebase/app',
    [
      '@react-native-firebase/app-check',
      {
        isTokenAutoRefreshEnabled: true,
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          // Expo SDK 54 以降、React Native はプリコンパイル済み XCFrameworks として
          // 配布されるが、@react-native-firebase の ObjC ヘッダーと競合する。
          // ソースビルドに切り替えることで non-modular header エラーを解消する。
          buildReactNativeFromSource: true,
        },
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        iosAppId: admobIosAppId,
        // Android は未対応だが、未指定だと prebuild 時にネイティブ SDK がクラッシュするため
        // Google 公式のテスト用 App ID を設定しておく
        androidAppId: 'ca-app-pub-3940256099942544~3347511713',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    baseUrl: '/mumumu',
  },
  extra: {
    router: {},
    eas: {
      projectId: '4b83463a-c2c8-473c-a623-748e33898c3a',
    },
  },
});
