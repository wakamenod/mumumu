import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

// ─────────────────────────────────────────────────────
// AdBanner – Anchored Adaptive Banner 広告コンポーネント
//
// 各画面で再利用可能なバナー広告ラッパー。
// 広告読み込みエラー時は何も表示しない（アプリの動作に影響しない）。
// ─────────────────────────────────────────────────────

interface AdBannerProps {
  /** AdMob 広告ユニット ID（config/admob.ts からインポートして渡す） */
  adUnitId: string;
}

export function AdBanner({ adUnitId }: AdBannerProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={(error) => {
          console.warn(`[AdBanner] 広告読み込み失敗 (unitId=${adUnitId}):`, error.message);
          setHasError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
});
