import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import Colors from '@/constants/Colors';

// ─── Screen ──────────────────────────────────────────────────────────────────
// スタブ実装。今後ここに正解数・経過時間・ランキング登録フォームを実装する。

export default function ResultScreen() {
  const { correct, total } = useLocalSearchParams<{ correct: string; total: string }>();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const correctNum = Number(correct ?? 0);
  const totalNum = Number(total ?? 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <Text style={[styles.title, { color: colors.levelLabel }]}>結果</Text>
      <Text style={[styles.score, { color: colors.accent }]}>
        {correctNum} / {totalNum}
      </Text>
      <Text style={[styles.subText, { color: colors.levelDescription }]}>
        ※ この画面は現在スタブ実装です
      </Text>

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
  subText: {
    fontSize: 13,
  },
  button: {
    marginTop: 16,
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
