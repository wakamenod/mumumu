// Web 版 Firebase 初期化
//
// ネイティブ版（firebase.ts）は @react-native-firebase/* を使うが、
// Web では公式 JS SDK（firebase パッケージ）で初期化する。

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 二重初期化を防止
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ─────────────────────────────────────────────────────────────────────────────
// App Check（reCAPTCHA v3）
//
// ネイティブ版は App Attest / Play Integrity を使うが、
// Web では reCAPTCHA v3 をプロバイダとして使用する。
//
// 開発時はデバッグプロバイダを使用する。
// ブラウザの DevTools コンソールにデバッグトークンが出力されるので、
// Firebase Console > App Check > デバッグトークンを管理 で登録する。
// ─────────────────────────────────────────────────────────────────────────────
if (__DEV__) {
  // デバッグプロバイダを有効化
  // @ts-expect-error -- Firebase App Check debug token flag
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const recaptchaSiteKey = process.env.EXPO_PUBLIC_RECAPTCHA_V3_SITE_KEY;
if (recaptchaSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

const functionsInstance = getFunctions(app);

if (__DEV__) {
  connectFunctionsEmulator(functionsInstance, 'localhost', 5001);
}

// ─────────────────────────────────────────────────────────────────────────────
// ネイティブ版と同じインターフェースを提供する互換ラッパー
//
// ネイティブ版の functions.httpsCallable<Req, Res>(name) は
//   (data: Req) => Promise<{ data: Res }> を返す。
// JS SDK の httpsCallable<Req, Res>(functions, name) は
//   (data: Req) => Promise<HttpsCallableResult<Res>> を返す（同じ形状）。
// ─────────────────────────────────────────────────────────────────────────────
const functionsCompat = {
  httpsCallable<Req, Res>(name: string) {
    return httpsCallable<Req, Res>(functionsInstance, name);
  },
};

export { functionsCompat as functions };
export { app as firebase };
