#!/bin/bash
set -euo pipefail

# Cloud Run deployment script for shrine-stair-trainer
# Usage:
#   # Make sure to source your environment variables (e.g. from /workspaces/ai-dev-control-plane/.env)
#   bash scripts/deploy-cloudrun.sh

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
REGION="${REGION:-asia-northeast1}"
SERVICE_NAME="shrine-stair-trainer"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# ALLOWED_USER_EMAILS is a runtime environment variable.
ALLOWED_USER_EMAILS="${ALLOWED_USER_EMAILS:?ALLOWED_USER_EMAILS is required}"

# Server-side auth runtime environment variables.
# FIREBASE_API_KEY: server-side Firebase Web API key for Identity Toolkit REST sign-in.
# AUTH_SECRET: secret used to HMAC-sign the server session cookie.
FIREBASE_API_KEY="${FIREBASE_API_KEY:?FIREBASE_API_KEY is required}"
AUTH_SECRET="${AUTH_SECRET:?AUTH_SECRET is required}"

# Firebase config is needed at build time for the Vite SPA.
VITE_FIREBASE_API_KEY="${VITE_FIREBASE_API_KEY:?VITE_FIREBASE_API_KEY is required}"
VITE_FIREBASE_AUTH_DOMAIN="${VITE_FIREBASE_AUTH_DOMAIN:?VITE_FIREBASE_AUTH_DOMAIN is required}"
VITE_FIREBASE_PROJECT_ID="${VITE_FIREBASE_PROJECT_ID:?VITE_FIREBASE_PROJECT_ID is required}"
VITE_FIREBASE_APP_ID="${VITE_FIREBASE_APP_ID:?VITE_FIREBASE_APP_ID is required}"

echo "Building and pushing image: ${IMAGE}"
gcloud builds submit \
  --project="${PROJECT_ID}" \
  --tag="${IMAGE}" \
  --substitutions="_VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},_VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},_VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},_VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}" \
  .

echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --image="${IMAGE}" \
  --platform=managed \
  --region="${REGION}" \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=1 \
  --set-env-vars "ALLOWED_USER_EMAILS=${ALLOWED_USER_EMAILS},FIREBASE_API_KEY=${FIREBASE_API_KEY},AUTH_SECRET=${AUTH_SECRET}"

echo "Done. Service URL:"
gcloud run services describe "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format="value(status.url)"
