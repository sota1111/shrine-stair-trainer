#!/bin/bash
set -euo pipefail

# Cloud Run deployment script for shrine-stair-trainer
# Usage:
#   GCP_PROJECT_ID=your-project-id \
#   VITE_AUTH_PASSWORD=your-password \
#   bash scripts/deploy-cloudrun.sh

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
REGION="${REGION:-asia-northeast1}"
SERVICE_NAME="shrine-stair-trainer"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# VITE_AUTH_PASSWORD is a build-time variable baked into the static bundle.
AUTH_PASSWORD="${VITE_AUTH_PASSWORD:?VITE_AUTH_PASSWORD is required}"

echo "Building and pushing image: ${IMAGE}"
gcloud builds submit \
  --project="${PROJECT_ID}" \
  --tag="${IMAGE}" \
  --substitutions="_VITE_AUTH_PASSWORD=${AUTH_PASSWORD}" \
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
  --max-instances=1

echo "Done. Service URL:"
gcloud run services describe "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format="value(status.url)"
