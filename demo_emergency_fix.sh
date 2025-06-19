#!/bin/bash
# Emergency Demo Fix Script
# Run this if ANYTHING breaks before demo

echo "🚨 EMERGENCY DEMO FIX ACTIVATED"

# 1. Create standalone Lambda package with ALL dependencies
echo "📦 Creating self-contained Lambda package..."
cd /Users/christianperez/Desktop/VetROI/lambda/recommend
mkdir -p emergency_deploy
cp -r src/* emergency_deploy/
cd emergency_deploy

# Install ALL dependencies locally
pip install boto3 aws-lambda-powertools pydantic requests -t .

# Create deployment package
zip -r ../emergency_function.zip . -x "*.pyc" "__pycache__/*"

# 2. Deploy directly to Lambda (bypass CloudFormation)
echo "🚀 Deploying to Lambda directly..."
aws lambda update-function-code \
  --function-name VetROI_Recommend \
  --zip-file fileb://../emergency_function.zip \
  --region us-east-2

# 3. Ensure handler is correct
aws lambda update-function-configuration \
  --function-name VetROI_Recommend \
  --handler handler.lambda_handler \
  --region us-east-2

# 4. Test the endpoint
echo "✅ Testing endpoint..."
curl -X OPTIONS https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend

echo "✅ Emergency fix complete!"