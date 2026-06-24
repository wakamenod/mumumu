import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { AppButton } from '@/components/AppButton';
import Colors from '@/constants/Colors';
import {
  CountdownOverlay,
  DIFFICULTY_LEVELS,
  ElapsedTimer,
  MathDisplay,
  NumericKeypad,
  getQuiz,
} from '@/features/quiz';
import type { GetQuizResponse } from '@/features/quiz';
import type { AnswerEntry } from '@/features/quiz/api/submitScore';

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

  const router = useRouter();
  const navigation = useNavigation();

  // ヘッダータイトルをレベル名に設定
  useEffect(() => {
    navigation.setOptions({
      title: level?.label ?? 'クイズ',
    });
  }, [navigation, level]);

  const [fetchState, setFetchState] = useState<FetchState>({ status: 'loading' });
  const [showCountdown, setShowCountdown] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputRaw, setInputRaw] = useState('');
  // 各問の正誤 (true=正解, false=不正解, null=未回答)
  const [results, setResults] = useState<(boolean | null)[]>([]);
  // 各問の { id, answer } ペア（submitScoreFunction に送る）
  const [answers, setAnswers] = useState<AnswerEntry[]>([]);
  // クイズ開始時刻（ms Unix timestamp）
  const startedAtRef = useRef<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  // 結果画面へのナビゲーション済みフラグ（スワイプバック後の二重送信を防止）
  const hasNavigatedToResultRef = useRef(false);
  // 回答処理中フラグ（非同期処理 + 900ms 待機中の二重送信を防止）
  const isSubmittingRef = useRef(false);

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
          // 開始時刻はカウントダウン完了後に記録する
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

  // クイズ進行中の画面離脱を確認ダイアログでブロック
  const isQuizInProgress = fetchState.status === 'success' && !showCountdown;
  useEffect(() => {
    if (!isQuizInProgress) return;

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      Alert.alert('クイズを中断しますか？', undefined, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '中断する',
          style: 'destructive',
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });

    return unsubscribe;
  }, [navigation, isQuizInProgress]);

  // 成功時のみ使う派生値
  const questions = fetchState.status === 'success' ? fetchState.data.questions : [];
  const totalCount = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === totalCount - 1;

  // カウントダウン完了時のハンドラ
  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    const now = Date.now();
    startedAtRef.current = now;
    setStartedAt(now);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // SHA-256 ハッシュを計算して比較（仕様 §5.2: 生文字列をそのままハッシュ化）
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, inputRaw);
    const isCorrect = hash === currentQuestion.answer_hash;

    // 結果を保存
    const nextResults = [...results];
    nextResults[currentIndex] = isCorrect;
    setResults(nextResults);

    // 生入力を { id, answer } ペアとして蓄積
    const nextAnswers = [...answers, { id: currentQuestion.id, answer: inputRaw }];
    setAnswers(nextAnswers);

    // 短いディレイの後、次の問題へ（最終問題なら結果画面へ）
    setTimeout(() => {
      isSubmittingRef.current = false;
      if (isLastQuestion) {
        // スワイプバック後の再押下などによる二重送信を防止
        if (hasNavigatedToResultRef.current) return;
        hasNavigatedToResultRef.current = true;
        router.push({
          pathname: '/result',
          params: {
            levelId: levelId ?? '',
            startedAt: String(startedAtRef.current ?? Date.now()),
            answers: JSON.stringify(nextAnswers),
          },
        });
      } else {
        setCurrentIndex((prev) => prev + 1);
        setInputRaw('');
      }
    }, 900);
  }, [currentQuestion, inputRaw, currentIndex, results, answers, isLastQuestion, levelId, router]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      {/* ─ ヘッダー ─ */}
      <View style={styles.header}>
        {fetchState.status === 'success' && !showCountdown && (
          <>
            <ElapsedTimer startedAt={startedAt} color={colors.levelDescription} />
            <Text style={[styles.progress, { color: colors.levelDescription }]}>
              問 {currentIndex + 1} / {totalCount}
            </Text>
          </>
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

        {/* カウントダウン */}
        {fetchState.status === 'success' && showCountdown && (
          <CountdownOverlay onComplete={handleCountdownComplete} />
        )}

        {/* 問題表示 + 入力エリア */}
        {fetchState.status === 'success' && !showCountdown && currentQuestion && (
          <View style={styles.questionArea}>
            <View style={styles.mathWrapper}>
              <MathDisplay latex={currentQuestion.question} />
            </View>

            <NumericKeypad
              key={currentIndex}
              onValueChange={setInputRaw}
              resultState={results[currentIndex] ?? null}
            />
          </View>
        )}
      </View>

      {/* ─ 回答ボタン ─ */}
      {fetchState.status === 'success' && !showCountdown && totalCount > 0 && (
        <View style={styles.navRow}>
          <AppButton
            style={[styles.submitButton, { backgroundColor: level?.color ?? colors.accent }]}
            onPress={handleSubmit}
            accessibilityLabel={isLastQuestion ? '回答して結果を見る' : '回答する'}
          >
            <Text style={styles.submitButtonText}>
              {isLastQuestion ? '回答して結果へ' : '回答'}
            </Text>
          </AppButton>
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
    justifyContent: 'flex-start',
    padding: 16,
    gap: 16,
  },
  mathWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },

  // 回答ボタン行
  navRow: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
