#!/bin/bash

# Fix Legacy Report and AI Prompts deployment
# This ensures enhanced_prompts_v2.py is included in the Lambda package

echo "🚀 Deploying DD214 Insights Lambda with Legacy Report features..."

cd /Users/christianperez/Desktop/VetROI/lambda/dd214_insights

# Create deployment package
echo "📦 Creating deployment package..."
cd src
zip -r ../dd214_insights_deployment.zip .

# Update Lambda function
echo "⬆️ Updating Lambda function..."
aws lambda update-function-code \
    --function-name VetROI_DD214_Insights \
    --zip-file fileb://../dd214_insights_deployment.zip \
    --region us-east-2

echo "✅ Deployment complete!"
echo ""
echo "🔍 Verifying deployment..."
aws lambda get-function-configuration \
    --function-name VetROI_DD214_Insights \
    --region us-east-2 \
    --query 'LastModified'

# Cleanup
rm ../dd214_insights_deployment.zip

echo ""
echo "📝 Next steps:"
echo "1. Upload a DD214 to test"
echo "2. Check if Legacy Report and AI Prompts tabs show content"
echo "3. If still not working, check CloudWatch logs for import errors"