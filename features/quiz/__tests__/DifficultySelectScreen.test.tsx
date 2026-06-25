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
import AsyncStorage from '@react-native-async-storage/async-storage';

import DifficultySelectScreen from '@/app/(tabs)/index';
import { DIFFICULTY_LEVELS, TOTAL_QUESTIONS, LAST_LEVEL_KEY } from '@/features/quiz';

const mockPush = router.push as jest.Mock;

beforeEach(() => {
  mockPush.mockClear();
  (AsyncStorage as any).__resetStore();
});

describe('DifficultySelectScreen', () => {
  describe('初期表示', () => {
    it('アプリタイトルが表示される', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });
      expect(screen.getByText('🧮 暗算クイズ')).toBeTruthy();
    });

    it('問題数「全 7 問」が表示される', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });
      expect(screen.getByText(`全 ${TOTAL_QUESTIONS} 問　|　制限時間なし`)).toBeTruthy();
    });

    it('スタートボタンが表示される', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });
      expect(screen.getByText('▶　スタート！')).toBeTruthy();
    });

    it('初期状態では最初のレベル（小学1年生）が選択されている', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });
      expect(screen.getByText(DIFFICULTY_LEVELS[0].label)).toBeTruthy();
    });

    it('保存済みレベルがあればそのレベルが初期表示される', async () => {
      await AsyncStorage.setItem(LAST_LEVEL_KEY, 'G');
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });
      expect(screen.getByText(DIFFICULTY_LEVELS[6].label)).toBeTruthy(); // 中学1年生
    });
  });

  describe('レベル復元', () => {
    it('保存値がない場合はデフォルト（小学1年生）が表示される', async () => {
      // __resetStore 済みなので保存値なし
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(LAST_LEVEL_KEY);
      expect(screen.getByText(DIFFICULTY_LEVELS[0].label)).toBeTruthy();
    });

    it('最後のレベル A が保存されていれば大学・一般が表示される', async () => {
      await AsyncStorage.setItem(LAST_LEVEL_KEY, 'A');
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });
      expect(screen.getByText(DIFFICULTY_LEVELS[12].label)).toBeTruthy(); // 大学・一般
    });

    it('無効な ID が保存されている場合はデフォルトにフォールバックする', async () => {
      await AsyncStorage.setItem(LAST_LEVEL_KEY, 'INVALID_ID');
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });
      // findIndex が -1 なので selectedIndex は初期値 0 のまま
      expect(screen.getByText(DIFFICULTY_LEVELS[0].label)).toBeTruthy();
    });

    it('AsyncStorage の読み込みが失敗してもデフォルトで表示される', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });
      expect(screen.getByText(DIFFICULTY_LEVELS[0].label)).toBeTruthy();
    });
  });

  describe('レベル保存', () => {
    it('レベルを変更してスタートすると変更後のレベルが保存される', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });

      // → を2回押して K（小学3年生）に移動
      for (let i = 0; i < 2; i++) {
        await act(async () => {
          fireEvent.press(screen.getByLabelText('次のレベル'));
        });
      }

      fireEvent.press(screen.getByText('▶　スタート！'));

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(LAST_LEVEL_KEY, 'K');
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz',
        params: { levelId: 'K' },
      });
    });

    it('保存済みレベルから別レベルに変更してスタートすると上書き保存される', async () => {
      // 事前に G（中学1年生）を保存
      await AsyncStorage.setItem(LAST_LEVEL_KEY, 'G');
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });

      // G (index 6) から → を1回押して F（中学2年生, index 7）に移動
      await act(async () => {
        fireEvent.press(screen.getByLabelText('次のレベル'));
      });

      fireEvent.press(screen.getByText('▶　スタート！'));

      expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(LAST_LEVEL_KEY, 'F');
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz',
        params: { levelId: 'F' },
      });
    });
  });

  describe('解答ルール モーダル', () => {
    it('「📖 解答ルール」リンクが表示される', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });
      expect(screen.getByText('📖 解答ルール')).toBeTruthy();
    });

    it('初期状態ではルール文言が表示されていない', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });
      expect(screen.queryByText(/既約分数/)).toBeNull();
    });

    it('リンクを押すとモーダルが開きルール4項目が表示される', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });

      await act(async () => {
        fireEvent.press(screen.getByText('📖 解答ルール'));
      });

      expect(screen.getByText(/スラッシュで入力してください/)).toBeTruthy();
      expect(screen.getByText(/既約分数（これ以上約分できない状態）にしてください/)).toBeTruthy();
      expect(screen.getByText(/整数になる場合は整数/)).toBeTruthy();
      expect(screen.getByText(/「−0」は不正解となります/)).toBeTruthy();
    });

    it('「閉じる」ボタンを押すとモーダルが閉じる', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });

      // モーダルを開く
      await act(async () => {
        fireEvent.press(screen.getByText('📖 解答ルール'));
      });
      expect(screen.getByText(/既約分数/)).toBeTruthy();

      // 閉じるボタンを押す
      await act(async () => {
        fireEvent.press(screen.getByText('閉じる'));
      });
      expect(screen.queryByText(/既約分数/)).toBeNull();
    });
  });

  describe('スタートボタン', () => {
    it('初期状態でスタートを押すと M でクイズが始まる', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });

      fireEvent.press(screen.getByText('▶　スタート！'));

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz',
        params: { levelId: 'M' },
      });
    });

    it('スタート時に選択レベルが AsyncStorage に保存される', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });

      fireEvent.press(screen.getByText('▶　スタート！'));

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(LAST_LEVEL_KEY, 'M');
    });

    it('→ で1つ進めてからスタートすると L で始まる', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });

      // state 更新を act() でラップして re-render を確実に完了させる
      await act(async () => {
        fireEvent.press(screen.getByLabelText('次のレベル'));
      });

      fireEvent.press(screen.getByText('▶　スタート！'));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz',
        params: { levelId: 'L' },
      });
    });

    it('→ を3回押してから J でスタートできる', async () => {
      await act(async () => {
        await render(<DifficultySelectScreen />);
      });

      // 3回進める: M → J
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
