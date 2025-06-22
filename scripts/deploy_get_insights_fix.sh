#!/bin/bash

# Fix DD214 GetInsights Lambda Decimal serialization issue
echo "🔧 Deploying Decimal serialization fix for GetInsights Lambda..."

cd lambda/dd214_get_insights

# Create deployment package
zip -r dd214_get_insights_deployment.zip lambda_function.py

# Deploy to AWS
aws lambda update-function-code \
    --function-name VetROI_DD214_GetInsights \
    --zip-file fileb://dd214_get_insights_deployment.zip \
    --region us-east-2

# Cleanup
rm dd214_get_insights_deployment.zip

echo "✅ Deployment complete - Decimal serialization fixed!"