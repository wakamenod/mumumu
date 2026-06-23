/**
 * getRanking.test.ts — Unit tests for features/quiz/api/getRanking.ts
 *
 * テスト方針:
 *   - getRanking() が Cloud Functions の getRankingFunction を正しく呼び出すことを検証する。
 *   - submitScore.test.ts と同じ __callable パターンで firebase モジュールをモックする。
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
import { getRanking } from '@/features/quiz/api/getRanking';
import type { GetRankingRequest, GetRankingResponse } from '@/features/quiz/api/getRanking';
import type { RankingEntry } from '@/features/quiz/api/submitScore';
/* eslint-enable import/first */

// ─── モックの callable を取得 ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const firebaseMock = require('@/lib/firebase');
const callable: jest.Mock = firebaseMock.__callable;

// ─── テスト用ダミーデータ ─────────────────────────────────────

const MOCK_RANKINGS: RankingEntry[] = [
  { rank: 1, username: 'Alice', correct_count: 7, elapsed_time: 30.1 },
  { rank: 2, username: 'Bob', correct_count: 7, elapsed_time: 35.2 },
  { rank: 3, username: '-----', correct_count: 18, elapsed_time: 52.4 },
];

const MOCK_RESPONSE: GetRankingResponse = {
  rankings: MOCK_RANKINGS,
};

// ─── テストスイート ──────────────────────────────────────────

describe('getRanking', () => {
  beforeEach(() => {
    callable.mockClear();
  });

  // ──────────────────────────────────────────────────────────
  describe('初期化', () => {
    it('httpsCallable が "getRankingFunction" で初期化されている', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { functions } = require('@/lib/firebase');
      expect(functions.httpsCallable).toHaveBeenCalledWith('getRankingFunction');
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('正常系', () => {
    it('callable が resolve したとき rankings 配列を返す', async () => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE });

      const result = await getRanking('A');

      expect(result).toEqual(MOCK_RANKINGS);
    });

    it('callable に { level } が正しく渡される', async () => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE });

      await getRanking('A');

      expect(callable).toHaveBeenCalledTimes(1);
      expect(callable).toHaveBeenCalledWith({ level: 'A' } satisfies GetRankingRequest);
    });

    it('各レベル ID が callable にそのまま渡される', async () => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE });

      for (const level of ['A', 'G', 'M'] as const) {
        callable.mockClear();
        await getRanking(level);
        expect(callable).toHaveBeenCalledWith({ level });
      }
    });

    it('rankings: [] のとき空配列を返す（データなしは正常系）', async () => {
      callable.mockResolvedValue({ data: { rankings: [] } });

      const result = await getRanking('M');

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('rankings が7件フルのとき7件をそのまま返す', async () => {
      const full = Array.from({ length: 7 }, (_, i) => ({
        rank: i + 1,
        username: `User${i + 1}`,
        correct_count: 7 - i,
        elapsed_time: 30.0 + i * 5,
      }));
      callable.mockResolvedValue({ data: { rankings: full } });

      const result = await getRanking('B');

      expect(result).toHaveLength(7);
      expect(result[0].rank).toBe(1);
      expect(result[6].rank).toBe(7);
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('異常系', () => {
    it('callable が Error を throw したとき同じ Error が伝播する', async () => {
      const error = new Error('invalid-argument');
      callable.mockRejectedValue(error);

      await expect(getRanking('Z')).rejects.toThrow('invalid-argument');
    });

    it('callable が Error 以外を throw したときもそのまま伝播する', async () => {
      callable.mockRejectedValue('internal');

      await expect(getRanking('A')).rejects.toBe('internal');
    });
  });
});
