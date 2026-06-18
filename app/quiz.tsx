import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import Colors from '@/constants/Colors';
import { DIFFICULTY_LEVELS, getQuiz } from '@/features/quiz';
import type { GetQuizResponse } from '@/features/quiz';

type FetchState =
  | { status: 'loading' }
  | { status: 'success'; data: GetQuizResponse }
  | { status: 'error'; message: string };

export default function QuizScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const level = DIFFICULTY_LEVELS.find((l) => l.id === levelId);

  const [fetchState, setFetchState] = useState<FetchState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function fetchQuiz() {
      if (!levelId) {
        if (!cancelled) {
          setFetchState({ status: 'error', message: 'levelId が指定されていません' });
        }
        return;
      }

      // ここは非同期関数内なので同期 setState の警告が出ない
      if (!cancelled) setFetchState({ status: 'loading' });

      try {
        const data = await getQuiz([levelId]);
        if (!cancelled) setFetchState({ status: 'success', data });
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
          setFetchState({ status: 'error', message });
        }
      }
    }

    fetchQuiz();

    // levelId が変わった場合に古い結果で state を上書きしない
    return () => {
      cancelled = true;
    };
  }, [levelId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.badge, { color: level?.color ?? colors.accent }]}>
          {level?.label ?? levelId ?? '不明'}
        </Text>
        <Text style={[styles.title, { color: colors.levelLabel }]}>クイズ回答画面</Text>
        <Text style={[styles.sub, { color: colors.levelDescription }]}>
          疎通確認 — getQuizFunction レスポンス
        </Text>
      </View>

      {/* レスポンス表示エリア */}
      <View style={[styles.responseBox, { borderColor: level?.color ?? colors.accent }]}>
        {fetchState.status === 'loading' && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={level?.color ?? colors.accent} />
            <Text style={[styles.loadingText, { color: colors.levelDescription }]}>
              クイズを取得中...
            </Text>
          </View>
        )}

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

        {fetchState.status === 'success' && (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.successLabel, { color: level?.color ?? colors.accent }]}>
              ✅ 取得成功 — {fetchState.data.questions.length} 問
            </Text>
            <Text style={[styles.jsonText, { color: colors.levelLabel }]} selectable>
              {JSON.stringify(fetchState.data, null, 2)}
            </Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  sub: {
    fontSize: 13,
  },
  responseBox: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  successLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  jsonText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    lineHeight: 18,
  },
});
