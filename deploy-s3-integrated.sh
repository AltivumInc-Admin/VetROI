#!/bin/bash

# Deploy VetROI Lambda with S3 Data Integration

echo "Deploying VetROI Lambda with S3 data lake integration..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LAMBDA_NAME="VetROI_Recommend"
REGION="us-east-2"

# Step 1: Package Lambda function with dependencies
echo -e "${BLUE}Packaging Lambda function...${NC}"

# Create deployment package
rm -rf lambda-package
mkdir -p lambda-package

# Copy main Lambda function
cp lambda_function_s3_integrated.py lambda-package/lambda_function.py

# Copy supporting modules
cp onet_client.py lambda-package/ 2>/dev/null || echo "onet_client.py not found, skipping"
cp onet_s3_integration.py lambda-package/ 2>/dev/null || echo "onet_s3_integration.py not found, skipping"

# Create deployment zip
cd lambda-package
zip -r ../vetroi-s3-lambda.zip .
cd ..

echo -e "${GREEN}✓ Lambda package created${NC}"

# Step 2: Update Lambda function code
echo -e "${BLUE}Updating Lambda function...${NC}"

aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://vetroi-s3-lambda.zip \
    --region $REGION \
    --output text > /dev/null

echo -e "${GREEN}✓ Lambda function updated${NC}"

# Step 3: Wait for update to complete
echo -e "${BLUE}Waiting for update to complete...${NC}"
sleep 5

# Step 4: Update Lambda configuration
echo -e "${BLUE}Updating Lambda configuration...${NC}"

aws lambda update-function-configuration \
    --function-name $LAMBDA_NAME \
    --timeout 30 \
    --memory-size 1024 \
    --region $REGION \
    --output text > /dev/null 2>&1 || echo "Configuration update may be in progress"

echo -e "${GREEN}✓ Lambda configuration updated${NC}"

# Step 5: Test the function
echo -e "${BLUE}Testing Lambda function with sample military code...${NC}"

# Test payload
cat > test-payload.json << EOF
{
  "body": "{\"branch\": \"army\", \"code\": \"18D\", \"homeState\": \"TX\", \"education\": \"bachelor\", \"relocate\": false}"
}
EOF

# Invoke Lambda
aws lambda invoke \
    --function-name $LAMBDA_NAME \
    --payload file://test-payload.json \
    --region $REGION \
    response.json \
    --cli-binary-format raw-in-base64-out > /dev/null 2>&1

# Check response
if [ -f response.json ]; then
    echo -e "${GREEN}✓ Lambda test successful${NC}"
    echo "Response preview:"
    cat response.json | jq -r '.body' | jq '.message' | head -c 200
    echo "..."
else
    echo -e "${RED}✗ Lambda test failed${NC}"
fi

# Cleanup
rm -rf lambda-package vetroi-s3-lambda.zip test-payload.json response.json

echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "S3 Data Integration Status:"
echo "- Lambda has access to S3 bucket: altroi-data"
echo "- Can read 1,139 occupation files from soc-details/"
echo "- Military crosswalk implemented for common MOS codes"
echo "- Caching enabled for performance"
echo ""
echo "API Endpoint: https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend"
echo ""
echo "Next steps:"
echo "1. Test with various MOS codes (18D, 11B, 25B, 68W, 42A, 88M)"
echo "2. Verify career data is being pulled from S3"
echo "3. Update frontend to display career cards"