import { TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────
// AdMob 広告ユニット ID 設定
//
// .env.local の EXPO_PUBLIC_ADMOB_* から読み込み、
// 未設定の場合は Google 公式テスト用 ID にフォールバックする。
// テスト ID では「Test Ad」と表示されるダミー広告が配信される。
// ─────────────────────────────────────────────────────

/** タブ画面（難易度選択 / ランキング）下部バナー */
export const TAB_BANNER_ID =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_TAB_BANNER,
    // android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_TAB_BANNER,
  }) || TestIds.ADAPTIVE_BANNER;

/** クイズ画面 上部バナー */
export const QUIZ_BANNER_ID =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_QUIZ_BANNER,
    // android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_QUIZ_BANNER,
  }) || TestIds.ADAPTIVE_BANNER;

/** 結果画面 下部バナー */
export const RESULT_BANNER_ID =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_RESULT_BANNER,
    // android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_RESULT_BANNER,
  }) || TestIds.ADAPTIVE_BANNER;
