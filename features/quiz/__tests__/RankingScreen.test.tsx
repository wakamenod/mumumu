/**
 * RankingScreen.test.tsx — Integration tests for app/(tabs)/two.tsx
 *
 * テスト方針:
 *   - ランキング画面全体を render し、ユーザー操作の「意図」を検証する。
 *   - getRankingFunction の callable を __callable パターンでモックする。
 *   - ローディング / 成功 / エラー / データなしの4状態を確認する。
 *   - レベルタブの切り替えで正しいレベルで callable が呼ばれることを確認する。
 *   - RankingTable 内部の詳細は RankingTable.test.tsx でカバー済み。
 *     ここでは「選択レベルのランキングが取得・表示されるか」という結合点に集中する。
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

import RankingScreen from '@/app/(tabs)/two';
import { DIFFICULTY_LEVELS } from '@/features/quiz';
/* eslint-enable import/first */

// ─── モックの callable を取得 ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const firebaseMock = require('@/lib/firebase');
const callable: jest.Mock = firebaseMock.__callable;

// ─── テスト用ダミーデータ ─────────────────────────────────────

const MOCK_RANKINGS = [
  { rank: 1, username: 'Alice', correct_count: 20, elapsed_time: 30.1 },
  { rank: 2, username: 'Bob', correct_count: 19, elapsed_time: 45.0 },
  { rank: 3, username: '-----', correct_count: 18, elapsed_time: 52.4 },
];

// ─── ヘルパー ────────────────────────────────────────────────

/** 永遠に resolve しない（ローディング状態のまま）よう設定する */
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

/** RankingScreen を render する共通ヘルパー */
async function renderRankingScreen() {
  await act(async () => {
    render(<RankingScreen />);
  });
}

// ─── テストスイート ──────────────────────────────────────────

describe('RankingScreen', () => {
  beforeEach(() => {
    callable.mockClear();
  });

  afterEach(() => {
    loadingAbortController?.abort();
    loadingAbortController = null;
  });

  // ──────────────────────────────────────────────────────────
  describe('初期表示', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: { rankings: MOCK_RANKINGS } });
    });

    it('画面タイトル「ランキング」が表示される', async () => {
      await renderRankingScreen();
      // ページタイトルとテーブル見出し両方に「ランキング」が出るため getAllByText を使う
      expect(screen.getAllByText('ランキング').length).toBeGreaterThanOrEqual(1);
    });

    it('デフォルトでリスト先頭のレベル（M = 小学1年生）が選択されている', async () => {
      await renderRankingScreen();

      const firstLevel = DIFFICULTY_LEVELS[0];
      expect(firstLevel.id).toBe('M');

      await waitFor(() => {
        expect(screen.getByText(firstLevel.label)).toBeTruthy();
      });
    });

    it('左右の矢印ボタン（前のレベル・次のレベル）が表示される', async () => {
      await renderRankingScreen();

      await waitFor(() => {
        expect(screen.getByLabelText('前のレベル')).toBeTruthy();
        expect(screen.getByLabelText('次のレベル')).toBeTruthy();
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('ローディング状態', () => {
    it('callable が pending のとき「読み込み中...」が表示される', async () => {
      setupLoadingResponse();
      await renderRankingScreen();

      expect(screen.getByText('読み込み中...')).toBeTruthy();

      await act(async () => {
        loadingAbortController?.abort();
      });
    });

    it('ローディング中はランキングテーブルが表示されない', async () => {
      setupLoadingResponse();
      await renderRankingScreen();

      // 「ランキング」はページタイトルとして表示されるが、
      // テーブル見出し「ランキング」は RankingTable 内部のもの。
      // ここでは「ユーザー名」ヘッダーがないことでテーブル非表示を確認する。
      expect(screen.queryByText('ユーザー名')).toBeNull();

      await act(async () => {
        loadingAbortController?.abort();
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('成功状態 — rankings あり', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: { rankings: MOCK_RANKINGS } });
    });

    it('「ユーザー名」列ヘッダーが表示される（RankingTable がレンダーされている）', async () => {
      await renderRankingScreen();

      await waitFor(() => {
        expect(screen.getByText('ユーザー名')).toBeTruthy();
      });
    });

    it('ランキングのユーザー名が表示される', async () => {
      await renderRankingScreen();

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeTruthy();
        expect(screen.getByText('Bob')).toBeTruthy();
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('成功状態 — rankings 空', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: { rankings: [] } });
    });

    it('「まだランキングデータがありません」が表示される', async () => {
      await renderRankingScreen();

      await waitFor(() => {
        expect(screen.getByText('まだランキングデータがありません')).toBeTruthy();
      });
    });

    it('RankingTable（「ユーザー名」ヘッダー）が表示されない', async () => {
      await renderRankingScreen();

      await waitFor(() => {
        expect(screen.getByText('まだランキングデータがありません')).toBeTruthy();
      });

      expect(screen.queryByText('ユーザー名')).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('エラー状態', () => {
    it('callable が Error を throw したとき「エラーが発生しました」が表示される', async () => {
      callable.mockRejectedValue(new Error('deadline-exceeded'));
      await renderRankingScreen();

      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeTruthy();
      });
    });

    it('エラーメッセージが表示される', async () => {
      callable.mockRejectedValue(new Error('サーバーに接続できません'));
      await renderRankingScreen();

      await waitFor(() => {
        expect(screen.getByText('サーバーに接続できません')).toBeTruthy();
      });
    });

    it('Error インスタンス以外のとき「不明なエラーが発生しました」が表示される', async () => {
      callable.mockRejectedValue('internal');
      await renderRankingScreen();

      await waitFor(() => {
        expect(screen.getByText('不明なエラーが発生しました')).toBeTruthy();
      });
    });

    it('「再試行」ボタンが表示される', async () => {
      callable.mockRejectedValue(new Error('network-error'));
      await renderRankingScreen();

      await waitFor(() => {
        expect(screen.getByLabelText('再試行')).toBeTruthy();
      });
    });

    it('「再試行」ボタンをタップすると callable が再度呼ばれる', async () => {
      callable.mockRejectedValue(new Error('network-error'));
      await renderRankingScreen();

      await waitFor(() => {
        expect(screen.getByLabelText('再試行')).toBeTruthy();
      });

      // 2回目は成功させる
      callable.mockResolvedValue({ data: { rankings: MOCK_RANKINGS } });

      await act(async () => {
        fireEvent.press(screen.getByLabelText('再試行'));
      });

      // 1回目（マウント時）+ 1回目（再試行）= 合計2回
      expect(callable).toHaveBeenCalledTimes(2);
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('callable の呼び出し引数', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: { rankings: MOCK_RANKINGS } });
    });

    it('マウント時に callable が1回だけ呼ばれる', async () => {
      await renderRankingScreen();

      await waitFor(() => {
        expect(callable).toHaveBeenCalledTimes(1);
      });
    });

    it('初期（M レベル）で callable に { level: "M" } が渡される', async () => {
      // DIFFICULTY_LEVELS[0].id === 'M' がデフォルト選択
      await renderRankingScreen();

      await waitFor(() => {
        expect(callable).toHaveBeenCalledWith({ level: 'M' });
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('レベルタブの切り替え', () => {
    beforeEach(() => {
      callable.mockResolvedValue({ data: { rankings: MOCK_RANKINGS } });
    });

    it('「次のレベル」ボタンをタップすると次のレベルで callable が呼ばれる', async () => {
      await renderRankingScreen();

      await waitFor(() => {
        expect(callable).toHaveBeenCalledTimes(1);
      });

      // 「次のレベル」で M → L に切り替える
      await act(async () => {
        fireEvent.press(screen.getByLabelText('次のレベル'));
      });

      const levelL = DIFFICULTY_LEVELS[1]; // L = 小学2年生
      await waitFor(() => {
        expect(callable).toHaveBeenCalledWith({ level: levelL.id });
      });
    });

    it('レベル切り替え後に選択レベルの label が表示される', async () => {
      await renderRankingScreen();

      // 「次のレベル」を1回タップ → M → L（小学2年生）
      await act(async () => {
        fireEvent.press(screen.getByLabelText('次のレベル'));
      });

      const levelL = DIFFICULTY_LEVELS[1];
      await waitFor(() => {
        expect(screen.getByText(levelL.label)).toBeTruthy();
      });
    });

    it('「前のレベル」で循環し、先頭から末尾（大学・一般）へ切り替わる', async () => {
      await renderRankingScreen();

      await waitFor(() => {
        expect(callable).toHaveBeenCalledWith({ level: 'M' });
      });

      // 先頭（M）で「前のレベル」→ 末尾（A = 大学・一般）に循環
      await act(async () => {
        fireEvent.press(screen.getByLabelText('前のレベル'));
      });

      const lastLevel = DIFFICULTY_LEVELS[DIFFICULTY_LEVELS.length - 1];
      await waitFor(() => {
        expect(callable).toHaveBeenCalledWith({ level: lastLevel.id });
        expect(screen.getByText(lastLevel.label)).toBeTruthy();
      });
    });
  });
});
