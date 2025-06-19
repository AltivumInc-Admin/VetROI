# VetROI CloudFormation Migration - Phase 3 Detailed Plan

## Phase 3: API Gateway & Event Integrations

### Current State Summary
- ✅ Phase 1: Data resources identified (but not imported due to existing resources)
- ✅ Phase 2: Lambda layer and test function deployed via CloudFormation
- 🎯 Phase 3: Complete infrastructure integration

### Phase 3.1: API Gateway Integration

#### Objective
Bring the API Gateway under CloudFormation management without disrupting production traffic.

#### Current Production API
- **API ID**: `jg5fae61lj`
- **Type**: HTTP API (v2)
- **URL**: `https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod`
- **Routes**:
  - POST /recommend
  - GET /career/{socCode}
  - POST /dd214/upload
  - GET /dd214/status
  - GET /dd214/insights
  - GET /dd214/redacted
  - POST /sentra/conversation

#### Steps:
1. **Create new API Gateway in CloudFormation**
   - Deploy as `vetroi-api-cf` (separate from production)
   - Configure all routes
   - Set up CORS properly
   - Use CloudFormation Lambda functions

2. **Test new API thoroughly**
   - Test each endpoint
   - Verify CORS headers
   - Check Lambda integrations

3. **Gradual migration options**:
   - Option A: Update frontend to use new API
   - Option B: Use Route53 weighted routing
   - Option C: API Gateway custom domain

### Phase 3.2: Step Functions Integration

#### Current Step Functions
1. **VetROI-DD214-Processing**
   - Handles DD214 document processing workflow
   - Integrates with Textract, Macie, and Lambda functions

2. **VetROI_DATA**
   - O*NET data refresh pipeline

#### Steps:
1. **Export Step Function definitions**
   ```bash
   aws stepfunctions describe-state-machine \
     --state-machine-arn <arn> \
     --query 'definition' > state-machine.json
   ```

2. **Create CloudFormation templates**
   - Define Step Functions in YAML
   - Create IAM roles for Step Functions
   - Set up CloudWatch logging

3. **Deploy parallel Step Functions**
   - Deploy with `-CF` suffix
   - Test with sample data
   - Verify all state transitions

### Phase 3.3: Event Bridge & S3 Notifications

#### Current Event Sources
1. **S3 Upload Triggers**
   - Bucket: `vetroi-dd214-documents`
   - Triggers: `VetROI_S3_DD214_Trigger` Lambda

#### Steps:
1. **Define S3 bucket notifications in CloudFormation**
   ```yaml
   NotificationConfiguration:
     LambdaConfigurations:
       - Event: s3:ObjectCreated:*
         Function: !GetAtt S3TriggerLambda.Arn
         Filter:
           S3Key:
             Rules:
               - Name: suffix
                 Value: .pdf
   ```

2. **Handle circular dependencies**
   - Use custom resource for notifications
   - Or deploy in separate stack

### Phase 3.4: Secrets & Parameters

#### Current Secrets
- **ONET credentials** in Secrets Manager

#### Steps:
1. **Reference existing secrets**
   ```yaml
   OnetSecret:
     Type: AWS::SecretsManager::Secret
     Properties:
       Name: ONET
       Description: O*NET API Credentials
   ```

2. **Create parameter store entries**
   - API endpoints
   - Configuration values

### Phase 3.5: Monitoring & Alarms

#### Add CloudWatch Components
1. **Lambda Alarms**
   - Error rate > 1%
   - Duration > timeout * 0.8
   - Throttles > 0

2. **API Gateway Alarms**
   - 4xx errors > 5%
   - 5xx errors > 1%
   - Latency > 1000ms

3. **DynamoDB Alarms**
   - User errors > 0
   - System errors > 0

### Phase 3.6: Complete Migration Checklist

#### Pre-Migration
- [ ] All CloudFormation resources tested
- [ ] Backup current configuration
- [ ] Document rollback procedure
- [ ] Schedule maintenance window

#### Migration Steps
1. **Deploy complete CloudFormation stack**
   ```bash
   aws cloudformation create-stack \
     --stack-name vetroi-production-complete \
     --template-body file://complete-stack.yaml \
     --capabilities CAPABILITY_NAMED_IAM
   ```

2. **Update DNS/Frontend**
   - Point frontend to new API
   - Monitor for errors

3. **Decommission old resources**
   - Wait 24-48 hours
   - Check CloudWatch logs
   - Delete manual resources

## Implementation Timeline

### Week 1: API Gateway
- Day 1-2: Create and test new API Gateway
- Day 3-4: Set up all routes and integrations
- Day 5: Load testing and verification

### Week 2: Step Functions & Events
- Day 1-2: Migrate Step Functions
- Day 3-4: Set up S3 notifications
- Day 5: End-to-end testing

### Week 3: Monitoring & Cutover
- Day 1-2: Add all monitoring
- Day 3: Final testing
- Day 4: Production cutover
- Day 5: Monitor and verify

## Risk Mitigation

1. **Zero-downtime deployment**
   - Keep old resources running
   - Use blue-green deployment
   - Quick rollback capability

2. **Testing strategy**
   - Automated tests for each endpoint
   - Load testing before cutover
   - Canary deployment option

3. **Rollback procedure**
   - Document all changes
   - Keep old resources for 1 week
   - One-command rollback script

## Next Immediate Steps

1. **Create Phase 3.1 template** - New API Gateway
2. **Set up test environment** - Separate from production
3. **Build automated tests** - For API endpoints

Would you like me to start with creating the Phase 3.1 API Gateway CloudFormation template?