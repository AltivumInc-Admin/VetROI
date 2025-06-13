#!/bin/bash
# Deploy Lambda with branch parameter fix for O*NET API calls

set -e

echo "🚀 Deploying Lambda with O*NET branch parameter fix..."

cd lambda/recommend

# Create deployment package
echo "📦 Creating deployment package..."
rm -rf package deployment.zip
mkdir package
cp lambda_function.py package/
cp -r src package/
cd package

# Create minimal deployment with updated handler and onet_client
zip -r ../deployment.zip . -x "*.pyc" -x "__pycache__/*"

cd ..

# Update Lambda function
echo "⬆️  Updating Lambda function..."
aws lambda update-function-code \
    --function-name VetROI_Recommend \
    --zip-file fileb://deployment.zip \
    --region us-east-2

# Clean up
rm -rf package deployment.zip

echo "✅ Lambda updated with branch parameter support!"
echo "📝 The O*NET API will now receive the specific military branch for more accurate results."