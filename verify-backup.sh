#!/bin/bash
# Verify backup completeness

echo "Backup Verification Report"
echo "========================="

# Count Lambda backups
LAMBDA_CONFIGS=$(ls -1 lambda-functions/configs/*.json 2>/dev/null | wc -l)
LAMBDA_CODE=$(ls -1 lambda-functions/code/*.zip 2>/dev/null | wc -l)
echo "Lambda Functions: $LAMBDA_CONFIGS configs, $LAMBDA_CODE code packages"

# Count DynamoDB backups
DYNAMODB_COUNT=$(ls -1 dynamodb-schemas/*.json 2>/dev/null | wc -l)
echo "DynamoDB Tables: $DYNAMODB_COUNT schemas"

# Check API Gateway
if [ -f "api-gateway/http-api-config.json" ]; then
    echo "API Gateway: ✅ HTTP API backed up"
else
    echo "API Gateway: ❌ HTTP API backup missing"
fi

# Count S3 policies
S3_COUNT=$(ls -1 s3-policies/*-versioning.json 2>/dev/null | wc -l)
echo "S3 Buckets: $S3_COUNT configurations"

# Check critical files
echo ""
echo "Critical Components:"
[ -f "lambda-functions/configs/VetROI_Recommend-config.json" ] && echo "  ✅ VetROI_Recommend" || echo "  ❌ VetROI_Recommend"
[ -f "dynamodb-schemas/VetROI_Sessions.json" ] && echo "  ✅ VetROI_Sessions table" || echo "  ❌ VetROI_Sessions table"
[ -f "api-gateway/http-api-routes.json" ] && echo "  ✅ API routes" || echo "  ❌ API routes"

echo ""
echo "Backup location: $(pwd)"
echo "Backup completed at: $(date)"
