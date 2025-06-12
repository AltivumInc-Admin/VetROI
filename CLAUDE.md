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

## Current Architecture Status

### ✅ Phase 1: AI-Powered MVP (COMPLETED June 2025)

#### Production Frontend
- **Production URL**: https://vetroi.altivum.ai (custom domain)
- **Amplify URL**: https://main.d34razwlkdgpdv.amplifyapp.com
- **Technology**: React 18 + TypeScript + Vite
- **Hosting**: AWS Amplify with CI/CD from GitHub
- **Features Implemented**:
  - Veteran profile intake (branch, MOS, education, location)
  - **AI-powered chat interface** using Amazon Nova Lite
  - Real-time conversational career guidance
  - Responsive design with WCAG AAA compliance (12.8:1 contrast)
  - Custom VetROI™ branding and favicon
  - Full text selection support in chat interface
  - O*NET attribution and data source acknowledgment

#### Production Backend
- **API Endpoint**: https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend
- **Lambda Function**: `VetROI_Recommend` (Python 3.12, 512MB, 30s timeout)
- **AI Integration**: Amazon Bedrock with Nova Lite model (`amazon.nova-lite-v1:0`)
- **Current Capabilities**:
  - Dynamic prompt building from veteran profile
  - Conversational AI responses
  - Context-aware career guidance
  - Graceful error handling with fallback responses
  - O*NET API client ready (credentials pending)

#### Infrastructure Components
```
AWS Services Deployed:
├── Lambda: VetROI_Recommend (with Bedrock permissions)
├── API Gateway: HTTP API with CORS enabled
├── DynamoDB: VetROI_Sessions table (ready for integration)
├── IAM Roles: VetROI-Lambda-ExecutionRole with Bedrock access
├── S3 Buckets: 
│   ├── vetroi-lambda-artifacts-205930636302 (Lambda deployment)
│   └── altroi-data (O*NET career data lake)
├── Amplify App: d34razwlkdgpdv (VetROI™)
├── CloudFront: Custom domain distribution
└── ACM: SSL certificate for vetroi.altivum.ai
```

### DNS Configuration
```
Cloudflare DNS Records:
├── CNAME: vetroi → d36tct6k8zn76l.cloudfront.net (DNS only)
└── CNAME: _c3d57ccff4c6d1122518abe807a67b61.vetroi → ACM validation (DNS only)
```

---

## Data Architecture & Pipeline

### 🎯 O*NET Data Lake (COMPLETED)

We've built a comprehensive career intelligence data pipeline that transforms VetROI™ from a simple chatbot into a data-driven career advisory platform.

#### Data Pipeline Components
```yaml
Step Functions Workflow:
├── ReadMasterSOCList: Processes 1,139 O*NET occupations
├── ProcessSOCChunk: Parallel processing with 10x concurrency
├── FetchONETData: Career details, salary, outlook, skills
├── FetchMilitaryData: Military-civilian crosswalk
├── StoreInS3: Enriched data cached in S3
└── MonitoringAlerts: SNS notifications for updates
```

#### S3 Data Structure
```
s3://altroi-data/
├── soc-details/
│   ├── 11-1011.00.json  # Chief Executives
│   ├── 29-1141.00.json  # Registered Nurses
│   └── ... (1,139 total occupations)
├── master-soc-list/
│   └── onet_soc_codes.csv
└── military-crosswalk/
    └── crosswalk-cache.json
```

#### Data Schema Per Occupation
```json
{
  "soc": "29-1141.00",
  "title": "Registered Nurses",
  "last_updated": "2025-06-11T16:34:51.046562+00:00",
  "data": {
    "report_raw": {
      "career": {
        "what_they_do": "...",
        "on_the_job": { "task": [...] },
        "career_video": true
      },
      "knowledge": { /* Required knowledge areas */ },
      "skills": { /* Essential skills */ },
      "abilities": { /* Key abilities */ },
      "personality": { /* Work styles and interests */ },
      "technology": { /* Tools and software */ },
      "education": {
        "job_zone": 4,
        "education_usually_needed": ["bachelor's degree"],
        "apprenticeships": { /* Available programs */ }
      },
      "job_outlook": {
        "outlook": { "category": "Bright" },
        "salary": {
          "annual_median": 93600,
          "annual_10th_percentile": 66030,
          "annual_90th_percentile": 135320,
          "hourly_median": 45
        }
      },
      "check_out_my_state": {
        /* State-specific employment data */
        "above_average": { "state": [...] },
        "average": { "state": [...] },
        "below_average": { "state": [...] }
      }
    },
    "military_service_details": [
      /* All military codes that map to this occupation */
      {
        "branch": "army",
        "code": "68C",
        "title": "Practical Nursing Specialist",
        "active": true
      }
    ]
  }
}
```

#### Military Crosswalk API
```
GET /crosswalks/military?keyword=18D
→ Returns 25 civilian career matches with bright outlook indicators
```

---

## 🚧 Phase 2: Data Intelligence Implementation (IN PROGRESS)

### 1. Two-Stage Career Discovery Engine 🔍
**Timeline**: 3-4 days  
**Status**: Architecture designed, ready for implementation

#### Stage 1: MOS → Career Options
```python
# User inputs military code
veteran_input: "18D" (Special Forces Medical Sergeant)
            ↓
# O*NET Crosswalk API returns matches
crosswalk_results: [
  {"code": "29-1141.00", "title": "Registered Nurses", "bright_outlook": true},
  {"code": "29-2042.00", "title": "Emergency Medical Technicians", "bright_outlook": true},
  {"code": "11-9111.00", "title": "Medical and Health Services Managers"},
  # ... up to 25 matches
]
            ↓
# AI presents top 5 with context
```

#### Stage 2: Career → Deep Intelligence
```python
# User selects career
selected: "29-1141.00"
         ↓
# Fetch from S3 data lake
career_intelligence: {
  "salary_by_state": { /* 50 states + territories */ },
  "education_paths": [ /* Specific programs */ ],
  "military_matches": [ /* Which MOS codes qualify */ ],
  "growth_outlook": "6% (faster than average)",
  "automation_risk": "Low"
}
         ↓
# AI provides hyper-personalized guidance
```

### 2. ROI Calculation Engine 💰
**Timeline**: 2-3 days  
**Status**: Algorithm designed

#### Core Components
```typescript
interface ROICalculation {
  // Investment Analysis
  educationCost: number
  educationDuration: number // months
  opportunityCost: number // lost income during education
  
  // GI Bill Benefits
  tuitionCoverage: number // Post-9/11 GI Bill
  monthlyHousingAllowance: number // BAH by zip code
  bookStipend: number
  yellowRibbonMatch?: number
  
  // Return Projections
  currentMilitaryPay: number
  entryLevelCivilianPay: number
  fiveYearProjectedPay: number
  tenYearProjectedPay: number
  
  // ROI Metrics
  breakEvenMonth: number
  fiveYearROI: number // percentage
  tenYearROI: number // percentage
  lifetimeEarningsDelta: number
  
  // Risk Factors
  jobGrowthRate: number
  automationProbability: number
  locationQuotient: number // demand in chosen state
  
  // Final Score
  vetROIScore: number // 0-100
}
```

#### Scoring Algorithm
```python
def calculate_vetroi_score(roi_data):
    # Weighted factors
    weights = {
        'break_even_speed': 0.25,      # How fast you recoup investment
        'five_year_roi': 0.30,          # Medium-term financial gain
        'job_security': 0.20,           # Growth rate + automation risk
        'education_efficiency': 0.15,    # GI Bill coverage percentage
        'location_match': 0.10          # Job availability in desired state
    }
    
    # Normalize each factor to 0-100
    scores = {
        'break_even_speed': max(0, 100 - (break_even_months * 2)),
        'five_year_roi': min(100, five_year_roi / 5),
        'job_security': (growth_rate * 5) + (100 - automation_risk),
        'education_efficiency': gi_bill_coverage_percent,
        'location_match': location_quotient * 50
    }
    
    # Calculate weighted score
    vetroi_score = sum(scores[k] * weights[k] for k in weights)
    
    return round(vetroi_score)
```

### 3. Progressive Intelligence UI/UX 🎨
**Timeline**: 2-3 days  
**Status**: Components designed

#### Three-Stage Interface
```
1. Discovery Stage
   - Veteran inputs profile
   - AI greets and asks interests
   - Shows top 5 career matches from crosswalk
   
2. Exploration Stage  
   - User selects career
   - Deep data dive from S3
   - Salary comparisons, requirements, outlook
   
3. Action Stage
   - ROI calculation with score
   - Direct links to schools/certifications
   - One-click applications
```

#### Key UI Components
- **CareerCard**: Clickable cards with bright outlook badges
- **ROICalculator**: Interactive calculator with GI Bill integration  
- **ActionLinks**: Direct pathways to education/jobs
- **ComplexityToggle**: Show/hide data pipeline details

### 4. Session Persistence & Analytics 📊
**Timeline**: 1-2 days  
**Status**: DynamoDB table exists

#### Session Schema
```python
{
    'session_id': str,          # UUID
    'timestamp': int,           # Unix timestamp
    'veteran_profile': {
        'branch': str,
        'code': str,           # MOS/Rate/AFSC
        'state': str,
        'education': str,
        'relocate': bool
    },
    'conversation_history': [
        {
            'role': str,        # user/assistant
            'content': str,
            'timestamp': int,
            'metadata': dict    # Career selections, ROI calculations
        }
    ],
    'careers_explored': [
        {
            'soc': str,
            'title': str,
            'roi_score': int,
            'explored_at': int
        }
    ],
    'actions_taken': [
        {
            'type': str,        # school_apply, cert_info, job_search
            'target': str,      # URL or resource
            'timestamp': int
        }
    ],
    'ttl': int                 # 90 days retention
}
```

### 5. Enhanced Lambda Architecture 🏗️
**Timeline**: 1 day  
**Status**: Ready to implement

#### Lambda Layer Structure
```
vetroi-data-layer/
├── python/
│   ├── onet_client.py
│   ├── onet_s3_integration.py
│   ├── roi_calculator.py
│   ├── gi_bill_calculator.py
│   └── session_manager.py
```

#### Environment Variables
```bash
# O*NET Configuration
ONET_USERNAME=<from_secrets_manager>
ONET_PASSWORD=<from_secrets_manager>

# S3 Configuration  
DATA_BUCKET=altroi-data
SOC_PREFIX=soc-details/

# DynamoDB
TABLE_NAME=VetROI_Sessions

# Feature Flags
ENABLE_ROI_CALC=true
ENABLE_SESSION_PERSISTENCE=true
```

---

## 🎯 Phase 3: Production Enhancement (PLANNED)

### 1. Real-Time Data Sync
- **EventBridge**: Daily O*NET data refresh
- **Change Detection**: Track salary/outlook changes
- **Notification**: Alert users to new opportunities

### 2. Machine Learning Enhancement
- **SageMaker**: Train on successful transitions
- **Personalization**: Learn from user choices
- **Recommendation Engine**: Improve match quality

### 3. Enterprise Features
- **Bulk Processing**: Unit/base-wide analysis
- **White Label**: Custom branding for partners
- **API Access**: Integration with TAP programs

### 4. Advanced Analytics
- **QuickSight Dashboards**: Aggregate insights
- **Athena Queries**: S3 data lake analysis
- **Predictive Models**: Success probability scores

---

## Implementation Roadmap

### Week 1: Data Pipeline Integration (Current)
- [x] O*NET API client implementation
- [x] S3 data lake structure design
- [ ] Lambda integration with S3 data
- [ ] Military crosswalk implementation
- [ ] Two-stage query optimization

### Week 2: Intelligence Layer
- [ ] ROI calculation engine
- [ ] GI Bill benefits calculator
- [ ] Education provider matching
- [ ] State-specific adjustments
- [ ] Risk factor analysis

### Week 3: UI/UX Enhancement
- [ ] Progressive disclosure interface
- [ ] Career exploration components
- [ ] ROI visualization
- [ ] Action link generation
- [ ] Mobile optimization

### Week 4: Production Hardening
- [ ] Session persistence
- [ ] Analytics pipeline
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing

---

## Success Metrics

### Technical KPIs
- ✅ 1,139 occupations indexed
- ✅ <100ms S3 data retrieval
- ✅ 99.9%+ availability
- ⬜ <3s end-to-end response time
- ⬜ 90% cache hit rate

### Business KPIs
- ⬜ Average ROI score presented
- ⬜ Careers explored per session
- ⬜ Action links clicked
- ⬜ Return user rate
- ⬜ Successful transitions tracked

### Data Quality Metrics
- ✅ 100% SOC coverage
- ✅ Military crosswalk accuracy
- ⬜ Salary data freshness (<30 days)
- ⬜ Education provider accuracy
- ⬜ State-specific data coverage

---

## Competitive Advantages

1. **Comprehensive Data Lake**: 1,139 occupations with deep intelligence
2. **Military-Specific Crosswalk**: Direct MOS to civilian mapping
3. **ROI Calculation**: Concrete financial projections, not just recommendations
4. **GI Bill Integration**: Accurate benefit calculations by state
5. **Real-Time Intelligence**: Live O*NET data, not stale databases
6. **Serverless Scale**: No infrastructure limits
7. **AI + Data**: Nova Lite enhanced with real DOL data

---

## Cost Projections (Updated)

| Service | Monthly Volume | Estimated Cost |
|---------|---------------|----------------|
| Lambda | 100,000 invocations | $2.00 |
| API Gateway | 100,000 requests | $3.50 |
| DynamoDB | 5GB, On-Demand | $6.50 |
| S3 Storage | 10GB career data | $0.23 |
| S3 Requests | 500,000 GET | $0.20 |
| Bedrock | 100,000 API calls | $50.00 |
| Step Functions | 30 executions | $0.75 |
| **Total** | | **~$63/month** |

*Note: Scales linearly. At 1M users: ~$630/month*

---

## Team & Support

**Founder & Technical Lead**: Christian Perez (christian.perez@altivum.io)  
**Company**: Altivum Inc.  
**Mission**: Empowering veterans through data-driven career transformation

**Repository**: https://github.com/AltivumInc-Admin/VetROI  
**Production URL**: https://vetroi.altivum.ai  
**Trademark**: VetROI™ is a registered trademark of Altivum Inc.

---

*This is a living document representing Altivum Inc.'s flagship product strategy and implementation.*

*Last Updated: June 12, 2025*