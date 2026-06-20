/**
 * MathDisplay.tsx
 *
 * LaTeX 文字列を react-native-mathjax-html-to-svg の MathJaxSvg で
 * ネイティブ描画するコンポーネント。WebView は使用しない。
 */
import React from 'react';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';

// ─── Props ──────────────────────────────────────────────────────────────────

interface MathDisplayProps {
  /** LaTeX 形式の数式文字列（$$ デリミタなし、例: "\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"） */
  latex: string;
  /** フォントサイズ（デフォルト: 22） */
  fontSize?: number;
  /** 数式の色（デフォルト: #1A2A6C） */
  color?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function MathDisplay({ latex, fontSize = 22, color = '#1A2A6C' }: MathDisplayProps) {
  // $$ で囲むことでディスプレイ数式（block）として描画する
  return (
    <MathJaxSvg fontSize={fontSize} color={color} fontCache={true}>
      {`$$${latex}$$`}
    </MathJaxSvg>
  );
}
