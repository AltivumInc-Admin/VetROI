#!/bin/bash

# Deploy Extended Summary Update for DD214 Insights Lambda
# This adds the new extended_summary section to veteran insights

echo "Deploying Extended Summary Update..."

# Set variables
LAMBDA_NAME="VetROI_DD214_Insights"
SOURCE_DIR="../lambda/dd214_insights/src"
ZIP_FILE="dd214_insights_extended_summary.zip"

# Navigate to lambda directory (parent of src)
cd "$(dirname "$0")/../lambda/dd214_insights"

# Create deployment package preserving src directory structure
echo "Creating deployment package..."
zip -r $ZIP_FILE src/lambda_function.py src/enhanced_prompts_original.py src/enhanced_prompts_v2.py src/enhanced_prompts.py

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
echo "- New 'extended_summary' section with 5-paragraph veteran portrait"
echo "- Focus on strengths and positive labor market impact"
echo "- Added to required sections list for data validation"
echo ""
echo "Veterans will now see a comprehensive summary of their unique value!"