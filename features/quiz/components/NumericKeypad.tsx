import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppButton } from '@/components/AppButton';
import Colors from '@/constants/Colors';

// ─── 型定義 ──────────────────────────────────────────────────────────────────

type Sign = '+' | '-';

type Props = {
  /** 入力値が変化するたびに呼ばれる。raw 文字列（例: "-2/5", "3", "0"）を渡す */
  onValueChange: (raw: string) => void;
  /** 回答結果。true=正解(○), false=不正解(×), null/undefined=未回答（非表示） */
  resultState?: boolean | null;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function NumericKeypad({ onValueChange, resultState }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [sign, setSign] = useState<Sign>('+');
  // 数字とスラッシュのみを保持する文字列（符号なし）
  const [digits, setDigits] = useState('');

  // ─── ○× オーバーレイ アニメーション ────────────────────────────────────
  const markOpacity = useSharedValue(0);
  const markScale = useSharedValue(0.4);

  useEffect(() => {
    if (resultState === true || resultState === false) {
      // マウント直後またはフラグ変化時にアニメーションを再生
      markOpacity.value = 0;
      markScale.value = 0.4;
      markOpacity.value = withTiming(1, { duration: 200 });
      markScale.value = withSequence(
        withSpring(1.25, { damping: 6, stiffness: 200 }),
        withSpring(1.0, { damping: 10, stiffness: 180 })
      );
    }
    // null/undefined のときは条件付きレンダリングでアンマウントされるため何もしない
  }, [resultState, markOpacity, markScale]);

  const markAnimStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));

  // ─── 表示・送出値の導出 ─────────────────────────────────────────────────
  const rawValue = useMemo(() => {
    if (digits === '' || digits === '0') return '0';
    return sign === '-' ? `-${digits}` : digits;
  }, [sign, digits]);

  // ─── バリデーション（§4.2） ───────────────────────────────────────────────
  /** `/` ボタンを無効化する条件: 入力が空 or すでに `/` が含まれている */
  const slashDisabled = digits.length === 0 || digits.includes('/');
  /** `0` ボタンを無効化する条件: `/` の直後（分母ゼロ防止） */
  const zeroDisabled = digits.endsWith('/');

  // ─── 親への通知 ─────────────────────────────────────────────────────────
  useEffect(() => {
    onValueChange(rawValue);
  }, [rawValue, onValueChange]);

  // ─── ハンドラ ────────────────────────────────────────────────────────────

  const handleDigit = (d: string) => {
    setDigits((prev) => {
      // 先頭の余分なゼロを防ぐ（"0" の後に数字が来たら置き換え）
      if (prev === '0') return d;
      return prev + d;
    });
  };

  const handleSlash = () => {
    if (!slashDisabled) setDigits((prev) => prev + '/');
  };

  const handleSign = () => {
    setSign((prev) => (prev === '+' ? '-' : '+'));
  };

  const handleBackspace = () => {
    setDigits((prev) => prev.slice(0, -1));
  };

  // ─── ボタン定義 ─────────────────────────────────────────────────────────

  type KeyItem =
    | { type: 'digit'; label: string; value: string; flex?: number }
    | { type: 'slash' }
    | { type: 'sign' }
    | { type: 'backspace' };

  const rows: KeyItem[][] = [
    [
      { type: 'digit', label: '7', value: '7' },
      { type: 'digit', label: '8', value: '8' },
      { type: 'digit', label: '9', value: '9' },
      { type: 'sign' },
    ],
    [
      { type: 'digit', label: '4', value: '4' },
      { type: 'digit', label: '5', value: '5' },
      { type: 'digit', label: '6', value: '6' },
      { type: 'slash' },
    ],
    [
      { type: 'digit', label: '1', value: '1' },
      { type: 'digit', label: '2', value: '2' },
      { type: 'digit', label: '3', value: '3' },
      { type: 'backspace' },
    ],
    [{ type: 'digit', label: '0', value: '0', flex: 3 }],
  ];

  // ─── キー描画ヘルパー ─────────────────────────────────────────────────────

  const renderKey = (key: KeyItem, idx: number) => {
    switch (key.type) {
      case 'digit': {
        const disabled = key.value === '0' && zeroDisabled;
        return (
          <AppButton
            key={idx}
            style={[
              styles.key,
              { flex: key.flex ?? 1, backgroundColor: colors.cardBackground },
              disabled && styles.keyDisabled,
            ]}
            onPress={() => handleDigit(key.value)}
            disabled={disabled}
            throttleMs={100}
            accessibilityLabel={key.label}
          >
            <Text style={[styles.keyLabel, { color: colors.levelLabel }]}>{key.label}</Text>
          </AppButton>
        );
      }
      case 'slash': {
        return (
          <AppButton
            key={idx}
            style={[
              styles.key,
              { flex: 1, backgroundColor: colors.cardBackground },
              slashDisabled && styles.keyDisabled,
            ]}
            onPress={handleSlash}
            disabled={slashDisabled}
            throttleMs={100}
            accessibilityLabel="スラッシュ（分数）"
          >
            <Text style={[styles.keyLabel, { color: colors.accent }]}>/</Text>
          </AppButton>
        );
      }
      case 'sign': {
        return (
          <AppButton
            key={idx}
            style={[styles.key, { flex: 1, backgroundColor: colors.cardBackground }]}
            onPress={handleSign}
            throttleMs={100}
            accessibilityLabel={sign === '+' ? 'マイナスに切り替え' : 'プラスに切り替え'}
          >
            <Text style={[styles.keyLabel, { color: colors.accent }]}>
              {sign === '+' ? '+/−' : '+/−'}
            </Text>
            <Text style={[styles.keySubLabel, { color: colors.levelDescription }]}>
              {sign === '+' ? '現在: +' : '現在: −'}
            </Text>
          </AppButton>
        );
      }
      case 'backspace': {
        const disabled = digits.length === 0;
        return (
          <AppButton
            key={idx}
            style={[
              styles.key,
              { flex: 1, backgroundColor: colors.cardBackground },
              disabled && styles.keyDisabled,
            ]}
            onPress={handleBackspace}
            disabled={disabled}
            throttleMs={100}
            accessibilityLabel="1文字削除"
          >
            <Text style={[styles.keyLabel, { color: colors.levelLabel }]}>⌫</Text>
          </AppButton>
        );
      }
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  // 入力表示用の文字列（空のときはプレースホルダー）
  const displayText = digits === '' ? '?' : rawValue;
  const isPlaceholder = digits === '';

  return (
    <View style={styles.container}>
      {/* ─ 入力表示エリア ─ */}
      <View
        style={[
          styles.display,
          { borderColor: colors.accent, backgroundColor: colors.cardBackground },
        ]}
      >
        <Text
          testID="numeric-keypad-display"
          style={[
            styles.displayText,
            { color: isPlaceholder ? colors.levelDescription : colors.levelLabel },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {displayText}
        </Text>

        {/* ○× オーバーレイ（入力表示エリア全体に重なる）
            resultState が null/undefined のときはアンマウントして完全に非表示にする */}
        {(resultState === true || resultState === false) && (
          <Animated.View style={[styles.resultOverlay, markAnimStyle]} pointerEvents="none">
            <Text
              style={[
                styles.resultMark,
                resultState ? styles.resultMarkCorrect : styles.resultMarkWrong,
              ]}
            >
              {resultState ? '○' : '×'}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* ─ 解答ルール文言（§4.3） ─ */}
      <View style={[styles.rulesBox, { borderColor: colors.accent + '44' }]}>
        <Text style={[styles.rulesTitle, { color: colors.levelDescription }]}>【解答ルール】</Text>
        <Text style={[styles.rulesText, { color: colors.levelDescription }]}>
          ・分数は「1/3」や「−2/5」のようにスラッシュで入力してください。
        </Text>
        <Text style={[styles.rulesText, { color: colors.levelDescription }]}>
          ・回答は必ず既約分数（これ以上約分できない状態）にしてください。
        </Text>
        <Text style={[styles.rulesText, { color: colors.levelDescription }]}>
          ・整数になる場合は整数（例: 3）で入力してください（「3/1」は不正解）。
        </Text>
        <Text style={[styles.rulesText, { color: colors.levelDescription }]}>
          ・「−0」は不正解となります。
        </Text>
      </View>

      {/* ─ キーパッド ─ */}
      <View style={styles.keypad}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((key, keyIdx) => renderKey(key, keyIdx))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },

  // 入力表示
  display: {
    height: 60,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  displayText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // ○× オーバーレイ（display View に絶対配置で重なる）
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultMark: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 56,
  },
  resultMarkCorrect: {
    color: '#E02020',
  },
  resultMarkWrong: {
    color: '#555555',
  },

  // 解答ルール
  rulesBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  rulesTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  rulesText: {
    fontSize: 10,
    lineHeight: 15,
  },

  // キーパッド
  keypad: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  key: {
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  keyDisabled: {
    opacity: 0.3,
  },
  keyLabel: {
    fontSize: 22,
    fontWeight: '600',
  },
  keySubLabel: {
    fontSize: 9,
    marginTop: 1,
  },
});
