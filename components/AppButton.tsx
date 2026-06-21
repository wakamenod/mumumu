import React, { useRef } from 'react';
import { Pressable, type PressableProps } from 'react-native';

// 連打防止のインターバル（ms）
const THROTTLE_MS = 500;

type AppButtonProps = Omit<PressableProps, 'onPress'> & {
  onPress?: () => void;
  /**
   * 連打防止インターバル（ms）。デフォルトは 500ms。
   * キーパッドのように素早い入力が必要な場合は小さい値（例: 100）を指定できる。
   */
  throttleMs?: number;
};

/**
 * アプリ全体で使う共通ボタンコンポーネント。
 * onPress に自動的にスロットル（連打防止）を適用する。
 */
export function AppButton({ onPress, throttleMs = THROTTLE_MS, ...rest }: AppButtonProps) {
  const lastCallRef = useRef(0);

  const handlePress = () => {
    if (!onPress) return;
    // テスト環境ではスロットルをスキップ（fireEvent が同一タイムスタンプで連続発火するため）
    if (process.env.NODE_ENV !== 'test') {
      const now = Date.now();
      if (now - lastCallRef.current < throttleMs) return;
      lastCallRef.current = now;
    }
    onPress();
  };

  return <Pressable onPress={handlePress} {...rest} />;
}
