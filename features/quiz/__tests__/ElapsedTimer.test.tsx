/**
 * ElapsedTimer.test.tsx — ElapsedTimer コンポーネントの単体テスト
 *
 * テスト方針:
 *   - startedAt が null のとき「00:00.00」を表示する初期状態。
 *   - startedAt を与え rAF を進めたときに正しい mm:ss.dd 形式で経過時間が表示される。
 *   - 分・秒・百分の一秒がゼロパディングされる。
 *   - AppState が "active" に復帰したとき経過時間を再計算する。
 *   - アンマウント時に cancelAnimationFrame と AppState subscription の解除が行われる。
 *   - startedAt が途中で null に戻ったとき「00:00.00」にリセットされる。
 *
 * 技術的注意:
 *   - ElapsedTimer は requestAnimationFrame を使用する。
 *     jest.useFakeTimers() (modern mode) は rAF を含むため、
 *     jest.advanceTimersByTime() で rAF コールバックを発火できる。
 *   - Date.now() は jest.setSystemTime() で制御する。
 *   - AppState.addEventListener はスパイで listener を取得し、手動で発火する。
 */

import React from 'react';
import { AppState } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';

import { ElapsedTimer } from '@/features/quiz/components/ElapsedTimer';

// ─── テストライフサイクル ─────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
  // 初期時刻を固定（2024-01-01T00:00:00.000Z）
  jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// ─── ヘルパー ────────────────────────────────────────────────

/** 画面に表示されているタイマーテキストを取得する */
function getTimerText(): string {
  // ElapsedTimer は単一の <Text> をレンダリングする
  return screen.getByText(/^\d{2}:\d{2}\.\d{2}$/).props.children as string;
}

/**
 * 指定した時刻にシステム時刻を設定し、rAF を1フレーム分進めて表示を更新する。
 *
 * fake timers では advanceTimersByTime(16) で Date.now() も +16ms 進む。
 * rAF コールバック内の Date.now() が目的の値を返すよう、
 * 16ms 手前にセットしてから進める。
 */
async function advanceTimeTo(isoOrMs: string | number) {
  const targetMs = typeof isoOrMs === 'string' ? new Date(isoOrMs).getTime() : isoOrMs;
  jest.setSystemTime(new Date(targetMs - 16));
  await act(async () => {
    jest.advanceTimersByTime(16);
  });
}

// ─── テスト ──────────────────────────────────────────────────

describe('ElapsedTimer', () => {
  // ──────────────────────────────────────────────────────────
  describe('初期表示（startedAt = null）', () => {
    it('startedAt が null のとき「00:00.00」を表示する', async () => {
      await act(async () => {
        render(<ElapsedTimer startedAt={null} color="#000" />);
      });

      expect(getTimerText()).toBe('00:00.00');
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('タイマー動作', () => {
    it('startedAt 設定後に rAF を進めると経過時間が表示される', async () => {
      const startedAt = Date.now(); // 固定済み: 2024-01-01T00:00:00.000Z

      await act(async () => {
        render(<ElapsedTimer startedAt={startedAt} color="#000" />);
      });

      // 1.5秒進める
      await advanceTimeTo('2024-01-01T00:00:01.500Z');

      expect(getTimerText()).toBe('00:01.50');
    });

    it('1分以上の経過時間が mm:ss.dd 形式で正しく表示される', async () => {
      const startedAt = Date.now();

      await act(async () => {
        render(<ElapsedTimer startedAt={startedAt} color="#000" />);
      });

      // 2分30.50秒 = 150.50秒後
      await advanceTimeTo('2024-01-01T00:02:30.500Z');

      expect(getTimerText()).toBe('02:30.50');
    });

    it('分・秒・百分の一秒がゼロパディングされる', async () => {
      const startedAt = Date.now();

      await act(async () => {
        render(<ElapsedTimer startedAt={startedAt} color="#000" />);
      });

      // 3.05秒後（百分の一秒が一桁 → 05 にパディング）
      await advanceTimeTo('2024-01-01T00:00:03.050Z');

      expect(getTimerText()).toBe('00:03.05');
    });

    it('経過時間が継続的に更新される', async () => {
      const startedAt = Date.now();

      await act(async () => {
        render(<ElapsedTimer startedAt={startedAt} color="#000" />);
      });

      // 10秒後
      await advanceTimeTo('2024-01-01T00:00:10.000Z');
      expect(getTimerText()).toBe('00:10.00');

      // さらに 20秒後（合計30秒）
      await advanceTimeTo('2024-01-01T00:00:30.000Z');
      expect(getTimerText()).toBe('00:30.00');
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('AppState によるフォアグラウンド復帰', () => {
    it('AppState が "active" に変わったとき経過時間を再計算する', async () => {
      // AppState.addEventListener をスパイして listener を取得する
      let appStateListener: ((state: string) => void) | null = null;
      const removeMock = jest.fn();
      const addEventListenerSpy = jest
        .spyOn(AppState, 'addEventListener')
        .mockImplementation((_type, listener) => {
          appStateListener = listener as (state: string) => void;
          return { remove: removeMock } as ReturnType<typeof AppState.addEventListener>;
        });

      const startedAt = Date.now();

      await act(async () => {
        render(<ElapsedTimer startedAt={startedAt} color="#000" />);
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
      expect(appStateListener).not.toBeNull();

      // バックグラウンド中に 60 秒経過をシミュレート
      jest.setSystemTime(new Date('2024-01-01T00:01:00.000Z'));

      // AppState "active" を発火
      await act(async () => {
        appStateListener!('active');
      });

      expect(getTimerText()).toBe('01:00.00');
    });

    it('AppState が "background" に変わっても再計算しない', async () => {
      let appStateListener: ((state: string) => void) | null = null;
      jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
        appStateListener = listener as (state: string) => void;
        return { remove: jest.fn() } as ReturnType<typeof AppState.addEventListener>;
      });

      const startedAt = Date.now();

      await act(async () => {
        render(<ElapsedTimer startedAt={startedAt} color="#000" />);
      });

      // 最初の rAF で表示を進める
      await advanceTimeTo('2024-01-01T00:00:01.000Z');
      const textBefore = getTimerText();

      // 時間を進めて background イベント発火
      jest.setSystemTime(new Date('2024-01-01T00:01:00.000Z'));
      await act(async () => {
        appStateListener!('background');
      });

      // background イベントでは再計算されないので rAF が進まない限り値は変わらない
      // （rAF はバックグラウンドでは停止するため）
      // ここでは rAF を進めずにテキストが変わっていないことを確認
      expect(getTimerText()).toBe(textBefore);
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('クリーンアップ', () => {
    it('アンマウント時に cancelAnimationFrame が呼ばれる', async () => {
      const cancelSpy = jest.spyOn(global, 'cancelAnimationFrame');
      const startedAt = Date.now();

      await act(async () => {
        render(<ElapsedTimer startedAt={startedAt} color="#000" />);
      });

      // rAF を1フレーム進めてタイマーが動作中であることを確認
      await advanceTimeTo('2024-01-01T00:00:01.000Z');

      await act(async () => {
        screen.unmount();
      });

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('アンマウント時に AppState subscription が解除される', async () => {
      const removeMock = jest.fn();
      jest.spyOn(AppState, 'addEventListener').mockImplementation(() => {
        return { remove: removeMock } as ReturnType<typeof AppState.addEventListener>;
      });

      const startedAt = Date.now();

      await act(async () => {
        render(<ElapsedTimer startedAt={startedAt} color="#000" />);
      });

      await act(async () => {
        screen.unmount();
      });

      expect(removeMock).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('startedAt のリセット', () => {
    it('startedAt が null に戻ると「00:00.00」にリセットされる', async () => {
      const startedAt = Date.now();

      await act(async () => {
        render(<ElapsedTimer startedAt={startedAt} color="#000" />);
      });

      // 5秒進める
      await advanceTimeTo('2024-01-01T00:00:05.000Z');
      expect(getTimerText()).toBe('00:05.00');

      // startedAt を null に更新
      await act(async () => {
        screen.rerender(<ElapsedTimer startedAt={null} color="#000" />);
      });

      expect(getTimerText()).toBe('00:00.00');
    });
  });
});
