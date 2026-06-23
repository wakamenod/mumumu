import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { AppButton } from '@/components/AppButton';
import Colors from '@/constants/Colors';
import { registerUsername as registerUsernameApi } from '@/features/quiz/api/registerUsername';
import { submitScore } from '@/features/quiz/api/submitScore';
import type {
  AnswerEntry,
  RankingEntry,
  SubmitScoreResponse,
} from '@/features/quiz/api/submitScore';
import { InitialsEntryForm } from '@/features/quiz/components/InitialsEntryForm';
import {
  RankingTable,
  RankingTableBody,
  RankingTableHeader,
  formatTime,
} from '@/features/quiz/components/RankingTable';

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

  /** イニシャル入力で確定した文字列 */
  const [username, setUsername] = useState<string>('');
  /** END ボタンが押されて入力が完了したか */
  const [initialsSubmitted, setInitialsSubmitted] = useState<boolean>(false);
  /** registerUsernameFunction の通信中フラグ */
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  /** ランキング（username 更新をローカルに反映するためのコピー） */
  const [localRankings, setLocalRankings] = useState<RankingEntry[] | null>(null);

  // ─── スクロール制御（ランクイン時・自分の行をセンタリング） ────────────────
  const scrollRef = useRef<ScrollView>(null);
  /** ランキング ScrollView の表示高さ（onLayout で更新） */
  const scrollViewHeightRef = useRef<number>(0);
  /** 初期スクロールを一度だけ実行するためのフラグ */
  const hasScrolledRef = useRef<boolean>(false);
  /** 1行あたりの推定高さ: paddingVertical 8×2 + fontSize 14 ≈ 36pt */
  const ROW_HEIGHT = 36;

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
          setLocalRankings(data.rankings);
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

  /** ローディング中、または END が押されるまでトップに戻るボタンを非活性にする */
  const isButtonDisabled =
    submitState.status === 'loading' ||
    (submitState.status === 'success' && submitState.data.ranked && !initialsSubmitted);

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      {/* ══════════════════════════════════════════════════════════════════
          ランクイン & 入力中: 固定エリア（フォーム＋ヘッダー）＋スクロール行
          ══════════════════════════════════════════════════════════════════ */}
      {submitState.status === 'success' &&
        submitState.data.ranked &&
        !initialsSubmitted &&
        localRankings && (
          <>
            {/* 固定エリア: InitialsEntryForm ＋ ランキングタイトル＋ヘッダー行 */}
            <View style={[styles.fixedArea, { backgroundColor: colors.screenBackground }]}>
              <InitialsEntryForm
                value={username}
                onPressLetter={(char) =>
                  setUsername((prev) => (prev.length < 5 ? prev + char : prev))
                }
                onBackspace={() => setUsername((prev) => prev.slice(0, -1))}
                onEnd={async () => {
                  if (!submitState.data.claimToken) return;

                  setIsRegistering(true);
                  try {
                    await registerUsernameApi(levelId ?? '', submitState.data.claimToken, username);
                    setLocalRankings(
                      (prev) =>
                        prev?.map((entry) =>
                          entry.rank === submitState.data.rank ? { ...entry, username } : entry
                        ) ?? null
                    );
                    setInitialsSubmitted(true);
                  } catch {
                    Alert.alert(
                      'ユーザー名の登録に失敗しました',
                      '通信環境を確認して再度お試しください。'
                    );
                  } finally {
                    setIsRegistering(false);
                  }
                }}
                submitting={isRegistering}
                colors={colors}
              />
              <Text style={[styles.rankingTitle, { color: colors.levelLabel }]}>ランキング</Text>
              <RankingTableHeader colors={colors} showArrowColumn />
            </View>

            {/* スクロール可能エリア: データ行のみ。初期表示で自分の行を中央に */}
            <ScrollView
              ref={scrollRef}
              style={styles.rankingScroll}
              contentContainerStyle={styles.rankingScrollContent}
              showsVerticalScrollIndicator={false}
              onLayout={(e) => {
                scrollViewHeightRef.current = e.nativeEvent.layout.height;
              }}
              onContentSizeChange={() => {
                if (
                  !hasScrolledRef.current &&
                  submitState.data.rank != null &&
                  scrollViewHeightRef.current > 0
                ) {
                  const targetY = Math.max(
                    0,
                    (submitState.data.rank - 1) * ROW_HEIGHT -
                      scrollViewHeightRef.current / 2 +
                      ROW_HEIGHT / 2
                  );
                  scrollRef.current?.scrollTo({ y: targetY, animated: false });
                  hasScrolledRef.current = true;
                }
              }}
            >
              <RankingTableBody
                rankings={localRankings.map((entry) =>
                  entry.rank === submitState.data.rank
                    ? { ...entry, username: username.padEnd(5, '_') }
                    : entry
                )}
                myRank={submitState.data.rank}
                colors={colors}
                isEntering
              />
            </ScrollView>
          </>
        )}

      {/* ══════════════════════════════════════════════════════════════════
          その他の状態: ローディング / エラー / ランクインなし / 入力完了後
          ══════════════════════════════════════════════════════════════════ */}
      {!(submitState.status === 'success' && submitState.data.ranked && !initialsSubmitted) && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─ ローディング ─ */}
          {submitState.status === 'loading' && (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.levelDescription }]}>
                採点中...
              </Text>
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

          {/* ─ 成功（ランクインなし または 入力完了後） ─ */}
          {submitState.status === 'success' && (!submitState.data.ranked || initialsSubmitted) && (
            <>
              <ScoreSummary
                correctCount={submitState.data.correct_count}
                elapsedTime={submitState.data.elapsed_time}
                colors={colors}
              />
              {submitState.data.ranked && localRankings && (
                <RankingTable
                  rankings={localRankings}
                  myRank={submitState.data.rank}
                  colors={colors}
                />
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ─ トップに戻るボタン ─ */}
      <View style={styles.buttonArea}>
        <AppButton
          style={[
            styles.button,
            { backgroundColor: isButtonDisabled ? colors.arrowButtonDisabled : colors.accent },
          ]}
          onPress={() => router.replace('/')}
          disabled={isButtonDisabled}
          accessibilityLabel="トップに戻る"
        >
          <Text style={[styles.buttonText, isButtonDisabled && styles.buttonTextDisabled]}>
            トップに戻る
          </Text>
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

  // イニシャル入力画面: 固定エリア（フォーム＋ランキングヘッダー）
  fixedArea: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 16,
  },
  rankingTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },

  // イニシャル入力画面: スクロール可能ランキング行エリア
  rankingScroll: {
    flex: 1,
  },
  rankingScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
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
  buttonTextDisabled: {
    opacity: 0.5,
  },
});
