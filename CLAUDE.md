@AGENTS.md

## Firebase + App Check セットアップ手順

### アーキテクチャ

- Firebase SDK: `@react-native-firebase`（ネイティブ SDK）
- App Check プロバイダー
  - 本番 iOS: **App Attest**（Apple のデバイス証明）
  - 本番 Android: **Play Integrity**（Google のデバイス証明）
  - 開発時: デバッグトークン（UUID）
- Cloud Functions: `@react-native-firebase/functions`
- Firebase 設定値（apiKey 等）は環境変数ではなく **plist / json ファイル** で管理

---

### 1. Firebase 設定ファイルの配置

Firebase Console からダウンロードしてプロジェクトルートに配置する。

| ファイル                   | 取得場所                                                            |
| -------------------------- | ------------------------------------------------------------------- |
| `GoogleService-Info.plist` | Firebase Console > プロジェクト設定 > iOS アプリ > ダウンロード     |
| `google-services.json`     | Firebase Console > プロジェクト設定 > Android アプリ > ダウンロード |

⚠️ どちらも秘密情報を含むため **`.gitignore` に追加すること**（下記参照）。

```
# .gitignore に追加
GoogleService-Info.plist
google-services.json
```

EAS Build では「シークレットファイル」として登録する（下記）。

---

### 2. App Check デバッグトークンの発行

ローカル・開発ビルドで App Check を通過するために Firebase Console でトークンを発行する。

```
Firebase Console > App Check > アプリ（iOS / Android）> デバッグトークンを管理 > トークンを追加
```

発行した UUID を `.env.local` に設定する：

```env
EXPO_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

### 3. EAS Build の設定（本番ビルド前）

設定ファイルとデバッグトークンを EAS のシークレットとして登録する。

```bash
# plist / json をファイル型シークレットとして登録
# app.json で "$GOOGLE_SERVICES_IOS" / "$GOOGLE_SERVICES_ANDROID" として参照される
eas secret:create --scope project --name GOOGLE_SERVICES_IOS --type file --value ./GoogleService-Info.plist
eas secret:create --scope project --name GOOGLE_SERVICES_ANDROID --type file --value ./google-services.json

# デバッグトークン（preview / development ビルド用）
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN --value "UUID"

# 確認
eas secret:list
```

---

### 4. App Check Enforcement の有効化（本番リリース前）

```
Firebase Console > App Check > Cloud Functions > 適用
```

⚠️ **有効化するとデバッグトークンのない本番ビルドはすべて 403 でブロックされる。**
必ず本番ビルドで動作確認してから有効化すること。

---

### 5. ビルド手順

```bash
# 開発ビルド（初回 or ネイティブ変更時）
eas build --profile development --platform ios

# 本番ビルド
eas build --profile production --platform ios
```

開発ビルド後は Expo Go ではなく **development build** を端末にインストールして
`npx expo start --dev-client` で起動する。
