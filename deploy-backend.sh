#!/bin/bash

# Deploy VetROI Backend Infrastructure

STACK_NAME="vetroi-prod"
REGION="us-east-2"
S3_BUCKET="vetroi-sam-artifacts-$(aws sts get-caller-identity --query Account --output text)"

echo "Creating S3 bucket for SAM artifacts..."
aws s3 mb s3://${S3_BUCKET} --region ${REGION} 2>/dev/null || true

echo "Deploying SAM stack..."
sam deploy \
  --stack-name ${STACK_NAME} \
  --s3-bucket ${S3_BUCKET} \
  --capabilities CAPABILITY_IAM \
  --region ${REGION} \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    BedrockModelId="anthropic.claude-3-sonnet-20240229" \
    ONetApiUrl="https://services.onetcenter.org/ws"

echo "Getting API Gateway URL..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

echo "API Gateway URL: ${API_URL}"
echo "Export this for frontend deployment:"
echo "export VITE_API_URL=${API_URL}"