# VetROI™ Development Documentation

## Project Vision & Strategy

**VetROI™** (Veteran Return on Investment) is the flagship SaaS product of Altivum Inc., designed to revolutionize how military veterans transition to civilian careers. This is not a hackathon project—it's a production application strategically launching through the AWS Lambda Hackathon 2025 for market validation and visibility.

### Business Strategy
- **Market Validation**: AWS hackathon placement serves as proof of concept and market demand
- **Strategic Launch**: Using competition for credibility, visibility, and potential funding
- **Real Impact**: Addressing the critical need of 200,000+ veterans transitioning annually
- **Revenue Model**: Freemium SaaS with premium features for career coaching and enterprise partnerships

**Trademark**: VetROI™ - Serial Number 99211176 (Filed: May 30, 2025)  
**Owner**: Altivum Inc.  
**License**: MIT License (enabling both open-source community and commercial monetization)

---

## Current Architecture Status (June 16, 2025)

### ✅ Phase 1: Data Collection & Career Discovery (COMPLETED)

#### Production Frontend
- **Production URL**: https://vetroi.altivum.ai (custom domain via CloudFront)
- **Amplify App ID**: d34razwlkdgpdv (us-east-2)
- **Technology**: React 18 + TypeScript + Vite
- **Hosting**: AWS Amplify with CI/CD from GitHub
- **UI Theme**: Dark glassmorphic design with cyan accents (#00d4ff)

#### User Flow (Working Perfectly - DO NOT CHANGE)
1. **Veteran Profile Input**
   - Branch, MOS/Rate/AFSC, Education, Home State, Relocation preference
   
2. **MOS Confirmation Step**
   - O*NET API translates military code to job title
   - Shows: "Special Forces Medical Sergeant (18D)"
   - User confirms or adjusts

3. **Career Match Display**
   - Shows 25 O*NET career matches
   - Bright Outlook badges for high-growth careers
   - Rolodex-style navigation on mobile
   - User selects careers of interest

4. **Detailed Analysis View**
   - Fetches full O*NET career reports
   - Beautiful cards showing:
     - Career title and SOC code
     - What They Do description
     - Salary data (10th, median, 90th percentile)
     - Education requirements
     - Location quotient for user's state
     - Skills, abilities, knowledge required
     - Job outlook and growth projections

#### Production Backend
- **API Gateway**: https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod
- **Lambda Function**: `VetROI_Recommend` 
  - Handler: `lambda_function.lambda_handler`
  - Runtime: Python 3.12
  - Uses urllib3 (no external dependencies needed)

#### API Endpoints (Both Working Perfectly)
1. **POST /recommend**
   - Input: `{branch, code, homeState, relocate, education}`
   - Calls: O*NET `/online/crosswalks/military?keyword={code}`
   - Returns: 25 career matches with occupation details
   - Response structure:
   ```json
   {
     "session_id": "uuid",
     "profile": {...},
     "onet_careers": {
       "match": [{
         "code": "18D",
         "title": "Special Forces Medical Sergeant (Army - Enlisted)",
         "occupations": {
           "occupation": [/* 25 careers */]
         }
       }]
     }
   }
   ```

2. **GET /career/{socCode}**
   - Input: SOC code (e.g., "29-1141.00")
   - Calls: O*NET `/mnm/careers/{soc}/report`
   - Returns: Complete career report with all details
   - Frontend parses this beautifully - no changes needed

#### O*NET Integration
- **Credentials**: Stored in AWS Secrets Manager (secret: "ONET")
- **Authentication**: Basic auth with credentials from Secrets Manager
- **Headers**: Accept: application/json
- **NO AI/Bedrock** in data collection phase - pure O*NET data

#### Infrastructure Components
```
AWS Services Deployed:
├── Lambda: VetROI_Recommend (handles both endpoints)
├── API Gateway: jg5fae61lj (HTTP API with CORS)
├── DynamoDB: VetROI_Sessions (stores session data)
├── Secrets Manager: ONET credentials
├── S3 Buckets: 
│   ├── vetroi-lambda-artifacts-* (Lambda deployments)
│   └── altroi-data (O*NET career data lake - 1,139 careers)
├── Amplify: d34razwlkdgpdv (frontend hosting)
├── CloudFront: vetroi.altivum.ai distribution
└── Step Functions: VetROI_DATA (data pipeline)
```

### 🎯 What's Working Perfectly (DO NOT CHANGE)
- ✅ Veteran profile collection
- ✅ MOS to job title translation
- ✅ 25 career matches from O*NET crosswalk
- ✅ Career selection interface
- ✅ Detailed career analysis with full O*NET data
- ✅ Beautiful data visualization
- ✅ Session storage in DynamoDB
- ✅ Dark theme UI with glassmorphic effects
- ✅ DD214 upload and processing pipeline
- ✅ Enhanced Nova Lite AI insights (8000 tokens)

---

## 🚀 AI Intelligence Layers (ENHANCED - June 20, 2025)

### DD214 AI Insights - Revolutionary Career Intelligence
When veteran uploads DD214, Nova Lite generates:

1. **Executive Intelligence Summary**
   - Unique value proposition with clearance premiums
   - Market position (top 1%, 5%, etc.)
   - Immediate leverage points worth $20-40K

2. **Market Intelligence**
   - Specific companies actively hiring (with requisition IDs)
   - Exact salary ranges with geographic multipliers
   - Insider tips and application hacks
   - Hidden opportunities in emerging sectors

3. **Risk Intelligence**
   - 10-year automation vulnerability
   - MOS-specific burnout factors
   - Ethical conflict identification
   - Risk mitigation strategies

4. **Legacy Narratives**
   - 60-second investor pitch
   - TED Talk opener
   - LinkedIn viral article template
   - Book foreword positioning

5. **Future-Proof Pathways (2035 Vision)**
   - AI-resistant careers
   - AI-hybrid microbusinesses
   - International opportunities
   - Skills investment portfolio

6. **Entrepreneurial Force Multipliers**
   - MOS-specific business models
   - Federal contracting opportunities
   - Pitch deck templates
   - Path to $10K MRR

### Sentra - AI Career Counselor (Next Enhancement)
When veteran clicks "Meet with Sentra" after exploring careers:

1. **Context Awareness**
   - Full DD214 intelligence
   - Career exploration history
   - Risk tolerance assessment
   - Geographic preferences

2. **Conversational Intelligence**
   - Military-aware language model
   - Motivational interviewing techniques
   - Action-oriented guidance
   - Accountability check-ins

3. **Integration Points**
   - POST /sentra/conversation
   - Context from DD214 insights
   - Session continuity

---

## Data Architecture

### O*NET Data Lake (S3)
- **Bucket**: altroi-data
- **Structure**: 
  - `/soc-details/{soc}.json` - 1,139 career details
  - `/master-soc-list/` - Complete SOC list
  - `/military-crosswalk/` - Military to civilian mappings

### Step Functions Pipeline
- **VetROI_DATA**: Refreshes O*NET data
- **VetROI_ONET_Refresh_prod**: Scheduled updates
- Processes all 1,139 occupations with detailed information

---

## Critical Configuration

### Environment Variables (Amplify)
```
VITE_API_URL=https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod
VITE_API_KEY=1du0W33OTS3NkLhXJY5R4FOY9LJq6ZB1h7Lrdwig
```

### Lambda Configuration
- **Handler**: lambda_function.lambda_handler
- **Timeout**: 30 seconds
- **Memory**: 1024 MB
- **Environment Variables**:
  - TABLE_NAME: VetROI_Sessions
  - DATA_BUCKET: altroi-data
  - ENABLE_S3_DATA: true

### CORS Configuration
- Handled by Lambda (not API Gateway)
- Returns proper headers for all responses
- OPTIONS requests return 200 with CORS headers

---

## Development Guidelines

### DO NOT CHANGE
1. Current user flow - it's perfect
2. O*NET API endpoints and response parsing
3. Frontend component structure
4. Dark theme styling
5. Career data visualization

### Safe to Add/Enhance
1. Sentra AI counselor integration
2. ROI calculations
3. GI Bill benefit calculators
4. Additional analytics
5. Performance optimizations

### Testing Endpoints
```bash
# Test career matches
curl -X POST https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend \
  -H "Content-Type: application/json" \
  -d '{"branch":"army","code":"18D","homeState":"CA","relocate":false,"education":"bachelor"}'

# Test career details
curl https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/career/29-1141.00
```

---

## Current Status Summary

**What We Have**: A fully functional career discovery platform that:
- Takes veteran input
- Shows real O*NET career matches
- Provides detailed career analysis
- Looks professional with dark glassmorphic UI
- Stores sessions for continuity

**What's Next**: AI-powered career counseling with Sentra

**Remember**: The current implementation is PERFECT. Any new features should enhance, not replace, what we have.

---

## ✅ Phase 2: DD214 Processing & AI Insights (COMPLETED - June 19, 2025)

### DD214 Upload & Processing Pipeline
Complete automated pipeline for DD214 document processing with PII protection and AI-powered career insights.

#### User Flow
1. **Secure Upload**
   - Authenticated users upload DD214 PDF
   - Pre-signed S3 URLs for direct upload
   - File stored in `vetroi-dd214-secure` bucket

2. **Automated Processing** (2.5 minutes end-to-end)
   - S3 trigger starts Step Function workflow
   - Textract OCR extracts text and fields
   - Macie scans for PII (SSN, DoD ID, Address, DOB)
   - Document redaction creates safe version
   - AI generates personalized career insights

3. **Results Delivery**
   - Processing status available via API
   - Redacted document accessible
   - AI career recommendations based on actual military experience
   - Resume bullets, interview prep, networking strategy

#### Infrastructure Components
```
DD214 Processing Pipeline:
├── S3 Buckets:
│   ├── vetroi-dd214-secure (encrypted uploads)
│   └── vetroi-dd214-redacted (PII-removed versions)
├── Step Function: VetROI-DD214-Processing
│   ├── StartTextractJob → OCR processing
│   ├── ProcessTextractResults → Field extraction
│   ├── StartMacieScan → PII detection
│   ├── RedactDocument → Remove sensitive data
│   ├── GenerateInsights → AI career analysis
│   └── UpdateDynamoDB → Status tracking
├── Lambda Functions:
│   ├── VetROI_DD214_GenerateUploadURL
│   ├── VetROI_DD214_GetStatus
│   ├── VetROI_DD214_Processor
│   ├── VetROI_DD214_Macie
│   ├── VetROI_DD214_Insights
│   └── VetROI_S3_DD214_Trigger
├── DynamoDB: VetROI_DD214_Processing
└── Cognito: VetROI-DD214-Users (authentication)
```

#### API Endpoints (All Working)
1. **POST /dd214/upload-url** - Generate secure upload URL (requires auth)
2. **GET /dd214/status/{documentId}** - Check processing status
3. **GET /dd214/insights/{documentId}** - Get AI career insights
4. **GET /dd214/redacted/{documentId}** - Access redacted document

#### Key Features
- **PII Protection**: Automatic detection and redaction of sensitive information
- **AI Career Insights**: Personalized recommendations based on MOS, rank, experience
- **Cost Efficient**: ~$0.25 per document processed
- **Secure**: End-to-end encryption, authenticated uploads

#### Critical Lambda Functions
- **VetROI_Recommend** (`lambda_function.lambda_handler`)
  - MUST use the handler that routes both `/recommend` and `/career/{socCode}`
  - Contains critical routing logic to prevent "broken app" issues
- **VetROI_DD214_Macie** 
  - Must retrieve `extracted_text` from DynamoDB, not S3
  - Prevents "Unable to retrieve document text" errors
- **VetROI_DD214_Insights**
  - Requires null-safe string operations (`str(field or '').lower()`)
  - Uses actual DD214 data to prevent AI hallucination

---

## 🏗️ CloudFormation Migration (COMPLETED - June 19, 2025)

### Infrastructure as Code Implementation
Comprehensive CloudFormation templates for disaster recovery and environment replication.

#### Phase 1: Data Resources ✅
- Imported existing S3 buckets and DynamoDB tables
- Preserved all production data and configurations
- Stack: `vetroi-resources-import`

#### Phase 2: Lambda & IAM ✅
- Created Lambda dependency layer (41MB)
- Deployed Lambda functions with proper IAM roles
- Stack: `vetroi-lambda-test`

#### Phase 3: API & Event Integration ✅
- **3.1**: API Gateway configuration
- **3.2**: Step Functions for DD214 processing
- **3.3**: S3 event notifications
- **3.4**: Lambda API integrations
- **3.5**: CloudWatch monitoring & alarms
- Stacks: `vetroi-api-test`, `vetroi-stepfunctions-test`, `vetroi-lambda-integrations-v2`, `vetroi-monitoring-v2`

### Migration Journey & Fixes
During the CloudFormation migration, several critical issues were identified and resolved:

1. **CORS Error Fix**: Updated Lambda handler to support HTTP API v2 event format
2. **Career Endpoint Fix**: Deployed correct routing logic for `/career/{socCode}` endpoint
3. **Lambda Import Errors**: Removed `aws_xray_sdk` dependencies, created proper layer
4. **Step Function JSONPath**: Fixed parameter passing for RedactDocument and GenerateInsights
5. **AI Hallucination Fix**: Updated Macie Lambda to retrieve text from DynamoDB instead of S3

### What's In CloudFormation
```
✅ Managed by CloudFormation:
├── Lambda Functions (with dependencies)
├── API Gateway (all endpoints)
├── DynamoDB Tables (imported)
├── S3 Buckets (imported)
├── Step Functions (DD214 workflow)
├── IAM Roles & Policies
├── CloudWatch Alarms & Dashboard
└── Monitoring & Logging

❌ NOT in CloudFormation (by design):
├── Cognito (has user data, manual)
├── Amplify (GitHub integration, manual)
└── Lex Bot (us-east-1, manual)
```

### Monitoring & Observability
- **CloudWatch Dashboard**: Real-time system health
- **Email Alerts**: christian.perez0321@gmail.com
- **Metrics Tracked**: API errors, Lambda performance, DynamoDB throttling
- **Custom Alarms**: DD214 processing failures, high latency

---

## 🤖 AI Integration Status

### Amazon Lex - SentraCareerBot ✅
- **Bot ID**: IV2NSREVFS (us-east-1)
- **Purpose**: Conversational career guidance
- **Status**: Available and integrated with UI
- **Cross-Region**: Lex (us-east-1) → Lambda (us-east-2)

### Amazon Bedrock ✅
- **Model**: Amazon Nova Lite v1
- **Used For**: DD214 insights generation
- **Integration**: Direct API calls from Lambda
- **Response Quality**: Excellent career recommendations

---

## 📊 Cost Analysis & Tracking

### DD214 Processing Costs
Per document processed:
- Textract: $0.015
- Macie: $0.040
- Lambda: $0.087
- Bedrock: $0.100
- Storage: $0.005
- **Total**: ~$0.25 per DD214

### Monthly Projections
- 100 documents: $25
- 1,000 documents: $250
- 10,000 documents: $2,500

### Cost Tracking Implementation (June 19, 2025)
- **Resource Tagging**: All DD214-related resources tagged with `CostCenter: DD214Processing`
- **Tag-Based Billing**: Enabled in AWS Cost Allocation Tags
- **Cost Explorer Views**: Custom reports for DD214 processing costs
- **Python Script**: `scripts/track_dd214_costs.py` for automated reporting
- **CloudFormation**: `infrastructure/cost-tracking.yaml` for policy enforcement

---

## 🔧 Development Workflow

### Code Management
```
GitHub Repository
├── /frontend → Amplify (auto-deploy on push)
├── /lambda → Lambda functions (manual deploy)
├── /infrastructure/cloudformation → IaC templates
└── All changes tracked in Git
```

### Deployment Process
1. **Frontend**: Git push → Amplify auto-builds → Live
2. **Backend**: Git push → Manual CloudFormation update
3. **Database**: CloudFormation manages structure, not data

### Git & CloudFormation Workflow
- **Git Repository**: Version control for all code and CloudFormation templates
- **CloudFormation**: Infrastructure deployment (separate from Git)
- **Key Understanding**: Pushing to Git does NOT auto-deploy CloudFormation
- **Production Safety**: Current app continues working regardless of Git commits

### Environment Variables
- Stored in respective services (Amplify, Lambda)
- Secrets in AWS Secrets Manager
- No hardcoded credentials

---

## 🚨 Critical Notes

### Production Stability
- **Working Production**: All services operational
- **CloudFormation**: Templates ready but not required for operation
- **No Breaking Changes**: CF deployment is optional

### Known Issues & Fixes Applied
1. **DD214 Insights Error**: Fixed null handling in `.lower()` calls
2. **Redaction Issue**: Fixed DynamoDB text retrieval
3. **Import Errors**: Removed X-Ray SDK dependencies
4. **Step Function**: Fixed JSONPath parameter issues
5. **CORS Preflight Error**: Fixed by updating Lambda to handle HTTP API v2 format
6. **Career Detail Broken**: Fixed by deploying correct handler with routing logic
7. **AI Hallucination**: Fixed by ensuring Macie Lambda retrieves actual DD214 text

### Best Practices
1. Test all Lambda changes locally first
2. Use CloudFormation for new resources
3. Keep Cognito/Amplify manual (user data)
4. Monitor costs via tagging

---

## 📈 Next Steps & Roadmap

### Immediate Priorities
1. ✅ Production monitoring active
2. ✅ Cost tracking implemented
3. ⏳ Sentra AI chat enhancement
4. ⏳ User dashboard features

### Future Enhancements
- PDF generation for redacted DD214s
- Batch processing capabilities
- Enterprise accounts
- Advanced analytics
- Mobile app

### Technical Debt
- Complete CI/CD pipeline setup
- Automated testing framework
- Performance optimization
- Multi-region deployment

---

## 📋 Infrastructure Inventory (June 19, 2025)

### Complete AWS Resource List

#### Lambda Functions (12)
1. **VetROI_Recommend** - Career recommendations & O*NET integration
2. **VetROI_DD214_GenerateUploadURL** - Pre-signed S3 URLs
3. **VetROI_DD214_GetStatus** - Processing status check
4. **VetROI_DD214_GetInsights** - AI career insights retrieval
5. **VetROI_DD214_GetRedacted** - Redacted document access
6. **VetROI_DD214_Processor** - Textract OCR processing
7. **VetROI_DD214_Macie** - PII detection & redaction
8. **VetROI_DD214_Insights** - AI insights generation
9. **VetROI_S3_DD214_Trigger** - S3 event handler
10. **VetROI_ONET_Refresh** - O*NET data updates
11. **VetROI_DATA** - Data pipeline
12. **VetROI-BucketNotification-Function** - CloudFormation custom resource

#### DynamoDB Tables (5)
1. **VetROI_Sessions** - User session data
2. **VetROI_DD214_Processing** - DD214 processing status
3. **VetROI_CareerInsights** - AI-generated insights
4. **VetROI_Conversations** - Chat history
5. **VetROI_UserDocuments** - Document metadata

#### S3 Buckets (5)
1. **altroi-data** - O*NET career data lake
2. **vetroi-dd214-secure** - Encrypted DD214 uploads
3. **vetroi-dd214-redacted** - PII-removed documents
4. **vetroi-lambda-artifacts-****** - Lambda deployment packages
5. **amplify-vetroi-****** - Amplify hosting

#### API Gateway (2)
1. **jg5fae61lj** - HTTP API (Production)
2. **wzj49zuaaa** - REST API (Legacy)

#### Step Functions (3)
1. **VetROI-DD214-Processing** - DD214 workflow
2. **VetROI_DATA** - Data refresh pipeline
3. **VetROI_ONET_Refresh_prod** - Scheduled O*NET updates

#### Other Services
- **Cognito User Pool**: us-east-2_zVjrLf0jA
- **Cognito Identity Pool**: us-east-2:10f0038f-acb9-44c2-a433-c9aa12185217
- **Amplify App**: d34razwlkdgpdv
- **CloudFront Distribution**: vetroi.altivum.ai
- **Lex Bot**: SentraCareerBot (us-east-1)
- **Secrets Manager**: ONET credentials
- **SNS Topic**: vetroi-monitoring-alerts

---

## Recent Frontend Enhancements (June 19, 2025)

### ✅ UI/UX Improvements
1. **Fixed TM Visibility**: VetROI™ trademark now properly displays in welcome header
2. **Updated Welcome Messaging**: Clarified account benefits vs. free access
3. **Fixed Quote Flickering**: Career selection quotes now stable during scrolling
4. **Restored Confirmation Centering**: Fixed CSS alignment issues in confirmation step

### ✅ DD214 Processing Engagement Modal
Revolutionary 2-3 minute wait time monetization:

1. **Engagement Options During Processing**:
   - Quick 2-question survey for market research
   - "Beyond the Assessment" book showcase with 15% discount (VETROI15)
   - AI podcast preview with Spotify integration
   - Real-time countdown and progress tracking

2. **Business Value Features**:
   - Poll data collection for product improvement
   - Book promotion with Stop Soldier Suicide donation tracking
   - Spotify audiobook 5-minute preview embed
   - Future ad space potential

3. **Technical Implementation**:
   - ProcessingEngagementModal component with multiple views
   - Smooth transitions between engagement options
   - Progress bar synced with actual processing time
   - "Continue waiting quietly" option for user preference

### ✅ Repository Optimization
- Cleaned 1.1GB of build artifacts (1.4GB → 325MB)
- Removed 4,600+ unnecessary files
- Maintained full functionality
- Created timestamped backup before cleanup

---

---

## Nova Lite Enhancements (June 20, 2025)

### Prompt Engineering
- Expanded prompts from 500 to 2000+ words
- Increased token limit to 8000 for comprehensive responses
- Role-based prompting ("elite military career strategist")
- Structured JSON output with 50+ data points per veteran

### Intelligence Modules
1. **Traditional Career Paths**: Companies, salaries, 90-day plans
2. **Risk Assessment**: Automation, burnout, ethical conflicts
3. **Narrative Building**: Investor pitches, TED talks, viral content
4. **Future-Proofing**: 2035 careers, AI-hybrid businesses
5. **Entrepreneurship**: Business models, federal contracting

### Output Quality
- **Before**: Generic recommendations ($70K roles)
- **After**: Specific intelligence ($130K+ opportunities)
- Includes negotiation scripts, networking contacts, weekly action plans
- Transforms imposter syndrome into executive confidence

### Files Created
- `lambda/dd214_insights/src/enhanced_prompts.py` - Prompt library
- `DD214_ENHANCED_OUTPUT_EXAMPLE.md` - Shows transformation
- `NOVA_LITE_ENHANCEMENT_SUMMARY.md` - Technical details

---

*Last Updated: June 20, 2025 - After Nova Lite enhancement implementation*