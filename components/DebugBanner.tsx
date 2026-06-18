import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * デバッグビルド時のみ画面上部に黄色いバナーを表示するコンポーネント。
 * 本番ビルドでは null を返すため、バンドルサイズ・パフォーマンスへの影響はない。
 *
 * React Native の `__DEV__` は Metro Bundler がビルド時に置換するグローバル変数で、
 * - 開発ビルド (metro / Expo Go / debug APK): true
 * - 本番ビルド (EAS Build production / release APK): false
 */
export default function DebugBanner() {
  // 本番ビルドでは何も描画しない
  if (!__DEV__) return null;

  return <DebugBannerInner />;
}

/** __DEV__ が true の場合のみレンダーされる内部コンポーネント */
function DebugBannerInner() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.banner,
        // ノッチ・ダイナミックアイランドの下に帯を置く
        { paddingTop: insets.top > 0 ? insets.top : 8 },
      ]}
      pointerEvents="none" // タッチイベントを素通りさせてUI操作を妨げない
    >
      <Text style={styles.text}>🚧 DEBUG BUILD</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#F5A623',
    paddingBottom: 6,
    alignItems: 'center',
    // iOS の影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // Android の影
    elevation: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1.2,
  },
});
