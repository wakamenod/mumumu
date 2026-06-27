import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import Colors from '@/constants/Colors';
import type { RankingEntry } from '@/features/quiz/api/submitScore';
import { t } from '@/lib/i18n';

// ─── 定数 ────────────────────────────────────────────────────────────────────

const RANKING_ROWS = 20;

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

/** ランキング配列を常に RANKING_ROWS 件にパディングする */
export function padRankings(rankings: RankingEntry[]): (RankingEntry | null)[] {
  const padded: (RankingEntry | null)[] = [...rankings];
  while (padded.length < RANKING_ROWS) {
    padded.push(null);
  }
  return padded;
}

/** elapsed_time (秒) を表示用文字列に変換する */
export function formatTime(seconds: number): string {
  return t('rankingTable.timeSeconds', { time: seconds.toFixed(1) });
}

// ─── Props ───────────────────────────────────────────────────────────────────

type ColorsType = (typeof Colors)['light'];

export interface RankingTableProps {
  rankings: RankingEntry[];
  /** 自分の順位。指定した場合その行を accent 色でハイライトする。省略時はハイライトなし。 */
  myRank?: number | null;
  colors: ColorsType;
}

// ─── BlinkingArrow ────────────────────────────────────────────────────────────

/** 自分の行の左端に表示する点滅矢印。reanimated で opacity をループ。 */
function BlinkingArrow({ color }: { color: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1 // 無限ループ
    );
    // クリーンアップ不要: reanimated はアンマウント時に自動停止
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.Text style={[styles.arrowText, { color }, animStyle]}>▶</Animated.Text>;
}

// ─── RankingTableHeader ──────────────────────────────────────────────────────

interface RankingTableHeaderProps {
  colors: ColorsType;
  /** true のとき左端に矢印列（幅16）のスペーサーを追加し、Body の列位置と揃える */
  showArrowColumn?: boolean;
}

/** ランキングのヘッダー行のみを描画する。固定ヘッダーとして単独利用可能。 */
export function RankingTableHeader({ colors, showArrowColumn = false }: RankingTableHeaderProps) {
  return (
    <View
      style={[
        styles.rankingRow,
        styles.rankingHeader,
        { borderBottomColor: colors.levelDescription },
      ]}
    >
      {showArrowColumn && <View style={styles.arrowCol} />}
      <Text style={[styles.rankingHeaderCell, styles.colRank, { color: colors.levelDescription }]}>
        {t('rankingTable.rank')}
      </Text>
      <Text style={[styles.rankingHeaderCell, styles.colName, { color: colors.levelDescription }]}>
        {t('rankingTable.username')}
      </Text>
      <Text style={[styles.rankingHeaderCell, styles.colScore, { color: colors.levelDescription }]}>
        {t('rankingTable.correctCount')}
      </Text>
      <Text style={[styles.rankingHeaderCell, styles.colTime, { color: colors.levelDescription }]}>
        {t('rankingTable.elapsedTime')}
      </Text>
    </View>
  );
}

// ─── RankingTableBody ─────────────────────────────────────────────────────────

export interface RankingTableBodyProps {
  rankings: RankingEntry[];
  myRank?: number | null;
  colors: ColorsType;
  /**
   * true のとき「イニシャル入力中」モードとして以下を適用:
   * - 自分以外の行を opacity: 0.25 で薄く表示
   * - 自分の行の左端に点滅矢印を表示
   * - 自分以外の行の左端にスペーサーを追加（列位置を揃える）
   */
  isEntering?: boolean;
}

/**
 * ランキングのデータ行のみを描画する。
 * ScrollView の直接の子として利用することで、行部分だけをスクロール可能にできる。
 */
export function RankingTableBody({
  rankings,
  myRank,
  colors,
  isEntering = false,
}: RankingTableBodyProps) {
  const rows = padRankings(rankings);

  return (
    <>
      {rows.map((entry, index) => {
        const rank = index + 1;
        const isMe = myRank != null && entry?.rank === myRank;
        const dimmed = isEntering && !isMe;

        return (
          <View
            key={rank}
            style={[
              styles.rankingRow,
              isMe && { backgroundColor: colors.accent },
              index < rows.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.levelDescription + '40',
              },
              dimmed && styles.rowDimmed,
            ]}
          >
            {/* 矢印列: isEntering のときのみ表示。自分の行は点滅矢印、他はスペーサー */}
            {isEntering &&
              (isMe ? (
                <BlinkingArrow color={colors.accentText} />
              ) : (
                <View style={styles.arrowCol} />
              ))}

            <Text
              style={[
                styles.rankingCell,
                styles.colRank,
                isMe ? styles.rankingCellHighlight : { color: colors.levelLabel },
              ]}
            >
              {entry ? String(entry.rank) : '—'}
            </Text>
            <Text
              style={[
                styles.rankingCell,
                styles.colName,
                isMe ? styles.rankingCellHighlight : { color: colors.levelLabel },
              ]}
            >
              {entry ? entry.username : '—'}
            </Text>
            <Text
              style={[
                styles.rankingCell,
                styles.colScore,
                isMe ? styles.rankingCellHighlight : { color: colors.levelLabel },
              ]}
            >
              {entry ? String(entry.correct_count) : '—'}
            </Text>
            <Text
              style={[
                styles.rankingCell,
                styles.colTime,
                isMe ? styles.rankingCellHighlight : { color: colors.levelLabel },
              ]}
            >
              {entry ? formatTime(entry.elapsed_time) : '—'}
            </Text>
          </View>
        );
      })}
    </>
  );
}

// ─── RankingTable (combined) ──────────────────────────────────────────────────

/** ヘッダー・データ行をまとめて描画する従来の合体コンポーネント。RankingScreen 等で利用。 */
export function RankingTable({ rankings, myRank, colors }: RankingTableProps) {
  return (
    <View style={styles.rankingContainer}>
      <RankingTableHeader colors={colors} />
      <RankingTableBody rankings={rankings} myRank={myRank} colors={colors} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  rankingContainer: {
    width: '100%',
    gap: 8,
  },

  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  rankingHeader: {
    borderBottomWidth: 1.5,
    borderRadius: 0,
    paddingBottom: 6,
    marginBottom: 2,
  },
  rankingHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rankingCell: {
    fontSize: 14,
    fontWeight: '500',
  },
  rankingCellHighlight: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rowDimmed: {
    opacity: 0.25,
  },

  // 矢印列（BlinkingArrow / スペーサー共用）
  arrowCol: {
    width: 16,
  },
  arrowText: {
    width: 16,
    fontSize: 10,
    textAlign: 'center',
  },

  // 列幅
  colRank: {
    width: 40,
    textAlign: 'center',
  },
  colName: {
    flex: 1,
    paddingLeft: 8,
  },
  colScore: {
    width: 56,
    textAlign: 'center',
  },
  colTime: {
    width: 72,
    textAlign: 'right',
  },
});
