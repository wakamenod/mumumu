/**
 * DifficultySelectScreen.test.tsx — Integration tests
 *
 * テスト方針:
 *   - 難易度選択画面全体を render し、ユーザー操作の「意図」を検証する。
 *   - router.push の呼び出し引数で「どのレベルでクイズが始まるか」を確認する。
 *   - LevelStepper の詳細な動作は LevelStepper.test.tsx でカバー済み。
 *     ここでは「選択されたレベルで正しくクイズが開始されるか」という結合点に集中する。
 *   - RTL v14 では render() が非同期のため await が必要。
 *   - fireEvent 後の state 更新は act() でラップして確実に反映させる。
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { router } from 'expo-router';

import DifficultySelectScreen from '@/app/(tabs)/index';
import { DIFFICULTY_LEVELS, TOTAL_QUESTIONS } from '@/features/quiz';

const mockPush = router.push as jest.Mock;

beforeEach(() => {
  mockPush.mockClear();
});

describe('DifficultySelectScreen', () => {
  describe('初期表示', () => {
    it('アプリタイトルが表示される', async () => {
      await render(<DifficultySelectScreen />);
      expect(screen.getByText('🧮 暗算クイズ')).toBeTruthy();
    });

    it('問題数「全 20 問」が表示される', async () => {
      await render(<DifficultySelectScreen />);
      expect(screen.getByText(`全 ${TOTAL_QUESTIONS} 問　|　制限時間なし`)).toBeTruthy();
    });

    it('スタートボタンが表示される', async () => {
      await render(<DifficultySelectScreen />);
      expect(screen.getByText('▶　スタート！')).toBeTruthy();
    });

    it('初期状態では最初のレベル（小学1年生）が選択されている', async () => {
      await render(<DifficultySelectScreen />);
      expect(screen.getByText(DIFFICULTY_LEVELS[0].label)).toBeTruthy();
    });
  });

  describe('スタートボタン', () => {
    it('初期状態でスタートを押すと grade1 でクイズが始まる', async () => {
      await render(<DifficultySelectScreen />);

      fireEvent.press(screen.getByText('▶　スタート！'));

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz',
        params: { levelId: 'grade1' },
      });
    });

    it('→ で1つ進めてからスタートすると grade2 で始まる', async () => {
      await render(<DifficultySelectScreen />);

      // state 更新を act() でラップして re-render を確実に完了させる
      await act(async () => {
        fireEvent.press(screen.getByLabelText('次のレベル'));
      });

      fireEvent.press(screen.getByText('▶　スタート！'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz',
        params: { levelId: 'grade2' },
      });
    });

    it('→ を3回押してから grade4 でスタートできる', async () => {
      await render(<DifficultySelectScreen />);

      // 3回進める: grade1 → grade4
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.press(screen.getByLabelText('次のレベル'));
        });
      }

      fireEvent.press(screen.getByText('▶　スタート！'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz',
        params: { levelId: DIFFICULTY_LEVELS[3].id },
      });
    });
  });
});
