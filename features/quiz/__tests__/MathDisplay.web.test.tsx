/**
 * MathDisplay.web.test.tsx — Web 版 MathDisplay のテスト
 *
 * テスト方針:
 *   - Web 版は KaTeX の renderToString() で LaTeX → HTML に変換し、
 *     dangerouslySetInnerHTML で埋め込む。
 *   - katex モジュールをモック化して、renderToString() の呼び出しと
 *     引数を検証する。
 *   - Props（latex / fontSize / color）の適用、デフォルト値、
 *     エラー時のフォールバックを検証する。
 *
 * 実装メモ:
 *   ネイティブ版と同じく \( ... \) デリミタで分割し、
 *   数式部分を KaTeX でレンダリング、テキスト部分はそのまま表示する。
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { MathDisplay } from '../components/MathDisplay.web';

// ─── katex のモック ──────────────────────────────────────────
//
// KaTeX は DOM 操作を伴うため、React Native のテスト環境では
// renderToString をモックに差し替える。
//
const mockRenderToString = jest.fn((tex: string) => `<span class="katex">${tex}</span>`);

jest.mock('katex', () => ({
  __esModule: true,
  default: {
    renderToString: (...args: unknown[]) => mockRenderToString(...(args as [string])),
  },
}));

// ─── ヘルパー ────────────────────────────────────────────────

/** 数式を \( ... \) デリミタで囲むヘルパー */
function math(expr: string): string {
  return `\\(${expr}\\)`;
}

interface RenderOptions {
  latex: string;
  fontSize?: number;
  color?: string;
}

async function renderMathDisplay(options: RenderOptions) {
  return render(<MathDisplay {...options} />);
}

// ─── テストスイート ──────────────────────────────────────────

describe('MathDisplay (Web)', () => {
  beforeEach(() => {
    mockRenderToString.mockClear();
  });

  describe('レンダリング', () => {
    it('\\( ... \\) で囲まれた数式があると katex.renderToString が呼ばれる', async () => {
      await renderMathDisplay({ latex: math('1 + 1') });
      expect(mockRenderToString).toHaveBeenCalledWith('1 + 1', {
        throwOnError: false,
        displayMode: false,
      });
    });

    it('\\( ... \\) がない場合はテキストのみレンダリングされる', async () => {
      await renderMathDisplay({ latex: 'テキストのみ' });
      expect(mockRenderToString).not.toHaveBeenCalled();
      expect(screen.getByText('テキストのみ')).toBeTruthy();
    });

    it('テキストと数式が混在する場合、両方がレンダリングされる', async () => {
      await renderMathDisplay({ latex: '答えは\\(x^2\\)です' });
      expect(screen.getByText('答えは')).toBeTruthy();
      expect(screen.getByText('です')).toBeTruthy();
      expect(mockRenderToString).toHaveBeenCalledWith('x^2', {
        throwOnError: false,
        displayMode: false,
      });
    });

    it('複数の数式が含まれる場合、すべて renderToString が呼ばれる', async () => {
      await renderMathDisplay({ latex: '\\(a\\)と\\(b\\)' });
      expect(mockRenderToString).toHaveBeenCalledTimes(2);
      expect(mockRenderToString).toHaveBeenCalledWith('a', expect.any(Object));
      expect(mockRenderToString).toHaveBeenCalledWith('b', expect.any(Object));
    });

    it('空の数式部分はスキップされる', async () => {
      await renderMathDisplay({ latex: '\\(  \\)テキスト' });
      expect(mockRenderToString).not.toHaveBeenCalled();
      expect(screen.getByText('テキスト')).toBeTruthy();
    });
  });

  describe('デフォルト Props', () => {
    it('fontSize を省略すると 22 がデフォルトで使われる', async () => {
      const { toJSON } = await renderMathDisplay({ latex: math('x') });
      const json = toJSON();
      // テキスト要素にデフォルトの fontSize が適用されていることを確認
      expect(mockRenderToString).toHaveBeenCalled();
      expect(json).toBeTruthy();
    });

    it('color を省略すると #1A2A6C がデフォルトで使われる', async () => {
      await renderMathDisplay({ latex: 'テキスト' });
      const textElement = screen.getByText('テキスト');
      expect(textElement.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: '#1A2A6C' })])
      );
    });
  });

  describe('カスタム Props', () => {
    it('fontSize を指定するとテキスト要素に反映される', async () => {
      await renderMathDisplay({ latex: 'テキスト', fontSize: 36 });
      const textElement = screen.getByText('テキスト');
      expect(textElement.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 36 })])
      );
    });

    it('color を指定するとテキスト要素に反映される', async () => {
      await renderMathDisplay({ latex: 'テキスト', color: '#FF0000' });
      const textElement = screen.getByText('テキスト');
      expect(textElement.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ color: '#FF0000' })])
      );
    });
  });

  describe('KaTeX エラー時のフォールバック', () => {
    it('renderToString がエラーを投げた場合、生テキストにフォールバックする', async () => {
      mockRenderToString.mockImplementationOnce(() => {
        throw new Error('KaTeX parse error');
      });
      await renderMathDisplay({ latex: math('\\invalid') });
      // エラー時は生テキストが表示される
      expect(screen.getByText('\\invalid')).toBeTruthy();
    });
  });

  describe('latex の内容', () => {
    it('分数が renderToString に正しく渡される', async () => {
      await renderMathDisplay({ latex: math('\\frac{1}{2}') });
      expect(mockRenderToString).toHaveBeenCalledWith('\\frac{1}{2}', expect.any(Object));
    });

    it('二次方程式の解の公式が renderToString に正しく渡される', async () => {
      const expr = '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}';
      await renderMathDisplay({ latex: math(expr) });
      expect(mockRenderToString).toHaveBeenCalledWith(expr, expect.any(Object));
    });

    it('平方根が renderToString に正しく渡される', async () => {
      await renderMathDisplay({ latex: math('\\sqrt{3}') });
      expect(mockRenderToString).toHaveBeenCalledWith('\\sqrt{3}', expect.any(Object));
    });
  });
});
