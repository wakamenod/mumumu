import { Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';

// ─── 定数 ────────────────────────────────────────────────────────────────────

const USERNAME_LENGTH = 5;

/**
 * 3行10列のボタン配列定義。
 *
 * 行1: A–J
 * 行2: K–T
 * 行3: U–Z, -, ←(backspace), END(2列分)
 */
const ROWS: readonly (readonly string[])[] = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y', 'Z', '-', '←', 'END'],
] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

type ColorsType = (typeof Colors)['light'];

export interface InitialsEntryFormProps {
  /** 現在の入力文字列（最大5文字）。親コンポーネントが管理する。 */
  value: string;
  /** 文字ボタン（A–Z, -）が押されたとき */
  onPressLetter: (char: string) => void;
  /** ← ボタンが押されたとき */
  onBackspace: () => void;
  /** END ボタンが押されたとき（value が5文字のときのみ呼ばれる） */
  onEnd: () => void;
  colors: ColorsType;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InitialsEntryForm({
  value,
  onPressLetter,
  onBackspace,
  onEnd,
  colors,
}: InitialsEntryFormProps) {
  const isFull = value.length >= USERNAME_LENGTH;
  const isEmpty = value.length === 0;

  return (
    <View style={styles.container}>
      {/* タイトル */}
      <Text style={[styles.title, { color: colors.levelLabel }]}>ENTER YOUR INITIALS</Text>

      {/* ボタングリッド */}
      <View style={styles.grid}>
        {ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map((key) => {
              if (key === 'END') {
                // END ボタン：2列分の幅、5文字入力済みのときのみ活性
                return (
                  <Pressable
                    key="END"
                    onPress={onEnd}
                    disabled={!isFull}
                    style={({ pressed }) => [
                      styles.keyButton,
                      styles.endButton,
                      {
                        backgroundColor: isFull ? colors.accent : colors.cardBorder,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    accessibilityLabel="入力完了"
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.keyText,
                        styles.endText,
                        { color: isFull ? colors.accentText : colors.levelDescription },
                      ]}
                    >
                      END
                    </Text>
                  </Pressable>
                );
              }

              if (key === '←') {
                // バックスペースボタン：入力が0文字のときは無効
                return (
                  <Pressable
                    key="←"
                    onPress={onBackspace}
                    disabled={isEmpty}
                    style={({ pressed }) => [
                      styles.keyButton,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.cardBorder,
                        opacity: isEmpty ? 0.35 : pressed ? 0.6 : 1,
                      },
                    ]}
                    accessibilityLabel="1文字削除"
                    accessibilityRole="button"
                  >
                    <Text style={[styles.keyText, { color: colors.levelLabel }]}>←</Text>
                  </Pressable>
                );
              }

              // 通常の文字ボタン（A–Z, -）：5文字入力済みのときは無効
              return (
                <Pressable
                  key={key}
                  onPress={() => onPressLetter(key)}
                  disabled={isFull}
                  style={({ pressed }) => [
                    styles.keyButton,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                      opacity: isFull ? 0.35 : pressed ? 0.6 : 1,
                    },
                  ]}
                  accessibilityLabel={key}
                  accessibilityRole="button"
                >
                  <Text style={[styles.keyText, { color: colors.levelLabel }]}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
  },

  // タイトル
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },

  // グリッド
  grid: {
    width: '100%',
    gap: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },

  // 通常キーボタン
  keyButton: {
    // 10列に収まるよう flex: 1 ではなく固定幅。
    // 画面幅は最低 320pt を想定。水平 padding 24*2=48 を除くと 272pt。
    // gap 4 * 9 = 36 を引くと 236。236 / 10 = 23.6 → 23pt
    width: 28,
    height: 36,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // END ボタン（2列分 = 28*2 + gap4 = 60）
  endButton: {
    width: 60,
    borderWidth: 0,
  },
  endText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
