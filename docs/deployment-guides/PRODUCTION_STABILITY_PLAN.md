# VetROI Production Stability Plan
## Preventing Demo-Day Disasters

### IMMEDIATE FIXES NEEDED:

#### 1. Fix CloudFormation Stack (CRITICAL)
```bash
# Option A: Force delete and recreate
aws cloudformation delete-stack --stack-name vetroi-production --retain-resources DD214UploadBucket ONetCacheBucket --region us-east-2

# Option B: Create new stack with different name
sam deploy --stack-name vetroi-prod-stable --guided
```

#### 2. Lambda Resilience Pattern
Instead of relying on layers, package ALL dependencies:

```bash
# Create self-contained Lambda packages
cd lambda/recommend
pip install -r requirements.txt -t .
zip -r function.zip . -x "*.pyc" "__pycache__/*"
```

#### 3. Universal CORS Handler
```python
def get_http_method(event):
    """Works with both REST API and HTTP API"""
    # HTTP API v2 format
    if 'requestContext' in event and 'http' in event['requestContext']:
        return event['requestContext']['http']['method']
    # REST API format
    return event.get('httpMethod', '')

def cors_response(status_code=200, body=None, error=None):
    """Always return proper CORS headers"""
    response = {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key',
            'Content-Type': 'application/json'
        }
    }
    
    if error:
        response['body'] = json.dumps({'error': error})
    elif body:
        response['body'] = json.dumps(body)
    else:
        response['body'] = ''
    
    return response
```

### DEMO-DAY CHECKLIST:

#### 1. Infrastructure Lockdown (1 week before demo)
- [ ] NO infrastructure changes after this point
- [ ] Create AMI/snapshot backups of everything
- [ ] Document all API endpoints and test them
- [ ] Have fallback static responses ready

#### 2. Redundancy Setup
- [ ] Deploy backup Lambda functions with embedded dependencies
- [ ] Create secondary API Gateway as failover
- [ ] Cache O*NET responses in DynamoDB for offline mode
- [ ] Have local demo environment ready

#### 3. Error Handling
- [ ] Every Lambda returns CORS headers even on error
- [ ] Frontend gracefully handles 500 errors
- [ ] Implement retry logic with exponential backoff
- [ ] Add circuit breaker pattern

#### 4. Monitoring & Alerts
```bash
# Set up CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "VetROI-API-Errors" \
  --alarm-description "Alert on API errors" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### ARCHITECTURAL IMPROVEMENTS:

#### 1. Monolithic Lambda Option
For critical demos, consider a single Lambda with all code:
```
lambda/vetroi-monolith/
├── lambda_function.py  # All handlers in one file
├── requirements.txt    # All dependencies
└── deploy.sh          # Direct deployment script
```

#### 2. Static Fallback Mode
```javascript
// Frontend fallback
const callAPI = async (endpoint, data) => {
  try {
    return await fetch(API_URL + endpoint, {...});
  } catch (error) {
    console.error('API failed, using static data');
    return STATIC_DEMO_DATA[endpoint];
  }
};
```

#### 3. Database Connection Pooling
```python
# Reuse connections across Lambda invocations
dynamodb = None

def get_dynamodb():
    global dynamodb
    if dynamodb is None:
        dynamodb = boto3.resource('dynamodb')
    return dynamodb
```

### TESTING PROTOCOL:

#### Daily Health Checks (Automated)
```bash
#!/bin/bash
# health_check.sh
ENDPOINTS=(
  "https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend"
  "https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/career/11-1011.00"
)

for endpoint in "${ENDPOINTS[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
  if [ "$response" != "200" ]; then
    echo "ALERT: $endpoint returned $response"
    # Send alert
  fi
done
```

### EMERGENCY PROCEDURES:

#### If API Fails During Demo:
1. **Immediate:** Switch to cached/static data in frontend
2. **30 seconds:** Deploy backup Lambda with embedded deps
3. **2 minutes:** Switch to backup API Gateway
4. **5 minutes:** Full local demo environment

#### Pre-Demo Commands:
```bash
# Warm up Lambdas
aws lambda invoke --function-name VetROI_Recommend --payload '{"warmup":true}' output.json

# Verify all endpoints
curl -X OPTIONS https://your-api/prod/recommend  # Should return 200
curl -X POST https://your-api/prod/recommend -d '{...}'  # Should return data

# Check CloudWatch for errors
aws logs tail /aws/lambda/VetROI_Recommend --since 1h
```

### PERMANENT FIXES:

1. **Infrastructure as Code**
   - Version control EVERYTHING
   - Use AWS CDK instead of SAM for better control
   - Implement blue/green deployments

2. **Dependency Management**
   - Use Lambda containers for complex dependencies
   - Or embed all dependencies in deployment package
   - Never rely on layers for production

3. **API Gateway Configuration**
   - Use REST API instead of HTTP API for better CORS control
   - Or implement CORS at CloudFront level

4. **Monitoring**
   - Set up PagerDuty/Opsgenie for instant alerts
   - Use synthetic monitoring to catch issues early
   - Implement distributed tracing (X-Ray) properly

Remember: **NO INFRASTRUCTURE CHANGES WITHIN 48 HOURS OF DEMO**