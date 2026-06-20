/**
 * NumericKeypad.test.tsx — Unit tests for NumericKeypad
 *
 * テスト方針:
 *   - §4.2 のバリデーション制御（ボタンの活性・非活性）を重点的に検証する。
 *   - 「ユーザーが見て操作できること」を軸に検証し、内部 state には直接触れない。
 *   - accessibilityLabel でキーを取得し、実装詳細（スタイル等）に依存しない。
 *   - onValueChange コールバックで rawValue が仕様通りに組み立てられることを確認する。
 *   - RTL v14 では render() が非同期のため await が必要。
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { NumericKeypad } from '../components/NumericKeypad';

// ─── ヘルパー ────────────────────────────────────────────────

/** NumericKeypad を render して onValueChange の mock も返す */
async function renderKeypad(onValueChange = jest.fn()) {
  // act でラップして初回 useEffect（onValueChange への "0" 通知）を確実に flush する
  await act(async () => {
    render(<NumericKeypad onValueChange={onValueChange} />);
  });
  return { onValueChange };
}

/** accessibilityLabel "N" のキーを取得する */
const getKey = (label: string) => screen.getByLabelText(label);

/** 入力表示エリアのテキストを取得する */
const getDisplayText = () => screen.getByTestId('numeric-keypad-display').props.children;

/** 数字キーを順に押す（各 press を act でラップして state 更新を確定させる） */
async function pressDigits(...digits: string[]) {
  for (const d of digits) {
    await act(async () => {
      fireEvent.press(getKey(d));
    });
  }
}

// ─── テストスイート ──────────────────────────────────────────

describe('NumericKeypad', () => {
  // ────────────────────────────────────────────────────────────
  describe('初期状態', () => {
    it('入力表示に "?" が表示される', async () => {
      await renderKeypad();
      expect(getDisplayText()).toBe('?');
    });

    it('onValueChange に "0" が初期通知される', async () => {
      const { onValueChange } = await renderKeypad();
      // rawValue の初期値は "0"（digits="" のフォールバック）
      expect(onValueChange).toHaveBeenCalledWith('0');
    });

    it('"/" ボタンが disabled（先頭スラッシュ禁止 §4.2）', async () => {
      await renderKeypad();
      // disabled なので押しても onValueChange の値が変わらない
      const slash = getKey('スラッシュ（分数）');
      fireEvent.press(slash);
      expect(screen.getByText('?')).toBeTruthy();
    });

    it('"⌫" ボタンが disabled（削除する文字がない）', async () => {
      await renderKeypad();
      const before = screen.getByText('?');
      fireEvent.press(getKey('1文字削除'));
      expect(before).toBeTruthy();
      expect(screen.getByText('?')).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('数字入力', () => {
    it('数字キーを押すと入力表示が更新される', async () => {
      await renderKeypad();
      await act(async () => {
        fireEvent.press(getKey('7'));
      });
      expect(getDisplayText()).toBe('7');
    });

    it('複数桁を連続入力できる', async () => {
      await renderKeypad();
      await pressDigits('1', '2', '3');
      expect(getDisplayText()).toBe('123');
    });

    it('数字入力後に onValueChange が正しい raw 文字列で呼ばれる', async () => {
      const { onValueChange } = await renderKeypad();
      onValueChange.mockClear();
      await pressDigits('4', '2');
      // 最後の呼び出しが "42" であることを確認
      expect(onValueChange).toHaveBeenLastCalledWith('42');
    });

    it('"0" 単体を入力したとき表示は "0"（rawValue も "0" のまま）', async () => {
      await renderKeypad();
      await act(async () => {
        fireEvent.press(getKey('0'));
      });
      // rawValue は "0" → "0" で変化なし（useEffect は発火しないのが正しい挙動）
      // 表示エリアが "0" であることで rawValue を間接確認する
      expect(getDisplayText()).toBe('0');
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('スラッシュ制限（§4.2）', () => {
    it('1文字入力後は "/" が押せる', async () => {
      const { onValueChange } = await renderKeypad();
      onValueChange.mockClear();
      await act(async () => {
        fireEvent.press(getKey('3'));
      });
      await act(async () => {
        fireEvent.press(getKey('スラッシュ（分数）'));
      });
      expect(onValueChange).toHaveBeenLastCalledWith('3/');
    });

    it('すでに "/" がある場合は再度 "/" を押しても無効（§4.2）', async () => {
      const { onValueChange } = await renderKeypad();
      await pressDigits('1');
      await act(async () => {
        fireEvent.press(getKey('スラッシュ（分数）'));
      });
      await pressDigits('2');
      const callsAfterSlash = onValueChange.mock.calls.length;

      // 2回目の "/" を押す
      await act(async () => {
        fireEvent.press(getKey('スラッシュ（分数）'));
      });
      // コール数が増えていない（disabled で無反応）
      expect(onValueChange.mock.calls.length).toBe(callsAfterSlash);
    });

    it('"/" 後の入力で分数が組み立てられる', async () => {
      const { onValueChange } = await renderKeypad();
      onValueChange.mockClear();
      await pressDigits('1');
      await act(async () => {
        fireEvent.press(getKey('スラッシュ（分数）'));
      });
      await pressDigits('3');
      expect(onValueChange).toHaveBeenLastCalledWith('1/3');
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('分母ゼロ禁止（§4.2）', () => {
    it('"/" 直後に "0" は押せない（分母ゼロ防止）', async () => {
      const { onValueChange } = await renderKeypad();
      await pressDigits('5');
      await act(async () => {
        fireEvent.press(getKey('スラッシュ（分数）'));
      });
      const callsBeforeZero = onValueChange.mock.calls.length;

      // "/" 直後に "0" を押す
      await act(async () => {
        fireEvent.press(getKey('0'));
      });
      expect(onValueChange.mock.calls.length).toBe(callsBeforeZero);
    });

    it('"/" 直後でも非ゼロ数字は押せる', async () => {
      const { onValueChange } = await renderKeypad();
      await pressDigits('2');
      await act(async () => {
        fireEvent.press(getKey('スラッシュ（分数）'));
      });
      onValueChange.mockClear();

      await act(async () => {
        fireEvent.press(getKey('4'));
      });
      expect(onValueChange).toHaveBeenLastCalledWith('2/4');
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('+/- 符号切り替え', () => {
    it('初期状態では "現在: +" が表示されている', async () => {
      await renderKeypad();
      expect(screen.getByText('現在: +')).toBeTruthy();
    });

    it('符号ボタンを押すと "現在: −" に変わる', async () => {
      await renderKeypad();
      await act(async () => {
        fireEvent.press(getKey('マイナスに切り替え'));
      });
      expect(screen.getByText('現在: −')).toBeTruthy();
    });

    it('再度押すと "現在: +" に戻る', async () => {
      await renderKeypad();
      await act(async () => {
        fireEvent.press(getKey('マイナスに切り替え'));
      });
      await act(async () => {
        fireEvent.press(getKey('プラスに切り替え'));
      });
      expect(screen.getByText('現在: +')).toBeTruthy();
    });

    it('数字入力後にマイナスにすると rawValue に "-" が付く', async () => {
      const { onValueChange } = await renderKeypad();
      await pressDigits('5');
      await act(async () => {
        fireEvent.press(getKey('マイナスに切り替え'));
      });
      expect(onValueChange).toHaveBeenLastCalledWith('-5');
    });

    it('入力が空のとき "−" にしても表示は "?" のまま（rawValue="0" で変化なし、-0 防止）', async () => {
      await renderKeypad();
      await act(async () => {
        fireEvent.press(getKey('マイナスに切り替え'));
      });
      // rawValue は "0" → "0" で変化なし（useEffect は発火しないのが正しい挙動）
      // 表示はプレースホルダーのまま
      expect(getDisplayText()).toBe('?');
    });

    it('"0" のみ入力時に "−" にしても表示は "0" のまま（-0 防止）', async () => {
      await renderKeypad();
      await act(async () => {
        fireEvent.press(getKey('0'));
      });
      await act(async () => {
        fireEvent.press(getKey('マイナスに切り替え'));
      });
      // rawValue は "0" → "0" で変化なし
      expect(getDisplayText()).toBe('0');
    });

    it('分数全体に符号が付く（例: -2/5）', async () => {
      const { onValueChange } = await renderKeypad();
      await pressDigits('2');
      await act(async () => {
        fireEvent.press(getKey('スラッシュ（分数）'));
      });
      await pressDigits('5');
      await act(async () => {
        fireEvent.press(getKey('マイナスに切り替え'));
      });
      expect(onValueChange).toHaveBeenLastCalledWith('-2/5');
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('バックスペース（削除）', () => {
    it('数字を1つ削除できる', async () => {
      const { onValueChange } = await renderKeypad();
      await pressDigits('1', '2');
      onValueChange.mockClear();
      await act(async () => {
        fireEvent.press(getKey('1文字削除'));
      });
      expect(onValueChange).toHaveBeenLastCalledWith('1');
    });

    it('"/" も削除できる', async () => {
      const { onValueChange } = await renderKeypad();
      await pressDigits('3');
      await act(async () => {
        fireEvent.press(getKey('スラッシュ（分数）'));
      });
      onValueChange.mockClear();
      await act(async () => {
        fireEvent.press(getKey('1文字削除'));
      });
      expect(onValueChange).toHaveBeenLastCalledWith('3');
    });

    it('"/" を削除後は "/" ボタンが再び押せる', async () => {
      const { onValueChange } = await renderKeypad();
      await pressDigits('3');
      await act(async () => {
        fireEvent.press(getKey('スラッシュ（分数）'));
      });
      // "/" を削除
      await act(async () => {
        fireEvent.press(getKey('1文字削除'));
      });
      onValueChange.mockClear();
      // "/" が再度押せる
      await act(async () => {
        fireEvent.press(getKey('スラッシュ（分数）'));
      });
      expect(onValueChange).toHaveBeenLastCalledWith('3/');
    });

    it('全て削除すると "⌫" が disabled になり "?" が表示される', async () => {
      await renderKeypad();
      await pressDigits('9');
      await act(async () => {
        fireEvent.press(getKey('1文字削除'));
      });
      // 空になると表示が "?" に戻る
      expect(getDisplayText()).toBe('?');
      // disabled なのでさらに押しても変化しない（エラーが出ない）
      await act(async () => {
        fireEvent.press(getKey('1文字削除'));
      });
      expect(getDisplayText()).toBe('?');
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('解答ルール文言（§4.3）', () => {
    it('ルール見出しが常に表示されている', async () => {
      await renderKeypad();
      expect(screen.getByText('【解答ルール】')).toBeTruthy();
    });

    it('"既約分数" のルール文言が表示されている', async () => {
      await renderKeypad();
      expect(screen.getByText(/既約分数（これ以上約分できない状態）にしてください/)).toBeTruthy();
    });
  });
});
