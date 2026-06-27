// Web 版 MathDisplay — KaTeX で数式をレンダリングする
//
// ネイティブ版（MathDisplay.tsx）は react-native-mathjax-html-to-svg を使うが、
// Web では KaTeX の renderToString() で LaTeX → HTML に変換し、
// dangerouslySetInnerHTML で埋め込む。

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import katex from 'katex';

interface MathDisplayProps {
  /** テキストと \( ... \) が混在した文字列 */
  latex: string;
  /** フォントサイズ（デフォルト: 22） */
  fontSize?: number;
  /** 文字および数式の色（デフォルト: #1A2A6C） */
  color?: string;
}

export function MathDisplay({ latex, fontSize = 22, color = '#1A2A6C' }: MathDisplayProps) {
  // ネイティブ版と同じロジックで \( ... \) を分割する
  const parts = latex.split(/\\\(([\s\S]*?)\\\)/g);

  return (
    <View style={styles.container}>
      {parts.map((part, index) => {
        // 奇数インデックスは数式部分（ \( と \) の中身 ）
        if (index % 2 === 1) {
          const trimmedMath = part.trim();
          if (!trimmedMath) return null;

          let html: string;
          try {
            html = katex.renderToString(trimmedMath, {
              throwOnError: false,
              displayMode: false,
            });
          } catch {
            // フォールバック: レンダリングに失敗したら生テキストを表示
            return (
              <Text key={index} style={[styles.text, { fontSize, color }]}>
                {trimmedMath}
              </Text>
            );
          }

          return (
            <View key={index} style={styles.mathWrapper}>
              <div
                style={{ fontSize, color, display: 'inline-block' }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </View>
          );
        }

        // 偶数インデックスは通常テキスト
        if (part === '') return null;

        return (
          <Text key={index} style={[styles.text, { fontSize, color }]}>
            {part}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flexShrink: 1,
    width: '100%',
  },
  text: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  mathWrapper: {
    paddingHorizontal: 1,
  },
});
