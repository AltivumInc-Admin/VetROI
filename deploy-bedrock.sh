#!/bin/bash

# Deploy VetROI Lambda with Bedrock integration

echo "Deploying VetROI Lambda with Amazon Nova Lite integration..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
LAMBDA_NAME="VetROI_Recommend"
REGION="us-east-2"

# Step 1: Update IAM permissions for Bedrock
echo "Adding Bedrock permissions to Lambda role..."
ROLE_ARN=$(aws lambda get-function --function-name $LAMBDA_NAME --region $REGION --query 'Configuration.Role' --output text)
ROLE_NAME=$(echo $ROLE_ARN | awk -F'/' '{print $NF}')

# Create Bedrock policy
cat > bedrock-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0"
            ]
        }
    ]
}
EOF

# Attach policy to role
aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name VetROI-Bedrock-Policy \
    --policy-document file://bedrock-policy.json \
    --region $REGION

echo -e "${GREEN}✓ Bedrock permissions added${NC}"

# Step 2: Package Lambda function
echo "Packaging Lambda function..."
cp lambda_function_bedrock.py lambda_function.py
zip -j vetroi-lambda.zip lambda_function.py

# Step 3: Update Lambda function code
echo "Updating Lambda function..."
aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://vetroi-lambda.zip \
    --region $REGION \
    --output text > /dev/null

echo -e "${GREEN}✓ Lambda function updated${NC}"

# Step 4: Update Lambda configuration for Bedrock
echo "Updating Lambda configuration..."
aws lambda update-function-configuration \
    --function-name $LAMBDA_NAME \
    --timeout 30 \
    --memory-size 512 \
    --region $REGION \
    --output text > /dev/null

echo -e "${GREEN}✓ Lambda configuration updated${NC}"

# Cleanup
rm -f bedrock-policy.json vetroi-lambda.zip lambda_function.py

echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Test the API endpoint with a veteran profile"
echo "2. Update frontend to support chat interface"
echo "3. Monitor CloudWatch logs for any errors"
echo ""
echo "API Endpoint: https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend"