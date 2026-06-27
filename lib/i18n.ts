import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

import ja from '@/locales/ja';
import en from '@/locales/en';

const i18n = new I18n({ ja, en });

// デバイスの第一優先ロケールを取得（例: "ja", "en"）
const deviceLocale = getLocales()[0]?.languageCode ?? 'ja';
i18n.locale = deviceLocale;

// マッチする翻訳がない場合はフォールバック
i18n.enableFallback = true;
i18n.defaultLocale = 'ja';

export default i18n;
export const t = i18n.t.bind(i18n);
