#!/bin/bash
# Emergency restore script for VetROI

set -e

if [ "$1" != "--force" ]; then
    echo "This will restore Lambda functions from backup."
    echo "Run with --force to proceed."
    exit 1
fi

REGION="us-east-2"

echo "🚨 Emergency Restore Started"

# Restore VetROI_Recommend (most critical)
if [ -f "lambda-functions/code/VetROI_Recommend.zip" ]; then
    echo "Restoring VetROI_Recommend..."
    aws lambda update-function-code \
        --function-name VetROI_Recommend \
        --zip-file fileb://lambda-functions/code/VetROI_Recommend.zip \
        --region $REGION
    
    # Restore configuration
    if [ -f "lambda-functions/configs/VetROI_Recommend-config.json" ]; then
        ENV_VARS=$(jq -r '.Environment.Variables | to_entries | map("\(.key)=\(.value)") | join(",")' lambda-functions/configs/VetROI_Recommend-config.json)
        aws lambda update-function-configuration \
            --function-name VetROI_Recommend \
            --environment "Variables={$ENV_VARS}" \
            --region $REGION
    fi
    
    echo "✅ VetROI_Recommend restored"
fi

echo "Testing API..."
curl -X POST https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend \
    -H "Content-Type: application/json" \
    -d '{"branch":"army","code":"11B","homeState":"CA","relocate":false,"education":"high_school"}' \
    -w "\nStatus: %{http_code}\n"
