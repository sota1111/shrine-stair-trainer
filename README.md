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
# .env を開き VITE_AUTH_PASSWORD に任意のパスワードを設定
npm install
npm run dev
```

ブラウザで http://localhost:5173 にアクセス。

## 認証について
### GCP Secret Manager セットアップ

本番環境（Cloud Run）では機密情報を Secret Manager で管理します。初回デプロイ前に以下のコマンドでシークレットを作成してください。

```bash
# パスワードの作成
echo -n "your-password" | gcloud secrets create shrine-trainer-auth-password --data-file=- --project=YOUR_PROJECT_ID

# Cloud Run サービスアカウントへの権限付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```


個人利用向けのシンプルなパスワード認証を実装しています。

- パスワードは `.env` の `VITE_AUTH_PASSWORD` で設定します
- 認証状態はブラウザの localStorage に保存されます
- ユーザー登録・複数ユーザー管理機能は存在しません
- パスワードはソースコードに含まれません（`.env` ファイルは git 管理外）

## 画面構成

| 画面 | URL | 説明 |
|------|-----|------|
| 記録入力 | /record | トレーニング記録を入力 |
| 履歴一覧 | /history | 過去の記録一覧 |
| グラフ | /charts | タイム・疲労感等の推移グラフ |
| 週間メニュー | /menu | 推奨週間スケジュール |

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

### タイム計測画面 (`/timer`)

スタート・ストップ・リセットができるストップウォッチ機能。

**使い方:**
1. ナビゲーションの「⏱️ 計測」をタップ
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

- ブラウザの localStorage に保存
- 初回起動時はサンプルデータを自動読み込み

## 今後追加したい機能

- スマホ入力最適化
- 天気API連携（現在地の天気を自動取得）
- Google Fit / Apple Health 連携
- GPS不要の手動記録
- タイム計測ボタン
- 月次レポート生成

## GCP デプロイ準備

### 概要

このアプリは React (Vite) のみで構成されており、静的サイトとして GCP にホストできます。

### コンテナ化

Docker を使ってビルド・実行できます:

```bash
docker build -t shrine-stair-trainer .
docker run -p 8080:8080 --env-file .env shrine-stair-trainer
```

### GCP 実行環境

- **推奨**: Cloud Run (コンテナとしてデプロイ)
- ポート: `8080` (Cloud Run のデフォルト)
- 環境変数: `.env.example` を参照し、Cloud Run の環境変数設定または Secret Manager で管理

### 環境変数

| 変数名 | 説明 |
|--------|------|
| VITE_AUTH_PASSWORD | ログイン用パスワード（Secret Manager 推奨） |

### 注意事項

- 実際の `.env` ファイルは Git 管理対象外 (`.gitignore` 設定済み)
- 認証情報は Cloud Run の環境変数設定または Secret Manager で管理してください
- データは localStorage に保存されており、GCP 側のデータ永続化は不要

## Cloud Run へのデプロイ

### 前提条件

- `gcloud auth login` 済み
- GCP プロジェクトで Cloud Build API と Cloud Run API が有効になっていること
  ```bash
  gcloud services enable run.googleapis.com cloudbuild.googleapis.com --project=YOUR_PROJECT_ID
  ```

### デプロイ手順

```bash
GCP_PROJECT_ID=your-project-id \
VITE_AUTH_PASSWORD=your-secret-password \
bash scripts/deploy-cloudrun.sh
```

### 注意事項

- `VITE_AUTH_PASSWORD` はビルド時に静的バンドルへ埋め込まれます（ランタイム環境変数ではありません）
- デプロイのたびに同じパスワードを指定してください
- Cloud Run サービスは `--allow-unauthenticated`（公開アクセス可）で作成されます
