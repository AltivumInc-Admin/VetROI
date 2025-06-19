# DD214 Processing Cost Analysis for VetROI

## Complete Service List for One DD214 Processing Run

### AWS Services Used

1. **API Gateway** (HTTP API)
   - 1 POST request to `/dd214/presigned-url`
   - 1+ GET requests to `/dd214/status/{documentId}`

2. **Lambda Functions** (6 total)
   - `VetROI_DD214_PresignedUrl` - Generate upload URL
   - `VetROI_DD214_UploadTrigger` - S3 event trigger
   - `VetROI_DD214_Parser` - Main processing function
   - `VetROI_Macie_Handler` - PII detection
   - `VetROI_DD214_Status` - Status checking
   - `VetROI_Sentra_Conversation` - AI insights (if used)

3. **Step Functions**
   - 1 Standard workflow execution with ~15 states

4. **S3 Storage**
   - Upload: 1 DD214 file (~1-5 MB)
   - Textract results: ~2-3 JSON files
   - Macie findings: 1 JSON file
   - Redacted document: 1 file (if needed)
   - Total: ~10-20 MB per processing

5. **DynamoDB**
   - Tables: `VetROI_DD214_Processing`, `VetROI_UserDocuments`
   - ~5-10 write operations
   - ~3-5 read operations

6. **Textract**
   - 1 StartDocumentAnalysis API call
   - Multiple GetDocumentAnalysis calls (polling)
   - Document pages: typically 2-4 pages

7. **Amazon Macie**
   - 1 classification job
   - Scanning ~1-5 MB document

8. **Amazon Comprehend**
   - 3 parallel API calls:
     - DetectEntities
     - DetectKeyPhrases
     - DetectSentiment

9. **Amazon Bedrock**
   - 1 InvokeModel call (Nova Lite or Claude Sonnet)
   - ~1000 tokens input/output

10. **CloudWatch**
    - Logs from 6 Lambda functions
    - X-Ray traces for all services

## Cost Calculation Methods

### Method 1: AWS Cost Tagging Strategy

```bash
# Tag all resources with consistent tags
aws lambda tag-resource \
  --resource arn:aws:lambda:us-east-2:123456789012:function:VetROI_DD214_Parser \
  --tags "Project=VetROI,Feature=DD214Processing,Environment=Production"

# Apply tags to all Lambda functions
for func in VetROI_DD214_PresignedUrl VetROI_DD214_UploadTrigger VetROI_DD214_Parser VetROI_Macie_Handler VetROI_DD214_Status; do
  aws lambda tag-resource \
    --resource arn:aws:lambda:us-east-2:123456789012:function:$func \
    --tags "Project=VetROI,Feature=DD214Processing,Environment=Production"
done

# Tag Step Functions
aws stepfunctions tag-resource \
  --resource-arn arn:aws:states:us-east-2:123456789012:stateMachine:VetROI-DD214-Processing \
  --tags Project=VetROI,Feature=DD214Processing

# Tag S3 buckets
aws s3api put-bucket-tagging \
  --bucket vetroi-dd214-uploads-123456789012 \
  --tagging 'TagSet=[{Key=Project,Value=VetROI},{Key=Feature,Value=DD214Processing}]'

# Tag DynamoDB tables
aws dynamodb tag-resource \
  --resource-arn arn:aws:dynamodb:us-east-2:123456789012:table/VetROI_DD214_Processing \
  --tags Key=Project,Value=VetROI Key=Feature,Value=DD214Processing
```

### Method 2: CloudWatch Logs Insights Query

```sql
-- Query to aggregate Lambda costs by request ID
fields @timestamp, @message, @requestId, duration, billedDuration, memorySize, maxMemoryUsed
| filter @type = "REPORT"
| stats sum(billedDuration) as totalBilledMs,
        max(memorySize) as memoryMB,
        count() as invocations
by bin(5m)

-- Query for specific document processing
fields @timestamp, @message
| filter @message like /documentId.*YOUR_DOCUMENT_ID/
| stats count() by @logStream
```

### Method 3: X-Ray Service Map Analysis

```python
import boto3
from datetime import datetime, timedelta

xray = boto3.client('xray', region_name='us-east-2')

# Get traces for the last hour
end_time = datetime.utcnow()
start_time = end_time - timedelta(hours=1)

response = xray.get_trace_summaries(
    TimeRangeType='TraceId',
    TraceIds=['YOUR_TRACE_ID'],  # From Step Functions execution
    Sampling=False
)

# Analyze service usage
for trace in response['TraceSummaries']:
    print(f"Duration: {trace['Duration']} seconds")
    for service in trace['ServiceIds']:
        print(f"Service: {service}")
```

### Method 4: Manual Cost Calculation

Based on AWS Pricing (US East 2 - December 2024):

```
## Per DD214 Processing Run:

### Lambda Costs
- 6 functions × average 2 invocations = 12 invocations
- Average duration: 5 seconds × 1024 MB
- Cost: 12 × (5 × 1024/1000) × $0.0000166667 = $0.001

### Step Functions
- Standard workflow: $0.025 per 1,000 state transitions
- ~15 states per execution
- Cost: 15 × $0.025/1000 = $0.000375

### S3 Storage & Operations
- PUT requests: 5 × $0.0004/1000 = $0.000002
- GET requests: 10 × $0.00004/1000 = $0.0000004
- Storage (20 MB for 30 days): 0.02 × $0.023 = $0.00046

### DynamoDB
- Write units: 10 × $0.00065/1000 = $0.0000065
- Read units: 5 × $0.00013/1000 = $0.00000065

### Textract
- Document Analysis: 3 pages × $0.015 = $0.045

### Macie
- Data scanned: 5 MB × $1/GB = $0.005

### Comprehend
- 3 API calls × 1KB × $0.0001 = $0.0003

### Bedrock (Nova Lite)
- Input: 1000 tokens × $0.00015/1K = $0.00015
- Output: 1000 tokens × $0.0006/1K = $0.0006

### CloudWatch Logs
- Ingestion: ~50 MB × $0.50/GB = $0.025
- Storage: ~50 MB × $0.03/GB = $0.0015

### API Gateway
- 2 requests × $1.00/million = $0.000002

### TOTAL ESTIMATED COST PER RUN: ~$0.08
```

## Cost Tracking Implementation

### 1. Enable Cost Allocation Tags

```bash
# Enable cost allocation tags in AWS Billing Console
# Go to: Billing > Cost allocation tags > User-defined cost allocation tags
# Activate: Project, Feature, Environment tags
```

### 2. Create Cost Explorer Report

```python
import boto3
from datetime import datetime, timedelta

ce = boto3.client('ce', region_name='us-east-1')

# Get costs for DD214 processing
response = ce.get_cost_and_usage(
    TimePeriod={
        'Start': (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'),
        'End': datetime.now().strftime('%Y-%m-%d')
    },
    Granularity='DAILY',
    Metrics=['UnblendedCost'],
    Filter={
        'Tags': {
            'Key': 'Feature',
            'Values': ['DD214Processing']
        }
    },
    GroupBy=[
        {'Type': 'DIMENSION', 'Key': 'SERVICE'}
    ]
)

# Print cost breakdown
for result in response['ResultsByTime']:
    print(f"Date: {result['TimePeriod']['Start']}")
    for group in result['Groups']:
        service = group['Keys'][0]
        cost = group['Metrics']['UnblendedCost']['Amount']
        print(f"  {service}: ${cost}")
```

### 3. Create CloudWatch Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
          [".", "Duration", {"stat": "Average"}],
          [".", "Errors", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-2",
        "title": "DD214 Lambda Functions"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/States", "ExecutionsSucceeded", {"stat": "Sum"}],
          [".", "ExecutionsFailed", {"stat": "Sum"}],
          [".", "ExecutionTime", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-2",
        "title": "DD214 Step Functions"
      }
    }
  ]
}
```

### 4. Set Up Cost Anomaly Detection

```python
# Create cost anomaly monitor for DD214 processing
monitor = {
    "MonitorName": "DD214ProcessingCosts",
    "MonitorType": "CUSTOM",
    "MonitorDimension": {
        "Key": "LINKED_ACCOUNT",
        "Values": ["123456789012"]
    },
    "MonitorSpecification": {
        "Tags": {
            "Key": "Feature",
            "Values": ["DD214Processing"]
        }
    }
}
```

## Cost Optimization Recommendations

1. **Lambda Optimization**
   - Use ARM-based Graviton2 processors (20% cheaper)
   - Right-size memory allocation based on CloudWatch metrics
   - Enable Lambda SnapStart for Java functions

2. **S3 Optimization**
   - Use S3 Intelligent-Tiering for processed documents
   - Enable lifecycle policies to delete old Textract results
   - Compress JSON files before storage

3. **DynamoDB Optimization**
   - Use on-demand billing for variable workloads
   - Enable TTL on temporary processing records
   - Consider DynamoDB Global Tables only if needed

4. **Textract Optimization**
   - Cache results for identical documents
   - Use StartDocumentTextDetection for text-only extraction
   - Batch process during off-peak hours

5. **Step Functions Optimization**
   - Consider Express workflows for simple flows (<5 min)
   - Minimize state transitions
   - Use Map states for parallel processing

## Monitoring Script

```bash
#!/bin/bash
# monitor_dd214_costs.sh

# Set variables
DOCUMENT_ID=$1
START_TIME=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)
END_TIME=$(date -u +%Y-%m-%dT%H:%M:%S)

echo "Monitoring costs for Document ID: $DOCUMENT_ID"
echo "Time range: $START_TIME to $END_TIME"

# Check Lambda invocations
echo -e "\n=== Lambda Invocations ==="
aws logs insights start-query \
  --log-group-name "/aws/lambda/VetROI_DD214_Parser" \
  --start-time $(date -d "$START_TIME" +%s) \
  --end-time $(date -d "$END_TIME" +%s) \
  --query-string "fields @timestamp, duration, billedDuration | filter @message like /$DOCUMENT_ID/"

# Check Step Functions execution
echo -e "\n=== Step Functions Execution ==="
aws stepfunctions list-executions \
  --state-machine-arn "arn:aws:states:us-east-2:123456789012:stateMachine:VetROI-DD214-Processing" \
  --status-filter SUCCEEDED \
  --max-results 10 | jq '.executions[] | select(.name | contains("'$DOCUMENT_ID'"))'

# Check S3 operations
echo -e "\n=== S3 Operations ==="
aws s3 ls s3://vetroi-dd214-uploads-123456789012/users/ --recursive | grep $DOCUMENT_ID

# Estimate total cost
echo -e "\n=== Estimated Cost ==="
echo "Lambda: ~\$0.001"
echo "Step Functions: ~\$0.000375"
echo "S3: ~\$0.00046"
echo "DynamoDB: ~\$0.000007"
echo "Textract: ~\$0.045"
echo "Macie: ~\$0.005"
echo "Comprehend: ~\$0.0003"
echo "Bedrock: ~\$0.00075"
echo "CloudWatch: ~\$0.0265"
echo "-------------------"
echo "TOTAL: ~\$0.08 per document"
```

## Real-Time Cost Tracking

To track costs in real-time during processing:

1. Add cost estimation to your Step Functions:

```json
{
  "Comment": "Track costs during execution",
  "Type": "Task",
  "Resource": "arn:aws:states:::lambda:invoke",
  "Parameters": {
    "FunctionName": "VetROI_Cost_Tracker",
    "Payload": {
      "service": "Textract",
      "operation": "StartDocumentAnalysis",
      "units": 3,
      "costPerUnit": 0.015
    }
  }
}
```

2. Create a cost tracking Lambda function that logs to DynamoDB
3. Generate real-time cost reports from the tracking table

This comprehensive analysis shows that processing one DD214 document costs approximately **$0.08**, with Textract being the largest cost component at ~56% of the total.