#!/bin/bash
set -e

echo "=========================================="
echo "Preparing Lambda Deployment Packages"
echo "=========================================="

BACKUP_DIR="/Users/christianperez/Desktop/VetROI-Backup-20250619-090715"
PACKAGES_DIR="$(pwd)"
DEPLOY_BUCKET="vetroi-cloudformation-deploys-20250619"

# List of Lambda functions to package
FUNCTIONS=(
    "VetROI_Recommend"
    "VetROI_DD214_GenerateUploadURL"
    "VetROI_DD214_GetStatus"
    "VetROI_DD214_Processor"
    "VetROI_DD214_Macie"
    "VetROI_DD214_Insights"
    "VetROI_DD214_GetInsights"
    "VetROI_DD214_GetRedacted"
    "VetROI_S3_DD214_Trigger"
)

# Process each function
for func in "${FUNCTIONS[@]}"; do
    echo ""
    echo "Processing $func..."
    
    # Create directory for this function
    mkdir -p "$func"
    
    # Check if backup exists
    if [ -f "$BACKUP_DIR/lambda-functions/code/${func}.zip" ]; then
        # Copy the backup
        cp "$BACKUP_DIR/lambda-functions/code/${func}.zip" "./${func}.zip"
        echo "✅ Packaged $func from backup"
        
        # Upload to S3
        aws s3 cp "${func}.zip" "s3://$DEPLOY_BUCKET/lambda/${func}.zip"
        echo "✅ Uploaded $func to S3"
    else
        echo "⚠️  No backup found for $func"
    fi
done

# Special handling for VetROI_Recommend (use our working version)
echo ""
echo "Updating VetROI_Recommend with current working version..."
if [ -f "/Users/christianperez/Desktop/VetROI/lambda/recommend/working-handler.zip" ]; then
    cp "/Users/christianperez/Desktop/VetROI/lambda/recommend/working-handler.zip" "./VetROI_Recommend.zip"
    aws s3 cp "VetROI_Recommend.zip" "s3://$DEPLOY_BUCKET/lambda/VetROI_Recommend.zip" --region us-east-2
    echo "✅ Updated VetROI_Recommend with working version"
fi

# Upload the Lambda layer
echo ""
echo "Uploading Lambda layer..."
if [ -f "/Users/christianperez/Desktop/VetROI/lambda/layers/common/layer.zip" ]; then
    aws s3 cp "/Users/christianperez/Desktop/VetROI/lambda/layers/common/layer.zip" \
        "s3://$DEPLOY_BUCKET/layers/common-dependencies.zip" --region us-east-2
    echo "✅ Uploaded Lambda layer"
else
    echo "⚠️  Lambda layer not found"
fi

echo ""
echo "=========================================="
echo "Package Summary:"
echo "=========================================="
ls -la *.zip 2>/dev/null | wc -l | xargs echo "Total packages created:"
aws s3 ls "s3://$DEPLOY_BUCKET/lambda/" --region us-east-2 | wc -l | xargs echo "Total packages in S3:"
echo ""
echo "S3 bucket: s3://$DEPLOY_BUCKET/"
echo "Ready for CloudFormation deployment!"