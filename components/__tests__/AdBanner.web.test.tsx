/**
 * AdBanner.web.test.tsx — Web 版 AdBanner のテスト
 *
 * テスト方針:
 *   - Web 版 AdBanner は広告を表示しない（react-native-google-mobile-ads が Web 非対応のため）。
 *   - どの adUnitId を渡しても null を返すことを検証する。
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { AdBanner } from '../AdBanner.web';

// ─── テスト ──────────────────────────────────────────────────────────────────

describe('AdBanner (Web)', () => {
  it('何もレンダリングしない（null を返す）', async () => {
    await render(
      <View testID="wrapper">
        <AdBanner adUnitId="ca-app-pub-test/1234567890" />
      </View>
    );
    // AdBanner が null を返すので、wrapper の中は空
    expect(screen.getByTestId('wrapper').children).toHaveLength(0);
  });

  it('異なる adUnitId を渡しても何もレンダリングしない', async () => {
    await render(
      <View testID="wrapper">
        <AdBanner adUnitId="ca-app-pub-test/9999999999" />
      </View>
    );
    expect(screen.getByTestId('wrapper').children).toHaveLength(0);
  });
});
