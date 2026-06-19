import firebase from '@react-native-firebase/app';
import functionsModule from '@react-native-firebase/functions';
import appCheckModule from '@react-native-firebase/app-check';

// ─────────────────────────────────────────────────────────────────────────────
// App Check の初期化
//
// 【開発時（__DEV__ = true）= development ビルド / Expo Go】
//   デバッグトークン（UUID）を使用する。
//   Firebase Console > App Check > デバッグトークンを管理 で発行し、
//   .env.local の EXPO_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN に設定する。
//
// 【本番・プレビュー時（__DEV__ = false）= preview / production ビルド】
//   preview・production ともに正規の Apple/Google 署名が付いた実機ビルドなので
//   ネイティブ証明書が使える。
//   iOS: App Attest（Apple のデバイス証明。A12 Bionic 以降の実機のみ）
//   Android: Play Integrity（Google のデバイス証明）
//
//   【事前に必要な設定】
//   1. Apple Developer Console > Identifiers > com.wakamenod.mumumu
//      > Capabilities > App Attest を ON
//   2. Firebase Console > App Check > iOS アプリ > App Attest で登録
//   3. Firebase Console > App Check > Android アプリ > Play Integrity で登録
// ─────────────────────────────────────────────────────────────────────────────
async function initializeAppCheck() {
  const appCheck = appCheckModule();
  const provider = appCheck.newReactNativeFirebaseAppCheckProvider();

  provider.configure({
    android: __DEV__
      ? {
          provider: 'debug',
          debugToken: process.env.EXPO_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN,
        }
      : { provider: 'playIntegrity' },
    apple: __DEV__
      ? {
          provider: 'debug',
          debugToken: process.env.EXPO_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN,
        }
      : { provider: 'appAttest' },
  });

  await appCheck.initializeAppCheck({
    provider,
    isTokenAutoRefreshEnabled: true,
  });
}

initializeAppCheck().catch(console.error);

// ─────────────────────────────────────────────────────────────────────────────
// Cloud Functions
// ─────────────────────────────────────────────────────────────────────────────
const functionsInstance = functionsModule();

// 開発時はローカルエミュレーターに接続する
if (__DEV__) {
  functionsInstance.useEmulator('localhost', 5001);
}

export { functionsInstance as functions };
export { firebase };
