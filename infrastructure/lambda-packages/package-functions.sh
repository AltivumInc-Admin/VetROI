#!/bin/bash
set -e

echo "===========================================" 
echo "Packaging Remaining Lambda Functions"
echo "==========================================="

LAMBDA_DIR="/Users/christianperez/Desktop/VetROI/lambda"
PACKAGES_DIR="/Users/christianperez/Desktop/VetROI/infrastructure/lambda-packages"
DEPLOY_BUCKET="vetroi-cloudformation-deploys-20250619"

# DD214 Upload
echo ""
echo "Processing VetROI_DD214_GenerateUploadURL..."
if [ -f "$LAMBDA_DIR/dd214_upload/lambda_function.py" ]; then
    cd "$LAMBDA_DIR/dd214_upload"
    zip -r "$PACKAGES_DIR/VetROI_DD214_GenerateUploadURL.zip" lambda_function.py
    cd - > /dev/null
    aws s3 cp "$PACKAGES_DIR/VetROI_DD214_GenerateUploadURL.zip" "s3://$DEPLOY_BUCKET/lambda/VetROI_DD214_GenerateUploadURL.zip" --region us-east-2
    echo "✅ Packaged and uploaded VetROI_DD214_GenerateUploadURL"
fi

# DD214 Status
echo ""
echo "Processing VetROI_DD214_GetStatus..."
if [ -f "$LAMBDA_DIR/dd214_status/lambda_function.py" ]; then
    cd "$LAMBDA_DIR/dd214_status"
    zip -r "$PACKAGES_DIR/VetROI_DD214_GetStatus.zip" lambda_function.py
    cd - > /dev/null
    aws s3 cp "$PACKAGES_DIR/VetROI_DD214_GetStatus.zip" "s3://$DEPLOY_BUCKET/lambda/VetROI_DD214_GetStatus.zip" --region us-east-2
    echo "✅ Packaged and uploaded VetROI_DD214_GetStatus"
fi

# DD214 Macie
echo ""
echo "Processing VetROI_DD214_Macie..."
if [ -f "$LAMBDA_DIR/dd214_macie/lambda_function.py" ]; then
    cd "$LAMBDA_DIR/dd214_macie"
    zip -r "$PACKAGES_DIR/VetROI_DD214_Macie.zip" lambda_function.py
    cd - > /dev/null
    aws s3 cp "$PACKAGES_DIR/VetROI_DD214_Macie.zip" "s3://$DEPLOY_BUCKET/lambda/VetROI_DD214_Macie.zip" --region us-east-2
    echo "✅ Packaged and uploaded VetROI_DD214_Macie"
fi

# DD214 Get Insights
echo ""
echo "Processing VetROI_DD214_GetInsights..."
if [ -f "$LAMBDA_DIR/dd214_get_insights/lambda_function.py" ]; then
    cd "$LAMBDA_DIR/dd214_get_insights"
    zip -r "$PACKAGES_DIR/VetROI_DD214_GetInsights.zip" lambda_function.py
    cd - > /dev/null
    aws s3 cp "$PACKAGES_DIR/VetROI_DD214_GetInsights.zip" "s3://$DEPLOY_BUCKET/lambda/VetROI_DD214_GetInsights.zip" --region us-east-2
    echo "✅ Packaged and uploaded VetROI_DD214_GetInsights"
fi

# DD214 Get Redacted
echo ""
echo "Processing VetROI_DD214_GetRedacted..."
if [ -f "$LAMBDA_DIR/dd214_redacted/lambda_function.py" ]; then
    cd "$LAMBDA_DIR/dd214_redacted"
    zip -r "$PACKAGES_DIR/VetROI_DD214_GetRedacted.zip" lambda_function.py
    cd - > /dev/null
    aws s3 cp "$PACKAGES_DIR/VetROI_DD214_GetRedacted.zip" "s3://$DEPLOY_BUCKET/lambda/VetROI_DD214_GetRedacted.zip" --region us-east-2
    echo "✅ Packaged and uploaded VetROI_DD214_GetRedacted"
fi

# S3 Trigger
echo ""
echo "Processing VetROI_S3_DD214_Trigger..."
if [ -f "$LAMBDA_DIR/s3_trigger/lambda_function.py" ]; then
    cd "$LAMBDA_DIR/s3_trigger"
    zip -r "$PACKAGES_DIR/VetROI_S3_DD214_Trigger.zip" lambda_function.py
    cd - > /dev/null
    aws s3 cp "$PACKAGES_DIR/VetROI_S3_DD214_Trigger.zip" "s3://$DEPLOY_BUCKET/lambda/VetROI_S3_DD214_Trigger.zip" --region us-east-2
    echo "✅ Packaged and uploaded VetROI_S3_DD214_Trigger"
fi

# DD214 Insights (uses src/)
echo ""
echo "Processing VetROI_DD214_Insights..."
if [ -d "$LAMBDA_DIR/dd214_insights/src" ]; then
    cd "$LAMBDA_DIR/dd214_insights/src"
    zip -r "$PACKAGES_DIR/VetROI_DD214_Insights.zip" .
    cd - > /dev/null
    aws s3 cp "$PACKAGES_DIR/VetROI_DD214_Insights.zip" "s3://$DEPLOY_BUCKET/lambda/VetROI_DD214_Insights.zip" --region us-east-2
    echo "✅ Packaged and uploaded VetROI_DD214_Insights"
fi

# DD214 Processor (uses src/)
echo ""
echo "Processing VetROI_DD214_Processor..."
if [ -d "$LAMBDA_DIR/dd214_processor/src" ]; then
    cd "$LAMBDA_DIR/dd214_processor/src"
    zip -r "$PACKAGES_DIR/VetROI_DD214_Processor.zip" .
    cd - > /dev/null
    aws s3 cp "$PACKAGES_DIR/VetROI_DD214_Processor.zip" "s3://$DEPLOY_BUCKET/lambda/VetROI_DD214_Processor.zip" --region us-east-2
    echo "✅ Packaged and uploaded VetROI_DD214_Processor"
fi

echo ""
echo "===========================================" 
echo "Package Summary:"
echo "==========================================="
cd "$PACKAGES_DIR"
ls -la *.zip 2>/dev/null | wc -l | xargs echo "Total packages created:"
aws s3 ls "s3://$DEPLOY_BUCKET/lambda/" --region us-east-2 | wc -l | xargs echo "Total packages in S3:"
echo ""
echo "All Lambda functions packaged and uploaded!"