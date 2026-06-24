import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import Colors from '@/constants/Colors';

// ─── 型定義 ──────────────────────────────────────────────────────────────────

type Props = {
  /** カウントダウン完了後に呼ばれるコールバック */
  onComplete: () => void;
};

// ─── 定数 ────────────────────────────────────────────────────────────────────

/** カウントダウンの秒数（3→2→1） */
const COUNTDOWN_SECONDS = 3;
/** 各数字のフェード＋スケールアニメーション（ms） */
const NUMBER_ANIM_DURATION = 250;
/** リングの半径 */
const RING_RADIUS = 80;
/** リングの線幅 */
const RING_STROKE_WIDTH = 8;
/** SVG ビューボックスサイズ */
const SVG_SIZE = (RING_RADIUS + RING_STROKE_WIDTH) * 2;
/** 円周 */
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ─── AnimatedCircle ──────────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Component ───────────────────────────────────────────────────────────────

export function CountdownOverlay({ onComplete }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  // 表示テキスト: 3, 2, 1
  const [displayValue, setDisplayValue] = useState(COUNTDOWN_SECONDS);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // ─── リングアニメーション ──────────────────────────────────────────────
  const ringProgress = useSharedValue(0);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - ringProgress.value),
  }));

  // ─── 数字アニメーション ────────────────────────────────────────────────
  const numberScale = useSharedValue(0.3);
  const numberOpacity = useSharedValue(0);

  const numberAnimStyle = useAnimatedStyle(() => ({
    opacity: numberOpacity.value,
    transform: [{ scale: numberScale.value }],
  }));

  // 各数字が表示されるときにポップアニメーションを発火
  const triggerNumberAnim = () => {
    numberOpacity.value = 0;
    numberScale.value = 0.3;
    numberOpacity.value = withTiming(1, { duration: NUMBER_ANIM_DURATION });
    numberScale.value = withSequence(
      withSpring(1.15, { damping: 6, stiffness: 200 }),
      withSpring(1.0, { damping: 10, stiffness: 180 })
    );
  };

  // 数字がフェードアウトするアニメーション
  const triggerNumberFadeOut = () => {
    numberOpacity.value = withTiming(0, { duration: 150 });
    numberScale.value = withTiming(0.8, { duration: 150 });
  };

  // ─── カウントダウンシーケンス ──────────────────────────────────────────
  useEffect(() => {
    // リングを 3 秒かけて一周させる
    ringProgress.value = withTiming(1, { duration: COUNTDOWN_SECONDS * 1000 });

    // 初回ポップ
    triggerNumberAnim();

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i <= COUNTDOWN_SECONDS; i++) {
      // 数字切り替え前のフェードアウト
      timeouts.push(
        setTimeout(
          () => {
            triggerNumberFadeOut();
          },
          i * 1000 - 180
        )
      );

      if (i < COUNTDOWN_SECONDS) {
        // 次の数字を表示
        timeouts.push(
          setTimeout(() => {
            setDisplayValue(COUNTDOWN_SECONDS - i);
            triggerNumberAnim();
          }, i * 1000)
        );
      }
    }

    // カウントダウン終了 → onComplete
    timeouts.push(
      setTimeout(() => {
        onCompleteRef.current();
      }, COUNTDOWN_SECONDS * 1000)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <Animated.View style={styles.overlay}>
      {/* サークルリング */}
      <Svg
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        style={styles.svgContainer}
      >
        {/* 背景リング */}
        <Circle
          cx={SVG_SIZE / 2}
          cy={SVG_SIZE / 2}
          r={RING_RADIUS}
          stroke={colors.cardBorder}
          strokeWidth={RING_STROKE_WIDTH}
          fill="none"
        />
        {/* アニメーションリング */}
        <AnimatedCircle
          cx={SVG_SIZE / 2}
          cy={SVG_SIZE / 2}
          r={RING_RADIUS}
          stroke={colors.accent}
          strokeWidth={RING_STROKE_WIDTH}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedCircleProps}
          strokeLinecap="round"
          // 12 時方向から開始するために回転
          rotation="-90"
          origin={`${SVG_SIZE / 2}, ${SVG_SIZE / 2}`}
        />
      </Svg>

      {/* 中央の数字 */}
      <Animated.Text style={[styles.countdownText, { color: colors.accent }, numberAnimStyle]}>
        {displayValue}
      </Animated.Text>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'absolute',
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '900',
    textAlign: 'center',
  },
});
