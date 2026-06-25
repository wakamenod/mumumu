/**
 * admob.test.ts
 *
 * テスト方針:
 *   - config/admob.ts は EXPO_PUBLIC_ADMOB_* 環境変数から Ad Unit ID を読み込み、
 *     未設定の場合は Google 公式テスト ID にフォールバックする。
 *   - 環境変数の有無で正しい ID がエクスポートされることを検証する。
 *   - process.env を書き換えて再インポートすることで、両パターンをテストする。
 *   - jest.resetModules + require() パターンは環境変数テストの定石。
 */

/* eslint-disable @typescript-eslint/no-require-imports */

// テスト用の定数
const TEST_IDS = {
  ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/9214589741',
};

const PRODUCTION_IDS = {
  tab: 'ca-app-pub-1234567890/tab-unit-id',
  quiz: 'ca-app-pub-1234567890/quiz-unit-id',
  result: 'ca-app-pub-1234567890/result-unit-id',
};

// ─── テスト ──────────────────────────────────────────────────────────────────

describe('config/admob', () => {
  // 元の環境変数を保持
  const originalEnv = { ...process.env };

  afterEach(() => {
    // 環境変数を元に戻す
    process.env = { ...originalEnv };
    // モジュールキャッシュをリセットして再読み込み可能にする
    jest.resetModules();
  });

  describe('環境変数が未設定の場合', () => {
    beforeEach(() => {
      delete process.env.EXPO_PUBLIC_ADMOB_IOS_TAB_BANNER;
      delete process.env.EXPO_PUBLIC_ADMOB_IOS_QUIZ_BANNER;
      delete process.env.EXPO_PUBLIC_ADMOB_IOS_RESULT_BANNER;
    });

    it('TAB_BANNER_ID がテスト ID にフォールバックする', () => {
      const { TAB_BANNER_ID } = require('@/config/admob');
      expect(TAB_BANNER_ID).toBe(TEST_IDS.ADAPTIVE_BANNER);
    });

    it('QUIZ_BANNER_ID がテスト ID にフォールバックする', () => {
      const { QUIZ_BANNER_ID } = require('@/config/admob');
      expect(QUIZ_BANNER_ID).toBe(TEST_IDS.ADAPTIVE_BANNER);
    });

    it('RESULT_BANNER_ID がテスト ID にフォールバックする', () => {
      const { RESULT_BANNER_ID } = require('@/config/admob');
      expect(RESULT_BANNER_ID).toBe(TEST_IDS.ADAPTIVE_BANNER);
    });
  });

  describe('環境変数が設定されている場合', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ADMOB_IOS_TAB_BANNER = PRODUCTION_IDS.tab;
      process.env.EXPO_PUBLIC_ADMOB_IOS_QUIZ_BANNER = PRODUCTION_IDS.quiz;
      process.env.EXPO_PUBLIC_ADMOB_IOS_RESULT_BANNER = PRODUCTION_IDS.result;
    });

    it('TAB_BANNER_ID に環境変数の値が使われる', () => {
      const { TAB_BANNER_ID } = require('@/config/admob');
      expect(TAB_BANNER_ID).toBe(PRODUCTION_IDS.tab);
    });

    it('QUIZ_BANNER_ID に環境変数の値が使われる', () => {
      const { QUIZ_BANNER_ID } = require('@/config/admob');
      expect(QUIZ_BANNER_ID).toBe(PRODUCTION_IDS.quiz);
    });

    it('RESULT_BANNER_ID に環境変数の値が使われる', () => {
      const { RESULT_BANNER_ID } = require('@/config/admob');
      expect(RESULT_BANNER_ID).toBe(PRODUCTION_IDS.result);
    });
  });

  describe('一部の環境変数のみ設定されている場合', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_ADMOB_IOS_TAB_BANNER = PRODUCTION_IDS.tab;
      delete process.env.EXPO_PUBLIC_ADMOB_IOS_QUIZ_BANNER;
      delete process.env.EXPO_PUBLIC_ADMOB_IOS_RESULT_BANNER;
    });

    it('設定済みの TAB_BANNER_ID は環境変数の値が使われる', () => {
      const { TAB_BANNER_ID } = require('@/config/admob');
      expect(TAB_BANNER_ID).toBe(PRODUCTION_IDS.tab);
    });

    it('未設定の QUIZ_BANNER_ID はテスト ID にフォールバックする', () => {
      const { QUIZ_BANNER_ID } = require('@/config/admob');
      expect(QUIZ_BANNER_ID).toBe(TEST_IDS.ADAPTIVE_BANNER);
    });

    it('未設定の RESULT_BANNER_ID はテスト ID にフォールバックする', () => {
      const { RESULT_BANNER_ID } = require('@/config/admob');
      expect(RESULT_BANNER_ID).toBe(TEST_IDS.ADAPTIVE_BANNER);
    });
  });
});
