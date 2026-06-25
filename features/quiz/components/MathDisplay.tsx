import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';

interface MathDisplayProps {
  /** テキストと \( ... \) が混在した文字列 */
  latex: string;
  /** フォントサイズ（デフォルト: 22） */
  fontSize?: number;
  /** 文字および数式の色（デフォルト: #1A2A6C） */
  color?: string;
}

export function MathDisplay({ latex, fontSize = 22, color = '#1A2A6C' }: MathDisplayProps) {
  // 正規表現で「 \( 」から「 \) 」までをキャプチャして分割する
  // 括弧 () で囲むことで、マッチした数式部分も配列の要素として残ります
  const parts = latex.split(/\\\(([\s\S]*?)\\\)/g);

  return (
    <View style={styles.container}>
      {parts.map((part, index) => {
        // 奇数インデックスは数式部分（ \( と \) の中身 ）
        if (index % 2 === 1) {
          const trimmedMath = part.trim();
          if (!trimmedMath) return null;

          return (
            <View key={index} style={styles.mathWrapper}>
              {/* ライブラリが数式として認識するよう $$ で囲む */}
              <MathJaxSvg fontSize={fontSize} color={color} fontCache={true}>
                {`$$${trimmedMath}$$`}
              </MathJaxSvg>
            </View>
          );
        }

        // 偶数インデックスは通常の日本語テキスト
        // 空白のみの要素は描画しない
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
    // 数式の前後に極端な隙間が空かないよう微調整
    paddingHorizontal: 1,
  },
});
