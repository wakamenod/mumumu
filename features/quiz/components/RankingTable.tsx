import { StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import type { RankingEntry } from '@/features/quiz/api/submitScore';

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
  return `${seconds.toFixed(1)}秒`;
}

// ─── Props ───────────────────────────────────────────────────────────────────

type ColorsType = (typeof Colors)['light'];

export interface RankingTableProps {
  rankings: RankingEntry[];
  /** 自分の順位。指定した場合その行を accent 色でハイライトする。省略時はハイライトなし。 */
  myRank?: number | null;
  colors: ColorsType;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RankingTable({ rankings, myRank, colors }: RankingTableProps) {
  const rows = padRankings(rankings);

  return (
    <View style={styles.rankingContainer}>
      <Text style={[styles.rankingTitle, { color: colors.levelLabel }]}>ランキング</Text>

      {/* ヘッダー行 */}
      <View
        style={[
          styles.rankingRow,
          styles.rankingHeader,
          { borderBottomColor: colors.levelDescription },
        ]}
      >
        <Text
          style={[styles.rankingHeaderCell, styles.colRank, { color: colors.levelDescription }]}
        >
          順位
        </Text>
        <Text
          style={[styles.rankingHeaderCell, styles.colName, { color: colors.levelDescription }]}
        >
          ユーザー名
        </Text>
        <Text
          style={[styles.rankingHeaderCell, styles.colScore, { color: colors.levelDescription }]}
        >
          正解数
        </Text>
        <Text
          style={[styles.rankingHeaderCell, styles.colTime, { color: colors.levelDescription }]}
        >
          経過時間
        </Text>
      </View>

      {/* データ行 */}
      {rows.map((entry, index) => {
        const rank = index + 1;
        const isMe = myRank != null && entry?.rank === myRank;

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
            ]}
          >
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
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  rankingContainer: {
    width: '100%',
    gap: 8,
  },
  rankingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
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
