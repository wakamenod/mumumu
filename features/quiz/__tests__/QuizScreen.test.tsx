/**
 * QuizScreen.test.tsx — Integration tests for QuizScreen + NumericKeypad
 *
 * テスト方針:
 *   - quiz.tsx が NumericKeypad を正しく組み込んでいることを検証する結合テスト。
 *   - NumericKeypad 単体の詳細な動作は NumericKeypad.test.tsx でカバー済み。
 *     ここでは「画面遷移（次へ/前へ）時に入力がリセットされるか」という結合点に集中する。
 *   - getQuiz.ts はモジュールロード時に functions.httpsCallable() を実行する。
 *     jest.mock('@/lib/firebase') のファクトリー内で jest.fn() を完結させ、
 *     後から mockImplementation で動作を差し替える。
 *   - useLocalSearchParams は jest.setup.ts でモック済み。各テストで levelId を指定する。
 *   - RTL v14 では render() が非同期のため await が必要。
 *   - データ取得完了（state 更新）を waitFor() で待つ。
 */

// ─── jest.mock はファイル最上部に記述（hoisting により import より先に評価される） ───
//
// 注意: jest.mock のファクトリー内ではモジュールスコープの変数を参照できない。
//       ファクトリー内で callable インスタンスを生成し、__callable 経由で公開する。
//       getQuiz.ts のモジュールトップレベルの初期化（getQuizCallable への代入）が
//       このモックを参照するため、jest.mock は import より前に hoisting される必要がある。

jest.mock('@/lib/firebase', () => {
  // ファクトリー内では外部変数を参照できないため jest.fn() を直接生成する。
  const callable = jest.fn();
  return {
    functions: {
      httpsCallable: jest.fn(() => callable),
      useEmulator: jest.fn(),
    },
    firebase: {},
    // callable をファクトリー外から参照できるよう公開する
    __callable: callable,
  };
});

// expo-crypto をモック（SHA-256 ハッシュを固定値で返す）
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn().mockResolvedValue('mock-hash-never-matches'),
}));

// ─── 通常の import ────────────────────────────────────────────
// jest.mock の hoisting により、下記 import は実行順序上 jest.mock より後になる。
// import/first ルールの警告を抑制する。
/* eslint-disable import/first */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ExpoCrypto from 'expo-crypto';

import QuizScreen from '@/app/quiz';
/* eslint-enable import/first */

// expo-crypto の digestStringAsync mock への参照（テストごとに挙動を差し替える）
const mockDigestStringAsync = ExpoCrypto.digestStringAsync as jest.Mock;

// ─── モックの callable を取得 ─────────────────────────────────
// jest.mock のファクトリーで作成した callable を __callable 経由で取得する。
// eslint-disable-next-line @typescript-eslint/no-require-imports
const firebaseMock = require('@/lib/firebase');
const callable: jest.Mock = firebaseMock.__callable;

// ─── テスト用ダミーデータ ─────────────────────────────────────

const MOCK_QUESTIONS = [
  { order: 1, id: 'q1', question: '1 + 1', answer_hash: 'hash1' },
  { order: 2, id: 'q2', question: '2 + 2', answer_hash: 'hash2' },
  { order: 3, id: 'q3', question: '3 + 3', answer_hash: 'hash3' },
];

// ─── ヘルパー ────────────────────────────────────────────────

/** 正常なクイズレスポンスを返すよう callable を設定する */
function setupSuccessResponse() {
  callable.mockResolvedValue({ data: { questions: MOCK_QUESTIONS } });
}

/**
 * 永遠に resolve しない（ローディング状態のまま）よう設定する。
 * AbortController で Promise を外部からキャンセル可能にし、
 * テスト終了後にワーカーが詰まらないようにする。
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

/** Error インスタンスを throw するよう callable を設定する */
function setupErrorResponse(message = 'ネットワークエラー') {
  callable.mockRejectedValue(new Error(message));
}

/** Error インスタンス以外（文字列など）を throw するよう callable を設定する */
function setupNonErrorResponse() {
  callable.mockRejectedValue('something went wrong');
}

/** 空の問題リストを返すよう callable を設定する */
function setupEmptyResponse() {
  callable.mockResolvedValue({ data: { questions: [] } });
}

/**
 * QuizScreen を render して、クイズデータ取得完了 + カウントダウン完了まで待機する。
 *
 * 注意: MathDisplay は SVG で数式を描画するため、問題文テキスト（"1 + 1" など）は
 * DOM に存在しない。代わりに NumericKeypad の表示エリア（testID）が出現することで
 * 「success 状態に遷移した」ことを確認する。
 *
 * カウントダウン（3秒）を fake timers でスキップするため、
 * この関数を呼ぶ前に jest.useFakeTimers() が有効であることが前提。
 * 呼び出し側で jest.useRealTimers() を忘れずに行うこと。
 */
async function renderQuizScreen() {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

  await act(async () => {
    render(<QuizScreen />);
  });

  // getQuiz の Promise 解決を待つ（カウントダウンが表示される）
  await waitFor(() => {
    expect(screen.getByText('3')).toBeTruthy();
  });

  // カウントダウン 3秒をスキップする
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });

  // NumericKeypad が表示されるまで待つ（= カウントダウン完了 → 問題表示）
  await waitFor(() => {
    expect(screen.getByTestId('numeric-keypad-display')).toBeTruthy();
  });
}

// ─── テストスイート ──────────────────────────────────────────

describe('QuizScreen — NumericKeypad との統合', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    callable.mockClear();
    setupSuccessResponse();
  });

  afterEach(() => {
    jest.useRealTimers();
    // setupLoadingResponse が生成した pending Promise をキャンセルして
    // ワーカーが終了できない状態（open handle）を防ぐ
    loadingAbortController?.abort();
    loadingAbortController = null;
  });

  // ────────────────────────────────────────────────────────────
  describe('NumericKeypad の表示', () => {
    it('クイズ読み込み後に NumericKeypad が表示される（"?" プレースホルダー）', async () => {
      await renderQuizScreen();
      expect(screen.getByTestId('numeric-keypad-display')).toBeTruthy();
      expect(screen.getByTestId('numeric-keypad-display').props.children).toBe('?');
    });

    it('解答ルール文言が表示されている', async () => {
      await renderQuizScreen();
      expect(screen.getByText('【解答ルール】')).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('問題切り替え時の入力リセット', () => {
    it('数字を入力後に "回答" を押すと次問に進み入力が "?" にリセットされる', async () => {
      await renderQuizScreen();

      // 数字を入力する
      await act(async () => {
        fireEvent.press(screen.getByLabelText('5'));
      });
      expect(screen.getByTestId('numeric-keypad-display').props.children).toBe('5');

      // 「回答」を押す（SHA-256 は mock-hash-never-matches を返すため不正解になる）
      await act(async () => {
        fireEvent.press(screen.getByLabelText('回答する'));
      });

      // 900ms 後に次問へ進む setTimeout を進める
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // 2問目に遷移し入力がリセットされて "?" に戻る
      await waitFor(() => {
        expect(screen.getByText('問 2 / 3')).toBeTruthy();
        expect(screen.getByTestId('numeric-keypad-display').props.children).toBe('?');
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('ローディング中は NumericKeypad が表示されない', () => {
    it('データ取得中はキーパッドが存在しない', async () => {
      setupLoadingResponse();
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

      // render 直後（Promise pending 中）はローディング状態
      await act(async () => {
        render(<QuizScreen />);
      });

      // numeric-keypad-display が存在しない
      expect(screen.queryByTestId('numeric-keypad-display')).toBeNull();
      // ローディングテキストが表示されている
      expect(screen.getByText('クイズを取得中...')).toBeTruthy();

      // テスト終了前に abort して state 更新を act() の中に収める
      // （abort しないとワーカーが詰まり、act 外の setState 警告が出る）
      await act(async () => {
        loadingAbortController?.abort();
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('エラー時は NumericKeypad が表示されない', () => {
    it('データ取得失敗時はキーパッドが存在しない', async () => {
      setupErrorResponse();
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

      await act(async () => {
        render(<QuizScreen />);
      });

      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeTruthy();
      });

      expect(screen.queryByTestId('numeric-keypad-display')).toBeNull();
      expect(screen.queryByText('【解答ルール】')).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('回答ボタンの表示', () => {
    it('クイズ読み込み後に「回答する」ボタンが表示される', async () => {
      await renderQuizScreen();
      expect(screen.getByLabelText('回答する')).toBeTruthy();
    });

    it('最後の問題では「回答して結果を見る」ラベルになる', async () => {
      await renderQuizScreen();

      // 最後の問題（index 2）まで回答で進む
      for (let i = 0; i < 2; i++) {
        await act(async () => {
          fireEvent.press(screen.getByLabelText('回答する'));
        });
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
        await waitFor(() => {
          expect(screen.getByText(`問 ${i + 2} / 3`)).toBeTruthy();
        });
      }

      // 最後の問題ではラベルが変わる
      expect(screen.getByLabelText('回答して結果を見る')).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('エラーメッセージの詳細表示', () => {
    it('Error インスタンスを throw したとき、そのメッセージが画面に表示される', async () => {
      setupErrorResponse('サーバーに接続できません');
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

      await act(async () => {
        render(<QuizScreen />);
      });

      await waitFor(() => {
        expect(screen.getByText('サーバーに接続できません')).toBeTruthy();
      });
    });

    it('Error インスタンス以外を throw したとき「不明なエラーが発生しました」が表示される', async () => {
      setupNonErrorResponse();
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

      await act(async () => {
        render(<QuizScreen />);
      });

      await waitFor(() => {
        expect(screen.getByText('不明なエラーが発生しました')).toBeTruthy();
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('空の問題リスト', () => {
    it('questions: [] のとき NumericKeypad が表示されない', async () => {
      setupEmptyResponse();
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

      await act(async () => {
        render(<QuizScreen />);
      });

      // success 状態になる（エラーでもローディングでもない）が、
      // currentQuestion が undefined のため問題エリアが描画されない
      await waitFor(() => {
        expect(screen.queryByText('クイズを取得中...')).toBeNull();
      });

      expect(screen.queryByTestId('numeric-keypad-display')).toBeNull();
    });

    it('questions: [] のとき回答ボタン行が表示されない', async () => {
      setupEmptyResponse();
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

      await act(async () => {
        render(<QuizScreen />);
      });

      await waitFor(() => {
        expect(screen.queryByText('クイズを取得中...')).toBeNull();
      });

      // totalCount === 0 のときはボタン行ごと非表示になる
      expect(screen.queryByLabelText('回答する')).toBeNull();
      expect(screen.queryByLabelText('回答して結果を見る')).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('未知の levelId のフォールバック表示', () => {
    it('DIFFICULTY_LEVELS に存在しない levelId のとき、ヘッダーに levelId がそのまま表示される', async () => {
      // 'Z' は DIFFICULTY_LEVELS に存在しない ID
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'Z' });

      await act(async () => {
        render(<QuizScreen />);
      });

      // level が見つからない場合は levelId 文字列をそのまま badge に表示する
      await waitFor(() => {
        expect(screen.getByText('Z')).toBeTruthy();
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('levelId が未指定のエラー', () => {
    it('levelId がない場合にエラータイトルが表示される', async () => {
      // useLocalSearchParams が levelId を持たないオブジェクトを返す
      (useLocalSearchParams as jest.Mock).mockReturnValue({});

      await act(async () => {
        render(<QuizScreen />);
      });

      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeTruthy();
      });
    });

    it('levelId がない場合に専用のエラーメッセージが表示される', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});

      await act(async () => {
        render(<QuizScreen />);
      });

      await waitFor(() => {
        expect(screen.getByText('levelId が指定されていません')).toBeTruthy();
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('最終問題回答後の router.push 引数（answers / startedAt / levelId）', () => {
    let mockPush: jest.Mock;

    beforeEach(() => {
      mockPush = jest.fn();
      // useRouter が返す push を per-test の spy に差し替える
      (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });
    });

    it('全問回答後に router.push が pathname: "/result" で呼ばれる', async () => {
      await renderQuizScreen();

      // 3問すべて回答（SHA-256 mock は常に不一致なので全問不正解）
      for (let i = 0; i < MOCK_QUESTIONS.length; i++) {
        await act(async () => {
          fireEvent.press(screen.getByLabelText(i < 2 ? '回答する' : '回答して結果を見る'));
        });
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      expect(mockPush).toHaveBeenCalledTimes(1);
      const callArg = mockPush.mock.calls[0][0] as {
        pathname: string;
        params: Record<string, string>;
      };
      expect(callArg.pathname).toBe('/result');
    });

    it('router.push の params に levelId が含まれる', async () => {
      await renderQuizScreen(); // useLocalSearchParams は { levelId: 'M' } を返す

      for (let i = 0; i < MOCK_QUESTIONS.length; i++) {
        await act(async () => {
          fireEvent.press(screen.getByLabelText(i < 2 ? '回答する' : '回答して結果を見る'));
        });
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      const callArg = mockPush.mock.calls[0][0] as {
        pathname: string;
        params: Record<string, string>;
      };
      expect(callArg.params.levelId).toBe('M');
    });

    it('router.push の params.startedAt が数値文字列である', async () => {
      await renderQuizScreen();

      for (let i = 0; i < MOCK_QUESTIONS.length; i++) {
        await act(async () => {
          fireEvent.press(screen.getByLabelText(i < 2 ? '回答する' : '回答して結果を見る'));
        });
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      const callArg = mockPush.mock.calls[0][0] as {
        pathname: string;
        params: Record<string, string>;
      };
      // 数値文字列に変換できることを確認（Date.now() の結果）
      expect(Number(callArg.params.startedAt)).toBeGreaterThan(0);
    });

    it('router.push の params.answers が JSON パース可能な配列で、全問の { id, answer } ペアを含む', async () => {
      await renderQuizScreen();

      // 各問で数字キーを押してから回答する（1問目: "7"、2問目: "3"、3問目: "5"）
      const inputs = ['7', '3', '5'];
      for (let i = 0; i < MOCK_QUESTIONS.length; i++) {
        await act(async () => {
          fireEvent.press(screen.getByLabelText(inputs[i]));
        });
        await act(async () => {
          fireEvent.press(screen.getByLabelText(i < 2 ? '回答する' : '回答して結果を見る'));
        });
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      const callArg = mockPush.mock.calls[0][0] as {
        pathname: string;
        params: Record<string, string>;
      };
      const parsedAnswers = JSON.parse(callArg.params.answers) as { id: string; answer: string }[];

      expect(parsedAnswers).toHaveLength(MOCK_QUESTIONS.length);
      expect(parsedAnswers[0]).toEqual({ id: 'q1', answer: '7' });
      expect(parsedAnswers[1]).toEqual({ id: 'q2', answer: '3' });
      expect(parsedAnswers[2]).toEqual({ id: 'q3', answer: '5' });
    });

    it('router.push の params に correct が含まれない（削除済み）', async () => {
      await renderQuizScreen();

      for (let i = 0; i < MOCK_QUESTIONS.length; i++) {
        await act(async () => {
          fireEvent.press(screen.getByLabelText(i < 2 ? '回答する' : '回答して結果を見る'));
        });
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      const callArg = mockPush.mock.calls[0][0] as {
        pathname: string;
        params: Record<string, string>;
      };
      expect(callArg.params.correct).toBeUndefined();
    });

    it('router.push の params に total が含まれない（削除済み）', async () => {
      await renderQuizScreen();

      for (let i = 0; i < MOCK_QUESTIONS.length; i++) {
        await act(async () => {
          fireEvent.press(screen.getByLabelText(i < 2 ? '回答する' : '回答して結果を見る'));
        });
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      const callArg = mockPush.mock.calls[0][0] as {
        pathname: string;
        params: Record<string, string>;
      };
      expect(callArg.params.total).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('二重遷移ガード（hasNavigatedToResultRef）', () => {
    /**
     * テスト方針:
     *   - 全問回答後に router.push が呼ばれた後、再度「回答して結果へ」を押しても
     *     router.push が2回目以降は呼ばれないことを確認する。
     *   - スワイプバックで /quiz に戻り再送信するケースを模擬している。
     *     テスト環境では router.push をモックするため実際の画面遷移は発生しないが、
     *     push の呼び出し回数でガードの動作を検証できる。
     */

    let mockPush: jest.Mock;

    beforeEach(() => {
      mockPush = jest.fn();
      (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });
    });

    it('最終問題を2回回答しても router.push は1回しか呼ばれない', async () => {
      await renderQuizScreen();

      // 1〜2問目を回答して進む
      for (let i = 0; i < MOCK_QUESTIONS.length - 1; i++) {
        await act(async () => {
          fireEvent.press(screen.getByLabelText('回答する'));
        });
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      // 最終問題（3問目）を1回目回答 → router.push が呼ばれる
      await act(async () => {
        fireEvent.press(screen.getByLabelText('回答して結果を見る'));
      });
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockPush).toHaveBeenCalledTimes(1);

      // 再度「回答して結果へ」を押す（スワイプバック後の再押下を模擬）
      await act(async () => {
        fireEvent.press(screen.getByLabelText('回答して結果を見る'));
      });
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // ガードにより2回目の push は実行されない
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('正誤オーバーレイ（resultState の伝播）', () => {
    /**
     * テスト方針:
     *   - QuizScreen が回答後に NumericKeypad の resultState prop を更新し、
     *     入力表示エリア内に ○/× が描画されることを結合テストで確認する。
     *   - SHA-256 比較は expo-crypto をモックで制御する。
     *     - 不正解: mockDigestStringAsync が 'mock-hash-never-matches' を返す（デフォルト）
     *     - 正解:   mockDigestStringAsync が MOCK_QUESTIONS[0].answer_hash と同じ値を返す
     *   - setTimeout (900ms) は jest.useFakeTimers() で制御し、
     *     タイマー進行前（○/× 表示中）と進行後（次問へ遷移後）を分けて検証する。
     */

    beforeEach(() => {
      // デフォルトに戻す（不正解になるハッシュ）
      mockDigestStringAsync.mockResolvedValue('mock-hash-never-matches');
    });

    it('回答後（タイマー進行前）に × が表示される（不正解の場合）', async () => {
      await renderQuizScreen();

      // 回答ボタンを押す（digestStringAsync はデフォルトで不一致を返す → 不正解）
      await act(async () => {
        fireEvent.press(screen.getByLabelText('回答する'));
      });

      // タイマーを進める前の時点で × が表示されている
      expect(screen.getByText('×')).toBeTruthy();
      expect(screen.queryByText('○')).toBeNull();

      // タイマーを進めてクリーンアップ
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    });

    it('回答後（タイマー進行前）に ○ が表示される（正解の場合）', async () => {
      // 1問目の answer_hash と同じ値をモックが返す → 正解
      mockDigestStringAsync.mockResolvedValue(MOCK_QUESTIONS[0].answer_hash);

      await renderQuizScreen();

      await act(async () => {
        fireEvent.press(screen.getByLabelText('回答する'));
      });

      // ○ が表示されている
      expect(screen.getByText('○')).toBeTruthy();
      expect(screen.queryByText('×')).toBeNull();

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    });

    it('次の問題に進むと ○/× が消えて入力待ち状態に戻る', async () => {
      await renderQuizScreen();

      // 1問目に回答（不正解）
      await act(async () => {
        fireEvent.press(screen.getByLabelText('回答する'));
      });
      expect(screen.getByText('×')).toBeTruthy();

      // 900ms 後に次問へ自動遷移
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // 2問目に遷移し、2問目は未回答なので ○/× が消えている
      await waitFor(() => {
        expect(screen.getByText('問 2 / 3')).toBeTruthy();
      });
      expect(screen.queryByText('×')).toBeNull();
      expect(screen.queryByText('○')).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('カウントダウン表示', () => {
    it('getQuiz 成功後にカウントダウン（数字「3」）が表示され、問題はまだ表示されない', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

      await act(async () => {
        render(<QuizScreen />);
      });

      // カウントダウンが表示される
      await waitFor(() => {
        expect(screen.getByText('3')).toBeTruthy();
      });

      // 問題エリア・キーパッドはまだ表示されない
      expect(screen.queryByTestId('numeric-keypad-display')).toBeNull();
    });

    it('カウントダウン中は進捗表示（問 X / Y）が非表示である', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

      await act(async () => {
        render(<QuizScreen />);
      });

      await waitFor(() => {
        expect(screen.getByText('3')).toBeTruthy();
      });

      expect(screen.queryByText(/問 \d+ \/ \d+/)).toBeNull();
    });

    it('カウントダウン中は回答ボタンが非表示である', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

      await act(async () => {
        render(<QuizScreen />);
      });

      await waitFor(() => {
        expect(screen.getByText('3')).toBeTruthy();
      });

      expect(screen.queryByLabelText('回答する')).toBeNull();
    });

    it('カウントダウン完了後に問題と回答ボタンが表示される', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

      await act(async () => {
        render(<QuizScreen />);
      });

      await waitFor(() => {
        expect(screen.getByText('3')).toBeTruthy();
      });

      // カウントダウン 3秒をスキップ
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      // 問題表示・キーパッド・回答ボタン・進捗がすべて表示される
      await waitFor(() => {
        expect(screen.getByTestId('numeric-keypad-display')).toBeTruthy();
      });
      expect(screen.getByLabelText('回答する')).toBeTruthy();
      expect(screen.getByText('問 1 / 3')).toBeTruthy();
    });
  });
});
