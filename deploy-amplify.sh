#!/bin/bash

# Deploy VetROI Frontend with AWS Amplify

REGION="us-east-2"
APP_NAME="vetroi-frontend"
GITHUB_REPO="https://github.com/AltivumInc-Admin/VetROI"
BRANCH="main"

echo "Creating Amplify App..."
APP_ID=$(aws amplify create-app \
  --name ${APP_NAME} \
  --region ${REGION} \
  --repository ${GITHUB_REPO} \
  --access-token ${GITHUB_ACCESS_TOKEN} \
  --build-spec "$(cat <<EOF
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
EOF
)" \
  --environment-variables VITE_API_URL=${VITE_API_URL} \
  --query appId \
  --output text)

echo "Created Amplify App: ${APP_ID}"

# Create branch
echo "Creating branch..."
aws amplify create-branch \
  --app-id ${APP_ID} \
  --branch-name ${BRANCH} \
  --region ${REGION}

# Start deployment
echo "Starting deployment..."
JOB_ID=$(aws amplify start-deployment \
  --app-id ${APP_ID} \
  --branch-name ${BRANCH} \
  --region ${REGION} \
  --query jobSummary.jobId \
  --output text)

echo "Deployment started with Job ID: ${JOB_ID}"

# Get app URL
APP_URL="https://${BRANCH}.${APP_ID}.amplifyapp.com"
echo "App will be available at: ${APP_URL}"