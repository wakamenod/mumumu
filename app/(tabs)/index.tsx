import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import Colors from '@/constants/Colors';
import { LevelStepper } from '@/features/quiz/components/LevelStepper';
import { DIFFICULTY_LEVELS, TOTAL_QUESTIONS } from '@/features/quiz';

export default function DifficultySelectScreen() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const selectedLevel = DIFFICULTY_LEVELS[selectedIndex];

  const handleStart = () => {
    router.push({
      pathname: '/quiz' as any,
      params: { levelId: selectedLevel.id },
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.screenBackground }]}
      edges={['bottom', 'left', 'right']}
    >
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.screenBackground}
      />

      <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: colors.accent }]}>🧮 暗算クイズ</Text>
          <Text style={[styles.subtitle, { color: colors.levelDescription }]}>
            難易度を選んでスタート！
          </Text>
        </View>

        {/* Stepper */}
        <View style={styles.stepperArea}>
          <LevelStepper selectedIndex={selectedIndex} onIndexChange={setSelectedIndex} />
        </View>

        {/* Quiz info */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.infoText, { color: colors.levelDescription }]}>
            全 {TOTAL_QUESTIONS} 問　|　制限時間なし
          </Text>
        </View>

        {/* Start button */}
        <AppButton
          onPress={handleStart}
          style={({ pressed }) => [
            styles.startButton,
            {
              backgroundColor: pressed ? colors.startButtonDark : colors.startButton,
              shadowColor: colors.startButton,
            },
          ]}
          accessibilityLabel={`${selectedLevel.label}でクイズをスタート`}
          accessibilityRole="button"
        >
          <Text style={styles.startButtonText}>▶　スタート！</Text>
        </AppButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 28,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  stepperArea: {
    width: '100%',
    alignItems: 'center',
  },
  infoBox: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 52,
    borderRadius: 32,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
