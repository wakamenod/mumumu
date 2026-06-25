// Web では react-native-mathjax-html-to-svg が使えないため、
// 数式をプレーンテキストとしてフォールバック表示する。
// 本格的な数式レンダリングが必要な場合は KaTeX 等を導入する。

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MathDisplayProps {
  latex: string;
  fontSize?: number;
  color?: string;
}

export function MathDisplay({ latex, fontSize = 22, color = '#1A2A6C' }: MathDisplayProps) {
  // \( ... \) を取り除いて中身だけ表示する
  const displayText = latex.replace(/\\\(/g, '').replace(/\\\)/g, '');

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize, color }]}>{displayText}</Text>
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
});
