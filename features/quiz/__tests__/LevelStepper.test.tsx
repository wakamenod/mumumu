/**
 * LevelStepper.test.tsx — Component tests for LevelStepper
 *
 * テスト方針:
 *   - 「ユーザーが見て操作できること」を軸に検証する。
 *   - アニメーションの内部状態（translateX.value 等）は一切検証しない。
 *   - アクセシビリティロール/ラベルで要素を取得し、実装詳細に依存しない。
 *   - RTL v14 では render() が非同期のため await が必要。
 *   - Reanimated は jest.setup.ts で setUpTests() によりモック済み。
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { LevelStepper } from '../components/LevelStepper';
import { DIFFICULTY_LEVELS } from '../constants';

const LAST_INDEX = DIFFICULTY_LEVELS.length - 1;

// ─── ヘルパー ────────────────────────────────────────────────
async function renderStepper(selectedIndex: number, onIndexChange = jest.fn()) {
  await render(<LevelStepper selectedIndex={selectedIndex} onIndexChange={onIndexChange} />);
  return { onIndexChange };
}

// ─── テストスイート ──────────────────────────────────────────
describe('LevelStepper', () => {
  describe('初期表示', () => {
    it('selectedIndex=0 のとき 小学1年生 が表示される', async () => {
      await renderStepper(0);
      expect(screen.getByText('小学1年生')).toBeTruthy();
    });

    it('selectedIndex=12 のとき 大学・一般 が表示される', async () => {
      await renderStepper(LAST_INDEX);
      expect(screen.getByText('大学・一般')).toBeTruthy();
    });

    it('「X / 13」の形式でカウンターが表示される', async () => {
      await renderStepper(0);
      expect(screen.getByText('1 / 13')).toBeTruthy();
    });

    it('中間レベルではカウンターが正しく更新される', async () => {
      await renderStepper(4);
      expect(screen.getByText('5 / 13')).toBeTruthy();
    });
  });

  describe('ナビゲーション操作', () => {
    it('→ ボタンを押すと onIndexChange(1) が呼ばれる', async () => {
      const onIndexChange = jest.fn();
      await renderStepper(0, onIndexChange);

      fireEvent.press(screen.getByLabelText('次のレベル'));

      expect(onIndexChange).toHaveBeenCalledTimes(1);
      expect(onIndexChange).toHaveBeenCalledWith(1);
    });

    it('← ボタンを押すと onIndexChange(selectedIndex - 1) が呼ばれる', async () => {
      const onIndexChange = jest.fn();
      await renderStepper(3, onIndexChange);

      fireEvent.press(screen.getByLabelText('前のレベル'));

      expect(onIndexChange).toHaveBeenCalledTimes(1);
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });
  });

  describe('端点での無効化', () => {
    it('selectedIndex=0 のとき ← ボタンが disabled になる', async () => {
      const onIndexChange = jest.fn();
      await renderStepper(0, onIndexChange);

      fireEvent.press(screen.getByLabelText('前のレベル'));

      // disabled なのでコールバックは呼ばれない
      expect(onIndexChange).not.toHaveBeenCalled();
    });

    it('最後のレベルのとき → ボタンが disabled になる', async () => {
      const onIndexChange = jest.fn();
      await renderStepper(LAST_INDEX, onIndexChange);

      fireEvent.press(screen.getByLabelText('次のレベル'));

      expect(onIndexChange).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('前のレベル・次のレベルの 2 つの button ロールが存在する', async () => {
      await renderStepper(2);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('← ボタンに accessibilityLabel が設定されている', async () => {
      await renderStepper(2);
      expect(screen.getByLabelText('前のレベル')).toBeTruthy();
    });

    it('→ ボタンに accessibilityLabel が設定されている', async () => {
      await renderStepper(2);
      expect(screen.getByLabelText('次のレベル')).toBeTruthy();
    });
  });
});
