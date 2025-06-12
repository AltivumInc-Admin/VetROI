#!/bin/bash

# VetROI™ Phase 1: Core API Deployment
# Lightweight, fast deployment focusing on core functionality

set -e

REGION="us-east-2"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
FUNCTION_NAME="VetROI_Recommend"
BUCKET_NAME="vetroi-lambda-artifacts-${ACCOUNT_ID}"

echo "🚀 Starting VetROI™ Phase 1 Deployment..."
echo "Account: ${ACCOUNT_ID} | Region: ${REGION}"

# Step 1: Create minimal Lambda package
echo "📦 Creating minimal Lambda package..."
cd lambda/recommend

# Create a minimal requirements file for faster install
cat > requirements-minimal.txt << EOF
boto3==1.34.0
requests==2.32.3
pydantic==2.5.0
EOF

# Create package directory
rm -rf package
mkdir -p package

# Install minimal dependencies
pip install -r requirements-minimal.txt -t package/ --no-deps --quiet

# Copy source code
cp -r src/* package/
cd package

# Remove unnecessary files to reduce size
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true

# Create deployment package
zip -r ../../../vetroi-recommend-minimal.zip . -q
cd ../../..

echo "✅ Package created (size: $(du -h vetroi-recommend-minimal.zip | cut -f1))"

# Step 2: Upload to S3
echo "☁️  Uploading to S3..."
aws s3 cp vetroi-recommend-minimal.zip s3://${BUCKET_NAME}/ --region ${REGION}

# Step 3: Create/Update Lambda function
echo "⚡ Deploying Lambda function..."
if aws lambda get-function --function-name ${FUNCTION_NAME} --region ${REGION} 2>/dev/null; then
    echo "Updating existing function..."
    aws lambda update-function-code \
        --function-name ${FUNCTION_NAME} \
        --s3-bucket ${BUCKET_NAME} \
        --s3-key vetroi-recommend-minimal.zip \
        --region ${REGION} > /dev/null
else
    echo "Creating new function..."
    aws lambda create-function \
        --function-name ${FUNCTION_NAME} \
        --runtime python3.12 \
        --role arn:aws:iam::${ACCOUNT_ID}:role/VetROI-Lambda-ExecutionRole \
        --handler handler.lambda_handler \
        --code S3Bucket=${BUCKET_NAME},S3Key=vetroi-recommend-minimal.zip \
        --timeout 30 \
        --memory-size 512 \
        --environment Variables="{
            TABLE_NAME=VetROI_Sessions,
            BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229,
            ONET_API_URL=https://services.onetcenter.org/ws
        }" \
        --region ${REGION} > /dev/null
fi

# Wait for function to be active
aws lambda wait function-active --function-name ${FUNCTION_NAME} --region ${REGION}
echo "✅ Lambda function ready"

# Step 4: Create HTTP API Gateway
echo "🌐 Setting up API Gateway..."
API_ID=$(aws apigatewayv2 create-api \
    --name "VetROI-API" \
    --protocol-type HTTP \
    --cors-configuration '{"AllowOrigins":["*"],"AllowMethods":["*"],"AllowHeaders":["*"],"MaxAge":300}' \
    --region ${REGION} \
    --query ApiId \
    --output text 2>/dev/null || \
    aws apigatewayv2 get-apis --region ${REGION} --query "Items[?Name=='VetROI-API'].ApiId" --output text | head -1)

# Create Lambda integration
echo "🔗 Creating Lambda integration..."
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id ${API_ID} \
    --integration-type AWS_PROXY \
    --integration-uri arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME} \
    --payload-format-version 2.0 \
    --region ${REGION} \
    --query IntegrationId \
    --output text 2>/dev/null || \
    aws apigatewayv2 get-integrations --api-id ${API_ID} --region ${REGION} --query "Items[0].IntegrationId" --output text)

# Create route
echo "🛣️  Creating API route..."
aws apigatewayv2 create-route \
    --api-id ${API_ID} \
    --route-key 'POST /recommend' \
    --target integrations/${INTEGRATION_ID} \
    --region ${REGION} > /dev/null 2>&1 || true

# Create auto-deployment stage
echo "🚀 Creating deployment stage..."
aws apigatewayv2 create-stage \
    --api-id ${API_ID} \
    --stage-name prod \
    --auto-deploy \
    --region ${REGION} > /dev/null 2>&1 || true

# Add Lambda permission
aws lambda add-permission \
    --function-name ${FUNCTION_NAME} \
    --statement-id AllowAPIGateway \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
    --region ${REGION} > /dev/null 2>&1 || true

# Get API endpoint
API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com"

# Step 5: Test the API
echo "🧪 Testing API endpoint..."
TEST_RESPONSE=$(curl -s -X POST ${API_ENDPOINT}/recommend \
    -H 'Content-Type: application/json' \
    -d '{"branch":"army","code":"11B","homeState":"TX","relocate":false,"education":"bachelor"}' \
    -w "\nHTTP_STATUS:%{http_code}" || echo "HTTP_STATUS:000")

HTTP_STATUS=$(echo "$TEST_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)

echo ""
echo "======================================"
echo "🎉 VetROI™ Phase 1 Deployment Complete!"
echo "======================================"
echo ""
echo "📊 Deployment Summary:"
echo "  • Lambda Function: ${FUNCTION_NAME}"
echo "  • API Endpoint: ${API_ENDPOINT}/recommend"
echo "  • API Status: ${HTTP_STATUS}"
echo ""
echo "🔧 Next Steps:"
echo "1. Update Amplify environment variable:"
echo "   Key: VITE_API_URL"
echo "   Value: ${API_ENDPOINT}"
echo ""
echo "2. Create O*NET credentials (optional):"
echo "   aws secretsmanager create-secret \\"
echo "     --name VetROI/ONet/ApiCredentials \\"
echo "     --secret-string '{\"username\":\"YOUR_USERNAME\",\"password\":\"YOUR_PASSWORD\"}'"
echo ""
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ API is responding successfully!"
else
    echo "⚠️  API returned status: ${HTTP_STATUS}"
    echo "   Check CloudWatch logs for details"
fi

# Cleanup
rm -f vetroi-recommend-minimal.zip
rm -f lambda/recommend/requirements-minimal.txt