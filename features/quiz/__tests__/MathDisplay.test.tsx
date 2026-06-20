/**
 * MathDisplay.test.tsx — Component tests for MathDisplay
 *
 * テスト方針:
 *   - MathJaxSvg は SVG をネイティブ描画するため、テスト環境では
 *     シンプルな View + testID を持つモックに差し替える。
 *   - Props（latex / fontSize / color）が MathJaxSvg に正しく渡されるか検証する。
 *   - latex が $$ デリミタで囲まれた文字列として子要素に渡されるか検証する。
 *   - デフォルト Props（fontSize=22 / color='#1A2A6C'）の適用を検証する。
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { MathDisplay } from '../components/MathDisplay';

// ─── react-native-mathjax-html-to-svg のモック ───────────────
//
// MathJaxSvg はネイティブ SVG レンダリングを行うため、
// Jest (jsdom/Node.js) 環境では動作しない。
// テスト用に Props を記録できる軽量な View モックに差し替える。
//
jest.mock('react-native-mathjax-html-to-svg', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native');

  // MathJaxSvg モック: Props を testID 経由で取得できるよう View に展開する
  const MathJaxSvgMock = ({
    children,
    fontSize,
    color,
    fontCache,
  }: {
    children?: React.ReactNode;
    fontSize?: number;
    color?: string;
    fontCache?: boolean;
  }) => (
    <View
      testID="math-jax-svg"
      accessibilityLabel={`fontSize:${fontSize} color:${color} fontCache:${fontCache}`}
    >
      <Text testID="math-jax-svg-children">{children}</Text>
    </View>
  );
  MathJaxSvgMock.displayName = 'MathJaxSvg';

  return { MathJaxSvg: MathJaxSvgMock };
});

// ─── ヘルパー ────────────────────────────────────────────────

interface RenderOptions {
  latex: string;
  fontSize?: number;
  color?: string;
}

async function renderMathDisplay(options: RenderOptions) {
  await render(<MathDisplay {...options} />);
}

// ─── テストスイート ──────────────────────────────────────────

describe('MathDisplay', () => {
  describe('レンダリング', () => {
    it('MathJaxSvg がレンダリングされる', async () => {
      await renderMathDisplay({ latex: '1 + 1' });
      expect(screen.getByTestId('math-jax-svg')).toBeTruthy();
    });

    it('children に latex が $$ デリミタで囲まれて渡される', async () => {
      await renderMathDisplay({ latex: '\\frac{1}{2}' });
      expect(screen.getByTestId('math-jax-svg-children')).toHaveTextContent('$$\\frac{1}{2}$$');
    });

    it('空文字列の latex も $$ で囲まれる', async () => {
      await renderMathDisplay({ latex: '' });
      expect(screen.getByTestId('math-jax-svg-children')).toHaveTextContent('$$$$');
    });
  });

  describe('デフォルト Props', () => {
    it('fontSize を省略すると 22 が MathJaxSvg に渡される', async () => {
      await renderMathDisplay({ latex: 'x^2' });
      expect(screen.getByTestId('math-jax-svg')).toHaveAccessibilityValue({
        text: undefined,
      });
      // accessibilityLabel でデフォルト値を確認する
      expect(screen.getByLabelText('fontSize:22 color:#1A2A6C fontCache:true')).toBeTruthy();
    });

    it('color を省略すると #1A2A6C が MathJaxSvg に渡される', async () => {
      await renderMathDisplay({ latex: 'x^2' });
      expect(screen.getByLabelText('fontSize:22 color:#1A2A6C fontCache:true')).toBeTruthy();
    });

    it('fontCache は常に true で MathJaxSvg に渡される', async () => {
      await renderMathDisplay({ latex: 'x^2' });
      expect(screen.getByLabelText('fontSize:22 color:#1A2A6C fontCache:true')).toBeTruthy();
    });
  });

  describe('カスタム Props', () => {
    it('fontSize を指定するとその値が MathJaxSvg に渡される', async () => {
      await renderMathDisplay({ latex: 'x^2', fontSize: 36 });
      expect(screen.getByLabelText('fontSize:36 color:#1A2A6C fontCache:true')).toBeTruthy();
    });

    it('color を指定するとその値が MathJaxSvg に渡される', async () => {
      await renderMathDisplay({ latex: 'x^2', color: '#FF0000' });
      expect(screen.getByLabelText('fontSize:22 color:#FF0000 fontCache:true')).toBeTruthy();
    });

    it('fontSize と color を両方指定できる', async () => {
      await renderMathDisplay({ latex: '\\sqrt{3}', fontSize: 18, color: '#333333' });
      expect(screen.getByLabelText('fontSize:18 color:#333333 fontCache:true')).toBeTruthy();
    });
  });

  describe('latex の内容', () => {
    it('二次方程式の解の公式を $$ で囲んで渡す', async () => {
      const latex = '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}';
      await renderMathDisplay({ latex });
      expect(screen.getByTestId('math-jax-svg-children')).toHaveTextContent(`$$${latex}$$`);
    });

    it('加算式を $$ で囲んで渡す', async () => {
      await renderMathDisplay({ latex: '1 + 1 = 2' });
      expect(screen.getByTestId('math-jax-svg-children')).toHaveTextContent('$$1 + 1 = 2$$');
    });

    it('分数式を $$ で囲んで渡す', async () => {
      await renderMathDisplay({ latex: '\\frac{3}{4}' });
      expect(screen.getByTestId('math-jax-svg-children')).toHaveTextContent('$$\\frac{3}{4}$$');
    });
  });
});
