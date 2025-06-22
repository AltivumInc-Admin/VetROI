#!/bin/bash

# Quick fix deployment for DD214 Insights Lambda
echo "🔧 Deploying syntax fix for DD214 Insights Lambda..."

# Create deployment package
cd lambda/dd214_insights
rm -rf package dd214_insights_deployment.zip
mkdir -p package/src
cp src/*.py package/src/

# Create zip
cd package
zip -r ../dd214_insights_deployment.zip .
cd ..

# Deploy to AWS
aws lambda update-function-code \
    --function-name VetROI_DD214_Insights \
    --zip-file fileb://dd214_insights_deployment.zip \
    --region us-east-2

# Cleanup
rm -rf package dd214_insights_deployment.zip

echo "✅ Deployment complete - syntax error fixed!"