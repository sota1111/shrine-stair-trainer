# 神社階段トレーニング記録アプリ

## アプリ概要

保育園送迎後に実施する神社の階段約70段ダッシュを記録・可視化するWebアプリ。
「30秒間に発揮できる身体能力の最大化」を目的とする。

## 対象トレーニング

- 神社の階段 約70段
- トレーニング時間: 約5分
- 実施タイミング: 保育園送迎後

## 起動方法

```bash
cp .env.example .env
# .env に Firebase の設定値を記述
npm install
npm run dev
```

ブラウザで http://localhost:5173 にアクセス。

## 構成とセキュリティ (Updated SOT-743)

案1（サーバサイド Firebase REST 認証 + 自前サーバセッション）へ移行しました。ブラウザは Firebase と直接通信しません。

1. **サーバサイド認証**: ブラウザは自前のメール/パスワードフォームから資格情報をサーバ (`POST /api/auth/login`) に送信します。サーバが Firebase Identity Toolkit REST (`accounts:signInWithPassword`) を **サーバ側の `FIREBASE_API_KEY`** で呼び出して照合します。Firebase Client SDK ログイン（`signInWithEmailAndPassword`）と `Authorization: Bearer` 方式は撤去されました。
2. **サーバセッション (署名Cookie)**: 認証成功時、`AUTH_SECRET` で HMAC 署名した HttpOnly Cookie（本番は Secure、SameSite=Lax）を発行します。Cookie には Firebase uid を埋め込み、各保護API/ページはこの Cookie を検証してアクセス制御します（`req.uid` をユーザ単位の Firestore スコープに使用）。`ALLOWED_USER_EMAILS` に含まれるメールアドレスのみ許可します。
3. **CSRF / パスワード保護**: 状態変更API（POST/PUT/PATCH/DELETE）に同一オリジン (Origin/Referer) チェックを適用。パスワードや Identity Toolkit の生レスポンスはログ出力しません。
4. **API 経由のデータアクセス**: ブラウザから Firestore への直接アクセスは廃止し、すべてのデータ操作はサーバー API を経由します。
5. **統合配信**: 単一の Node サーバーが静的 SPA (`dist/`) の配信と API エンドポイントの提供を同居して行います。

## 環境構築

### 必要な環境変数 (.env)

`.env.example` を参考に `.env` を作成し、以下の値を設定してください。

```env
# Firebase Client SDK 用 (Vite ビルド時に使用)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...

# Backend Server 用 (実行時に使用)
ALLOWED_USER_EMAILS=user@example.com,another@example.com
PORT=8080
# サーバ側でメール/パスワード照合に使う Firebase Web API key（ブラウザには渡さない）
# FIREBASE_WEB_API_KEY を優先し、未設定時は FIREBASE_API_KEY にフォールバックする
FIREBASE_WEB_API_KEY=...
FIREBASE_API_KEY=...
# サーバセッションCookieの署名に使うランダムなシークレット
AUTH_SECRET=...
```

### ローカル実行

1. 依存関係のインストール:
   ```bash
   npm install
   ```
2. フロントエンドのビルド:
   ```bash
   npm run build
   ```
3. サーバーの起動:
   ```bash
   # Google Cloud の Application Default Credentials (ADC) が必要です
   npm start
   ```

## デプロイ

### GitHub Actions による自動デプロイ (Cloud Run)

`main` への push（および `workflow_dispatch` による手動実行）で、
`.github/workflows/deploy-cloudrun.yml` が GCP Cloud Run へ自動デプロイします。

- 認証は Workload Identity Federation を使用します（JSONキーは不使用）。
- フロー: Docker build → Artifact Registry push → `gcloud run deploy`。
- Vite ビルド時に Firebase 設定が必要なため、build 時に `VITE_FIREBASE_*` を `--build-arg` で渡します。

#### 必要な GitHub Secrets

| Secret | 説明 |
|--------|------|
| `GCP_PROJECT_ID` | GCP プロジェクト ID |
| `GCP_REGION` | デプロイ先リージョン（例: `asia-northeast1`） |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity Provider のリソース名 |
| `GCP_SERVICE_ACCOUNT` | デプロイに使用するサービスアカウント |
| `ARTIFACT_REGISTRY_REPOSITORY` | Artifact Registry のリポジトリ名 |
| `CLOUD_RUN_SERVICE` | Cloud Run サービス名（= `shrine-stair-trainer`） |
| `VITE_FIREBASE_API_KEY` | Firebase Client SDK API Key（ビルド時） |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain（ビルド時） |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID（ビルド時） |
| `VITE_FIREBASE_APP_ID` | Firebase App ID（ビルド時） |

### 手動デプロイ

ローカルから手動でデプロイする場合は、以下のスクリプトを使用します。

```bash
# 事前に必要な環境変数をロードした状態で実行してください
bash scripts/deploy-cloudrun.sh
```

デプロイ時には `ALLOWED_USER_EMAILS` が Cloud Run のランタイム環境変数として設定されます。
以前使用していた `VITE_AUTH_PASSWORD` は廃止されました。

サーバ側のメール/パスワード照合に使う Firebase Web API key は、ランタイム環境変数
`FIREBASE_WEB_API_KEY`（優先）または `FIREBASE_API_KEY`（フォールバック）で渡します。
本番 Cloud Run では Secret Manager 管理の Secret を `--set-secrets` で注入してください
（`AUTH_SECRET` / `ALLOWED_USER_EMAILS` も同様）。


## 画面構成

| 画面 | URL | 説明 |
|------|-----|------|
| ホーム | /home | 今日の状態・クイックアクション・サマリーダッシュボード |
| 記録入力 | /record | トレーニング記録を入力（ストップウォッチによるタイム計測を内蔵。`/timer` は `/record` にリダイレクト） |
| 履歴一覧 | /history | 過去の記録一覧（フィルタ機能あり） |
| グラフ | /charts | メニュー別 最速タイム推移・平均タイム・疲労感等の推移グラフ |
| サマリ | /summary | サマリ・継続日数・目標設定 |
| 週間メニュー | /menu | 推奨週間スケジュール・雨天時代替メニュー |

### スマホ向けナビゲーション

- **PC幅**: 画面上部のヘッダーナビを使用
- **スマホ幅 (≤600px)**: 画面下部にタブナビゲーションを表示
  - 🏠 今日 / 📝 記録 / 📋 履歴 / 📊 グラフ / 📈 サマリ / 📅 メニュー
  - ページコンテンツはボトムナビの上に表示されるよう余白が自動調整される

## 記録項目

| 項目 | 説明 |
|------|------|
| 実施日 | トレーニング日 |
| 曜日 | 自動計算（変更可） |
| 天気 | sunny / cloudy / rainy / light-rain |
| 路面状態 | dry / wet / rainy / slippery |
| 種目 | 70段ダッシュ / 一段ずつ / 一段飛ばし / 二段飛ばし / 軽め / 屋内ジャンプ / 休養 |
| 本数・タイム | 各セットのタイム（秒） |
| 主観的強度 | 1〜10 |
| 疲労感 | 1〜10 |
| 痛みの有無 | あり / なし |
| メモ | 自由記述 |

## 雨天時の制御仕様

天気が `rainy` / `light-rain` または路面状態が `wet` / `rainy` / `slippery` の場合:

- **一段飛ばし** および **二段飛ばし** は推奨しない
- 警告バナーを表示
- 代替推奨メニュー: 一段ずつ、軽め、屋内ジャンプ、休養
- 週間メニュー画面でも、雨天・路面不良を選択すると高リスク種目（一段飛ばし・二段飛ばし）が代替メニューへ自動切替され、理由が表示される

## スマホ最適化・タイム計測機能

### スマホ入力最適化

- 記録入力画面のボタン・フォームをタップしやすいサイズに最適化
- 天気・路面状態・種目をワンタップで選択できるクイック選択ボタン
- 主観的強度・疲労感をスライダーで直感的に入力
- 痛みの有無をトグルボタンで切り替え

### ホーム画面 (`/home`)

ログイン後のデフォルト画面。以下を表示する:
- 今日の推奨メニューへのリンク
- クイックアクションボタン（計測開始・記録入力・履歴を見る）
- ダッシュボードサマリー（今週/今月の実施回数、直近ベストタイム、前回タイム、疲労感平均、痛みあり記録数、継続日数）

### 履歴フィルタ

履歴一覧画面では以下のフィルタが使用できる:
- **すべて**: 全記録表示
- **痛みあり**: 痛みが記録された記録のみ
- **雨天のみ**: 雨天条件の記録のみ
- **種目フィルタ**: 種目別に絞り込み

また、各履歴カードに「🤕 痛みあり」「🌧️ 雨天実施」バッジが表示される。

### タイム計測（記録入力画面 `/record` 内蔵）

記録入力画面に統合されたストップウォッチ機能（スタート・ストップ・リセット）。`/timer` にアクセスすると `/record` にリダイレクトされる。

**使い方:**
1. ナビゲーションの「📝 記録」をタップ
2. 天気・路面・種目を選択
3. **START** ボタンをタップして計測開始
4. **STOP** ボタンをタップして1本目を記録
5. 次の本を計測する場合は **START** を再度タップ
6. 計測が終わったら **記録として保存** をタップ
7. RPE・疲労感・痛みを入力して **保存する** をタップ
8. 履歴画面に記録が反映される

**注意:**
- 雨天・路面不良時は一段飛ばし・二段飛ばしに警告が表示される
- リセット・破棄時は確認ダイアログが表示される

### 計測結果の記録フロー

```
計測（タイム計測画面）
  → 複数本のタイムを連続記録
  → 記録として保存をタップ
  → RPE / 疲労感 / 痛みを入力
  → 保存 → 履歴画面へ
```

### 既存データとの互換性

- 既存の `localStorage` データ（`shrine-stair-trainer-records` キー）はそのまま読み込まれる
- データ構造変更なし（`TrainingRecord` / `ExerciseEntry` / `SetRecord` 型は変わらない）
- 既存の記録も履歴・グラフに正常に表示される

## データ保存

- Firebase Firestore に保存・同期
- ログイン中のユーザーごとに `users/{uid}/records/{recordId}` 構造で保存されます
- 複数デバイス間でのデータ同期に対応
- 初回ログイン時、既存の `localStorage` データ（非サンプルデータ）は Firestore へ自動移行されます

## 今後追加したい機能

- 天気API連携（現在地の天気を自動取得）
- Google Fit / Apple Health 連携
- 月次レポート生成

### 注意事項

- 実際の `.env` ファイルは Git 管理対象外 (`.gitignore` 設定済み)
- 認証情報は Firebase Authentication で管理されます
- データは Firestore に保存されます
