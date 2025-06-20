#!/bin/bash

# Deploy Enhanced DD214 Insights Lambda
# This script updates the DD214 insights Lambda with the enhanced prompts

echo "Deploying Enhanced DD214 Insights Lambda..."

# Set variables
LAMBDA_NAME="VetROI_DD214_Insights"
SOURCE_DIR="../lambda/dd214_insights/src"
ZIP_FILE="dd214_insights_enhanced.zip"

# Navigate to source directory
cd $SOURCE_DIR

# Create deployment package
echo "Creating deployment package..."
zip -r $ZIP_FILE lambda_function.py enhanced_prompts.py

# Update Lambda function
echo "Updating Lambda function..."
aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://$ZIP_FILE \
    --region us-east-2

# Clean up
rm $ZIP_FILE

echo "Deployment complete!"
echo ""
echo "The DD214 Insights Lambda now includes:"
echo "- Enhanced prompts (2000+ words)"
echo "- 8000 token limit"
echo "- Market intelligence with specific companies"
echo "- Risk assessment modules"
echo "- Legacy narrative builder"
echo "- Future-proof career paths"
echo "- Entrepreneurial opportunities"
echo ""
echo "Veterans will now receive $130K+ career intelligence instead of basic $70K recommendations!"