#!/bin/bash

# Simple Lambda deployment for VetROI™

REGION="us-east-2"
FUNCTION_NAME="VetROI_Recommend"

# Create deployment package
echo "Creating deployment package..."
cd lambda/recommend
zip -r ../../recommend.zip .
cd ../..

# Create IAM role for Lambda
echo "Creating IAM role..."
aws iam create-role \
  --role-name VetROI-Lambda-Role \
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
  --role-name VetROI-Lambda-Role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  --region ${REGION}

# Wait for role to be ready
sleep 10

# Create Lambda function
echo "Creating Lambda function..."
aws lambda create-function \
  --function-name ${FUNCTION_NAME} \
  --runtime python3.12 \
  --role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/VetROI-Lambda-Role \
  --handler src.handler.lambda_handler \
  --zip-file fileb://recommend.zip \
  --timeout 30 \
  --memory-size 1024 \
  --region ${REGION}

echo "Lambda function created successfully!"
echo "You can now test it in the AWS Console"