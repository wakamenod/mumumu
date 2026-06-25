import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import Colors from '@/constants/Colors';
import { DIFFICULTY_LEVELS } from '@/features/quiz/constants';
import { getRanking } from '@/features/quiz/api/getRanking';
import type { RankingEntry } from '@/features/quiz/api/submitScore';
import { RankingTable } from '@/features/quiz/components/RankingTable';

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

  const tabScrollRef = useRef<ScrollView>(null);

  const selectedLevel = DIFFICULTY_LEVELS[selectedIndex];

  // ─ ランキング取得 ──────────────────────────────────────────────────────────

  const fetchRanking = useCallback(async (levelId: string) => {
    setFetchState({ status: 'loading' });
    try {
      const rankings = await getRanking(levelId);
      setFetchState({ status: 'success', rankings });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setFetchState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    fetchRanking(selectedLevel.id);
  }, [selectedLevel.id, fetchRanking]);

  // ─ レベル切替ハンドラ ──────────────────────────────────────────────────────

  const handleSelectLevel = (index: number) => {
    setSelectedIndex(index);
    // 選択されたタブがビューに収まるようスクロールする
    tabScrollRef.current?.scrollTo({ x: index * TAB_ITEM_WIDTH - TAB_ITEM_WIDTH, animated: true });
  };

  // ─ 星表示ヘルパー ──────────────────────────────────────────────────────────

  const starsLabel = '★'.repeat(selectedLevel.stars) + '☆'.repeat(5 - selectedLevel.stars);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.screenBackground }]}
      edges={['left', 'right']}
    >
      {/* ─ ページタイトル ─ */}
      <Text style={[styles.pageTitle, { color: colors.levelLabel }]}>ランキング</Text>

      {/* ─ レベルタブ（横スクロール） ─ */}
      <View
        style={[
          styles.tabBarWrapper,
          { borderBottomColor: colors.cardBorder, backgroundColor: colors.cardBackground },
        ]}
      >
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {DIFFICULTY_LEVELS.map((level, index) => {
            const isSelected = index === selectedIndex;
            return (
              <TouchableOpacity
                key={level.id}
                style={[styles.tabItem, { width: TAB_ITEM_WIDTH }]}
                onPress={() => handleSelectLevel(index)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${level.id} ${level.label}`}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    isSelected
                      ? { color: colors.accent, fontWeight: '700' }
                      : { color: colors.levelDescription },
                  ]}
                >
                  {level.id}
                </Text>
                {isSelected && (
                  <View style={[styles.tabUnderline, { backgroundColor: colors.accent }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─ 選択中レベルの説明 ─ */}
      <View style={[styles.levelInfo, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.levelInfoLabel, { color: colors.levelLabel }]}>
          {selectedLevel.label}
        </Text>
        <Text style={[styles.levelInfoStars, { color: colors.starActive }]}>{starsLabel}</Text>
      </View>

      {/* ─ コンテンツエリア ─ */}
      {fetchState.status === 'loading' && (
        <View style={styles.centerArea}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.levelDescription }]}>
            読み込み中...
          </Text>
        </View>
      )}

      {fetchState.status === 'error' && (
        <View style={styles.centerArea}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorLabel, { color: colors.levelLabel }]}>
            エラーが発生しました
          </Text>
          <Text style={[styles.errorMessage, { color: colors.levelDescription }]}>
            {fetchState.message}
          </Text>
          <AppButton
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
            onPress={() => fetchRanking(selectedLevel.id)}
            accessibilityLabel="再試行"
          >
            <Text style={styles.retryButtonText}>再試行</Text>
          </AppButton>
        </View>
      )}

      {fetchState.status === 'success' && fetchState.rankings.length === 0 && (
        <View style={styles.centerArea}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={[styles.emptyText, { color: colors.levelDescription }]}>
            まだランキングデータがありません
          </Text>
        </View>
      )}

      {fetchState.status === 'success' && fetchState.rankings.length > 0 && (
        <ScrollView
          contentContainerStyle={styles.rankingScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <RankingTable rankings={fetchState.rankings} colors={colors} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TAB_ITEM_WIDTH = 48;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // ページタイトル
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },

  // タブバー
  tabBarWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBarContent: {
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 15,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 6,
    right: 6,
    height: 2.5,
    borderRadius: 2,
  },

  // 選択中レベルの説明行
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  levelInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  levelInfoStars: {
    fontSize: 13,
    letterSpacing: 1,
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
});
