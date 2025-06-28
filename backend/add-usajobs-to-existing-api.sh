#\!/bin/bash

# Variables
FUNCTION_NAME="vetROI-usajobs-search"
REGION="us-east-2"
ACCOUNT_ID="205930636302"
API_ID="yrugnz2sl7"  # Your existing API Gateway

echo "Getting root resource ID..."
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region $REGION \
  --query "items[?path=='/'].id" \
  --output text)

# Create or get /usajobs-search resource
RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region $REGION \
  --query "items[?path=='/usajobs-search'].id" \
  --output text)

if [ -z "$RESOURCE_ID" ]; then
  echo "Creating /usajobs-search resource..."
  RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part usajobs-search \
    --region $REGION \
    --query 'id' \
    --output text)
fi

echo "Creating POST method..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE \
  --region $REGION 2>/dev/null || echo "POST method already exists"

echo "Creating OPTIONS method for CORS..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION 2>/dev/null || echo "OPTIONS method already exists"

echo "Setting up Lambda integration..."
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME/invocations \
  --region $REGION

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME/invocations \
  --region $REGION

echo "Adding Lambda permission for API Gateway..."
aws lambda add-permission \
  --function-name $FUNCTION_NAME \
  --statement-id apigateway-existing-post \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/usajobs-search" \
  --region $REGION 2>/dev/null || echo "Permission already exists"

aws lambda add-permission \
  --function-name $FUNCTION_NAME \
  --statement-id apigateway-existing-options \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/OPTIONS/usajobs-search" \
  --region $REGION 2>/dev/null || echo "Permission already exists"

echo "Deploying API..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION

echo "Done\! Endpoint added to existing API: https://$API_ID.execute-api.$REGION.amazonaws.com/prod/usajobs-search"
