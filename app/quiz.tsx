import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import Colors from '@/constants/Colors';
import { DIFFICULTY_LEVELS, MathDisplay, getQuiz } from '@/features/quiz';
import type { GetQuizResponse } from '@/features/quiz';

// ─── 型定義 ──────────────────────────────────────────────────────────────────

type FetchState =
  | { status: 'loading' }
  | { status: 'success'; data: GetQuizResponse }
  | { status: 'error'; message: string };

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function QuizScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const level = DIFFICULTY_LEVELS.find((l) => l.id === levelId);

  const [fetchState, setFetchState] = useState<FetchState>({ status: 'loading' });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchQuiz() {
      if (!levelId) {
        if (!cancelled) {
          setFetchState({ status: 'error', message: 'levelId が指定されていません' });
        }
        return;
      }

      if (!cancelled) setFetchState({ status: 'loading' });

      try {
        const data = await getQuiz([levelId]);
        if (!cancelled) {
          setFetchState({ status: 'success', data });
          setCurrentIndex(0);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
          setFetchState({ status: 'error', message });
        }
      }
    }

    fetchQuiz();

    return () => {
      cancelled = true;
    };
  }, [levelId]);

  // 成功時のみ使う派生値
  const questions = fetchState.status === 'success' ? fetchState.data.questions : [];
  const totalCount = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === totalCount - 1;

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      {/* ─ ヘッダー ─ */}
      <View style={styles.header}>
        <Text style={[styles.badge, { color: level?.color ?? colors.accent }]}>
          {level?.label ?? levelId ?? '不明'}
        </Text>

        {fetchState.status === 'success' && (
          <Text style={[styles.progress, { color: colors.levelDescription }]}>
            問 {currentIndex + 1} / {totalCount}
          </Text>
        )}
      </View>

      {/* ─ メインエリア ─ */}
      <View
        style={[
          styles.mainArea,
          { borderColor: level?.color ?? colors.accent, backgroundColor: colors.cardBackground },
        ]}
      >
        {/* ローディング */}
        {fetchState.status === 'loading' && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={level?.color ?? colors.accent} />
            <Text style={[styles.loadingText, { color: colors.levelDescription }]}>
              クイズを取得中...
            </Text>
          </View>
        )}

        {/* エラー */}
        {fetchState.status === 'error' && (
          <View style={styles.centered}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={[styles.errorTitle, { color: colors.levelLabel }]}>
              エラーが発生しました
            </Text>
            <Text style={[styles.errorMessage, { color: colors.levelDescription }]}>
              {fetchState.message}
            </Text>
          </View>
        )}

        {/* 問題表示 */}
        {fetchState.status === 'success' && currentQuestion && (
          <View style={styles.questionArea}>
            <MathDisplay latex={currentQuestion.question} />
          </View>
        )}
      </View>

      {/* ─ ナビゲーションボタン（確認用） ─ */}
      {fetchState.status === 'success' && (
        <View style={styles.navRow}>
          {/* 前へ */}
          <Pressable
            style={[
              styles.navButton,
              { backgroundColor: colors.accent },
              currentIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
            accessibilityLabel="前の問題"
          >
            <Text
              style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}
            >
              ← 前へ
            </Text>
          </Pressable>

          {/* 問題番号ドット */}
          <Text style={[styles.indexLabel, { color: colors.levelDescription }]}>
            {currentIndex + 1} / {totalCount}
          </Text>

          {/* 次へ */}
          <Pressable
            style={[
              styles.navButton,
              { backgroundColor: colors.accent },
              isLastQuestion && styles.navButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={isLastQuestion}
            accessibilityLabel="次の問題"
          >
            <Text style={[styles.navButtonText, isLastQuestion && styles.navButtonTextDisabled]}>
              次へ →
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 20,
  },

  // ヘッダー
  header: {
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progress: {
    fontSize: 14,
    fontWeight: '600',
  },

  // 問題カード
  mainArea: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 36,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 13,
    textAlign: 'center',
  },
  questionArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  // ナビゲーション行
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  navButtonTextDisabled: {
    color: '#FFFFFF',
  },
  indexLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
