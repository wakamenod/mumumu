/**
 * RankingTable.test.tsx — Unit tests for features/quiz/components/RankingTable.tsx
 *
 * テスト方針:
 *   - RankingTable コンポーネントの表示・スタイルを検証する。
 *   - padRankings / formatTime ヘルパー関数の単体テストも含む。
 *   - myRank の有無によるハイライト動作（ResultScreen.test.tsx と同じ StyleSheet 検証手法）。
 *   - Firebase への依存がないため jest.mock は不要。
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import {
  RankingTable,
  RankingTableHeader,
  RankingTableBody,
  padRankings,
  formatTime,
} from '@/features/quiz/components/RankingTable';
import type { RankingEntry } from '@/features/quiz/api/submitScore';
import Colors from '@/constants/Colors';

// ─── テスト用ダミーデータ ─────────────────────────────────────

const COLORS = Colors.light;

const MOCK_3_RANKINGS: RankingEntry[] = [
  { rank: 1, username: 'Alice', correct_count: 20, elapsed_time: 30.1 },
  { rank: 2, username: 'Bob', correct_count: 19, elapsed_time: 45.0 },
  { rank: 3, username: '-----', correct_count: 18, elapsed_time: 52.4 },
];

const MOCK_20_RANKINGS: RankingEntry[] = Array.from({ length: 20 }, (_, i) => ({
  rank: i + 1,
  username: `User${i + 1}`,
  correct_count: 20 - i,
  elapsed_time: 30.0 + i * 5,
}));

// ─── テストスイート ──────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
describe('formatTime', () => {
  it('整数秒（30）を「30.0秒」に変換する', () => {
    expect(formatTime(30)).toBe('30.0秒');
  });

  it('小数点1桁秒（35.2）を「35.2秒」に変換する', () => {
    expect(formatTime(35.2)).toBe('35.2秒');
  });

  it('0 を「0.0秒」に変換する', () => {
    expect(formatTime(0)).toBe('0.0秒');
  });

  it('小数点2桁以上（52.45）は1桁に丸めて「52.5秒」に変換する', () => {
    expect(formatTime(52.45)).toBe('52.5秒');
  });
});

// ──────────────────────────────────────────────────────────────
describe('padRankings', () => {
  it('3件の入力を20件にパディングする', () => {
    const result = padRankings(MOCK_3_RANKINGS);
    expect(result).toHaveLength(20);
  });

  it('先頭3件は元のエントリ、残り17件は null になる', () => {
    const result = padRankings(MOCK_3_RANKINGS);
    expect(result[0]).toEqual(MOCK_3_RANKINGS[0]);
    expect(result[2]).toEqual(MOCK_3_RANKINGS[2]);
    expect(result[3]).toBeNull();
    expect(result[19]).toBeNull();
  });

  it('20件の入力は変化せずそのまま20件を返す', () => {
    const result = padRankings(MOCK_20_RANKINGS);
    expect(result).toHaveLength(20);
    result.forEach((entry, i) => {
      expect(entry).toEqual(MOCK_20_RANKINGS[i]);
    });
  });

  it('空配列は20件の null 配列になる', () => {
    const result = padRankings([]);
    expect(result).toHaveLength(20);
    result.forEach((entry) => expect(entry).toBeNull());
  });
});

// ──────────────────────────────────────────────────────────────
describe('RankingTable', () => {
  // ──────────────────────────────────────────────────────────
  describe('ヘッダー行', () => {
    it('「順位」列ヘッダーが表示される', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} colors={COLORS} />);
      expect(screen.getByText('順位')).toBeTruthy();
    });

    it('「ユーザー名」列ヘッダーが表示される', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} colors={COLORS} />);
      expect(screen.getByText('ユーザー名')).toBeTruthy();
    });

    it('「正解数」列ヘッダーが表示される', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} colors={COLORS} />);
      expect(screen.getByText('正解数')).toBeTruthy();
    });

    it('「経過時間」列ヘッダーが表示される', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} colors={COLORS} />);
      expect(screen.getByText('経過時間')).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('データ行（ランキング3件）', () => {
    it('ユーザー名が表示される', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} colors={COLORS} />);
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
      expect(screen.getByText('-----')).toBeTruthy();
    });

    it('正解数が表示される', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} colors={COLORS} />);
      expect(screen.getByText('20')).toBeTruthy();
      expect(screen.getByText('19')).toBeTruthy();
      expect(screen.getByText('18')).toBeTruthy();
    });

    it('経過時間が「XX.X秒」形式で表示される', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} colors={COLORS} />);
      expect(screen.getByText('30.1秒')).toBeTruthy();
      expect(screen.getByText('45.0秒')).toBeTruthy();
      expect(screen.getByText('52.4秒')).toBeTruthy();
    });

    it('3件のとき残り17行が「—」で埋まる（順位・名前・正解数・経過時間 = 17×4 = 68個）', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} colors={COLORS} />);
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBe(17 * 4);
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('データ行（ランキング20件フル）', () => {
    it('「—」が一切表示されない', async () => {
      await render(<RankingTable rankings={MOCK_20_RANKINGS} colors={COLORS} />);
      expect(screen.queryAllByText('—')).toHaveLength(0);
    });

    it('先頭と末尾のユーザー名が表示される', async () => {
      await render(<RankingTable rankings={MOCK_20_RANKINGS} colors={COLORS} />);
      expect(screen.getByText('User1')).toBeTruthy();
      expect(screen.getByText('User20')).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('空配列', () => {
    it('20行すべてが「—」で表示される（20行 × 4列 = 80個）', async () => {
      await render(<RankingTable rankings={[]} colors={COLORS} />);
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBe(20 * 4);
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('myRank — ハイライト', () => {
    it('myRank を指定した行のテキストが白色（#FFFFFF）になる', async () => {
      // rank: 3 の行（username: '-----'）がハイライト対象
      await render(<RankingTable rankings={MOCK_3_RANKINGS} myRank={3} colors={COLORS} />);

      const myUsernameEl = screen.getByText('-----');
      const flatStyle = StyleSheet.flatten(myUsernameEl.props.style);
      expect(flatStyle.color).toBe('#FFFFFF');
    });

    it('myRank を指定しても他の行は白色にならない', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} myRank={3} colors={COLORS} />);

      const aliceEl = screen.getByText('Alice');
      const flatStyle = StyleSheet.flatten(aliceEl.props.style);
      expect(flatStyle.color).not.toBe('#FFFFFF');
    });

    it('myRank を省略した場合（undefined）は全行ハイライトなし', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} colors={COLORS} />);

      // 全ユーザー名テキストが白色でないことを確認
      for (const name of ['Alice', 'Bob', '-----']) {
        const el = screen.getByText(name);
        const flatStyle = StyleSheet.flatten(el.props.style);
        expect(flatStyle.color).not.toBe('#FFFFFF');
      }
    });

    it('myRank=null の場合は全行ハイライトなし', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} myRank={null} colors={COLORS} />);

      for (const name of ['Alice', 'Bob', '-----']) {
        const el = screen.getByText(name);
        const flatStyle = StyleSheet.flatten(el.props.style);
        expect(flatStyle.color).not.toBe('#FFFFFF');
      }
    });

    it('myRank=1 のとき rank:1 の行（Alice）がハイライトされる', async () => {
      await render(<RankingTable rankings={MOCK_3_RANKINGS} myRank={1} colors={COLORS} />);

      const aliceEl = screen.getByText('Alice');
      const flatStyle = StyleSheet.flatten(aliceEl.props.style);
      expect(flatStyle.color).toBe('#FFFFFF');
    });
  });
});

// ──────────────────────────────────────────────────────────────
describe('RankingTableHeader', () => {
  describe('showArrowColumn 未指定（デフォルト: false）', () => {
    it('ヘッダー列ラベルが 4 つすべて表示される', async () => {
      await render(<RankingTableHeader colors={COLORS} />);
      expect(screen.getByText('順位')).toBeTruthy();
      expect(screen.getByText('ユーザー名')).toBeTruthy();
      expect(screen.getByText('正解数')).toBeTruthy();
      expect(screen.getByText('経過時間')).toBeTruthy();
    });
  });

  describe('showArrowColumn={true}', () => {
    it('ヘッダー列ラベルが 4 つすべて表示される', async () => {
      await render(<RankingTableHeader colors={COLORS} showArrowColumn />);
      expect(screen.getByText('順位')).toBeTruthy();
      expect(screen.getByText('ユーザー名')).toBeTruthy();
      expect(screen.getByText('正解数')).toBeTruthy();
      expect(screen.getByText('経過時間')).toBeTruthy();
    });

    it('showArrowColumn={false} と同じヘッダーラベルが表示される', async () => {
      // showArrowColumn はスペーサーの有無のみに影響し、ラベル表示には影響しない
      await render(<RankingTableHeader colors={COLORS} showArrowColumn />);
      const labels = ['順位', 'ユーザー名', '正解数', '経過時間'];
      for (const label of labels) {
        expect(screen.getByText(label)).toBeTruthy();
      }
    });
  });
});

// ──────────────────────────────────────────────────────────────
describe('RankingTableBody', () => {
  // ──────────────────────────────────────────────────────────
  describe('isEntering 未指定（デフォルト: false）', () => {
    it('ユーザー名が表示される', async () => {
      await render(<RankingTableBody rankings={MOCK_3_RANKINGS} colors={COLORS} />);
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
    });

    it('点滅矢印「▶」が表示されない', async () => {
      await render(<RankingTableBody rankings={MOCK_3_RANKINGS} myRank={3} colors={COLORS} />);
      expect(screen.queryByText('▶')).toBeNull();
    });

    it('他の行に opacity: 0.25 の dimmed スタイルが適用されない', async () => {
      await render(<RankingTableBody rankings={MOCK_3_RANKINGS} myRank={3} colors={COLORS} />);
      // Alice の行（非ハイライト行）が dimmed でないことを確認
      const aliceEl = screen.getByText('Alice');
      const rowEl = aliceEl.parent;
      const flatStyle = StyleSheet.flatten(rowEl?.props.style);
      expect(flatStyle?.opacity).not.toBe(0.25);
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('isEntering={true}', () => {
    it('自分の行（myRank 一致）に点滅矢印「▶」が表示される', async () => {
      await render(
        <RankingTableBody rankings={MOCK_3_RANKINGS} myRank={3} colors={COLORS} isEntering />
      );
      expect(screen.getByText('▶')).toBeTruthy();
    });

    it('自分以外の行に opacity: 0.25 の dimmed スタイルが適用される', async () => {
      await render(
        <RankingTableBody rankings={MOCK_3_RANKINGS} myRank={3} colors={COLORS} isEntering />
      );
      // Alice（rank: 1）の行は自分ではないので dimmed になる
      const aliceEl = screen.getByText('Alice');
      const rowEl = aliceEl.parent;
      const flatStyle = StyleSheet.flatten(rowEl?.props.style);
      expect(flatStyle?.opacity).toBe(0.25);
    });

    it('自分の行（myRank 一致）には dimmed スタイルが適用されない', async () => {
      await render(
        <RankingTableBody rankings={MOCK_3_RANKINGS} myRank={3} colors={COLORS} isEntering />
      );
      // rank: 3 の行（username: '-----'）は自分の行なので dimmed にならない
      const myUsernameEl = screen.getByText('-----');
      const rowEl = myUsernameEl.parent;
      const flatStyle = StyleSheet.flatten(rowEl?.props.style);
      expect(flatStyle?.opacity).not.toBe(0.25);
    });

    it('isEntering=true でも myRank 未指定なら矢印「▶」が表示されない', async () => {
      await render(<RankingTableBody rankings={MOCK_3_RANKINGS} colors={COLORS} isEntering />);
      // myRank が指定されていないので isMe = false → 矢印なし
      expect(screen.queryByText('▶')).toBeNull();
    });

    it('isEntering=true でも myRank 未指定なら全行が dimmed になる', async () => {
      await render(<RankingTableBody rankings={MOCK_3_RANKINGS} colors={COLORS} isEntering />);
      // myRank なし: isMe は常に false → 全行 dimmed
      const aliceEl = screen.getByText('Alice');
      const rowEl = aliceEl.parent;
      const flatStyle = StyleSheet.flatten(rowEl?.props.style);
      expect(flatStyle?.opacity).toBe(0.25);
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('myRank — ハイライト（RankingTableBody 単体）', () => {
    it('myRank を指定した行のテキストが白色（#FFFFFF）になる', async () => {
      await render(<RankingTableBody rankings={MOCK_3_RANKINGS} myRank={1} colors={COLORS} />);
      const aliceEl = screen.getByText('Alice');
      const flatStyle = StyleSheet.flatten(aliceEl.props.style);
      expect(flatStyle.color).toBe('#FFFFFF');
    });

    it('myRank を指定しても他の行は白色にならない', async () => {
      await render(<RankingTableBody rankings={MOCK_3_RANKINGS} myRank={1} colors={COLORS} />);
      const bobEl = screen.getByText('Bob');
      const flatStyle = StyleSheet.flatten(bobEl.props.style);
      expect(flatStyle.color).not.toBe('#FFFFFF');
    });
  });
});
