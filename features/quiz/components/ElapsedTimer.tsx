import React, { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text } from 'react-native';

type Props = {
  /** クイズ開始時刻（ms Unix timestamp）。null の間は 00:00.00 を表示。 */
  startedAt: number | null;
  /** テキストカラー */
  color: string;
};

/**
 * 経過時間を mm:ss.dd 形式で表示する自己完結型タイマーコンポーネント。
 *
 * - requestAnimationFrame でディスプレイのリフレッシュレートに同期して更新する。
 * - タイマーロジックをコンポーネント内に閉じ込めることで、
 *   再レンダリングが <Text> ノード 1 つに限定される。
 * - AppState を監視し、バックグラウンドからの復帰時にも正確な経過時間を表示する。
 */
export function ElapsedTimer({ startedAt, color }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (startedAt === null) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      setElapsed((Date.now() - startedAt) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };

    // 初回即時計算 + rAF ループ開始
    rafRef.current = requestAnimationFrame(tick);

    // AppState: バックグラウンドから復帰したとき即座に再計算
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setElapsed((Date.now() - startedAt) / 1000);
      }
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      subscription.remove();
    };
  }, [startedAt]);

  const totalHundredths = Math.floor(elapsed * 100);
  const hundredths = totalHundredths % 100;
  const totalSecondsInt = Math.floor(totalHundredths / 100);
  const seconds = totalSecondsInt % 60;
  const minutes = Math.floor(totalSecondsInt / 60);

  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

  return <Text style={[styles.timer, { color }]}>{display}</Text>;
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 32,
    fontFamily: 'DSEG7Classic',
    letterSpacing: 2,
  },
});
