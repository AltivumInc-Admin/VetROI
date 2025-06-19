#!/bin/bash

# VetROI AWS Resource Tagging Script
# Tags all Lambda functions, DynamoDB tables, S3 buckets, and other resources for cost tracking

echo "🏷️  Tagging all VetROI AWS resources for cost tracking..."

# Define common tags
PROJECT_TAG="Project=VetROI"
ENVIRONMENT_TAG="Environment=Production"
COST_CENTER_TAG="CostCenter=DD214Processing"
OWNER_TAG="Owner=ChristianPerez"
PURPOSE_TAG="Purpose=VeteranCareerIntelligence"

# Tag all Lambda functions
echo "📦 Tagging Lambda functions..."

LAMBDA_FUNCTIONS=(
    "VetROI_Recommend"
    "VetROI_DD214_Upload"
    "VetROI_DD214_Parser"
    "VetROI_DD214_Insights"
    "VetROI_DD214_Macie"
    "VetROI_DD214_Status"
    "VetROI_DD214_GetInsights"
    "VetROI_DD214_Processor"
)

for function in "${LAMBDA_FUNCTIONS[@]}"; do
    echo "  → Tagging Lambda function: $function"
    aws lambda tag-resource \
        --resource "arn:aws:lambda:us-east-2:205930636302:function:$function" \
        --tags "$PROJECT_TAG,$ENVIRONMENT_TAG,$COST_CENTER_TAG,$OWNER_TAG,$PURPOSE_TAG" \
        2>/dev/null || echo "    ⚠️  Function $function not found or already tagged"
done

# Tag DynamoDB tables
echo "🗄️  Tagging DynamoDB tables..."

DYNAMODB_TABLES=(
    "VetROI_Sessions"
    "VetROI_DD214_Processing"
    "VetROI_CareerInsights"
    "VetROI-Sessions"
)

for table in "${DYNAMODB_TABLES[@]}"; do
    echo "  → Tagging DynamoDB table: $table"
    aws dynamodb tag-resource \
        --resource-arn "arn:aws:dynamodb:us-east-2:205930636302:table/$table" \
        --tags Key=Project,Value=VetROI \
               Key=Environment,Value=Production \
               Key=CostCenter,Value=DD214Processing \
               Key=Owner,Value=ChristianPerez \
               Key=Purpose,Value=VeteranCareerIntelligence \
        2>/dev/null || echo "    ⚠️  Table $table not found or already tagged"
done

# Tag S3 buckets
echo "🪣 Tagging S3 buckets..."

S3_BUCKETS=(
    "vetroi-dd214-uploads"
    "vetroi-dd214-redacted"
    "altroi-data"
    "vetroi-lambda-artifacts-205930636302"
    "vetroi-sam-deployments-205930636302"
)

for bucket in "${S3_BUCKETS[@]}"; do
    echo "  → Tagging S3 bucket: $bucket"
    aws s3api put-bucket-tagging \
        --bucket "$bucket" \
        --tagging '{
            "TagSet": [
                {"Key": "Project", "Value": "VetROI"},
                {"Key": "Environment", "Value": "Production"},
                {"Key": "CostCenter", "Value": "DD214Processing"},
                {"Key": "Owner", "Value": "ChristianPerez"},
                {"Key": "Purpose", "Value": "VeteranCareerIntelligence"}
            ]
        }' \
        2>/dev/null || echo "    ⚠️  Bucket $bucket not found or already tagged"
done

# Tag API Gateway
echo "🌐 Tagging API Gateway..."

API_ID="jg5fae61lj"
aws apigatewayv2 tag-resource \
    --resource-arn "arn:aws:apigateway:us-east-2::/apis/$API_ID" \
    --tags Project=VetROI,Environment=Production,CostCenter=DD214Processing \
    2>/dev/null || echo "  ⚠️  API Gateway not found or already tagged"

# Tag Step Functions State Machines
echo "⚙️  Tagging Step Functions..."

STATE_MACHINES=(
    "VetROI_DD214_Processing"
    "DD214ProcessingStateMachine"
    "VetROI_DATA"
    "VetROI_ONET_Refresh_prod"
)

for state_machine in "${STATE_MACHINES[@]}"; do
    echo "  → Tagging State Machine: $state_machine"
    aws stepfunctions tag-resource \
        --resource-arn "arn:aws:states:us-east-2:205930636302:stateMachine:$state_machine" \
        --tags Key=Project,Value=VetROI \
               Key=Environment,Value=Production \
               Key=CostCenter,Value=DD214Processing \
               Key=Owner,Value=ChristianPerez \
               Key=Purpose,Value=VeteranCareerIntelligence \
        2>/dev/null || echo "    ⚠️  State Machine $state_machine not found or already tagged"
done

# Tag Cognito User Pool
echo "🔐 Tagging Cognito resources..."

# You'll need to get your user pool ID
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 --query "UserPools[?Name=='VetROI-UserPool'].Id" --output text)
if [ ! -z "$USER_POOL_ID" ]; then
    aws cognito-idp tag-resource \
        --resource-arn "arn:aws:cognito-idp:us-east-2:205930636302:userpool/$USER_POOL_ID" \
        --tags Project=VetROI Environment=Production CostCenter=DD214Processing \
        2>/dev/null || echo "  ⚠️  User Pool already tagged"
fi

# Tag CloudFront Distribution
echo "☁️  Tagging CloudFront distribution..."

DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='VetROI Production'].Id" --output text)
if [ ! -z "$DISTRIBUTION_ID" ]; then
    aws cloudfront tag-resource \
        --resource-arn "arn:aws:cloudfront::205930636302:distribution/$DISTRIBUTION_ID" \
        --tags Items=Key=Project,Value=VetROI Items=Key=Environment,Value=Production \
        2>/dev/null || echo "  ⚠️  CloudFront distribution already tagged"
fi

echo ""
echo "✅ Tagging complete! Resources are now tagged for cost tracking."
echo ""
echo "📊 To view costs by tag, use:"
echo "aws ce get-cost-and-usage \\"
echo "  --time-period Start=$(date -u -d '7 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \\"
echo "  --granularity DAILY \\"
echo "  --metrics UnblendedCost \\"
echo "  --group-by Type=TAG,Key=CostCenter \\"
echo "  --filter file://cost-filter.json"
echo ""
echo "📋 Create cost-filter.json with:"
echo '{"Tags": {"Key": "CostCenter", "Values": ["DD214Processing"]}}'