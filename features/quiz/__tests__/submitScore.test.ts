/**
 * submitScore.test.ts — Unit tests for features/quiz/api/submitScore.ts
 *
 * テスト方針:
 *   - submitScore() が Cloud Functions の submitScoreFunction を正しく呼び出すことを検証する。
 *   - getQuiz.ts のテストと同じ __callable パターンを使い、
 *     jest.mock('@/lib/firebase') でモジュールレベルの callable を差し替える。
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
import { submitScore } from '@/features/quiz/api/submitScore';
import type { SubmitScoreRequest, SubmitScoreResponse } from '@/features/quiz/api/submitScore';
/* eslint-enable import/first */

// ─── モックの callable を取得 ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const firebaseMock = require('@/lib/firebase');
const callable: jest.Mock = firebaseMock.__callable;

// ─── テスト用ダミーデータ ─────────────────────────────────────

const MOCK_REQUEST: SubmitScoreRequest = {
  level: 'A',
  answers: [
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
  ],
  startedAt: 1718268420000,
};

const MOCK_RESPONSE: SubmitScoreResponse = {
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

// ─── テストスイート ──────────────────────────────────────────

describe('submitScore', () => {
  beforeEach(() => {
    callable.mockClear();
  });

  // ──────────────────────────────────────────────────────────
  describe('初期化', () => {
    it('httpsCallable が "submitScoreFunction" で初期化されている', () => {
      // モジュールロード時に httpsCallable('submitScoreFunction') が呼ばれている
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { functions } = require('@/lib/firebase');
      expect(functions.httpsCallable).toHaveBeenCalledWith('submitScoreFunction');
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('正常系', () => {
    it('callable が resolve したとき result.data を返す', async () => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE });

      const result = await submitScore(MOCK_REQUEST);

      expect(result).toEqual(MOCK_RESPONSE);
    });

    it('callable に正しいリクエスト引数が渡される', async () => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE });

      await submitScore(MOCK_REQUEST);

      expect(callable).toHaveBeenCalledTimes(1);
      expect(callable).toHaveBeenCalledWith(MOCK_REQUEST);
    });

    it('ranked: false のレスポンスも正しく返す', async () => {
      const unrankedResponse: SubmitScoreResponse = {
        ranked: false,
        rank: null,
        correct_count: 5,
        elapsed_time: 200000,
        claimToken: null,
        rankings: [],
      };
      callable.mockResolvedValue({ data: unrankedResponse });

      const result = await submitScore(MOCK_REQUEST);

      expect(result.ranked).toBe(false);
      expect(result.rank).toBeNull();
      expect(result.claimToken).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('異常系', () => {
    it('callable が Error を throw したとき同じ Error が伝播する', async () => {
      const error = new Error('deadline-exceeded');
      callable.mockRejectedValue(error);

      await expect(submitScore(MOCK_REQUEST)).rejects.toThrow('deadline-exceeded');
    });

    it('callable が Error 以外を throw したときもそのまま伝播する', async () => {
      callable.mockRejectedValue('invalid-argument');

      await expect(submitScore(MOCK_REQUEST)).rejects.toBe('invalid-argument');
    });
  });
});
