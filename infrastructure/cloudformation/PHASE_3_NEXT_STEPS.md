# VetROI CloudFormation Migration - Phase 3 Next Steps

## Current Status
- ✅ Phase 1 & 2 completed (Lambda layer and test function deployed)
- ✅ Phase 3 detailed plan created
- ✅ API Gateway CloudFormation template ready
- 🎯 Ready to deploy and test new API

## Immediate Next Steps

### 1. Deploy API Gateway Stack (Phase 3.1)
```bash
cd /Users/christianperez/Desktop/VetROI/infrastructure/cloudformation
chmod +x deploy-phase3-1-api.sh
./deploy-phase3-1-api.sh
```

This will:
- Create a new HTTP API with all routes
- Connect to the CloudFormation-managed Lambda function
- Set up CORS configuration
- Provide test endpoint URL

### 2. Test API Endpoints
```bash
chmod +x test-api-endpoints.sh
./test-api-endpoints.sh <your-test-api-endpoint>
```

Compare production vs test responses for:
- /recommend
- /career/{socCode}
- /dd214/* endpoints
- /sentra/conversation

### 3. Complete Lambda Integrations

Currently, all routes point to the Recommend Lambda. You need to:

a) **Deploy remaining Lambda functions to CloudFormation**
   - Add DD214 Lambda functions to the Lambda stack
   - Create proper integrations for each route

b) **Update the API Gateway template** with correct integrations:
   ```yaml
   DD214UploadIntegration:
     Type: AWS::ApiGatewayV2::Integration
     Properties:
       IntegrationUri: <DD214_GenerateUploadURL Lambda ARN>
   ```

### 4. Create Step Functions Templates (Phase 3.2)

Export current Step Function definitions:
```bash
# Export DD214 Processing
aws stepfunctions describe-state-machine \
  --state-machine-arn arn:aws:states:us-east-2:205930636302:stateMachine:VetROI-DD214-Processing \
  --query 'definition' --output text > dd214-statemachine.json

# Export Data Pipeline
aws stepfunctions describe-state-machine \
  --state-machine-arn arn:aws:states:us-east-2:205930636302:stateMachine:VetROI_DATA \
  --query 'definition' --output text > data-statemachine.json
```

### 5. Set Up S3 Event Notifications (Phase 3.3)

Create S3 notification configuration for DD214 uploads:
```yaml
DD214BucketNotification:
  Type: Custom::S3BucketNotification
  Properties:
    ServiceToken: !GetAtt S3NotificationFunction.Arn
    BucketName: vetroi-dd214-documents
    NotificationConfiguration:
      LambdaConfigurations:
        - Event: s3:ObjectCreated:*
          Function: !GetAtt S3TriggerLambda.Arn
```

## Decision Points

### 1. Migration Strategy
Choose one:
- **A) Blue-Green**: Run both APIs in parallel, switch frontend
- **B) Gradual**: Migrate one endpoint at a time
- **C) Big Bang**: Full cutover during maintenance window

### 2. Resource Naming
- Keep existing names (import resources)
- Use new names with `-CF` suffix (parallel deployment)
- Replace after testing

### 3. Frontend Update Strategy
- Environment variable for API endpoint
- Feature flag for gradual rollout
- Hard cutover with new deployment

## Risk Mitigation Checklist

- [ ] Backup all current Lambda function code
- [ ] Document current API Gateway configuration
- [ ] Create rollback scripts
- [ ] Set up monitoring for new resources
- [ ] Test each endpoint thoroughly
- [ ] Have communication plan for users

## Timeline Estimate

- **Today**: Deploy and test API Gateway (2-3 hours)
- **Tomorrow**: Complete Lambda integrations (3-4 hours)
- **Day 3**: Step Functions and S3 events (4-5 hours)
- **Day 4**: Full integration testing (2-3 hours)
- **Day 5**: Production cutover (1-2 hours)

## Commands Quick Reference

```bash
# Deploy API Gateway
./deploy-phase3-1-api.sh

# Test endpoints
./test-api-endpoints.sh <api-endpoint>

# Check stack status
aws cloudformation describe-stacks --stack-name vetroi-api-test --region us-east-2

# Update stack
aws cloudformation update-stack --stack-name vetroi-api-test --template-body file://phase3-1-api-gateway.yaml --region us-east-2

# Delete stack (if needed)
aws cloudformation delete-stack --stack-name vetroi-api-test --region us-east-2
```

## Support Resources

- AWS API Gateway v2 Docs: https://docs.aws.amazon.com/apigatewayv2/
- CloudFormation API Gateway Resources: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/AWS_ApiGatewayV2.html
- Lambda Integration: https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-lambda-integration.html

---

Ready to proceed with deployment when you are!