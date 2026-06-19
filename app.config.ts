import { ExpoConfig, ConfigContext } from 'expo/config';

// GoogleService-Info.plist / google-services.json のパス解決
//   - EAS Build: シークレットファイルが環境変数のパスに展開される
//   - ローカル:  プロジェクトルートのファイルを直接参照（.gitignore 済み）
const iosGoogleServicesFile = process.env.GOOGLE_SERVICES_IOS ?? './GoogleService-Info.plist';
const androidGoogleServicesFile = process.env.GOOGLE_SERVICES_ANDROID ?? './google-services.json';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'mumumu',
  slug: 'mumumu',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'mumumu',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
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
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '4b83463a-c2c8-473c-a623-748e33898c3a',
    },
  },
});
