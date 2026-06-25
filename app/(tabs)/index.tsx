import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppButton } from '@/components/AppButton';
import Colors from '@/constants/Colors';
import { LevelStepper } from '@/features/quiz/components/LevelStepper';
import { DIFFICULTY_LEVELS, TOTAL_QUESTIONS, LAST_LEVEL_KEY } from '@/features/quiz';

export default function DifficultySelectScreen() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const selectedLevel = DIFFICULTY_LEVELS[selectedIndex];

  // Restore last-selected level on mount
  useEffect(() => {
    AsyncStorage.getItem(LAST_LEVEL_KEY)
      .then((savedId) => {
        if (savedId) {
          const idx = DIFFICULTY_LEVELS.findIndex((l) => l.id === savedId);
          if (idx >= 0) setSelectedIndex(idx);
        }
      })
      .catch(() => {
        // ストレージ読み込み失敗時はデフォルト値のまま続行
      })
      .finally(() => setIsReady(true));
  }, []);

  const handleStart = () => {
    AsyncStorage.setItem(LAST_LEVEL_KEY, selectedLevel.id);
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

      <View
        style={[
          styles.container,
          { backgroundColor: colors.screenBackground, opacity: isReady ? 1 : 0 },
        ]}
      >
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

        {/* Rules link */}
        <TouchableOpacity onPress={() => setShowRules(true)} activeOpacity={0.6}>
          <Text style={[styles.rulesLink, { color: colors.levelDescription }]}>📖 解答ルール</Text>
        </TouchableOpacity>
      </View>

      {/* ─ 解答ルール モーダル ─ */}
      <Modal
        visible={showRules}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRules(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowRules(false)}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
            onPress={() => {
              /* カード内タップで閉じないようにする */
            }}
          >
            <Text style={[styles.modalTitle, { color: colors.accent }]}>📖 解答ルール</Text>

            <View style={styles.modalRules}>
              <Text style={[styles.modalRuleText, { color: colors.levelLabel }]}>
                ・分数は「1/3」や「−2/5」のようにスラッシュで入力してください。
              </Text>
              <Text style={[styles.modalRuleText, { color: colors.levelLabel }]}>
                ・回答は必ず既約分数（これ以上約分できない状態）にしてください。
              </Text>
              <Text style={[styles.modalRuleText, { color: colors.levelLabel }]}>
                ・整数になる場合は整数（例: 3）で入力してください（「3/1」は不正解）。
              </Text>
              <Text style={[styles.modalRuleText, { color: colors.levelLabel }]}>
                ・「−0」は不正解となります。
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowRules(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseText}>閉じる</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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

  // 解答ルール リンク
  rulesLink: {
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // 解答ルール モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalRules: {
    gap: 8,
  },
  modalRuleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalCloseButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 36,
    borderRadius: 20,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
