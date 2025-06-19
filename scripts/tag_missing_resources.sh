#!/bin/bash

# Tag the MISSING VetROI resources that were found

echo "🏷️  Tagging missing VetROI resources..."

# Missing Lambda functions
MISSING_LAMBDAS=(
    "VetROI_DD214_GenerateUploadURL"
    "VetROI_DD214_GetRedacted"
    "VetROI_DD214_GetStatus"
    "VetROI_S3_DD214_Trigger"
)

echo "📦 Tagging missing Lambda functions..."
for function in "${MISSING_LAMBDAS[@]}"; do
    echo "  → Tagging Lambda function: $function"
    aws lambda tag-resource \
        --resource "arn:aws:lambda:us-east-2:205930636302:function:$function" \
        --tags "Project=VetROI,Environment=Production,CostCenter=DD214Processing,Owner=ChristianPerez,Purpose=VeteranCareerIntelligence"
done

# Tag the correct Step Functions
echo "⚙️  Tagging Step Functions (correct names)..."
aws stepfunctions tag-resource \
    --resource-arn "arn:aws:states:us-east-2:205930636302:stateMachine:VetROI-DD214-Processing" \
    --tags Key=Project,Value=VetROI \
           Key=Environment,Value=Production \
           Key=CostCenter,Value=DD214Processing

aws stepfunctions tag-resource \
    --resource-arn "arn:aws:states:us-east-2:205930636302:stateMachine:VetROI_DATA" \
    --tags Key=Project,Value=VetROI \
           Key=Environment,Value=Production \
           Key=CostCenter,Value=DD214Processing

# Check for the actual S3 bucket names
echo "🪣 Checking S3 buckets..."
aws s3api list-buckets --query "Buckets[?contains(Name, 'vetroi') || contains(Name, 'dd214')].Name" --output json | jq -r '.[]'

echo "✅ Done!"