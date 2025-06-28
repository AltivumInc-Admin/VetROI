#\!/bin/bash

API_ID="4bw6u7f3uc"
REGION="us-east-2"

# Get resource ID
RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='/usajobs-search'].id" --output text)

echo "Configuring CORS for resource: $RESOURCE_ID"

# Add OPTIONS method response
aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Headers": true,
    "method.response.header.Access-Control-Allow-Methods": true,
    "method.response.header.Access-Control-Allow-Origin": true
  }' \
  --region $REGION

# Add integration response for OPTIONS
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Headers": "'\'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\'",
    "method.response.header.Access-Control-Allow-Methods": "'\'GET,OPTIONS,POST\'",
    "method.response.header.Access-Control-Allow-Origin": "'\'*\'"
  }' \
  --region $REGION

# Add POST method response
aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": true
  }' \
  --region $REGION

# Deploy the changes
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION

echo "CORS configuration complete\!"
