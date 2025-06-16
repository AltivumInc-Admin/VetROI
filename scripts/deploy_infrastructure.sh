#!/bin/bash
set -e

# VetROI™ AWS Infrastructure Deployment Script
# Account: 205930636302
# Region: us-east-2
# Profile: amplify-cli-user2

echo "🚀 VetROI™ Infrastructure Deployment Starting..."
echo "Account: 205930636302"
echo "Region: us-east-2"
echo "Profile: amplify-cli-user2"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
export AWS_PROFILE=amplify-cli-user2
export AWS_REGION=us-east-2
export ACCOUNT_ID=205930636302
export STACK_NAME=vetroi-production
export SAM_BUCKET=vetroi-sam-deployments-${ACCOUNT_ID}

# Function to check if a command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 succeeded${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Function to check if a resource exists
resource_exists() {
    if [ $? -eq 0 ]; then
        echo -e "${YELLOW}⚠ $1 already exists, skipping...${NC}"
        return 0
    else
        return 1
    fi
}

echo "======================================"
echo "Phase 1: Foundation Setup"
echo "======================================"

# 1.1 Create S3 bucket for SAM deployments
echo "Creating SAM deployment bucket..."
aws s3 ls s3://${SAM_BUCKET} 2>/dev/null
if resource_exists "SAM deployment bucket"; then
    :
else
    aws s3 mb s3://${SAM_BUCKET} --region ${AWS_REGION}
    check_status "SAM deployment bucket creation"
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket ${SAM_BUCKET} \
        --versioning-configuration Status=Enabled
    check_status "Bucket versioning"
fi

# 1.2 Create KMS keys
echo ""
echo "Creating KMS encryption keys..."

# Check if master key exists
MASTER_KEY_ID=$(aws kms list-aliases --query "Aliases[?AliasName=='alias/vetroi-master-key'].TargetKeyId" --output text)
if [ -z "$MASTER_KEY_ID" ] || [ "$MASTER_KEY_ID" == "None" ]; then
    # Create master key
    MASTER_KEY_RESPONSE=$(aws kms create-key \
        --description "VetROI Master Encryption Key" \
        --key-usage ENCRYPT_DECRYPT \
        --origin AWS_KMS \
        --tag TagKey=Application,TagValue=VetROI \
        --tag TagKey=Environment,TagValue=Production)
    
    MASTER_KEY_ID=$(echo $MASTER_KEY_RESPONSE | jq -r '.KeyMetadata.KeyId')
    
    # Create alias
    aws kms create-alias \
        --alias-name alias/vetroi-master-key \
        --target-key-id $MASTER_KEY_ID
    
    check_status "Master KMS key creation"
else
    echo -e "${YELLOW}⚠ Master KMS key already exists${NC}"
fi

# 1.3 Check if CloudTrail exists
echo ""
echo "Checking CloudTrail..."
TRAIL_EXISTS=$(aws cloudtrail describe-trails --trail-name-list VetROI-Audit-Trail --query 'trailList[0].Name' --output text 2>/dev/null)
if [ "$TRAIL_EXISTS" == "VetROI-Audit-Trail" ]; then
    echo -e "${YELLOW}⚠ CloudTrail already exists${NC}"
else
    # Create audit logs bucket first
    AUDIT_BUCKET=vetroi-audit-logs-${ACCOUNT_ID}
    aws s3 ls s3://${AUDIT_BUCKET} 2>/dev/null
    if resource_exists "Audit logs bucket"; then
        :
    else
        aws s3 mb s3://${AUDIT_BUCKET} --region ${AWS_REGION}
        
        # Create bucket policy for CloudTrail
        cat > /tmp/audit-bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AWSCloudTrailAclCheck",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:GetBucketAcl",
            "Resource": "arn:aws:s3:::${AUDIT_BUCKET}"
        },
        {
            "Sid": "AWSCloudTrailWrite",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::${AUDIT_BUCKET}/AWSLogs/${ACCOUNT_ID}/*",
            "Condition": {
                "StringEquals": {
                    "s3:x-amz-acl": "bucket-owner-full-control"
                }
            }
        }
    ]
}
EOF
        aws s3api put-bucket-policy --bucket ${AUDIT_BUCKET} --policy file:///tmp/audit-bucket-policy.json
        check_status "Audit bucket policy"
    fi
    
    # Create CloudTrail
    aws cloudtrail create-trail \
        --name VetROI-Audit-Trail \
        --s3-bucket-name ${AUDIT_BUCKET} \
        --is-multi-region-trail \
        --tag TagKey=Application,TagValue=VetROI
    
    # Start logging
    aws cloudtrail start-logging --name VetROI-Audit-Trail
    check_status "CloudTrail creation"
fi

# 1.4 Enable Amazon Macie
echo ""
echo "Enabling Amazon Macie..."
MACIE_STATUS=$(aws macie2 get-macie-session --query 'status' --output text 2>/dev/null || echo "NOT_ENABLED")
if [ "$MACIE_STATUS" == "ENABLED" ]; then
    echo -e "${YELLOW}⚠ Macie already enabled${NC}"
else
    aws macie2 enable-macie
    check_status "Macie enablement"
fi

# 1.5 Check for required secrets
echo ""
echo "Checking Secrets Manager..."
SECRET_EXISTS=$(aws secretsmanager describe-secret --secret-id VetROI/ONet/ApiCredentials --query 'Name' --output text 2>/dev/null || echo "")
if [ "$SECRET_EXISTS" == "VetROI/ONet/ApiCredentials" ]; then
    echo -e "${YELLOW}⚠ O*NET credentials secret already exists${NC}"
    echo -e "${YELLOW}  Please ensure it contains valid credentials!${NC}"
else
    echo -e "${RED}✗ O*NET credentials not found${NC}"
    echo "Please create the secret with:"
    echo 'aws secretsmanager create-secret \'
    echo '  --name VetROI/ONet/ApiCredentials \'
    echo '  --description "O*NET Web Services credentials" \'
    echo '  --secret-string "{\"username\":\"YOUR_USERNAME\",\"password\":\"YOUR_PASSWORD\"}"'
    echo ""
    read -p "Have you created the O*NET credentials secret? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please create the secret and run this script again."
        exit 1
    fi
fi

echo ""
echo "======================================"
echo "Phase 2: SAM Application Build"
echo "======================================"

# Change to project directory
cd /Users/christianperez/Desktop/VetROI

# Create samconfig.toml if it doesn't exist
if [ ! -f samconfig.toml ]; then
    echo "Creating samconfig.toml..."
    cat > samconfig.toml << EOF
version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "${STACK_NAME}"
s3_bucket = "${SAM_BUCKET}"
s3_prefix = "vetroi"
region = "${AWS_REGION}"
confirm_changeset = true
capabilities = "CAPABILITY_IAM CAPABILITY_AUTO_EXPAND"
parameter_overrides = "BedrockModelId=anthropic.claude-3-5-sonnet-20241022-v2:0"
EOF
    check_status "samconfig.toml creation"
fi

# Build SAM application
echo ""
echo "Building SAM application..."
sam build --use-container
check_status "SAM build"

echo ""
echo "======================================"
echo "Phase 3: Deploy Infrastructure"
echo "======================================"

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query 'Stacks[0].StackName' --output text 2>/dev/null || echo "")
if [ "$STACK_EXISTS" == "${STACK_NAME}" ]; then
    echo "Stack already exists. Deploying updates..."
    sam deploy --no-confirm-changeset
else
    echo "Creating new stack..."
    sam deploy --guided
fi

check_status "SAM deployment"

# Get stack outputs
echo ""
echo "Getting stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs' \
    --output json)

API_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="ApiUrl") | .OutputValue')
TABLE_NAME=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="SessionsTableName") | .OutputValue')
DD214_BUCKET=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="DD214BucketName") | .OutputValue')

echo "API URL: $API_URL"
echo "DynamoDB Table: $TABLE_NAME"
echo "DD214 Bucket: $DD214_BUCKET"

# Save outputs to file
cat > deployment-outputs.json << EOF
{
    "apiUrl": "$API_URL",
    "tableName": "$TABLE_NAME",
    "dd214Bucket": "$DD214_BUCKET",
    "region": "${AWS_REGION}",
    "accountId": "${ACCOUNT_ID}",
    "stackName": "${STACK_NAME}"
}
EOF

echo ""
echo "======================================"
echo "Phase 4: Post-Deployment Configuration"
echo "======================================"

# Update frontend configuration
echo "Updating frontend configuration..."
cat > frontend/.env.production << EOF
VITE_API_URL=$API_URL
EOF
check_status "Frontend configuration"

# Setup Macie custom identifiers
echo ""
echo "Setting up Macie custom identifiers..."
python3 scripts/setup_macie_identifiers.py
check_status "Macie identifiers"

echo ""
echo "======================================"
echo "Deployment Summary"
echo "======================================"
echo -e "${GREEN}✓ Infrastructure deployed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Load O*NET data: aws lambda invoke --function-name VetROI_ONET_Refresh --payload '{}' response.json"
echo "2. Build frontend: cd frontend && npm run build"
echo "3. Deploy frontend to Amplify"
echo "4. Configure custom domain (if desired)"
echo ""
echo "API Endpoint: $API_URL"
echo "CloudFormation Stack: ${STACK_NAME}"
echo ""
echo "Monitor costs at: https://console.aws.amazon.com/cost-management/"
echo "View logs at: https://console.aws.amazon.com/cloudwatch/"
echo ""
echo "🎉 Deployment complete!"