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

// ─── 通常の import ────────────────────────────────────────────
// jest.mock の hoisting により、下記 import は実行順序上 jest.mock より後になる。
// import/first ルールの警告を抑制する。
/* eslint-disable import/first */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import QuizScreen from '@/app/quiz';
/* eslint-enable import/first */

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
 * QuizScreen を render して、クイズデータ取得完了まで待機する。
 *
 * 注意: MathDisplay は SVG で数式を描画するため、問題文テキスト（"1 + 1" など）は
 * DOM に存在しない。代わりに NumericKeypad の表示エリア（testID）が出現することで
 * 「success 状態に遷移した」ことを確認する。
 */
async function renderQuizScreen() {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

  await act(async () => {
    render(<QuizScreen />);
  });

  // NumericKeypad が表示されるまで待つ（= success 状態への遷移完了）
  await waitFor(() => {
    expect(screen.getByTestId('numeric-keypad-display')).toBeTruthy();
  });
}

// ─── テストスイート ──────────────────────────────────────────

describe('QuizScreen — NumericKeypad との統合', () => {
  beforeEach(() => {
    callable.mockClear();
    setupSuccessResponse();
  });

  afterEach(() => {
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
    it('数字を入力後に "次へ" を押すと入力が "?" にリセットされる', async () => {
      await renderQuizScreen();

      // 数字を入力する
      await act(async () => {
        fireEvent.press(screen.getByLabelText('5'));
      });
      expect(screen.getByTestId('numeric-keypad-display').props.children).toBe('5');

      // 「次へ」を押す
      await act(async () => {
        fireEvent.press(screen.getByLabelText('次の問題'));
      });

      // 入力がリセットされて "?" に戻る
      await waitFor(() => {
        expect(screen.getByTestId('numeric-keypad-display').props.children).toBe('?');
      });
    });

    it('"次へ" で移動してから入力し "前へ" で戻ると入力がリセットされる', async () => {
      await renderQuizScreen();

      // 1問目から次へ
      await act(async () => {
        fireEvent.press(screen.getByLabelText('次の問題'));
      });

      // 2問目に遷移したことをページ番号で確認（MathDisplay はSVG描画のためテキスト検索不可）
      await waitFor(() => {
        expect(screen.getByText('問 2 / 3')).toBeTruthy();
      });

      // 2問目で入力
      await act(async () => {
        fireEvent.press(screen.getByLabelText('9'));
      });
      expect(screen.getByTestId('numeric-keypad-display').props.children).toBe('9');

      // 前へ戻る
      await act(async () => {
        fireEvent.press(screen.getByLabelText('前の問題'));
      });

      // 1問目に戻り、入力がリセットされている
      await waitFor(() => {
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
  describe('ナビゲーションボタンの disabled 状態', () => {
    it('最初の問題では「前へ」を押しても問題番号が変わらない', async () => {
      await renderQuizScreen();

      // currentIndex=0（問 1 / 3）の状態で「前へ」を押す
      await act(async () => {
        fireEvent.press(screen.getByLabelText('前の問題'));
      });

      // 問題番号が変化していない（nav row のカウンター）
      expect(screen.getByText('1 / 3')).toBeTruthy();
    });

    it('最後の問題では「次へ」を押しても問題番号が変わらない', async () => {
      await renderQuizScreen();

      // 最後の問題（index 2）まで進む
      await act(async () => {
        fireEvent.press(screen.getByLabelText('次の問題'));
      });
      await act(async () => {
        fireEvent.press(screen.getByLabelText('次の問題'));
      });

      await waitFor(() => {
        expect(screen.getByText('3 / 3')).toBeTruthy();
      });

      // 最後の問題で「次へ」を押す
      await act(async () => {
        fireEvent.press(screen.getByLabelText('次の問題'));
      });

      // 問題番号が変化していない
      expect(screen.getByText('3 / 3')).toBeTruthy();
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

    it('questions: [] のときナビゲーションボタン行が表示されない', async () => {
      setupEmptyResponse();
      (useLocalSearchParams as jest.Mock).mockReturnValue({ levelId: 'M' });

      await act(async () => {
        render(<QuizScreen />);
      });

      await waitFor(() => {
        expect(screen.queryByText('クイズを取得中...')).toBeNull();
      });

      // totalCount === 0 のときはナビ行ごと非表示になる
      expect(screen.queryByLabelText('次の問題')).toBeNull();
      expect(screen.queryByLabelText('前の問題')).toBeNull();
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
});
