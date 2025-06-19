# VetROI CloudFormation Rollback Plan

## Emergency Procedures

### If Stack Creation/Import Fails

1. **Immediate Actions**
```bash
# Cancel the change set if still pending
aws cloudformation delete-change-set \
  --stack-name vetroi-production-v2 \
  --change-set-name <change-set-name> \
  --region us-east-2

# If stack is in ROLLBACK_FAILED state
aws cloudformation continue-update-rollback \
  --stack-name vetroi-production-v2 \
  --region us-east-2

# Force delete if necessary (preserves imported resources)
aws cloudformation delete-stack \
  --stack-name vetroi-production-v2 \
  --retain-resources SessionsTable DD214ProcessingTable CareerInsightsTable \
  --region us-east-2
```

2. **Verify Resources Are Still Working**
```bash
# Test the API
curl -X POST https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend \
  -H "Content-Type: application/json" \
  -d '{"branch":"army","code":"11B","homeState":"CA","relocate":false,"education":"high_school"}'

# Check Lambda function
aws lambda invoke \
  --function-name VetROI_Recommend \
  --payload '{"test": true}' \
  output.json \
  --region us-east-2
```

### If Lambda Functions Stop Working

1. **Remove Layer and Revert to Embedded Dependencies**
```bash
# Remove layer from function
aws lambda update-function-configuration \
  --function-name VetROI_Recommend \
  --layers [] \
  --region us-east-2

# Deploy function with embedded dependencies
cd /Users/christianperez/Desktop/VetROI/lambda/recommend
zip -r function.zip . -x "*.pyc" "__pycache__/*"
aws lambda update-function-code \
  --function-name VetROI_Recommend \
  --zip-file fileb://function.zip \
  --region us-east-2
```

2. **Emergency Handler Deployment**
```bash
# Deploy the working real_handler.py
aws lambda update-function-code \
  --function-name VetROI_Recommend \
  --zip-file fileb://real_function.zip \
  --region us-east-2
```

### If API Gateway Has Issues

1. **Direct Lambda Invocation Test**
```bash
aws lambda invoke \
  --function-name VetROI_Recommend \
  --cli-binary-format raw-in-base64-out \
  --payload '{"body":"{\"branch\":\"army\",\"code\":\"11B\",\"homeState\":\"CA\",\"relocate\":false,\"education\":\"high_school\"}","requestContext":{"http":{"method":"POST"}}}' \
  response.json
```

2. **Update Integration Manually**
```bash
# Get integration ID
aws apigatewayv2 get-integrations \
  --api-id jg5fae61lj \
  --region us-east-2

# Update integration
aws apigatewayv2 update-integration \
  --api-id jg5fae61lj \
  --integration-id <integration-id> \
  --integration-uri arn:aws:lambda:us-east-2:205930636302:function:VetROI_Recommend \
  --region us-east-2
```

## Backup Strategy

### Before Deployment

1. **Backup Lambda Functions**
```bash
# Create backup directory
mkdir -p ~/vetroi-backups/$(date +%Y%m%d)
cd ~/vetroi-backups/$(date +%Y%m%d)

# Download all function code
for func in VetROI_Recommend VetROI_DD214_GenerateUploadURL VetROI_DD214_GetStatus \
            VetROI_DD214_Processor VetROI_DD214_Macie VetROI_DD214_Insights \
            VetROI_DD214_GetInsights VetROI_DD214_GetRedacted VetROI_S3_DD214_Trigger; do
  aws lambda get-function --function-name $func --query 'Code.Location' --output text | xargs wget -O $func.zip
done

# Save function configurations
for func in VetROI_Recommend VetROI_DD214_GenerateUploadURL VetROI_DD214_GetStatus \
            VetROI_DD214_Processor VetROI_DD214_Macie VetROI_DD214_Insights \
            VetROI_DD214_GetInsights VetROI_DD214_GetRedacted VetROI_S3_DD214_Trigger; do
  aws lambda get-function-configuration --function-name $func > $func-config.json
done
```

2. **Document Current State**
```bash
# Save API Gateway configuration
aws apigatewayv2 get-api --api-id jg5fae61lj > api-gateway-backup.json

# Save DynamoDB table descriptions
for table in VetROI_Sessions VetROI_DD214_Processing VetROI_CareerInsights \
             VetROI_Conversations VetROI_UserDocuments; do
  aws dynamodb describe-table --table-name $table > $table-backup.json
done
```

### Recovery Procedures

1. **Restore Lambda Function**
```bash
# Restore from backup
aws lambda update-function-code \
  --function-name VetROI_Recommend \
  --zip-file fileb://~/vetroi-backups/20250619/VetROI_Recommend.zip \
  --region us-east-2

# Restore configuration
aws lambda update-function-configuration \
  --function-name VetROI_Recommend \
  --cli-input-json file://~/vetroi-backups/20250619/VetROI_Recommend-config.json
```

2. **Direct Resource Management**
```bash
# Update Lambda environment variables directly
aws lambda update-function-configuration \
  --function-name VetROI_Recommend \
  --environment Variables='{
    "TABLE_NAME":"VetROI_Sessions",
    "DATA_BUCKET":"altroi-data",
    "ENABLE_S3_DATA":"true",
    "SOC_PREFIX":"soc-details/",
    "REGION":"us-east-2",
    "BEDROCK_MODEL_ID":"amazon.nova-lite-v1:0"
  }' \
  --region us-east-2
```

## Monitoring During Deployment

1. **Watch CloudFormation Events**
```bash
# In a separate terminal
watch -n 5 'aws cloudformation describe-stack-events \
  --stack-name vetroi-production-v2 \
  --region us-east-2 \
  --query "StackEvents[0:10].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]" \
  --output table'
```

2. **Monitor API Health**
```bash
# Continuous health check
while true; do
  curl -s -o /dev/null -w "%{http_code}" \
    https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend \
    -X OPTIONS
  echo " - $(date)"
  sleep 30
done
```

## Critical Reminders

1. **NEVER delete S3 buckets** - They contain production data
2. **NEVER delete DynamoDB tables** - They contain session and user data
3. **Always test in a separate account/region first** if possible
4. **Keep the frontend URL working** - Users access via https://vetroi.altivum.ai
5. **Document every change** - For audit trail and recovery

## Support Contacts

- AWS Support Case: Open immediately if production is impacted
- CloudFormation Issues: Check CloudTrail for detailed error messages
- Lambda Issues: Check CloudWatch Logs for function errors

Remember: The application can run without CloudFormation. CF is just for management.