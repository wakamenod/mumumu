// Web 版 Firebase 初期化
//
// ネイティブ版（firebase.ts）は @react-native-firebase/* を使うが、
// Web では公式 JS SDK（firebase パッケージ）で初期化する。

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 二重初期化を防止
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

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
