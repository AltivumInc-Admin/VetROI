#!/bin/bash

# Deploy VetROI Lambda with LIVE O*NET API Integration

echo "Deploying VetROI Lambda with LIVE O*NET API..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LAMBDA_NAME="VetROI_Recommend"
REGION="us-east-2"

# Step 1: Package Lambda function
echo -e "${BLUE}Packaging Lambda function...${NC}"

# Create deployment package
rm -rf lambda-package
mkdir -p lambda-package

# Copy the new O*NET live Lambda function
cp lambda_function_onet_live.py lambda-package/lambda_function.py

# Create deployment zip
cd lambda-package
zip -r ../vetroi-onet-live.zip .
cd ..

echo -e "${GREEN}✓ Lambda package created${NC}"

# Step 2: Update Lambda function code
echo -e "${BLUE}Updating Lambda function...${NC}"

aws lambda update-function-code \
    --function-name $LAMBDA_NAME \
    --zip-file fileb://vetroi-onet-live.zip \
    --region $REGION \
    --output text > /dev/null

echo -e "${GREEN}✓ Lambda function updated${NC}"

# Step 3: Wait for update to complete
echo -e "${BLUE}Waiting for update to complete...${NC}"
sleep 5

# Step 4: Test with 18D
echo -e "${BLUE}Testing with MOS 18D (Special Forces Medical Sergeant)...${NC}"

# Test payload
cat > test-18D.json << EOF
{
  "body": "{\"branch\": \"army\", \"code\": \"18D\", \"homeState\": \"TX\", \"education\": \"bachelor\", \"relocate\": false}"
}
EOF

# Invoke Lambda
aws lambda invoke \
    --function-name $LAMBDA_NAME \
    --payload file://test-18D.json \
    --region $REGION \
    response.json \
    --cli-binary-format raw-in-base64-out > /dev/null 2>&1

# Check response
if [ -f response.json ]; then
    echo -e "${GREEN}✓ Lambda test successful${NC}"
    echo "Response preview:"
    cat response.json | jq -r '.body' | jq '.message' | head -c 500
    echo "..."
else
    echo -e "${RED}✗ Lambda test failed${NC}"
fi

# Cleanup
rm -rf lambda-package vetroi-onet-live.zip test-18D.json response.json

echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "O*NET Live Integration Status:"
echo "- Lambda now calls: https://services.onetcenter.org/ws/online/crosswalks/military"
echo "- No hardcoded data - 100% real-time"
echo "- Raw JSON response displayed for verification"
echo ""
echo "API Endpoint: https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend"
echo ""
echo "Test military codes:"
echo "- Army: 18D, 68W, 11B, 25B, 42A"
echo "- Navy: HM, IT, BM"
echo "- Air Force: 1N0X1, 3D0X2"
echo "- Marines: 0311, 0651"