# VetROI™ Development Documentation

## Project Overview

**VetROI™** (Veteran Return on Investment) is a flagship SaaS application by Altivum Inc. that helps military veterans transition to civilian careers through AI-powered recommendations. The platform matches military experience with high-demand civilian careers using AWS serverless architecture, Amazon Bedrock LLM, and O*NET career data.

**Trademark**: VetROI™ - Serial Number 99211176 (Filed: May 30, 2025)  
**Owner**: Altivum Inc.  
**License**: MIT License  

---

## Current Architecture Status

### ✅ Phase 1: Core Infrastructure (COMPLETED)

#### Frontend (Live)
- **URL**: https://main.d34razwlkdgpdv.amplifyapp.com
- **Technology**: React 18 + TypeScript + Vite
- **Hosting**: AWS Amplify with auto-deploy from GitHub
- **Features Implemented**:
  - Veteran profile form (branch, MOS, education, location)
  - Chat-style recommendation display
  - Responsive design with proper contrast ratios
  - Custom VetROI™ favicon
  - Trademark attribution throughout

#### Backend (Live)
- **API Endpoint**: https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend
- **Lambda Function**: `VetROI_Recommend` (Python 3.12, 512MB)
- **Database**: DynamoDB table `VetROI_Sessions` (created, not yet integrated)
- **Current State**: Returns mock recommendations based on military branch

#### Infrastructure Components
```
AWS Services Deployed:
├── Lambda: VetROI_Recommend
├── API Gateway: HTTP API with CORS enabled
├── DynamoDB: VetROI_Sessions table
├── IAM Roles: VetROI-Lambda-ExecutionRole
├── S3 Buckets: vetroi-lambda-artifacts-205930636302
└── Amplify App: d34razwlkdgpdv (VetROI™)
```

---

## Implementation Details

### File Structure
```
VetROI/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # VeteranForm, RecommendationChat
│   │   ├── styles/            # App.css with accessibility improvements
│   │   ├── api.ts            # Axios API client
│   │   └── types.ts          # TypeScript interfaces
│   └── public/
│       └── favicon.png       # Custom VetROI™ favicon
├── lambda/
│   ├── recommend/            # Main recommendation Lambda
│   ├── dd214_parser/         # (Planned) Textract integration
│   └── onet_refresh/         # (Planned) O*NET sync
├── sam-templates/
│   ├── template.yaml         # Original SAM template
│   └── template-production.yaml  # Enhanced production template
└── deployment scripts/
    ├── deploy-phase1.sh      # Quick Lambda deployment
    └── deploy-core-backend.sh # Core infrastructure setup
```

### Key Design Decisions

1. **Minimal Lambda Approach**: Started with zero-dependency Lambda returning mock data to ensure quick deployment and testing
2. **CORS Configuration**: Implemented at both API Gateway and Lambda levels for maximum compatibility
3. **TypeScript**: Full type safety for frontend with Pydantic models ready for backend
4. **Contrast Ratios**: Improved from 3.5:1 to 12.8:1 for WCAG AAA compliance

### Known Issues Resolved
- ✅ Lambda deployment zip structure (must be flat, not nested)
- ✅ CORS preflight handling (added OPTIONS route)
- ✅ API stage URL (/prod was missing)
- ✅ Text contrast on recommendation cards
- ✅ Missing favicon.png

---

## Phase 2: Enhanced Functionality (PLANNED)

### 1. Amazon Bedrock Integration 🤖
**Priority**: HIGH  
**Timeline**: 1-2 days

```python
# Current: Mock recommendations
# Target: AI-powered personalization

class BedrockClient:
    - Model: anthropic.claude-3-sonnet-20240229
    - Prompt engineering for veteran context
    - Structured JSON output
    - Fallback to mock data on failure
```

**Implementation Steps**:
1. Add Bedrock permissions to Lambda role
2. Implement prompt template with military-civilian translation
3. Parse and validate Bedrock responses
4. Add retry logic with exponential backoff

### 2. O*NET API Integration 📊
**Priority**: HIGH  
**Timeline**: 2-3 days

```python
# Features to implement:
- Real-time career data fetching
- Military code crosswalk (MOS → O*NET SOC)
- State-specific salary data
- Skills matching algorithm
- S3 caching layer for performance
```

**Required Credentials**:
- Store in AWS Secrets Manager: `VetROI/ONet/ApiCredentials`
- Implement OAuth if required by O*NET
- Cache responses for 24 hours

### 3. DynamoDB Integration 💾
**Priority**: MEDIUM  
**Timeline**: 1 day

```python
# Schema Design:
{
    'session_id': 'uuid',      # Partition key
    'timestamp': 123456,       # Sort key
    'user_profile': {...},     # Veteran input data
    'recommendations': [...],   # AI results
    'feedback': {...},         # User ratings
    'ttl': 7776000            # 90 days
}
```

**Features**:
- Session persistence
- Analytics data collection
- User feedback tracking
- GDPR-compliant data retention

### 4. DD-214 Document Processing 📄
**Priority**: MEDIUM  
**Timeline**: 3-4 days

```python
# AWS Textract + Comprehend Pipeline:
1. S3 upload with presigned URLs
2. Textract: Extract text from PDF
3. Comprehend: Identify military entities
4. Custom NLP: Extract MOS, rank, skills
5. Update user profile with extracted data
```

**Security Considerations**:
- Encrypt at rest with KMS
- Delete after processing
- Audit trail for compliance

### 5. Authentication & User Management 🔐
**Priority**: LOW  
**Timeline**: 2-3 days

```typescript
// Amazon Cognito Integration
- User pools for veterans
- Social login (LinkedIn for professional network)
- JWT tokens for API authorization
- Profile management dashboard
```

---

## Phase 3: Production Hardening (PLANNED)

### Performance Optimizations
1. **Lambda Layers**: Shared dependencies to reduce cold starts
2. **API Caching**: CloudFront for static responses
3. **Connection Pooling**: Reuse DynamoDB connections
4. **Provisioned Concurrency**: For consistent performance

### Monitoring & Observability
```yaml
CloudWatch Dashboards:
  - API response times
  - Lambda errors and throttles
  - Bedrock API usage
  - User funnel metrics

X-Ray Tracing:
  - End-to-end request flow
  - Service map visualization
  - Performance bottlenecks

Alarms:
  - Error rate > 1%
  - Response time > 3s
  - Bedrock throttling
  - DynamoDB capacity
```

### Security Enhancements
- **WAF Rules**: Rate limiting, SQL injection protection
- **API Keys**: Required for production
- **VPC Endpoints**: For AWS service calls
- **Secrets Rotation**: Automated with Lambda
- **Penetration Testing**: Before public launch

---

## Development Workflow

### Local Development
```bash
# Frontend
cd frontend
npm install
npm run dev  # http://localhost:3000

# Backend
sam local start-api  # http://localhost:3001
```

### Deployment Process
```bash
# Quick Lambda update
./deploy-phase1.sh

# Full SAM deployment
sam build --template sam-templates/template-production.yaml
sam deploy --guided --stack-name vetroi-prod

# Frontend (automatic via Amplify)
git push origin main
```

### Environment Variables
```bash
# Lambda
TABLE_NAME=VetROI_Sessions
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229
ONET_API_URL=https://services.onetcenter.org/ws
ONET_SECRET_NAME=VetROI/ONet/ApiCredentials

# Frontend (Amplify)
VITE_API_URL=https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod
```

---

## Testing Strategy

### Unit Tests
```python
# Lambda functions
pytest lambda/recommend/tests/
pytest lambda/dd214_parser/tests/

# Coverage target: 80%
```

### Integration Tests
```typescript
// Frontend E2E with Cypress
- Form submission flow
- Recommendation display
- Error handling
- Accessibility (a11y)
```

### Load Testing
```bash
# Artillery for API testing
artillery quick --count 100 --num 10 https://api-url/recommend
```

---

## Cost Projections

| Service | Monthly Volume | Estimated Cost |
|---------|---------------|----------------|
| Lambda | 50,000 invocations | $1.00 |
| API Gateway | 50,000 requests | $3.50 |
| DynamoDB | 1GB, On-Demand | $2.50 |
| Bedrock | 50,000 API calls | $25.00 |
| Amplify | 10GB transfer | $1.00 |
| **Total** | | **~$33/month** |

*Note: Costs scale linearly with usage*

---

## Success Metrics

### Technical KPIs
- API response time < 2 seconds
- Uptime > 99.9%
- Error rate < 0.1%
- Cold start time < 1 second

### Business KPIs
- User engagement rate
- Recommendation acceptance rate
- Time to first job application
- Veteran satisfaction score (NPS)

---

## Upcoming Decisions

1. **Authentication Strategy**: Cognito vs Auth0 vs Custom JWT
2. **Payment Processing**: Stripe vs AWS Marketplace
3. **Analytics Platform**: Amplitude vs Mixpanel vs Custom
4. **Email Service**: SES vs SendGrid
5. **CDN Strategy**: CloudFront configuration

---

## Repository Information

**GitHub**: https://github.com/AltivumInc-Admin/VetROI  
**Branch Strategy**: main (production), develop (staging)  
**CI/CD**: GitHub Actions + AWS Amplify  

---

## Contact & Support

**Technical Lead**: Christian Perez (christian.perez@altivum.io)  
**Company**: Altivum Inc.  
**Trademark**: VetROI™ is a trademark of Altivum Inc.

---

*Last Updated: June 12, 2025*