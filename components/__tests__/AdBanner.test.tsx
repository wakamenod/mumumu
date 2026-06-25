/**
 * AdBanner.test.tsx
 *
 * テスト方針:
 *   - AdBanner は react-native-google-mobile-ads の BannerAd をラップする薄いコンポーネント。
 *   - 正常時: BannerAd が正しい unitId / size でレンダリングされることを検証する。
 *   - エラー時: onAdFailedToLoad 発火後にコンポーネントが非表示になることを検証する。
 *   - BannerAd は jest.setup.ts でモック済み（MockBannerAd として testID で検索可能）。
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react-native';

import { AdBanner } from '../AdBanner';

// ─── テスト用定数 ────────────────────────────────────────────────────────────

const TEST_AD_UNIT_ID = 'ca-app-pub-test/1234567890';

// ─── BannerAd モックへの参照を取得 ──────────────────────────────────────────

// jest.setup.ts のモックを上書きし、onAdFailedToLoad をテストから呼べるようにする
let capturedOnAdFailedToLoad: ((error: { message: string }) => void) | undefined;

jest.mock('react-native-google-mobile-ads', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native');

  function MockBannerAd(props: {
    unitId?: string;
    size?: string;
    onAdFailedToLoad?: (error: { message: string }) => void;
  }) {
    // テストから発火できるよう、コールバックを外部変数にキャプチャ
    capturedOnAdFailedToLoad = props.onAdFailedToLoad;
    return (
      <View testID="mock-banner-ad">
        <Text testID="mock-banner-ad-unit-id">{props.unitId}</Text>
        <Text testID="mock-banner-ad-size">{props.size}</Text>
      </View>
    );
  }

  return {
    BannerAd: MockBannerAd,
    BannerAdSize: {
      ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
      BANNER: 'BANNER',
      LARGE_BANNER: 'LARGE_BANNER',
      MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
    },
    TestIds: {
      ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/9214589741',
      BANNER: 'ca-app-pub-3940256099942544/2934735716',
    },
  };
});

// ─── テスト ──────────────────────────────────────────────────────────────────

describe('AdBanner', () => {
  beforeEach(() => {
    capturedOnAdFailedToLoad = undefined;
  });

  describe('正常時', () => {
    it('BannerAd がレンダリングされる', async () => {
      await act(async () => {
        render(<AdBanner adUnitId={TEST_AD_UNIT_ID} />);
      });
      expect(screen.getByTestId('mock-banner-ad')).toBeTruthy();
    });

    it('adUnitId が BannerAd の unitId に渡される', async () => {
      await act(async () => {
        render(<AdBanner adUnitId={TEST_AD_UNIT_ID} />);
      });
      expect(screen.getByTestId('mock-banner-ad-unit-id')).toHaveTextContent(TEST_AD_UNIT_ID);
    });

    it('ANCHORED_ADAPTIVE_BANNER サイズが使われる', async () => {
      await act(async () => {
        render(<AdBanner adUnitId={TEST_AD_UNIT_ID} />);
      });
      expect(screen.getByTestId('mock-banner-ad-size')).toHaveTextContent(
        'ANCHORED_ADAPTIVE_BANNER'
      );
    });
  });

  describe('エラー時', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('onAdFailedToLoad 発火後にバナーが非表示になる', async () => {
      await act(async () => {
        render(<AdBanner adUnitId={TEST_AD_UNIT_ID} />);
      });

      // バナーが表示されていることを確認
      expect(screen.getByTestId('mock-banner-ad')).toBeTruthy();

      // 広告読み込みエラーを発火
      await act(async () => {
        capturedOnAdFailedToLoad?.({ message: 'No fill' });
      });

      // バナーが非表示になることを確認
      expect(screen.queryByTestId('mock-banner-ad')).toBeNull();
    });

    it('エラー時に console.warn でログが出力される', async () => {
      await act(async () => {
        render(<AdBanner adUnitId={TEST_AD_UNIT_ID} />);
      });

      await act(async () => {
        capturedOnAdFailedToLoad?.({ message: 'No fill' });
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AdBanner]'),
        expect.stringContaining('No fill')
      );
    });
  });
});
