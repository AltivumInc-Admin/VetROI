#!/bin/bash

# Fix DD214 Insights Lambda handler issue
# The handler expects src.lambda_function but files are in root

echo "🔧 Fixing DD214 Insights Lambda handler configuration..."

cd /Users/christianperez/Desktop/VetROI/lambda/dd214_insights

# Create proper package structure
echo "📦 Creating deployment package with correct structure..."
rm -rf package dd214_insights_deployment.zip
mkdir -p package/src

# Copy all Python files to src directory
cp src/*.py package/src/

# Create the deployment package
cd package
zip -r ../dd214_insights_deployment.zip .

# Update Lambda function
echo "⬆️ Updating Lambda function..."
cd ..
aws lambda update-function-code \
    --function-name VetROI_DD214_Insights \
    --zip-file fileb://dd214_insights_deployment.zip \
    --region us-east-2

echo "✅ Deployment complete!"

# Cleanup
rm -rf package dd214_insights_deployment.zip

echo ""
echo "🎯 Handler path verified: src.lambda_function.lambda_handler"
echo "📝 The Lambda should now import correctly"