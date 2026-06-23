/**
 * registerUsername.test.ts — Unit tests for features/quiz/api/registerUsername.ts
 *
 * テスト方針:
 *   - registerUsername() が Cloud Functions の registerUsernameFunction を正しく呼び出すことを検証する。
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
import { registerUsername } from '@/features/quiz/api/registerUsername';
import type {
  RegisterUsernameRequest,
  RegisterUsernameResponse,
} from '@/features/quiz/api/registerUsername';
/* eslint-enable import/first */

// ─── モックの callable を取得 ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const firebaseMock = require('@/lib/firebase');
const callable: jest.Mock = firebaseMock.__callable;

// ─── テスト用ダミーデータ ─────────────────────────────────────

const MOCK_LEVEL = 'A';
const MOCK_CLAIM_TOKEN = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
const MOCK_USERNAME = 'ABCDE';

const MOCK_RESPONSE: RegisterUsernameResponse = {
  success: true,
  rank: 3,
  username: 'ABCDE',
};

// ─── テストスイート ──────────────────────────────────────────

describe('registerUsername', () => {
  beforeEach(() => {
    callable.mockClear();
  });

  // ──────────────────────────────────────────────────────────
  describe('初期化', () => {
    it('httpsCallable が "registerUsernameFunction" で初期化されている', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { functions } = require('@/lib/firebase');
      expect(functions.httpsCallable).toHaveBeenCalledWith('registerUsernameFunction');
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('正常系', () => {
    it('callable が resolve したとき result.data を返す', async () => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE });

      const result = await registerUsername(MOCK_LEVEL, MOCK_CLAIM_TOKEN, MOCK_USERNAME);

      expect(result).toEqual(MOCK_RESPONSE);
    });

    it('callable に正しいリクエスト引数が渡される', async () => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE });

      await registerUsername(MOCK_LEVEL, MOCK_CLAIM_TOKEN, MOCK_USERNAME);

      expect(callable).toHaveBeenCalledTimes(1);
      expect(callable).toHaveBeenCalledWith({
        level: MOCK_LEVEL,
        claimToken: MOCK_CLAIM_TOKEN,
        username: MOCK_USERNAME,
      } satisfies RegisterUsernameRequest);
    });

    it('各レベル ID が callable にそのまま渡される', async () => {
      callable.mockResolvedValue({ data: MOCK_RESPONSE });

      for (const level of ['A', 'G', 'M'] as const) {
        callable.mockClear();
        await registerUsername(level, MOCK_CLAIM_TOKEN, MOCK_USERNAME);
        expect(callable).toHaveBeenCalledWith(expect.objectContaining({ level }));
      }
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('異常系', () => {
    it('callable が Error を throw したとき同じ Error が伝播する', async () => {
      const error = new Error('deadline-exceeded');
      callable.mockRejectedValue(error);

      await expect(registerUsername(MOCK_LEVEL, MOCK_CLAIM_TOKEN, MOCK_USERNAME)).rejects.toThrow(
        'deadline-exceeded'
      );
    });

    it('callable が Error 以外を throw したときもそのまま伝播する', async () => {
      callable.mockRejectedValue('invalid-argument');

      await expect(registerUsername(MOCK_LEVEL, MOCK_CLAIM_TOKEN, MOCK_USERNAME)).rejects.toBe(
        'invalid-argument'
      );
    });
  });
});
