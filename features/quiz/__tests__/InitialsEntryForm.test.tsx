/**
 * InitialsEntryForm.test.tsx — Unit tests for features/quiz/components/InitialsEntryForm.tsx
 *
 * テスト方針:
 *   - ボタンの活性・非活性状態（isFull / isEmpty）を重点的に検証する。
 *   - onPressLetter / onBackspace / onEnd コールバックが正しく呼ばれることを確認する。
 *   - accessibilityLabel で各ボタンを取得し、実装詳細（スタイル）に依存しない。
 *   - 「value / isFull / isEmpty 制御はすべて親が行う」前提で props を差し替えて検証する。
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { InitialsEntryForm } from '@/features/quiz/components/InitialsEntryForm';
import Colors from '@/constants/Colors';

// ─── 共通定数 ────────────────────────────────────────────────

const COLORS = Colors.light;

// ─── ヘルパー ────────────────────────────────────────────────

interface RenderOptions {
  value?: string;
  onPressLetter?: jest.Mock;
  onBackspace?: jest.Mock;
  onEnd?: jest.Mock;
}

async function renderForm({
  value = '',
  onPressLetter = jest.fn(),
  onBackspace = jest.fn(),
  onEnd = jest.fn(),
}: RenderOptions = {}) {
  await act(async () => {
    render(
      <InitialsEntryForm
        value={value}
        onPressLetter={onPressLetter}
        onBackspace={onBackspace}
        onEnd={onEnd}
        colors={COLORS}
      />
    );
  });
  return { onPressLetter, onBackspace, onEnd };
}

// ─── テストスイート ──────────────────────────────────────────

describe('InitialsEntryForm', () => {
  // ──────────────────────────────────────────────────────────
  describe('表示', () => {
    it('「ENTER YOUR INITIALS」タイトルが表示される', async () => {
      await renderForm();
      expect(screen.getByText('ENTER YOUR INITIALS')).toBeTruthy();
    });

    it('A〜Z の全アルファベットボタンが表示される', async () => {
      await renderForm();
      for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        expect(screen.getByLabelText(ch)).toBeTruthy();
      }
    });

    it('ハイフン「-」ボタンが表示される', async () => {
      await renderForm();
      expect(screen.getByLabelText('-')).toBeTruthy();
    });

    it('バックスペース「←」ボタンが表示される', async () => {
      await renderForm();
      expect(screen.getByLabelText('1文字削除')).toBeTruthy();
    });

    it('END ボタンが表示される', async () => {
      await renderForm();
      expect(screen.getByLabelText('入力完了')).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('初期状態（value = ""）', () => {
    it('バックスペースボタンが無効になっている', async () => {
      await renderForm({ value: '' });
      const backspace = screen.getByLabelText('1文字削除');
      expect(backspace.props.accessibilityState?.disabled).toBe(true);
    });

    it('END ボタンが無効になっている', async () => {
      await renderForm({ value: '' });
      const end = screen.getByLabelText('入力完了');
      expect(end.props.accessibilityState?.disabled).toBe(true);
    });

    it('文字ボタンが有効になっている', async () => {
      await renderForm({ value: '' });
      expect(screen.getByLabelText('A').props.accessibilityState?.disabled).toBe(false);
      expect(screen.getByLabelText('Z').props.accessibilityState?.disabled).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('value が 5 文字のとき（isFull = true）', () => {
    it('文字ボタン（A）が無効になっている', async () => {
      await renderForm({ value: 'ABCDE' });
      expect(screen.getByLabelText('A').props.accessibilityState?.disabled).toBe(true);
    });

    it('文字ボタン（Z）が無効になっている', async () => {
      await renderForm({ value: 'ABCDE' });
      expect(screen.getByLabelText('Z').props.accessibilityState?.disabled).toBe(true);
    });

    it('ハイフンボタンが無効になっている', async () => {
      await renderForm({ value: 'ABCDE' });
      expect(screen.getByLabelText('-').props.accessibilityState?.disabled).toBe(true);
    });

    it('END ボタンが有効になっている', async () => {
      await renderForm({ value: 'ABCDE' });
      expect(screen.getByLabelText('入力完了').props.accessibilityState?.disabled).toBe(false);
    });

    it('バックスペースボタンが有効になっている', async () => {
      await renderForm({ value: 'ABCDE' });
      expect(screen.getByLabelText('1文字削除').props.accessibilityState?.disabled).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('value が 1〜4 文字のとき（isFull = false, isEmpty = false）', () => {
    it('文字ボタンが有効になっている', async () => {
      await renderForm({ value: 'ABC' });
      expect(screen.getByLabelText('A').props.accessibilityState?.disabled).toBe(false);
    });

    it('バックスペースボタンが有効になっている', async () => {
      await renderForm({ value: 'ABC' });
      expect(screen.getByLabelText('1文字削除').props.accessibilityState?.disabled).toBe(false);
    });

    it('END ボタンが無効になっている', async () => {
      await renderForm({ value: 'ABC' });
      expect(screen.getByLabelText('入力完了').props.accessibilityState?.disabled).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('コールバック — onPressLetter', () => {
    it('A ボタンを押すと onPressLetter("A") が呼ばれる', async () => {
      const { onPressLetter } = await renderForm();
      await act(async () => {
        fireEvent.press(screen.getByLabelText('A'));
      });
      expect(onPressLetter).toHaveBeenCalledTimes(1);
      expect(onPressLetter).toHaveBeenCalledWith('A');
    });

    it('Z ボタンを押すと onPressLetter("Z") が呼ばれる', async () => {
      const { onPressLetter } = await renderForm();
      await act(async () => {
        fireEvent.press(screen.getByLabelText('Z'));
      });
      expect(onPressLetter).toHaveBeenCalledWith('Z');
    });

    it('ハイフンボタンを押すと onPressLetter("-") が呼ばれる', async () => {
      const { onPressLetter } = await renderForm();
      await act(async () => {
        fireEvent.press(screen.getByLabelText('-'));
      });
      expect(onPressLetter).toHaveBeenCalledWith('-');
    });

    it('value が 5 文字のとき文字ボタンを押しても onPressLetter が呼ばれない', async () => {
      const { onPressLetter } = await renderForm({ value: 'ABCDE' });
      await act(async () => {
        fireEvent.press(screen.getByLabelText('A'));
      });
      expect(onPressLetter).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('コールバック — onBackspace', () => {
    it('「←」ボタンを押すと onBackspace が呼ばれる', async () => {
      const { onBackspace } = await renderForm({ value: 'A' });
      await act(async () => {
        fireEvent.press(screen.getByLabelText('1文字削除'));
      });
      expect(onBackspace).toHaveBeenCalledTimes(1);
    });

    it('value が "" のとき「←」ボタンを押しても onBackspace が呼ばれない', async () => {
      const { onBackspace } = await renderForm({ value: '' });
      await act(async () => {
        fireEvent.press(screen.getByLabelText('1文字削除'));
      });
      expect(onBackspace).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('コールバック — onEnd', () => {
    it('value が 5 文字のとき END ボタンを押すと onEnd が呼ばれる', async () => {
      const { onEnd } = await renderForm({ value: 'ABCDE' });
      await act(async () => {
        fireEvent.press(screen.getByLabelText('入力完了'));
      });
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('value が 5 文字未満のとき END ボタンを押しても onEnd が呼ばれない', async () => {
      const { onEnd } = await renderForm({ value: 'ABC' });
      await act(async () => {
        fireEvent.press(screen.getByLabelText('入力完了'));
      });
      expect(onEnd).not.toHaveBeenCalled();
    });

    it('value が 0 文字のとき END ボタンを押しても onEnd が呼ばれない', async () => {
      const { onEnd } = await renderForm({ value: '' });
      await act(async () => {
        fireEvent.press(screen.getByLabelText('入力完了'));
      });
      expect(onEnd).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('ボタン配置', () => {
    it('行1: A〜J の 10 ボタンがすべて存在する', async () => {
      await renderForm();
      for (const ch of 'ABCDEFGHIJ') {
        expect(screen.getByLabelText(ch)).toBeTruthy();
      }
    });

    it('行2: K〜T の 10 ボタンがすべて存在する', async () => {
      await renderForm();
      for (const ch of 'KLMNOPQRST') {
        expect(screen.getByLabelText(ch)).toBeTruthy();
      }
    });

    it('行3: U〜Z, -, ←, END がすべて存在する', async () => {
      await renderForm();
      for (const ch of 'UVWXYZ') {
        expect(screen.getByLabelText(ch)).toBeTruthy();
      }
      expect(screen.getByLabelText('-')).toBeTruthy();
      expect(screen.getByLabelText('1文字削除')).toBeTruthy();
      expect(screen.getByLabelText('入力完了')).toBeTruthy();
    });
  });
});
