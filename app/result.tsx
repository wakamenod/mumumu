import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { AppButton } from '@/components/AppButton';
import Colors from '@/constants/Colors';
import { submitScore } from '@/features/quiz/api/submitScore';
import type { AnswerEntry, SubmitScoreResponse } from '@/features/quiz/api/submitScore';
import { RankingTable, formatTime } from '@/features/quiz/components/RankingTable';

// ─── 型定義 ──────────────────────────────────────────────────────────────────

type SubmitState =
  | { status: 'loading' }
  | { status: 'success'; data: SubmitScoreResponse }
  | { status: 'error'; message: string };

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ResultScreen() {
  const { levelId, startedAt, answers } = useLocalSearchParams<{
    levelId: string;
    startedAt: string;
    answers: string;
  }>();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function callSubmitScore() {
      try {
        const parsedAnswers: AnswerEntry[] = answers ? JSON.parse(answers) : [];
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.levelLabel }]}>結果</Text>

        {/* ─ ローディング ─ */}
        {submitState.status === 'loading' && (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.levelDescription }]}>採点中...</Text>
          </View>
        )}

        {/* ─ エラー ─ */}
        {submitState.status === 'error' && (
          <View style={styles.errorArea}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={[styles.errorLabel, { color: colors.levelLabel }]}>
              エラーが発生しました
            </Text>
            <Text style={[styles.errorMessage, { color: colors.levelDescription }]}>
              {submitState.message}
            </Text>
          </View>
        )}

        {/* ─ 成功 ─ */}
        {submitState.status === 'success' && (
          <>
            {/* 正解数・経過時間 */}
            <ScoreSummary
              correctCount={submitState.data.correct_count}
              elapsedTime={submitState.data.elapsed_time}
              colors={colors}
            />

            {/* ランキングテーブル（ranked: true のみ） */}
            {submitState.data.ranked && (
              <RankingTable
                rankings={submitState.data.rankings}
                myRank={submitState.data.rank}
                colors={colors}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* ─ トップに戻るボタン ─ */}
      <View style={styles.buttonArea}>
        <AppButton
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={() => router.replace('/')}
          accessibilityLabel="トップに戻る"
        >
          <Text style={styles.buttonText}>トップに戻る</Text>
        </AppButton>
      </View>
    </View>
  );
}

// ─── ScoreSummary ─────────────────────────────────────────────────────────────

type ColorsType = (typeof Colors)['light'];

interface ScoreSummaryProps {
  correctCount: number;
  elapsedTime: number;
  colors: ColorsType;
}

function ScoreSummary({ correctCount, elapsedTime, colors }: ScoreSummaryProps) {
  return (
    <View style={styles.scoreSummary}>
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreLabel, { color: colors.levelDescription }]}>正解数</Text>
        <Text style={[styles.scoreValue, { color: colors.accent }]}>
          {correctCount}
          <Text style={[styles.scoreUnit, { color: colors.levelDescription }]}> / 20</Text>
        </Text>
      </View>
      <View style={[styles.scoreDivider, { backgroundColor: colors.levelDescription }]} />
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreLabel, { color: colors.levelDescription }]}>経過時間</Text>
        <Text style={[styles.scoreValue, { color: colors.accent }]}>{formatTime(elapsedTime)}</Text>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    gap: 32,
  },

  // タイトル
  title: {
    fontSize: 32,
    fontWeight: '700',
  },

  // ローディング
  loadingArea: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 15,
  },

  // エラー
  errorArea: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  errorIcon: {
    fontSize: 36,
  },
  errorLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorMessage: {
    fontSize: 13,
    textAlign: 'center',
  },

  // 正解数・経過時間サマリー
  scoreSummary: {
    width: '100%',
    gap: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scoreUnit: {
    fontSize: 18,
    fontWeight: '600',
  },
  scoreDivider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.3,
  },

  // ボタン
  buttonArea: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
