/**
 * CountdownOverlay.test.tsx — カウントダウンオーバーレイの単体テスト
 *
 * テスト方針:
 *   - setTimeout ベースのカウントダウンシーケンスを jest.useFakeTimers() で制御する。
 *   - 3→2→1 の数字切り替えと、3秒後の onComplete 呼び出しを検証する。
 *   - react-native-reanimated のアニメーション自体はモック化されている
 *     （jest.setup.ts の setUpTests()）ため、表示テキストと
 *     コールバック呼び出しの振る舞いに集中する。
 *   - react-native-svg は transformIgnorePatterns で実モジュールが読み込まれるため、
 *     SVG 要素のレンダリング自体は正常に行われる。
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react-native';

import { CountdownOverlay } from '@/features/quiz/components/CountdownOverlay';

// ─── テストスイート ──────────────────────────────────────────

describe('CountdownOverlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ────────────────────────────────────────────────────────────
  describe('初期表示', () => {
    it('マウント直後に数字「3」が表示される', async () => {
      const onComplete = jest.fn();

      await act(async () => {
        render(<CountdownOverlay onComplete={onComplete} />);
      });

      expect(screen.getByText('3')).toBeTruthy();
    });

    it('マウント直後には onComplete が呼ばれない', async () => {
      const onComplete = jest.fn();

      await act(async () => {
        render(<CountdownOverlay onComplete={onComplete} />);
      });

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('カウントダウンの数字切り替え', () => {
    it('1秒後に「2」が表示される', async () => {
      const onComplete = jest.fn();

      await act(async () => {
        render(<CountdownOverlay onComplete={onComplete} />);
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.queryByText('3')).toBeNull();
    });

    it('2秒後に「1」が表示される', async () => {
      const onComplete = jest.fn();

      await act(async () => {
        render(<CountdownOverlay onComplete={onComplete} />);
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.queryByText('2')).toBeNull();
    });

    it('3→2→1 の順序でカウントダウンが進行する', async () => {
      const onComplete = jest.fn();

      await act(async () => {
        render(<CountdownOverlay onComplete={onComplete} />);
      });

      // 初期: 3
      expect(screen.getByText('3')).toBeTruthy();

      // 1秒後: 2
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText('2')).toBeTruthy();

      // 2秒後: 1
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText('1')).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('onComplete コールバック', () => {
    it('3秒後に onComplete が1回呼ばれる', async () => {
      const onComplete = jest.fn();

      await act(async () => {
        render(<CountdownOverlay onComplete={onComplete} />);
      });

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('2秒時点では onComplete が呼ばれていない', async () => {
      const onComplete = jest.fn();

      await act(async () => {
        render(<CountdownOverlay onComplete={onComplete} />);
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('2.999秒時点では onComplete が呼ばれていない', async () => {
      const onComplete = jest.fn();

      await act(async () => {
        render(<CountdownOverlay onComplete={onComplete} />);
      });

      await act(async () => {
        jest.advanceTimersByTime(2999);
      });

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('アンマウント時のクリーンアップ', () => {
    it('アンマウント後に onComplete が呼ばれない', async () => {
      const onComplete = jest.fn();

      await act(async () => {
        render(<CountdownOverlay onComplete={onComplete} />);
      });

      // 500ms 経過（まだ「3」が表示中、onComplete 未呼び出し）
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // アンマウント → useEffect クリーンアップで全 setTimeout がクリアされる
      await act(async () => {
        screen.unmount();
      });

      // 残りの時間を進めても onComplete は呼ばれない（clearTimeout 済み）
      jest.advanceTimersByTime(5000);

      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
