import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import Colors from '@/constants/Colors';
import { DIFFICULTY_LEVELS } from '@/features/quiz/constants';
import { getRanking } from '@/features/quiz/api/getRanking';
import type { RankingEntry } from '@/features/quiz/api/submitScore';
import { RankingTable } from '@/features/quiz/components/RankingTable';
import { t } from '@/lib/i18n';

// ─── 型定義 ──────────────────────────────────────────────────────────────────

type FetchState =
  | { status: 'loading' }
  | { status: 'success'; rankings: RankingEntry[] }
  | { status: 'error'; message: string };

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function RankingScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  // デフォルト選択: リストの先頭（最も易しい「小学1年生」= M, インデックス 0）
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fetchState, setFetchState] = useState<FetchState>({ status: 'loading' });

  const selectedLevel = DIFFICULTY_LEVELS[selectedIndex];

  // ─ ランキング取得 ──────────────────────────────────────────────────────────

  const fetchRanking = useCallback(async (levelId: string) => {
    setFetchState({ status: 'loading' });
    try {
      const rankings = await getRanking(levelId);
      setFetchState({ status: 'success', rankings });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common.unknownError');
      setFetchState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    fetchRanking(selectedLevel.id);
  }, [selectedLevel.id, fetchRanking]);

  // ─ レベル切替ハンドラ ──────────────────────────────────────────────────────

  const goToPrevLevel = useCallback(() => {
    setSelectedIndex((prev) => (prev <= 0 ? DIFFICULTY_LEVELS.length - 1 : prev - 1));
  }, []);

  const goToNextLevel = useCallback(() => {
    setSelectedIndex((prev) => (prev >= DIFFICULTY_LEVELS.length - 1 ? 0 : prev + 1));
  }, []);

  // ─ スワイプジェスチャー ────────────────────────────────────────────────────

  const swipeHandled = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-30, 30]) // 横方向 30px 超えたら Pan 開始（縦スクロールと干渉しない）
    .onStart(() => {
      'worklet';
      swipeHandled.value = false;
    })
    .onUpdate((e) => {
      'worklet';
      if (swipeHandled.value) return;
      if (e.translationX < -50) {
        swipeHandled.value = true;
        runOnJS(goToNextLevel)();
      } else if (e.translationX > 50) {
        swipeHandled.value = true;
        runOnJS(goToPrevLevel)();
      }
    });

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.screenBackground }]}
      edges={['left', 'right']}
    >
      {/* ─ 見出し + レベルタイトル ─ */}
      <Text style={[styles.screenHeading, { color: colors.levelDescription }]}>
        {t('ranking.heading')}
      </Text>
      <Text style={[styles.levelTitle, { color: colors.levelLabel }]}>{selectedLevel.label}</Text>

      {/* ─ コンテンツエリア ─ */}
      {fetchState.status === 'loading' && (
        <GestureDetector gesture={panGesture}>
          <View style={styles.contentWithArrows}>
            <Pressable
              onPress={goToPrevLevel}
              style={styles.arrowButton}
              accessibilityLabel={t('a11y.prevLevel')}
            >
              <Text style={[styles.arrowText, { color: colors.levelLabel }]}>◀</Text>
            </Pressable>

            <View style={styles.centerArea}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.levelDescription }]}>
                {t('ranking.loading')}
              </Text>
            </View>

            <Pressable
              onPress={goToNextLevel}
              style={styles.arrowButton}
              accessibilityLabel={t('a11y.nextLevel')}
            >
              <Text style={[styles.arrowText, { color: colors.levelLabel }]}>▶</Text>
            </Pressable>
          </View>
        </GestureDetector>
      )}

      {fetchState.status === 'error' && (
        <GestureDetector gesture={panGesture}>
          <View style={styles.contentWithArrows}>
            <Pressable
              onPress={goToPrevLevel}
              style={styles.arrowButton}
              accessibilityLabel={t('a11y.prevLevel')}
            >
              <Text style={[styles.arrowText, { color: colors.levelLabel }]}>◀</Text>
            </Pressable>

            <View style={styles.centerArea}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[styles.errorLabel, { color: colors.levelLabel }]}>
                {t('ranking.errorTitle')}
              </Text>
              <Text style={[styles.errorMessage, { color: colors.levelDescription }]}>
                {fetchState.message}
              </Text>
              <AppButton
                style={[styles.retryButton, { backgroundColor: colors.accent }]}
                onPress={() => fetchRanking(selectedLevel.id)}
                accessibilityLabel={t('ranking.retryA11y')}
              >
                <Text style={styles.retryButtonText}>{t('ranking.retry')}</Text>
              </AppButton>
            </View>

            <Pressable
              onPress={goToNextLevel}
              style={styles.arrowButton}
              accessibilityLabel={t('a11y.nextLevel')}
            >
              <Text style={[styles.arrowText, { color: colors.levelLabel }]}>▶</Text>
            </Pressable>
          </View>
        </GestureDetector>
      )}

      {fetchState.status === 'success' && fetchState.rankings.length === 0 && (
        <GestureDetector gesture={panGesture}>
          <View style={styles.contentWithArrows}>
            <Pressable
              onPress={goToPrevLevel}
              style={styles.arrowButton}
              accessibilityLabel={t('a11y.prevLevel')}
            >
              <Text style={[styles.arrowText, { color: colors.levelLabel }]}>◀</Text>
            </Pressable>

            <View style={styles.centerArea}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={[styles.emptyText, { color: colors.levelDescription }]}>
                {t('ranking.empty')}
              </Text>
            </View>

            <Pressable
              onPress={goToNextLevel}
              style={styles.arrowButton}
              accessibilityLabel={t('a11y.nextLevel')}
            >
              <Text style={[styles.arrowText, { color: colors.levelLabel }]}>▶</Text>
            </Pressable>
          </View>
        </GestureDetector>
      )}

      {fetchState.status === 'success' && fetchState.rankings.length > 0 && (
        <GestureDetector gesture={panGesture}>
          <View style={styles.contentWithArrows}>
            <Pressable
              onPress={goToPrevLevel}
              style={styles.arrowButton}
              accessibilityLabel={t('a11y.prevLevel')}
            >
              <Text style={[styles.arrowText, { color: colors.levelLabel }]}>◀</Text>
            </Pressable>

            <ScrollView
              style={styles.rankingScrollArea}
              contentContainerStyle={styles.rankingScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <RankingTable rankings={fetchState.rankings} colors={colors} />
            </ScrollView>

            <Pressable
              onPress={goToNextLevel}
              style={styles.arrowButton}
              accessibilityLabel={t('a11y.nextLevel')}
            >
              <Text style={[styles.arrowText, { color: colors.levelLabel }]}>▶</Text>
            </Pressable>
          </View>
        </GestureDetector>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // 見出し
  screenHeading: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 10,
  },

  // レベルタイトル
  levelTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingTop: 2,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },

  // 矢印付きコンテンツレイアウト
  contentWithArrows: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  arrowButton: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowText: {
    fontSize: 22,
    fontWeight: '700',
  },
  rankingScrollArea: {
    flex: 1,
  },

  // ローディング・エラー・空状態の中央表示
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 15,
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
  retryButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },

  // ランキングテーブル
  rankingScrollContent: {
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 32,
  },
});
