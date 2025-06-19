# VetROI CloudFormation Production Migration Plan

## Current Production Status
- ✅ App is WORKING at https://vetroi.altivum.ai
- ✅ API is WORKING at https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod
- ✅ All resources backed up at: ~/Desktop/VetROI-Backup-20250619-090715
- ✅ Import change set ready: import-only-1750343801

## Phase 1: Import Data Layer (Day 1 - Today)
**Goal**: Bring data resources under CloudFormation management
**Risk**: Minimal - import only, no modifications

### 1.1 Execute Import (5 minutes)
```bash
# Execute the import
aws cloudformation execute-change-set \
  --stack-name vetroi-resources-import \
  --change-set-name import-only-1750343801 \
  --region us-east-2

# Monitor progress
watch -n 5 'aws cloudformation describe-stacks \
  --stack-name vetroi-resources-import \
  --region us-east-2 \
  --query "Stacks[0].{Status:StackStatus,Reason:StackStatusReason}" \
  --output table'
```

### 1.2 Verify Import Success (10 minutes)
```bash
# Test 1: Verify stack shows resources
aws cloudformation list-stack-resources \
  --stack-name vetroi-resources-import \
  --region us-east-2 \
  --query 'StackResourceSummaries[*].[LogicalResourceId,ResourceStatus]' \
  --output table

# Test 2: Verify app still works
curl -X POST https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend \
  -H "Content-Type: application/json" \
  -d '{"branch":"army","code":"11B","homeState":"CA","relocate":false,"education":"high_school"}'

# Test 3: Check DynamoDB tables
aws dynamodb describe-table --table-name VetROI_Sessions \
  --query 'Table.TableStatus' --output text

# Test 4: Check S3 buckets
aws s3 ls s3://vetroi-dd214-secure --max-items 1
```

### 1.3 Document Import Results
- Record stack ID
- Confirm all 8 resources show as "IMPORT_COMPLETE"
- Save CloudFormation event log

---

## Phase 2: Lambda & IAM Layer (Day 2)
**Goal**: Add compute resources to CloudFormation
**Risk**: Medium - need careful dependency management

### 2.1 Prepare Lambda Packages (30 minutes)
Create proper deployment packages for each Lambda function:

```bash
# Create deployment structure
mkdir -p infrastructure/lambda-packages

# For each Lambda function, create a package
for func in VetROI_Recommend VetROI_DD214_GenerateUploadURL \
            VetROI_DD214_GetStatus VetROI_DD214_Processor \
            VetROI_DD214_Macie VetROI_DD214_Insights \
            VetROI_DD214_GetInsights VetROI_DD214_GetRedacted \
            VetROI_S3_DD214_Trigger; do
    
    echo "Packaging $func..."
    mkdir -p infrastructure/lambda-packages/$func
    
    # Extract current deployment
    unzip -q ~/Desktop/VetROI-Backup-*/lambda-functions/code/${func}.zip \
          -d infrastructure/lambda-packages/$func/
    
    # Create deployment zip
    cd infrastructure/lambda-packages/$func
    zip -r ../${func}.zip . -x "*.pyc" "__pycache__/*"
    cd -
done
```

### 2.2 Upload to S3 (10 minutes)
```bash
# Create deployment bucket if needed
aws s3 mb s3://vetroi-cloudformation-deploys-$(date +%Y%m%d) --region us-east-2

# Upload Lambda packages
aws s3 sync infrastructure/lambda-packages/ \
  s3://vetroi-cloudformation-deploys-$(date +%Y%m%d)/lambda/ \
  --exclude "*" --include "*.zip"

# Upload Layer
aws s3 cp lambda/layers/common/layer.zip \
  s3://vetroi-cloudformation-deploys-$(date +%Y%m%d)/layers/common-layer.zip
```

### 2.3 Create Phase 2 Template
New template that:
- References the imported stack for data resources
- Adds Lambda functions
- Adds IAM roles
- Adds Lambda layer
- NO API Gateway events yet (avoid circular deps)

### 2.4 Deploy Phase 2
```bash
# Update existing stack with new resources
aws cloudformation update-stack \
  --stack-name vetroi-resources-import \
  --template-body file://phase2-lambda-iam.yaml \
  --capabilities CAPABILITY_NAMED_IAM
```

### 2.5 Verify Phase 2
- Test each Lambda function directly
- Verify IAM permissions
- Check layer attachment
- Ensure existing API still routes correctly

---

## Phase 3: Complete Integration (Day 3)
**Goal**: Add remaining infrastructure and connections
**Risk**: Low - building on stable foundation

### 3.1 Add Step Functions
- Import existing state machines
- Update Lambda environment variables
- Test workflow execution

### 3.2 Configure S3 Events
- Add bucket notifications
- Lambda permissions for S3
- Test file upload trigger

### 3.3 API Gateway Documentation
- Document existing API configuration
- Create API Gateway resource definitions
- Plan for future API management

### 3.4 Add Monitoring
- CloudWatch alarms
- X-Ray tracing activation
- Cost allocation tags

---

## Rollback Plans

### Phase 1 Rollback
```bash
# Delete stack but retain all resources
aws cloudformation delete-stack \
  --stack-name vetroi-resources-import \
  --retain-resources SessionsTable DD214ProcessingTable \
    CareerInsightsTable ConversationsTable UserDocumentsTable \
    DataLakeBucket DD214SecureBucket DD214RedactedBucket \
  --region us-east-2
```

### Phase 2 Rollback
```bash
# Restore Lambda functions from backup
cd ~/Desktop/VetROI-Backup-*/
./emergency-restore.sh --force
```

### Phase 3 Rollback
- Remove new monitoring only
- Keep core infrastructure in CF

---

## Success Criteria

### Phase 1 Success ✓
- [ ] All 8 resources show in CloudFormation
- [ ] App continues to work
- [ ] No errors in CloudWatch
- [ ] API responses unchanged

### Phase 2 Success ✓
- [ ] All Lambda functions managed by CF
- [ ] Functions use CF-deployed layer
- [ ] IAM roles properly attached
- [ ] Direct Lambda invokes work

### Phase 3 Success ✓
- [ ] Step Functions integrated
- [ ] S3 events trigger properly
- [ ] Monitoring active
- [ ] Full infrastructure in code

---

## Timeline
- **Phase 1**: Today (30 minutes)
- **Phase 2**: Tomorrow or when ready (2 hours)
- **Phase 3**: After Phase 2 stable (1 hour)

Total time: ~3.5 hours over multiple days
Risk: Minimized through phasing
Result: Full production CloudFormation management