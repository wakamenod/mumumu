/**
 * admob.web.test.ts — Web 版 admob 設定のテスト
 *
 * テスト方針:
 *   - Web では広告を表示しないため、すべての Ad Unit ID が空文字列であることを検証する。
 *   - AdBanner.web.tsx が null を返すため、これらの値は実際には使用されないが、
 *     型安全性のために空文字列をエクスポートしている。
 */

import { TAB_BANNER_ID, QUIZ_BANNER_ID, RESULT_BANNER_ID } from '../admob.web';

// ─── テスト ──────────────────────────────────────────────────────────────────

describe('config/admob (Web)', () => {
  it('TAB_BANNER_ID が空文字列である', () => {
    expect(TAB_BANNER_ID).toBe('');
  });

  it('QUIZ_BANNER_ID が空文字列である', () => {
    expect(QUIZ_BANNER_ID).toBe('');
  });

  it('RESULT_BANNER_ID が空文字列である', () => {
    expect(RESULT_BANNER_ID).toBe('');
  });
});
