#!/bin/bash

# Deploy VetROI™ Core Backend - Simplified for Quick Deployment

REGION="us-east-2"
STACK_NAME="vetroi-core"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Deploying VetROI™ Core Backend to AWS Account: ${ACCOUNT_ID}"

# Create S3 bucket for Lambda code
BUCKET_NAME="vetroi-lambda-artifacts-${ACCOUNT_ID}"
aws s3 mb s3://${BUCKET_NAME} --region ${REGION} 2>/dev/null || true

# Create IAM role for Lambda
echo "Creating Lambda execution role..."
aws iam create-role \
  --role-name VetROI-Lambda-ExecutionRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' \
  --region ${REGION} 2>/dev/null || true

# Attach policies
aws iam attach-role-policy \
  --role-name VetROI-Lambda-ExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create custom policy for VetROI
aws iam create-policy \
  --policy-name VetROI-Lambda-Policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        "Resource": "arn:aws:dynamodb:'${REGION}':'${ACCOUNT_ID}':table/VetROI_Sessions*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "bedrock:InvokeModel"
        ],
        "Resource": "arn:aws:bedrock:'${REGION}'::foundation-model/*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue"
        ],
        "Resource": "arn:aws:secretsmanager:'${REGION}':'${ACCOUNT_ID}':secret:VetROI/*"
      }
    ]
  }' \
  --region ${REGION} 2>/dev/null || true

aws iam attach-role-policy \
  --role-name VetROI-Lambda-ExecutionRole \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/VetROI-Lambda-Policy

# Create DynamoDB table
echo "Creating DynamoDB table..."
aws dynamodb create-table \
  --table-name VetROI_Sessions \
  --attribute-definitions \
    AttributeName=session_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=session_id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ${REGION} 2>/dev/null || echo "Table already exists"

# Package Lambda function
echo "Packaging Lambda function..."
cd lambda/recommend
pip install -r requirements.txt -t package/ --platform manylinux2014_x86_64 --only-binary :all:
cp -r src/* package/
cd package
zip -r ../../../vetroi-recommend.zip . > /dev/null
cd ../../..

# Upload to S3
aws s3 cp vetroi-recommend.zip s3://${BUCKET_NAME}/

# Create Lambda function
echo "Creating Lambda function..."
aws lambda create-function \
  --function-name VetROI_Recommend \
  --runtime python3.12 \
  --role arn:aws:iam::${ACCOUNT_ID}:role/VetROI-Lambda-ExecutionRole \
  --handler handler.lambda_handler \
  --code S3Bucket=${BUCKET_NAME},S3Key=vetroi-recommend.zip \
  --timeout 30 \
  --memory-size 1024 \
  --environment Variables="{
    TABLE_NAME=VetROI_Sessions,
    BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229,
    ONET_API_URL=https://services.onetcenter.org/ws,
    ONET_SECRET_NAME=VetROI/ONet/ApiCredentials
  }" \
  --region ${REGION} 2>/dev/null || \
aws lambda update-function-code \
  --function-name VetROI_Recommend \
  --s3-bucket ${BUCKET_NAME} \
  --s3-key vetroi-recommend.zip \
  --region ${REGION}

# Create API Gateway
echo "Creating API Gateway..."
API_ID=$(aws apigatewayv2 create-api \
  --name VetROI-API \
  --protocol-type HTTP \
  --cors-configuration AllowOrigins="*",AllowMethods="*",AllowHeaders="*" \
  --region ${REGION} \
  --query ApiId \
  --output text)

# Create Lambda integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id ${API_ID} \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:VetROI_Recommend \
  --payload-format-version 2.0 \
  --region ${REGION} \
  --query IntegrationId \
  --output text)

# Create route
aws apigatewayv2 create-route \
  --api-id ${API_ID} \
  --route-key 'POST /recommend' \
  --target integrations/${INTEGRATION_ID} \
  --region ${REGION}

# Create deployment
aws apigatewayv2 create-deployment \
  --api-id ${API_ID} \
  --region ${REGION}

# Add Lambda permission for API Gateway
aws lambda add-permission \
  --function-name VetROI_Recommend \
  --statement-id AllowAPIGateway \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
  --region ${REGION} 2>/dev/null || true

# Get API endpoint
API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com"

echo "======================================"
echo "VetROI™ Core Backend Deployed!"
echo "======================================"
echo "API Endpoint: ${API_ENDPOINT}/recommend"
echo ""
echo "Next steps:"
echo "1. Update Amplify environment variable:"
echo "   VITE_API_URL=${API_ENDPOINT}"
echo ""
echo "2. Create O*NET API credentials in Secrets Manager:"
echo "   aws secretsmanager create-secret \\"
echo "     --name VetROI/ONet/ApiCredentials \\"
echo "     --secret-string '{\"username\":\"YOUR_USERNAME\",\"password\":\"YOUR_PASSWORD\"}' \\"
echo "     --region ${REGION}"
echo ""
echo "3. Test the API:"
echo "   curl -X POST ${API_ENDPOINT}/recommend \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"branch\":\"army\",\"code\":\"11B\",\"homeState\":\"TX\",\"relocate\":false,\"education\":\"bachelor\"}'"