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

---

## 🚀 Next Phase: AI Career Counseling (Ready to Implement)

### Sentra - AI Career Counselor
When veteran clicks "Meet with Sentra" after exploring careers:

1. **Context Gathering**
   - Veteran profile
   - Careers viewed
   - Time spent on each
   - Selected careers of interest

2. **AI-Powered Conversation**
   - Uses Amazon Bedrock (Nova Lite)
   - Contextual understanding of military background
   - Personalized career guidance
   - Next steps and action items

3. **Integration Points**
   - New endpoint: POST /sentra/conversation
   - Bedrock integration (already have permissions)
   - Session continuity from DynamoDB

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

*Last Updated: June 16, 2025 - After successful Phase 1 & 2 implementation*