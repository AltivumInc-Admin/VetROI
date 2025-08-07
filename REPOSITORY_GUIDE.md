# 🗺️ VetROI™ Repository Guide

## Quick Navigation
- 🚀 [Live Application](https://vetroi.altivum.ai)
- 📋 [Main Documentation](README.md)
- 🛠️ [Development Guide](DEVELOPMENT.md)
- 📁 [All Documentation](/docs)

---

## 📊 Repository Structure Overview

```
VetROI/
├── 📱 frontend/                    # React 18 + TypeScript Application
├── ⚡ lambda/                      # AWS Lambda Functions (Python)
├── 🏗️ infrastructure/             # CloudFormation & IaC
├── 📚 docs/                       # Organized Documentation
├── 🔧 scripts/                    # Deployment & Utility Scripts
├── 🌐 api-gateway/                # API Gateway Configurations
├── 💾 dynamodb-schemas/           # Database Table Schemas
├── 🪣 s3-policies/                # S3 Bucket Policies
├── 🚀 sam-templates/              # SAM Deployment Templates
├── 📄 README.md                   # Project Overview
├── 🛠️ DEVELOPMENT.md              # Development Instructions
├── 📍 REPOSITORY_GUIDE.md         # This File
└── ⚖️ LICENSE                     # Business Source License 1.1 (BUSL-1.1)

Hidden but Important:
├── 🔐 .github/                    # GitHub Actions (CI/CD)
├── 🚫 .gitignore                  # Version Control Rules
├── 📝 .gitattributes              # Git file handling rules
├── 🏭 .aws-sam/                   # SAM Build Artifacts
├── 💻 mcp-servers/                # MCP development servers
├── 📊 generated-diagrams/         # Auto-generated diagrams
└── 🔑 secrets/                    # Local secrets (git-ignored)
```

---

## 🎯 Key Code Locations

### 🌟 Frontend Application (`/frontend`)
```
frontend/
├── src/
│   ├── 🎨 components/           # All React Components
│   │   ├── VeteranForm.tsx      # ⭐ Initial veteran profile form
│   │   ├── CareerMatchDisplay.tsx # ⭐ Main career results display
│   │   ├── DD214Upload.tsx      # ⭐ DD214 document upload
│   │   ├── DD214InsightsView.tsx # ⭐ AI insights display
│   │   ├── SentraChat.tsx       # AI chat interface
│   │   └── AuthModal.tsx        # Authentication modal
│   │
│   ├── 🎯 App.tsx               # ⭐ Main app logic & routing
│   ├── 🔌 api.ts                # ⭐ All API calls to backend
│   ├── 🔧 aws-config.ts         # AWS Amplify configuration
│   └── 📝 types.ts              # TypeScript interfaces
│
├── 🎨 styles/                   # Component-specific CSS
├── 🌐 public/                   # Static assets
└── 📦 package.json              # Dependencies & scripts
```

**Key Frontend Files:**
- `App.tsx` - Main application flow and state management
- `api.ts` - All backend API interactions
- `VeteranForm.tsx` - Starting point for user journey
- `DD214Upload.tsx` - Document processing entry point

### ⚡ Lambda Functions (`/lambda`)
```
lambda/
├── 🎯 recommend/                # ⭐ Main O*NET Career Matching
│   ├── lambda_function.py       # Handler for /recommend & /career endpoints
│   └── requirements.txt         
│
├── 🔍 dd214_insights/           # ⭐ AI Insights Generation
│   └── src/
│       ├── lambda_function.py   # Nova Lite AI integration
│       ├── enhanced_prompts_v2.py # Dynamic prompt system
│       └── enhanced_prompts.py  
│
├── 📄 dd214_processor/          # ⭐ DD214 OCR Processing
│   └── src/
│       └── lambda_function.py   # Textract integration
│
├── 🛡️ dd214_macie/             # ⭐ PII Detection & Redaction
│   └── lambda_function.py       # Macie security scanning
│
├── 📤 dd214_upload/             # Pre-signed URL generation
├── 📊 dd214_status/             # Processing status checks
└── 🔄 s3_trigger/               # S3 event handler
```

**Key Lambda Functions:**
- `recommend/lambda_function.py` - O*NET API integration & career matching
- `dd214_insights/src/lambda_function.py` - AI-powered insights using Bedrock
- `dd214_processor/src/lambda_function.py` - Document text extraction
- `dd214_macie/lambda_function.py` - PII detection and redaction

### 🏗️ Infrastructure (`/infrastructure`)
```
infrastructure/
├── cloudformation/              # ⭐ AWS CloudFormation Templates
│   ├── vetroi-production-stack.yaml
│   ├── phase3-1-api-gateway.yaml
│   ├── phase3-2-stepfunctions.yaml
│   └── phase3-5-monitoring.yaml
│
├── cognito/                     # Authentication configuration
├── s3/                          # S3 CORS policies
└── lambda-configs/              # Lambda function configurations
```

### 🔄 Step Functions (`/sam-templates/statemachine`)
```
statemachine/
├── dd214_processing.asl.json    # ⭐ Complete DD214 workflow
└── onet_refresh.asl.json        # O*NET data refresh workflow
```

---

## 🚀 API Endpoints

### Production Base URL: `https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod`

| Endpoint | Method | Lambda Function | Purpose |
|----------|---------|----------------|---------|
| `/recommend` | POST | VetROI_Recommend | Get 25 career matches |
| `/career/{socCode}` | GET | VetROI_Recommend | Get detailed career info |
| `/dd214/upload-url` | POST | VetROI_DD214_GenerateUploadURL | Get S3 upload URL |
| `/dd214/status/{id}` | GET | VetROI_DD214_GetStatus | Check processing status |
| `/dd214/insights/{id}` | GET | VetROI_DD214_GetInsights | Get AI insights |

---

## 💾 Database Schemas (`/dynamodb-schemas`)

| Table | Purpose | Key Attributes |
|-------|---------|----------------|
| `VetROI_Sessions` | User session data | session_id, profile, timestamp |
| `VetROI_DD214_Processing` | Document processing status | document_id, status, extracted_fields |
| `VetROI_CareerInsights` | AI-generated insights | document_id, ai_insights, legacy_report |
| `VetROI_Conversations` | Chat history | conversation_id, messages |
| `VetROI_UserDocuments` | Document metadata | user_id, document_id, upload_date |

---

## 📚 Documentation Structure (`/docs`)

```
docs/
├── 🏛️ architecture/            # System design & infrastructure
├── 🚀 deployment-guides/        # How to deploy & maintain
├── 💡 implementation/           # Development roadmaps
├── 🤖 ai-ml/                   # AI/ML enhancement docs
├── 🎯 product-vision/          # Product strategy & UI/UX
├── 💰 cost-tracking/           # AWS cost analysis
└── 🧹 cleanup/                 # Maintenance procedures
```

---

## 🔧 Utility Scripts (`/scripts`)

| Script | Purpose |
|--------|---------|
| `deploy_infrastructure.sh` | Deploy CloudFormation stacks |
| `track_dd214_costs.py` | Monitor DD214 processing costs |
| `tag_all_resources.sh` | Apply cost tracking tags |
| `deploy_enhanced_dd214_insights.sh` | Deploy AI enhancements |
| `diagram-generators/` | Python scripts for architecture diagrams |

---

## 🎯 Quick Start for Developers

1. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev  # Starts on http://localhost:5173
   ```

2. **Lambda Development**
   ```bash
   cd lambda/recommend
   pip install -r requirements.txt
   python -m src.lambda_function  # Test locally
   ```

3. **Deploy to AWS**
   ```bash
   sam build
   sam deploy --guided
   ```

---

## 🔍 Where to Find...

- **User Authentication Logic**: `frontend/src/contexts/AuthContext.tsx`
- **API Integration**: `frontend/src/api.ts`
- **O*NET Integration**: `lambda/recommend/lambda_function.py`
- **AI Prompts**: `lambda/dd214_insights/src/enhanced_prompts_v2.py`
- **Cost Tracking**: `scripts/track_dd214_costs.py`
- **CloudFormation Templates**: `infrastructure/cloudformation/`
- **Environment Variables**: Check `DEVELOPMENT.md`

---

## 📦 Key Dependencies

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- AWS Amplify (authentication)
- React Router (navigation)

### Backend
- Python 3.12
- AWS SDK (boto3)
- Amazon Bedrock (AI)
- AWS Textract (OCR)

---

## 🚨 Important Notes

1. **Secrets**: Never commit AWS credentials. Use AWS Secrets Manager.
2. **Environment Variables**: Set in Amplify Console and Lambda configs.
3. **CORS**: Handled by Lambda functions, not API Gateway.
4. **Authentication**: AWS Cognito with Amplify integration.

---

Last Updated: June 2025 | Production-Grade Serverless Platform