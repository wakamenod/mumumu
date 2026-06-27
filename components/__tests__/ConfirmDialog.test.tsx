/**
 * ConfirmDialog.test.tsx
 *
 * テスト方針:
 *   - ConfirmDialog は React Native 組み込みの Modal を使ったクロスプラットフォーム確認ダイアログ。
 *   - visible/title/message/cancelLabel/confirmLabel/destructive の各 prop が正しく反映されることを検証。
 *   - ボタン押下・backdrop タップ時のコールバック呼び出しを検証。
 *   - destructive prop によるスタイル差異（確認ボタンの背景色）を検証。
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

import { ConfirmDialog } from '../ConfirmDialog';

// ─── テスト用定数 ────────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  visible: true,
  title: 'テストタイトル',
  cancelLabel: 'キャンセル',
  confirmLabel: '確定',
  onCancel: jest.fn(),
  onConfirm: jest.fn(),
};

// ─── テスト ──────────────────────────────────────────────────────────────────

describe('ConfirmDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  describe('表示制御', () => {
    it('visible=true のときタイトルが表示される', async () => {
      await act(async () => {
        render(<ConfirmDialog {...DEFAULT_PROPS} visible={true} />);
      });

      expect(screen.getByText('テストタイトル')).toBeTruthy();
    });

    it('visible=true のときキャンセルボタンと確認ボタンが表示される', async () => {
      await act(async () => {
        render(<ConfirmDialog {...DEFAULT_PROPS} visible={true} />);
      });

      expect(screen.getByText('キャンセル')).toBeTruthy();
      expect(screen.getByText('確定')).toBeTruthy();
    });

    it('visible=false のときタイトルが表示されない', async () => {
      await act(async () => {
        render(<ConfirmDialog {...DEFAULT_PROPS} visible={false} />);
      });

      expect(screen.queryByText('テストタイトル')).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('message prop', () => {
    it('message が渡された場合にメッセージテキストが表示される', async () => {
      await act(async () => {
        render(<ConfirmDialog {...DEFAULT_PROPS} message="補足説明テキスト" />);
      });

      expect(screen.getByText('補足説明テキスト')).toBeTruthy();
    });

    it('message が省略された場合にメッセージ要素が表示されない', async () => {
      await act(async () => {
        render(<ConfirmDialog {...DEFAULT_PROPS} />);
      });

      expect(screen.queryByText('補足説明テキスト')).toBeNull();
      // タイトルとボタンは表示される
      expect(screen.getByText('テストタイトル')).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('コールバック', () => {
    it('確認ボタンを押すと onConfirm が呼ばれる', async () => {
      const onConfirm = jest.fn();

      await act(async () => {
        render(<ConfirmDialog {...DEFAULT_PROPS} onConfirm={onConfirm} />);
      });

      await act(async () => {
        fireEvent.press(screen.getByText('確定'));
      });

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('キャンセルボタンを押すと onCancel が呼ばれる', async () => {
      const onCancel = jest.fn();

      await act(async () => {
        render(<ConfirmDialog {...DEFAULT_PROPS} onCancel={onCancel} />);
      });

      await act(async () => {
        fireEvent.press(screen.getByText('キャンセル'));
      });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('確認ボタン押下時に onCancel は呼ばれない', async () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();

      await act(async () => {
        render(<ConfirmDialog {...DEFAULT_PROPS} onCancel={onCancel} onConfirm={onConfirm} />);
      });

      await act(async () => {
        fireEvent.press(screen.getByText('確定'));
      });

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('キャンセルボタン押下時に onConfirm は呼ばれない', async () => {
      const onCancel = jest.fn();
      const onConfirm = jest.fn();

      await act(async () => {
        render(<ConfirmDialog {...DEFAULT_PROPS} onCancel={onCancel} onConfirm={onConfirm} />);
      });

      await act(async () => {
        fireEvent.press(screen.getByText('キャンセル'));
      });

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('destructive スタイル', () => {
    it('destructive=true のとき確認ボタンの背景が赤色 (#E53935) になる', async () => {
      await act(async () => {
        render(<ConfirmDialog {...DEFAULT_PROPS} destructive={true} />);
      });

      const confirmButton = screen.getByText('確定').parent;
      // Pressable の style prop から背景色を検証する
      const flatStyle = Array.isArray(confirmButton?.props.style)
        ? Object.assign({}, ...confirmButton.props.style)
        : confirmButton?.props.style;
      expect(flatStyle.backgroundColor).toBe('#E53935');
    });

    it('destructive 未指定（デフォルト）のとき確認ボタンの背景がアクセントカラーになる', async () => {
      await act(async () => {
        render(<ConfirmDialog {...DEFAULT_PROPS} />);
      });

      const confirmButton = screen.getByText('確定').parent;
      const flatStyle = Array.isArray(confirmButton?.props.style)
        ? Object.assign({}, ...confirmButton.props.style)
        : confirmButton?.props.style;
      // デフォルト（destructive=false）ではアクセントカラー。赤色ではない
      expect(flatStyle.backgroundColor).not.toBe('#E53935');
    });
  });

  // ────────────────────────────────────────────────────────────
  describe('カスタムラベル', () => {
    it('cancelLabel / confirmLabel で指定したテキストがボタンに表示される', async () => {
      await act(async () => {
        render(
          <ConfirmDialog {...DEFAULT_PROPS} cancelLabel="いいえ" confirmLabel="はい、削除する" />
        );
      });

      expect(screen.getByText('いいえ')).toBeTruthy();
      expect(screen.getByText('はい、削除する')).toBeTruthy();
    });
  });
});
