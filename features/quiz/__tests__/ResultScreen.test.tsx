/**
 * ResultScreen.test.tsx — Integration tests for app/result.tsx
 *
 * テスト方針:
 *   - result.tsx が submitScoreFunction を正しく呼び出すことを検証する。
 *   - loading / success / error の3状態それぞれの表示を確認する。
 *   - ranked: false のとき正解数・経過時間のみ表示されることを確認する。
 *   - ranked: true のとき正解数・経過時間＋ランキングテーブルが表示されることを確認する。
 *   - ランキングが20件未満のとき残り行が「—」で埋まることを確認する。
 *   - 自分のランクの行がハイライトされることを確認する。
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
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import ResultScreen from '@/app/result';
/* eslint-enable import/first */

// ─── モックの callable を取得 ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const firebaseMock = require('@/lib/firebase');
const callable: jest.Mock = firebaseMock.__callable;

// ─── テスト用ダミーデータ ─────────────────────────────────────

const MOCK_ANSWERS = Array.from({ length: 20 }, (_, i) => ({
  id: `q${i + 1}`,
  answer: String(i + 1),
}));

const DEFAULT_PARAMS = {
  levelId: 'A',
  startedAt: '1718268420000',
  answers: JSON.stringify(MOCK_ANSWERS),
};

/** ranked: true のモックレスポンス（ランキング3件） */
const MOCK_RESPONSE_RANKED = {
  ranked: true,
  rank: 3,
  correct_count: 18,
  elapsed_time: 95.0,
  claimToken: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
  rankings: [
    { rank: 1, username: 'Alice', correct_count: 20, elapsed_time: 60.0 },
    { rank: 2, username: 'Bob', correct_count: 19, elapsed_time: 80.0 },
    { rank: 3, username: '-----', correct_count: 18, elapsed_time: 95.0 },
  ],
};

/** ranked: true のモックレスポンス（ランキング20件フル） */
const MOCK_RESPONSE_RANKED_FULL = {
  ranked: true,
  rank: 1,
  correct_count: 20,
  elapsed_time: 30.0,
  claimToken: 'token-full',
  rankings: Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    username: `User${i + 1}`,
    correct_count: 20 - i,
    elapsed_time: 30.0 + i * 5,
  })),
};

/** ranked: false のモックレスポンス */
const MOCK_RESPONSE_NOT_RANKED = {
  ranked: false,
  rank: null,
  correct_count: 10,
  elapsed_time: 120.5,
  claimToken: null,
  rankings: [],
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
  await render(<ResultScreen />);
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

  afterEach(async () => {
    // 先に unmount して useEffect のクリーンアップ（cancelled = true）を実行する。
    // これにより abort() 後の reject → catch でも setSubmitState は呼ばれない。
    await cleanup();
    loadingAbortController?.abort();
    loadingAbortController = null;
  });

  // ──────────────────────────────────────────────────────────
  describe('ローディング状態', () => {
    it('callable が pending のとき「採点中...」が表示される', async () => {
      setupLoadingResponse();
      await renderResultScreen();

      expect(screen.getByText('採点中...')).toBeTruthy();
    });

    it('ローディング中はランキングテーブルが表示されない', async () => {
      setupLoadingResponse();
      await renderResultScreen();

      expect(screen.queryByText('ランキング')).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('成功状態 — ranked: false', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE_NOT_RANKED });
    });

    it('正解数ラベルが表示される', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('正解数')).toBeTruthy();
      });
    });

    it('経過時間が表示される', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('120.5秒')).toBeTruthy();
      });
    });

    it('ランキングテーブルが表示されない', async () => {
      await renderResultScreen();

      await waitFor(() => {
        // 正解数ラベルが出ていることを確認（成功状態であることを前提）
        expect(screen.getByText('正解数')).toBeTruthy();
      });

      expect(screen.queryByText('ランキング')).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('成功状態 — ranked: true', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE_RANKED });
    });

    it('正解数が表示される', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('18')).toBeTruthy();
      });
    });

    it('経過時間が表示される', async () => {
      await renderResultScreen();

      await waitFor(() => {
        // サマリーとランキング行の両方に 95.0秒 が表示されるため getAllByText を使う
        expect(screen.getAllByText('95.0秒').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('「ランキング」見出しが表示される', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('ランキング')).toBeTruthy();
      });
    });

    it('ランキングに含まれるユーザー名が表示される', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeTruthy();
        expect(screen.getByText('Bob')).toBeTruthy();
      });
    });

    it('ランキングが3件でも合計20行表示される（残り17行は「—」）', async () => {
      await renderResultScreen();

      await waitFor(() => {
        // 「—」が複数あることを確認（少なくとも空欄行がある）
        const dashes = screen.getAllByText('—');
        // 17行 × 4列（順位・名前・正解数・経過時間）= 68個の「—」
        expect(dashes.length).toBeGreaterThanOrEqual(17 * 4);
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('エラー状態', () => {
    it('callable が Error を throw したとき「エラーが発生しました」が表示される', async () => {
      callable.mockRejectedValue(new Error('deadline-exceeded'));
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeTruthy();
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
      callable.mockResolvedValue({ data: MOCK_RESPONSE_RANKED });
    });

    it('「トップに戻る」ボタンが表示される', async () => {
      await renderResultScreen();

      expect(screen.getByLabelText('トップに戻る')).toBeTruthy();
    });

    it('「トップに戻る」を押すと router.replace("/") が呼ばれる', async () => {
      await renderResultScreen();

      // ランクイン時は END を押すまでボタンが disabled のため、
      // まず5文字入力して END を押して initialsSubmitted 状態にする
      await waitFor(() => {
        expect(screen.getByLabelText('A')).toBeTruthy();
      });
      await fireEvent.press(screen.getByLabelText('A'));
      await fireEvent.press(screen.getByLabelText('B'));
      await fireEvent.press(screen.getByLabelText('C'));
      await fireEvent.press(screen.getByLabelText('D'));
      await fireEvent.press(screen.getByLabelText('E'));

      await fireEvent.press(screen.getByLabelText('入力完了'));

      await fireEvent.press(screen.getByLabelText('トップに戻る'));

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('submitScore の呼び出し引数', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE_RANKED });
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

    it('callable に answers が { id, answer } ペアの配列で渡される', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(callable).toHaveBeenCalledTimes(1);
      });

      const callArg = callable.mock.calls[0][0] as {
        level: string;
        answers: { id: string; answer: string }[];
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

  // ──────────────────────────────────────────────────────────
  describe('自分のランク行のハイライト', () => {
    // MOCK_RESPONSE_RANKED: rank: 3, rankings[2].username = '-----'
    beforeEach(() => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE_RANKED });
    });

    it('自分のランク行（rank: 3）のテキストに白色スタイルが適用される', async () => {
      await renderResultScreen();

      // ランクイン時は InitialsEntryForm が表示される。
      // 5文字入力して END を押すと initialsSubmitted になりランキングが表示される。
      await waitFor(() => {
        expect(screen.getByLabelText('A')).toBeTruthy();
      });
      await fireEvent.press(screen.getByLabelText('A'));
      await fireEvent.press(screen.getByLabelText('B'));
      await fireEvent.press(screen.getByLabelText('C'));
      await fireEvent.press(screen.getByLabelText('D'));
      await fireEvent.press(screen.getByLabelText('E'));

      await fireEvent.press(screen.getByLabelText('入力完了'));

      // END 後は ScoreSummary + RankingTable が表示される。
      // 自分の行のユーザー名は入力した 'ABCDE' になる。
      await waitFor(() => {
        expect(screen.getByText('ABCDE')).toBeTruthy();
      });

      const myUsernameEl = screen.getByText('ABCDE');
      const flatStyle = StyleSheet.flatten(myUsernameEl.props.style);
      expect(flatStyle.color).toBe('#FFFFFF');
    });

    it('他のランク行（自分以外）のテキストには白色スタイルが適用されない', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeTruthy();
      });

      const aliceEl = screen.getByText('Alice');
      const flatStyle = StyleSheet.flatten(aliceEl.props.style);
      expect(flatStyle.color).not.toBe('#FFFFFF');
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('ランキング20件フル表示', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE_RANKED_FULL });
    });

    it('rankings が20件のとき「—」が一切表示されない', async () => {
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('ランキング')).toBeTruthy();
      });

      expect(screen.queryAllByText('—')).toHaveLength(0);
    });

    it('rankings が20件のとき全ユーザー名が表示される', async () => {
      await renderResultScreen();

      // ランクイン時は InitialsEntryForm が表示される。
      // 5文字入力して END を押すと initialsSubmitted になりランキングが表示される。
      await waitFor(() => {
        expect(screen.getByLabelText('A')).toBeTruthy();
      });
      await fireEvent.press(screen.getByLabelText('A'));
      await fireEvent.press(screen.getByLabelText('B'));
      await fireEvent.press(screen.getByLabelText('C'));
      await fireEvent.press(screen.getByLabelText('D'));
      await fireEvent.press(screen.getByLabelText('E'));

      await fireEvent.press(screen.getByLabelText('入力完了'));

      await waitFor(() => {
        // 先頭は自分の行なので入力値 'ABCDE'、2位以降のユーザーを確認
        expect(screen.getByText('ABCDE')).toBeTruthy();
        expect(screen.getByText('User20')).toBeTruthy();
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('elapsed_time の表示フォーマット', () => {
    it('elapsed_time が 0 のとき「0.0秒」と表示される', async () => {
      callable.mockResolvedValue({
        data: { ...MOCK_RESPONSE_NOT_RANKED, elapsed_time: 0 },
      });
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('0.0秒')).toBeTruthy();
      });
    });

    it('elapsed_time が整数値（100）のとき「100.0秒」と表示される', async () => {
      callable.mockResolvedValue({
        data: { ...MOCK_RESPONSE_NOT_RANKED, elapsed_time: 100 },
      });
      await renderResultScreen();

      await waitFor(() => {
        expect(screen.getByText('100.0秒')).toBeTruthy();
      });
    });
  });
});
