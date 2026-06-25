# mumumu — Justfile
# https://github.com/casey/just

# デフォルト: タスク一覧を表示
default:
    @just --list

# ───────────────────────────────────────────
# 開発サーバー
# ───────────────────────────────────────────

# Expo 開発サーバーを起動
start:
    npx expo start

# キャッシュをクリアして起動
start-clean:
    npx expo start --clear

# iOS シミュレーターで起動（ネイティブビルド＋インストール＋Metro 起動）
ios:
    npx expo run:ios

# Android エミュレーターで起動（ネイティブビルド＋インストール＋Metro 起動）
android:
    npx expo run:android

# Web ブラウザで起動
web:
    npx expo start --web

# ───────────────────────────────────────────
# デバイス登録
# ───────────────────────────────────────────

# デバイス登録 (EAS)
device:
    npx eas-cli device:create

# ───────────────────────────────────────────
# ビルド (EAS Build)
# ───────────────────────────────────────────

# iOS 向け開発ビルド (EAS)
build-ios-dev:
    npx eas-cli build --profile development --platform ios

# Android 向け開発ビルド (EAS)
build-android-dev:
    npx eas-cli build --profile development --platform android

# iOS 向けプレビュービルド (EAS)
build-ios-preview:
    npx eas-cli build --profile preview --platform ios

# Android 向けプレビュービルド (EAS)
build-android-preview:
    npx eas-cli build --profile preview --platform android

# iOS 向けプロダクションビルド (EAS)
build-ios:
    npx eas-cli build --profile production --platform ios

# Android 向けプロダクションビルド (EAS)
build-android:
    npx eas-cli build --profile production --platform android

# ───────────────────────────────────────────
# 型チェック / Lint
# ───────────────────────────────────────────

# TypeScript 型チェック
typecheck:
    npx tsc --noEmit

# Expo の型定義を再生成 (.expo/types)
generate-types:
    npx expo customize tsconfig.json

# ───────────────────────────────────────────
# ESLint
# ───────────────────────────────────────────

# ESLint でコードをチェック
lint:
    npx eslint .

# ESLint で自動修正
lint-fix:
    npx eslint . --fix

# ───────────────────────────────────────────
# Prettier
# ───────────────────────────────────────────

# Prettier でフォーマット (上書き)
format:
    npx prettier --write .

# Prettier でフォーマットのチェックのみ (CI 向け)
format-check:
    npx prettier --check .

# ───────────────────────────────────────────
# セキュリティ (gitleaks)
# ───────────────────────────────────────────

# リポジトリ全体のシークレットスキャン
scan:
    gitleaks detect --config .gitleaks.toml --source . --redact --verbose

# ステージ済みファイルのみスキャン (pre-commit と同じ)
scan-staged:
    gitleaks protect --config .gitleaks.toml --staged --redact --verbose

# ───────────────────────────────────────────
# まとめてチェック (CI 向け)
# ───────────────────────────────────────────

# 型チェック + lint + フォーマット確認 + シークレットスキャン + テストを一括実行
check: typecheck lint format-check scan test

# ───────────────────────────────────────────
# テスト
# ───────────────────────────────────────────

# Jest テストを実行
test:
    npx jest --passWithNoTests

# カバレッジ付きでテスト
test-coverage:
    npx jest --coverage

# ウォッチモードでテスト
test-watch:
    npx jest --watch

# ───────────────────────────────────────────
# EAS Secrets
# ───────────────────────────────────────────

# .env.local の値を EAS 環境変数に同期（EXPO_PUBLIC_* と ADMOB_* を対象）
# 全ビルドプロファイル (production, preview, development) に登録する
sync-secrets:
    #!/usr/bin/env bash
    set -euo pipefail
    ENV_FILE=".env.local"
    if [ ! -f "$ENV_FILE" ]; then
        echo "❌ $ENV_FILE が見つかりません"; exit 1
    fi
    echo "📤 $ENV_FILE → EAS 環境変数に同期します..."
    count=0
    while IFS= read -r line || [ -n "$line" ]; do
        # 空行・コメント行をスキップ
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        key="${line%%=*}"
        value="${line#*=}"
        # EXPO_PUBLIC_* または ADMOB_* のみ対象
        if [[ "$key" == EXPO_PUBLIC_* || "$key" == ADMOB_* ]]; then
            # EXPO_PUBLIC_* はビルド後のバンドルに埋め込まれるため secret 不可
            if [[ "$key" == EXPO_PUBLIC_* ]]; then
                vis="sensitive"
            else
                vis="secret"
            fi
            echo "  → $key ($vis)"
            npx eas-cli env:create \
                --name "$key" \
                --value "$value" \
                --environment production preview development \
                --visibility "$vis" \
                --type string \
                --scope project \
                --force \
                --non-interactive < /dev/null
            count=$((count + 1))
        fi
    done < "$ENV_FILE"
    echo "✅ $count 件の環境変数を同期しました"

# EAS 環境変数の一覧を表示
list-secrets:
    npx eas-cli env:list

# ───────────────────────────────────────────
# 依存関係
# ───────────────────────────────────────────

# npm install
install:
    npm install

# 依存関係のバージョン確認 (expo doctor)
doctor:
    npx expo-doctor

# Expo SDK のアップグレード
upgrade:
    npx expo install --fix

# ───────────────────────────────────────────
# ネイティブ / Prebuild
# ───────────────────────────────────────────

# ネイティブプロジェクトを生成 (ios/ android/ ディレクトリ)
prebuild:
    npx expo prebuild --platform ios

# ネイティブプロジェクトをクリーンして再生成
prebuild-clean:
    npx expo prebuild --clean --platform ios

# ───────────────────────────────────────────
# キャッシュ / クリーン
# ───────────────────────────────────────────

# Metro / Expo キャッシュを削除
clean:
    rm -rf .expo
    npx expo start --clear --non-interactive --exit || true
    @echo "キャッシュをクリアしました"

# node_modules を削除して再インストール
reset:
    rm -rf node_modules
    npm install
