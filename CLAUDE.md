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

#### Production Backend
- **API Endpoint**: https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod/recommend
- **Lambda Function**: `VetROI_Recommend` (Python 3.12, 512MB, 30s timeout)
- **AI Integration**: Amazon Bedrock with Nova Lite model (`amazon.nova-lite-v1:0`)
- **Current Capabilities**:
  - Dynamic prompt building from veteran profile
  - Conversational AI responses
  - Context-aware career guidance
  - Graceful error handling with fallback responses

#### Infrastructure Components
```
AWS Services Deployed:
├── Lambda: VetROI_Recommend (with Bedrock permissions)
├── API Gateway: HTTP API with CORS enabled
├── DynamoDB: VetROI_Sessions table (ready for integration)
├── IAM Roles: VetROI-Lambda-ExecutionRole with Bedrock access
├── S3 Buckets: vetroi-lambda-artifacts-205930636302
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

## Technical Implementation

### AI Conversation Flow
```python
# Veteran submits profile → AI contextualizes response
prompt_template = """You are VetROI™, an AI assistant specializing in helping military veterans transition to civilian careers.

VETERAN PROFILE:
- Branch of Service: {branch}
- Military Occupational Specialty (MOS/Rate/AFSC): {code}
- Current Location: {state}
- Education Level: {education}
- Willing to Relocate: {relocate}

YOUR ROLE:
1. Acknowledge their military service respectfully
2. Ask about their specific career interests or transition concerns
3. Provide guidance that connects their military skills to civilian opportunities
4. Be conversational, supportive, and practical
5. Focus on actionable next steps
"""
```

### Serverless Architecture Benefits
- **Zero Infrastructure Management**: 100% serverless stack
- **Infinite Scalability**: Handles 1 to 1M users automatically
- **Cost Efficiency**: ~$0.0006 per conversation
- **Global Performance**: CloudFront edge caching
- **Enterprise Security**: AWS managed security at every layer

---

## Phase 2: Enhanced Intelligence (IN PROGRESS)

### 1. O*NET API Integration 📊
**Status**: Next Priority  
**Impact**: Real-time labor market data

- Live salary data by location
- Military-civilian skill translation
- Industry growth projections
- Required certifications mapping

### 2. DynamoDB Conversation Memory 💾
**Status**: Table created, integration pending  
**Impact**: Personalized follow-ups

- Conversation history persistence
- Progress tracking
- Multi-session coaching
- Analytics dashboard

### 3. DD-214 Document Intelligence 📄
**Status**: Architecture designed  
**Impact**: Automated profile extraction

- Amazon Textract for OCR
- Amazon Comprehend for entity extraction
- Automatic MOS and skills identification
- Security clearance detection

---

## Production Metrics & Monitoring

### Current Performance
- **API Response Time**: ~2 seconds (with AI)
- **Availability**: 99.9%+ (AWS SLA)
- **AI Quality**: Nova Lite providing contextual, helpful responses
- **Cost per Session**: <$0.001

### Monitoring Strategy
```yaml
CloudWatch Dashboards:
  - Real-time API latency
  - Nova Lite token usage
  - User engagement funnel
  - Error rates by endpoint

Alarms:
  - Response time > 3s
  - Error rate > 1%
  - Bedrock throttling
  - SSL certificate expiry
```

---

## Revenue & Growth Strategy

### Monetization Roadmap
1. **Freemium Launch** (Current)
   - Free AI consultations
   - Build user base
   - Collect feedback

2. **Premium Features** (Q3 2025)
   - Unlimited conversations
   - Resume builder
   - Interview prep
   - Direct recruiter connections

3. **Enterprise Partnerships** (Q4 2025)
   - Military base integration
   - Corporate veteran hiring programs
   - White-label solutions
   - API licensing

### Market Opportunity
- **200,000** veterans transition annually
- **$15B** spent on veteran career services
- **67%** of veterans struggle with career translation
- **89%** would use AI-powered guidance (survey data)

---

## Development Workflow

### Local Development
```bash
# Frontend
cd frontend
npm install
npm run dev  # http://localhost:3000

# Backend Lambda testing
./deploy-bedrock.sh  # Deploys to AWS
```

### Production Deployment
```bash
# Frontend (automatic via Amplify)
git push origin main

# Backend Lambda update
./deploy-bedrock.sh

# Infrastructure changes
sam deploy --template sam-templates/template-production.yaml
```

### Environment Configuration
```bash
# Lambda Environment
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
TABLE_NAME=VetROI_Sessions
REGION=us-east-1  # Bedrock region

# Frontend Environment
VITE_API_URL=https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod
```

---

## Security & Compliance

### Current Security Posture
- **Data Encryption**: TLS 1.3 in transit, AES-256 at rest
- **No PII Storage**: Conversations are ephemeral (until DynamoDB integration)
- **CORS**: Restricted to production domains
- **IAM**: Least privilege access policies
- **SSL**: Amplify-managed certificates

### Compliance Roadmap
- [ ] SOC 2 Type II (planned)
- [ ] HIPAA compliance (for mental health features)
- [ ] VA data standards alignment
- [ ] GDPR compliance for international veterans

---

## Success Metrics

### Technical KPIs
- ✅ API response time < 2 seconds
- ✅ 99.9%+ uptime
- ✅ Zero infrastructure management
- ✅ WCAG AAA accessibility

### Business KPIs (Tracking)
- Daily active veterans
- Conversation completion rate
- Career match satisfaction
- Time to first application
- Veteran NPS score

---

## Competitive Advantages

1. **AI-First Approach**: Real conversational guidance vs static job boards
2. **Military-Native**: Built by veterans, for veterans
3. **Serverless Scale**: No infrastructure limits on growth
4. **Open Source + Commercial**: Community-driven development with enterprise features
5. **AWS Partnership**: Potential for AWS marketplace and co-marketing

---

## Team & Support

**Founder & Technical Lead**: Christian Perez (christian.perez@altivum.io)  
**Company**: Altivum Inc.  
**Mission**: Empowering veterans through AI-driven career transformation

**Repository**: https://github.com/AltivumInc-Admin/VetROI  
**Production URL**: https://vetroi.altivum.ai  
**Trademark**: VetROI™ is a registered trademark of Altivum Inc.

---

*This is a living document representing Altivum Inc.'s flagship product strategy and implementation.*

*Last Updated: June 12, 2025*