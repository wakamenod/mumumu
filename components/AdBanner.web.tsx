// Web では広告を表示しない（react-native-google-mobile-ads は Web 非対応）

interface AdBannerProps {
  adUnitId: string;
}

export function AdBanner(_props: AdBannerProps) {
  return null;
}
