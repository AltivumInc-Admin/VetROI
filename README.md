# VetROI™ - Veteran Return on Investment Career Platform

> **AWS Lambda Hackathon 2025 Submission**  
> Transform military experience into civilian career success with AI-powered intelligence

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-orange.svg)](https://aws.amazon.com/lambda/)
[![Powered by Bedrock](https://img.shields.io/badge/Powered%20by-Amazon%20Bedrock-purple.svg)](https://aws.amazon.com/bedrock/)

## 🎯 The Challenge

200,000+ veterans transition to civilian life annually, facing:
- 41% underemployment rate
- Average 6-month job search
- $65,000 average salary vs. $92,000 potential

**VetROI™** solves this with data-driven career intelligence, not just job matching.

## 🚀 Live Demo

**Production URL**: [https://vetroi.altivum.ai](https://vetroi.altivum.ai)

## 🏗️ Architecture

### 100% Serverless on AWS Lambda

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   React     │────▶│ API Gateway  │────▶│   Lambda    │
│  Frontend   │     │   (HTTP)     │     │  Function   │
└─────────────┘     └──────────────┘     └─────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────┐
                    │                            │                │
                    ▼                            ▼                ▼
            ┌──────────────┐           ┌──────────────┐  ┌──────────────┐
            │   Amazon     │           │   O*NET      │  │  DynamoDB    │
            │   Bedrock    │           │   API        │  │  Sessions    │
            └──────────────┘           └──────────────┘  └──────────────┘
```

### Core Lambda Function
- **VetROI_Recommend**: Processes veteran profiles in <1s
- Python 3.12 runtime, 512MB memory
- Integrates O*NET career data with AI recommendations
- Handles 1000+ concurrent requests

## 🛠️ Tech Stack

### Backend (Serverless)
- **AWS Lambda**: Core compute for all business logic
- **Amazon Bedrock**: Nova Lite model for AI-powered matching
- **API Gateway**: RESTful endpoints with CORS
- **DynamoDB**: Session persistence (on-demand pricing)
- **Python 3.12**: Lambda runtime with boto3 SDK

### Frontend
- **React 18**: Modern UI with TypeScript
- **Vite**: Lightning-fast build tooling
- **AWS Amplify**: CI/CD and hosting
- **Canvas API**: Data visualizations

### Data Pipeline
- **O*NET Web Services**: Real-time career data
- **Step Functions**: Orchestrated data refresh
- **S3 Data Lake**: 1,139 occupations indexed

## 📦 Installation

### Prerequisites
- AWS Account with appropriate permissions
- Node.js 18+ and npm
- Python 3.12
- AWS CLI configured

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/AltivumInc-Admin/VetROI.git
   cd VetROI
   ```

2. **Deploy Lambda function**
   ```bash
   cd lambda/recommend
   pip install -r requirements.txt -t package/
   cp lambda_function.py package/
   cd package && zip -r ../deployment.zip . && cd ..
   
   # Deploy via AWS Console or CLI
   aws lambda create-function \
     --function-name VetROI_Recommend \
     --runtime python3.12 \
     --handler lambda_function.lambda_handler \
     --zip-file fileb://deployment.zip \
     --role arn:aws:iam::YOUR_ACCOUNT:role/VetROI-Lambda-ExecutionRole
   ```

3. **Configure O*NET credentials in Lambda environment**
   ```
   ONET_USERNAME=your_username
   ONET_PASSWORD=your_password
   ```

4. **Deploy frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   # Deploy dist/ to S3 or Amplify
   ```

## 🎮 Usage

1. **Veteran Profile Input**
   - Select military branch and occupation code (MOS/AFSC/Rate)
   - Choose current location and education level
   - Indicate relocation preferences

2. **AI-Powered Analysis**
   - Instant matching to civilian careers
   - Salary projections with percentile ranges
   - Location-based job market analysis
   - Bright Outlook career indicators

3. **Detailed Intelligence**
   - Side-by-side state comparisons
   - Education requirements and pathways
   - Growth projections and automation risk
   - Related career exploration

## 💡 Key Features

### 🎯 Military-Civilian Translation
- Direct MOS/AFSC/Rate to O*NET mapping
- 25+ career matches per military role
- Skill transferability analysis

### 📊 Data Visualizations
- Salary curves (10th/50th/90th percentiles)
- Location quotient comparisons
- Job growth indicators

### 🤖 AI Enhancement
- Amazon Bedrock Nova Lite integration
- Conversational career guidance
- Personalized next-step recommendations

### 📱 Responsive Design
- Mobile-first approach
- Dark theme with glassmorphic UI
- WCAG AAA compliance (12.8:1 contrast)

## 💰 Cost Efficiency

**Monthly costs for 10,000 active users:**

| Service | Usage | Cost |
|---------|-------|------|
| Lambda | 100,000 invocations | $2.00 |
| API Gateway | 100,000 requests | $3.50 |
| DynamoDB | 5GB, On-Demand | $6.50 |
| Bedrock | 100,000 API calls | $50.00 |
| **Total** | | **~$62/month** |

*Scales linearly: 100K users = ~$620/month*

## 🧪 Testing

```bash
# Test Lambda locally
cd lambda/recommend
python -m pytest tests/ -v

# Test frontend
cd frontend
npm run lint
npm run build
```

## 📈 Performance Metrics

- **Lambda Cold Start**: <800ms
- **Warm Response**: <200ms
- **Frontend Load**: <1.5s
- **99.9% Availability**

## 🛡️ Security

- IAM roles with least privilege
- API Gateway request validation
- Environment variables for secrets
- CORS configuration for frontend domain
- Input sanitization on all endpoints

## 📄 License

MIT License - see [LICENSE](LICENSE) file. VetROI™ is a trademark of Altivum Inc.

## 🙏 Acknowledgments

- **O*NET**: Career data provided by O*NET Web Services
- **AWS**: Infrastructure and AI services
- **Veterans**: Your service inspires our mission

## 👨‍💻 Author

**Christian Perez**  
Founder & CEO, Altivum Inc.  
Former U.S. Army Special Forces (18D)

---

Built with ❤️ for those who served. *Control the controllable and influence the variables.*