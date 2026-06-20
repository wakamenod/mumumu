import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import Colors from '@/constants/Colors';
import { submitScore } from '@/features/quiz/api/submitScore';
import type { SubmitScoreResponse } from '@/features/quiz/api/submitScore';

// ─── Screen ──────────────────────────────────────────────────────────────────
// 疎通確認実装。submitScoreFunction を呼び出しレスポンスをそのまま表示する。

type SubmitState =
  | { status: 'loading' }
  | { status: 'success'; data: SubmitScoreResponse }
  | { status: 'error'; message: string };

export default function ResultScreen() {
  const { correct, total, levelId, startedAt, answers } = useLocalSearchParams<{
    correct: string;
    total: string;
    levelId: string;
    startedAt: string;
    answers: string;
  }>();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const correctNum = Number(correct ?? 0);
  const totalNum = Number(total ?? 0);

  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function callSubmitScore() {
      try {
        const parsedAnswers: string[] = answers ? JSON.parse(answers) : [];
        const parsedStartedAt = Number(startedAt ?? Date.now());

        const data = await submitScore({
          level: levelId ?? '',
          answers: parsedAnswers,
          startedAt: parsedStartedAt,
        });

        if (!cancelled) {
          setSubmitState({ status: 'success', data });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
          setSubmitState({ status: 'error', message });
        }
      }
    }

    callSubmitScore();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <Text style={[styles.title, { color: colors.levelLabel }]}>結果</Text>
      <Text style={[styles.score, { color: colors.accent }]}>
        {correctNum} / {totalNum}
      </Text>

      {/* ─ submitScoreFunction レスポンス表示（疎通確認用） ─ */}
      <View style={[styles.responseBox, { borderColor: colors.accent }]}>
        {submitState.status === 'loading' && (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.statusText, { color: colors.levelDescription }]}>送信中...</Text>
          </View>
        )}

        {submitState.status === 'error' && (
          <View style={styles.centered}>
            <Text style={[styles.errorLabel, { color: colors.levelLabel }]}>⚠️ エラー</Text>
            <Text style={[styles.statusText, { color: colors.levelDescription }]}>
              {submitState.message}
            </Text>
          </View>
        )}

        {submitState.status === 'success' && (
          <ScrollView>
            <Text style={[styles.responseLabel, { color: colors.levelDescription }]}>
              submitScoreFunction レスポンス（疎通確認）
            </Text>
            <Text style={[styles.responseJson, { color: colors.levelLabel }]}>
              {JSON.stringify(submitState.data, null, 2)}
            </Text>
          </ScrollView>
        )}
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={() => router.replace('/')}
        accessibilityLabel="トップに戻る"
      >
        <Text style={styles.buttonText}>トップに戻る</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  score: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: 2,
  },
  // submitScoreFunction レスポンス表示ボックス
  responseBox: {
    width: '100%',
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    textAlign: 'center',
  },
  errorLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  responseLabel: {
    fontSize: 11,
    marginBottom: 8,
  },
  responseJson: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
