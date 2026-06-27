import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, View, useColorScheme, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { AppButton } from '@/components/AppButton';
import Colors from '@/constants/Colors';
import { DIFFICULTY_LEVELS } from '../constants';
import type { DifficultyLevel } from '../types';
import { t } from '@/lib/i18n';

interface LevelStepperProps {
  selectedIndex: number;
  onIndexChange: (index: number) => void;
}

const SLIDE_IN_CONFIG = {
  duration: 180,
  easing: Easing.out(Easing.cubic),
};

const CARD_WIDTH = 280;

const SWIPE_TRANSLATION_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 500;

function StarRating({
  stars,
  maxStars = 5,
  color,
}: {
  stars: number;
  maxStars?: number;
  color: string;
}) {
  const scheme = useColorScheme() ?? 'light';
  const inactiveColor = Colors[scheme].starInactive;

  return (
    <View style={styles.starRow}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Text key={i} style={[styles.star, { color: i < stars ? color : inactiveColor }]}>
          ★
        </Text>
      ))}
    </View>
  );
}

function LevelCard({ level, style }: { level: DifficultyLevel; style?: ViewStyle }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: level.color,
          shadowColor: colors.cardShadow,
        },
        style,
      ]}
    >
      {/* Colored top accent bar */}
      <View style={[styles.cardAccentBar, { backgroundColor: level.color }]} />

      <View style={styles.cardBody}>
        <Text style={[styles.levelLabel, { color: colors.levelLabel }]}>{level.label}</Text>
        <Text style={[styles.levelSublabel, { color: level.color }]}>{level.sublabel}</Text>
        <StarRating stars={level.stars} color={level.color} />
        <Text style={[styles.levelDescription, { color: colors.levelDescription }]}>
          {level.description}
        </Text>
      </View>
    </View>
  );
}

export function LevelStepper({ selectedIndex, onIndexChange }: LevelStepperProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const total = DIFFICULTY_LEVELS.length;

  // Animation: translateX offset from center
  const translateX = useSharedValue(0);
  // Opacity for card swap
  const opacity = useSharedValue(1);

  // Direction ref to animate slide from correct side
  const directionRef = useRef<1 | -1>(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const navigate = useCallback(
    (direction: 1 | -1) => {
      const next = (((selectedIndex + direction) % total) + total) % total;

      directionRef.current = direction;

      // 状態更新を先に呼ぶ（テスト環境でもアニメーションに依存せず確実に実行される）
      onIndexChange(next);

      // アニメーション（視覚的な演出のみ）— shared value mutations are intentional
      // 1. 現カードをスライドアウト + フェードアウト
      translateX.value = withTiming(-direction * 50, { duration: 120 });
      opacity.value = withTiming(0, { duration: 120 }, () => {
        // 2. 新カードを反対側にスナップ配置
        translateX.value = direction * 50;
        // 3. スライドイン + フェードイン（減速カーブでスッと止まる）
        translateX.value = withTiming(0, SLIDE_IN_CONFIG);
        opacity.value = withTiming(1, { duration: 150 });
      });
    },
    [selectedIndex, total, translateX, opacity, onIndexChange]
  );

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      const swipedLeft =
        translationX < -SWIPE_TRANSLATION_THRESHOLD || velocityX < -SWIPE_VELOCITY_THRESHOLD;
      const swipedRight =
        translationX > SWIPE_TRANSLATION_THRESHOLD || velocityX > SWIPE_VELOCITY_THRESHOLD;

      if (swipedLeft) {
        runOnJS(navigate)(1);
      } else if (swipedRight) {
        runOnJS(navigate)(-1);
      }
    });

  const level = DIFFICULTY_LEVELS[selectedIndex];

  return (
    <View style={styles.container}>
      {/* Level counter */}
      <Text style={[styles.counter, { color: colors.levelDescription }]}>
        {selectedIndex + 1} / {total}
      </Text>

      <View style={styles.row}>
        {/* Left arrow */}
        <AppButton
          onPress={() => navigate(-1)}
          hitSlop={16}
          style={({ pressed }) => [
            styles.arrowButton,
            {
              backgroundColor: colors.arrowButton,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityLabel={t('a11y.prevLevel')}
          accessibilityRole="button"
        >
          <Text style={styles.arrowText}>‹</Text>
        </AppButton>

        {/* Animated card (swipeable) */}
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.cardWrapper}>
            <Animated.View style={[{ width: CARD_WIDTH }, animatedStyle]}>
              <LevelCard level={level} />
            </Animated.View>
          </View>
        </GestureDetector>

        {/* Right arrow */}
        <AppButton
          onPress={() => navigate(1)}
          hitSlop={16}
          style={({ pressed }) => [
            styles.arrowButton,
            {
              backgroundColor: colors.arrowButton,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityLabel={t('a11y.nextLevel')}
          accessibilityRole="button"
        >
          <Text style={styles.arrowText}>›</Text>
        </AppButton>
      </View>

      {/* Dot indicators */}
      <View style={styles.dotRow}>
        {DIFFICULTY_LEVELS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === selectedIndex ? colors.accent : colors.arrowButtonDisabled,
                width: i === selectedIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardAccentBar: {
    height: 8,
    width: '100%',
  },
  cardBody: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 10,
  },
  levelLabel: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  levelSublabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 4,
  },
  star: {
    fontSize: 24,
  },
  levelDescription: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  arrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    marginTop: -2,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
