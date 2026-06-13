import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import Colors from '@/constants/Colors';
import { DIFFICULTY_LEVELS } from '@/features/quiz';

export default function QuizScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const level = DIFFICULTY_LEVELS.find((l) => l.id === levelId);

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <Text style={[styles.badge, { color: level?.color ?? colors.accent }]}>
        {level?.label ?? '不明'}
      </Text>
      <Text style={[styles.title, { color: colors.levelLabel }]}>クイズ画面</Text>
      <Text style={[styles.sub, { color: colors.levelDescription }]}>🚧　準備中です</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  badge: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  sub: {
    fontSize: 16,
  },
});
