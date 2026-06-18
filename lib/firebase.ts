import { initializeApp, getApps } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeAppCheck, CustomProvider, getToken } from 'firebase/app-check';

const firebaseConfig = {
  // ローカルエミュレーターは projectId のみ必須
  projectId: 'mumumu-a278',
  // 本番では apiKey, authDomain 等を設定する
  apiKey: 'dummy-api-key',
  appId: 'dummy-app-id',
};

// initializeApp を複数回呼ばないようにガード
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// App Check の初期化
// __DEV__: デバッグトークンを使用（エミュレーター側は enforceAppCheck: false のため実質不要だが、
//          本番切り替え時に差し替えるだけで済むよう骨格を整えておく）
// 本番:    CustomProvider を App Attest / Play Integrity プロバイダーに差し替える
if (__DEV__) {
  initializeAppCheck(app, {
    provider: new CustomProvider({
      getToken: () =>
        Promise.resolve({
          token: 'mumumu-debug-appcheck-token',
          expireTimeMillis: Date.now() + 60 * 60 * 1000, // 1時間
        }),
    }),
    isTokenAutoRefreshEnabled: true,
  });
}

const functions = getFunctions(app, 'us-central1');

// 開発中はローカルエミュレーターに接続する
if (__DEV__) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { functions };
export { getToken };
