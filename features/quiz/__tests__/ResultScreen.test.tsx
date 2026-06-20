/**
 * ResultScreen.test.tsx — Integration tests for app/result.tsx
 *
 * テスト方針:
 *   - result.tsx が submitScoreFunction を正しく呼び出すことを検証する。
 *   - loading / success / error の3状態それぞれの表示を確認する。
 *   - QuizScreen.test.tsx と同じ __callable パターンでモックを制御する。
 */

// ─── jest.mock はファイル最上部に記述（hoisting により import より先に評価される） ───
jest.mock('@/lib/firebase', () => {
  const callable = jest.fn();
  return {
    functions: {
      httpsCallable: jest.fn(() => callable),
      useEmulator: jest.fn(),
    },
    firebase: {},
    __callable: callable,
  };
});

/* eslint-disable import/first */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import ResultScreen from '@/app/result';
/* eslint-enable import/first */

// ─── モックの callable を取得 ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const firebaseMock = require('@/lib/firebase');
const callable: jest.Mock = firebaseMock.__callable;

// ─── テスト用ダミーデータ ─────────────────────────────────────

const MOCK_ANSWERS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
];

const DEFAULT_PARAMS = {
  correct: '18',
  total: '20',
  levelId: 'A',
  startedAt: '1718268420000',
  answers: JSON.stringify(MOCK_ANSWERS),
};

const MOCK_RESPONSE = {
  ranked: true,
  rank: 3,
  correct_count: 18,
  elapsed_time: 95000,
  claimToken: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
  rankings: [
    { rank: 1, username: 'Alice', correct_count: 20, elapsed_time: 60000 },
    { rank: 2, username: 'Bob', correct_count: 19, elapsed_time: 80000 },
    { rank: 3, username: '', correct_count: 18, elapsed_time: 95000 },
  ],
};

// ─── ヘルパー ────────────────────────────────────────────────

/**
 * 永遠に resolve しない（ローディング状態のまま）よう設定する。
 */
let loadingAbortController: AbortController | null = null;

function setupLoadingResponse() {
  loadingAbortController = new AbortController();
  const { signal } = loadingAbortController;
  callable.mockReturnValue(
    new Promise<never>((_, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')));
    })
  );
}

/** ResultScreen を render する共通ヘルパー */
async function renderResultScreen(params = DEFAULT_PARAMS) {
  (useLocalSearchParams as jest.Mock).mockReturnValue(params);

  await act(async () => {
    render(<ResultScreen />);
  });
}

// ─── テストスイート ──────────────────────────────────────────

describe('ResultScreen', () => {
  let mockReplace: jest.Mock;

  beforeEach(() => {
    callable.mockClear();
    mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: mockReplace,
      back: jest.fn(),
    });
  });

  afterEach(() => {
    loadingAbortController?.abort();
    loadingAbortController = null;
  });

  // ──────────────────────────────────────────────────────────
  describe('ローディング状態', () => {
    it('callable が pending のとき「送信中...」が表示される', async () => {
      setupLoadingResponse();
      await renderResultScreen();

      expect(screen.getByText('送信中...')).toBeTruthy();

      await act(async () => {
        loadingAbortController?.abort();
      });
    });

    it('ローディング中は JSON レスポンスが表示されない', async () => {
      setupLoadingResponse();
      await renderResultScreen();

      expect(screen.queryByText('submitScoreFunction レスポンス（疎通確認）')).toBeNull();

      await act(async () => {
        loadingAbortController?.abort();
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('成功状態', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE });
    });

    it('レスポンスが返ったとき疎通確認ラベルが表示される', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('submitScoreFunction レスポンス（疎通確認）')).toBeTruthy();
      });
    });

    it('レスポンス JSON が画面に表示される（ranked フィールドを含む）', async () => {
      await renderResultScreen();

      await waitFor(() => {
        // JSON.stringify で出力される "ranked" キーが含まれることを確認
        expect(screen.getByText(/ranked/)).toBeTruthy();
      });
    });

    it('レスポンス JSON に correct_count が含まれる', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText(/correct_count/)).toBeTruthy();
      });
    });

    it('レスポンス JSON に elapsed_time が含まれる', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText(/elapsed_time/)).toBeTruthy();
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('エラー状態', () => {
    it('callable が Error を throw したとき「⚠️ エラー」が表示される', async () => {
      callable.mockRejectedValue(new Error('deadline-exceeded'));
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('⚠️ エラー')).toBeTruthy();
      });
    });

    it('エラーメッセージが画面に表示される', async () => {
      callable.mockRejectedValue(new Error('サーバーに接続できません'));
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('サーバーに接続できません')).toBeTruthy();
      });
    });

    it('Error インスタンス以外のとき「不明なエラーが発生しました」が表示される', async () => {
      callable.mockRejectedValue('unknown');
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('不明なエラーが発生しました')).toBeTruthy();
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('共通 UI', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE });
    });

    it('「トップに戻る」ボタンが表示される', async () => {
      await renderResultScreen();

      expect(screen.getByLabelText('トップに戻る')).toBeTruthy();
    });

    it('「トップに戻る」を押すと router.replace("/") が呼ばれる', async () => {
      await renderResultScreen();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('トップに戻る'));
      });

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('submitScore の呼び出し引数', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE });
    });

    it('callable に level が正しく渡される', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(callable).toHaveBeenCalledTimes(1);
      });

      const callArg = callable.mock.calls[0][0] as {
        level: string;
        answers: string[];
        startedAt: number;
      };
      expect(callArg.level).toBe('A');
    });

    it('callable に answers が JSON パース済み配列で渡される', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(callable).toHaveBeenCalledTimes(1);
      });

      const callArg = callable.mock.calls[0][0] as {
        level: string;
        answers: string[];
        startedAt: number;
      };
      expect(callArg.answers).toEqual(MOCK_ANSWERS);
    });

    it('callable に startedAt が数値で渡される', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(callable).toHaveBeenCalledTimes(1);
      });

      const callArg = callable.mock.calls[0][0] as {
        level: string;
        answers: string[];
        startedAt: number;
      };
      expect(typeof callArg.startedAt).toBe('number');
      expect(callArg.startedAt).toBe(1718268420000);
    });

    it('マウント時に1回だけ呼ばれる（再レンダーで重複呼び出しされない）', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(callable).toHaveBeenCalledTimes(1);
      });
    });
  });
});
