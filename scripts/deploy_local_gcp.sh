#!/usr/bin/env bash
set -euo pipefail

# ローカル gcloud CLI 認証による Cloud Run デプロイスクリプト
# (shrine-stair-trainer)
#
# 使い方:
#   # 環境変数をロードした状態で実行
#   bash scripts/deploy_local_gcp.sh

if [ -f .env ]; then set -a; source .env; set +a; fi

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
REGION="${GCP_REGION:-asia-northeast1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-shrine-stair-trainer}"
ARTIFACT_REPO="${ARTIFACT_REGISTRY_REPOSITORY:-shrine-stair-registry}"
IMAGE_VAR="${IMAGE_NAME:-shrine-stair-trainer}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${IMAGE_VAR}"

ALLOWED_USER_EMAILS="${ALLOWED_USER_EMAILS:?ALLOWED_USER_EMAILS is required}"

# Firebase config is needed at build time for the Vite SPA.
VITE_FIREBASE_API_KEY="${VITE_FIREBASE_API_KEY:?VITE_FIREBASE_API_KEY is required}"
VITE_FIREBASE_AUTH_DOMAIN="${VITE_FIREBASE_AUTH_DOMAIN:?VITE_FIREBASE_AUTH_DOMAIN is required}"
VITE_FIREBASE_PROJECT_ID="${VITE_FIREBASE_PROJECT_ID:?VITE_FIREBASE_PROJECT_ID is required}"
VITE_FIREBASE_APP_ID="${VITE_FIREBASE_APP_ID:?VITE_FIREBASE_APP_ID is required}"

echo "== Cloud Run デプロイ: ${SERVICE_NAME} =="
echo "Project: ${PROJECT_ID} | Region: ${REGION}"

gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

gcloud artifacts repositories describe "${ARTIFACT_REPO}" \
  --project="${PROJECT_ID}" --location="${REGION}" &>/dev/null || \
gcloud artifacts repositories create "${ARTIFACT_REPO}" \
  --project="${PROJECT_ID}" --location="${REGION}" \
  --repository-format=docker \
  --description="Shrine Stair Trainer Docker images"

gcloud builds submit . \
  --project="${PROJECT_ID}" \
  --tag="${IMAGE}:latest" \
  --substitutions="_VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},_VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},_VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},_VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}" \
  --timeout=600s

gcloud run deploy "${SERVICE_NAME}" \
  --set-env-vars "ALLOWED_USER_EMAILS=${ALLOWED_USER_EMAILS}" \
  --image="${IMAGE}:latest" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=1 \
  --quiet

URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region="${REGION}" --project="${PROJECT_ID}" \
  --format='value(status.url)')

echo "== デプロイ完了 =="
echo "Service URL: ${URL}"
