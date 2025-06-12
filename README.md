# VetROI™ - Military to Civilian Career Transition Assistant

Transform your military experience into civilian career success with AI-powered recommendations tailored to your unique background.

> VetROI™ is a trademark of Altivum Inc. All rights reserved.

## 🎯 Pitch

VetROI™ leverages AWS Lambda, Amazon Bedrock, and O*NET data to deliver personalized career recommendations for military veterans. Our serverless architecture processes veteran profiles in real-time, matching military skills to civilian opportunities with unprecedented accuracy. Built for the AWS Lambda Hackathon 2025.

## 🏗️ Architecture

![Architecture Diagram](docs/architecture.png)

### How We Use AWS Lambda

VetROI™ is built on a 100% serverless architecture with AWS Lambda at its core:

1. **VetROI_Recommend** (Primary Lambda): Processes veteran profiles, queries O*NET data, and generates AI-powered recommendations via Amazon Bedrock
2. **VetROI_DD214_Parser**: Extracts skills from DD-214 documents using Amazon Textract and Comprehend
3. **VetROI_ONET_Refresh**: Nightly synchronization of O*NET career data
4. **VetROI_Audit**: Monitors system health and generates analytics

All Lambda functions are triggered via Amazon API Gateway REST endpoints, ensuring scalable, pay-per-use operation.

### AWS Services Used

- **AWS Lambda**: Core compute engine for all backend logic
- **Amazon API Gateway**: RESTful API endpoints
- **Amazon Bedrock**: LLM-powered career matching (Claude 3 Sonnet)
- **Amazon DynamoDB**: Session and recommendation storage
- **Amazon S3**: Static website hosting and document storage
- **Amazon Textract**: DD-214 document processing
- **Amazon Comprehend**: Military skill extraction
- **AWS X-Ray**: Distributed tracing
- **Amazon CloudWatch**: Logging and monitoring
- **AWS Secrets Manager**: Secure credential storage

## 🚀 Prerequisites & Setup

### Requirements

- AWS Account with appropriate permissions
- AWS CLI configured
- AWS SAM CLI installed
- Node.js 18+ and npm
- Python 3.12

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/altivum/vetroi-hackathon.git
   cd vetroi-hackathon
   ```

2. **Deploy the backend**
   ```bash
   sam build --template sam-templates/template.yaml
   sam deploy --guided
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Set environment variables**
   Create `.env.local` in the frontend directory:
   ```
   VITE_API_URL=<Your API Gateway URL from SAM output>
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Environment Variables & Secrets

Configure the following in AWS Secrets Manager:
```json
{
  "username": "your-onet-username",
  "password": "your-onet-password"
}
```

Secret name: `VetROI/ONet/ApiCredentials`

## 🧪 Local Testing

### Test Lambda Functions Locally
```bash
sam local start-api
```

### Run Unit Tests
```bash
# Lambda tests
cd lambda/recommend
python -m pytest tests/ -v

# Frontend tests
cd frontend
npm run lint
```

### Test with Sample Request
```bash
curl -X POST http://localhost:3001/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "army",
    "code": "11B",
    "homeState": "TX",
    "relocate": false,
    "education": "bachelor"
  }'
```

## 🔄 CI/CD Pipeline

Our GitHub Actions workflow automates testing and deployment:

- **CI Pipeline**: Runs on every push
  - Python unit tests with pytest
  - Frontend linting and build validation
  - SAM template validation

- **CD Pipeline**: Deploys on merge to main
  - Builds and packages Lambda functions
  - Deploys SAM stack to AWS
  - Syncs frontend to S3/CloudFront

## 🎬 Demo Script

### 3-Minute Demo Video Walkthrough

1. **Introduction (0:00-0:30)**
   - Show VetROI™ homepage
   - Explain the veteran unemployment challenge
   - Highlight serverless architecture benefits

2. **Form Submission (0:30-1:30)**
   - Fill out veteran profile form
   - Select Army, MOS 11B (Infantry)
   - Choose Texas, Bachelor's degree
   - Submit and show loading state

3. **Results Display (1:30-2:30)**
   - Show 5 personalized career recommendations
   - Highlight salary information and match reasons
   - Demonstrate responsive chat interface

4. **Technical Deep Dive (2:30-3:00)**
   - Show AWS Console with Lambda functions
   - Display X-Ray trace of request flow
   - Show DynamoDB session storage

## 💰 Cost Analysis

Estimated monthly costs for 10,000 users:

| Service | Usage | Cost |
|---------|-------|------|
| Lambda | 50,000 invocations | $1.00 |
| API Gateway | 50,000 requests | $3.50 |
| DynamoDB | 1GB storage, 50K R/W | $2.50 |
| Bedrock | 50,000 API calls | $25.00 |
| S3/CloudFront | 10GB transfer | $1.00 |
| **Total** | | **$33.00** |

[Full AWS Pricing Calculator Link](https://calculator.aws/#/)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## ™ Trademark Notice

VetROI™ is a trademark of Altivum Inc. All rights reserved.

The VetROI™ name and logo are proprietary trademarks of Altivum Inc. and may not be used without express written permission. All other trademarks mentioned in this repository are the property of their respective owners.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📞 Support

- Create an issue in this repository
- Email: support@vetroi.example.com
- AWS Lambda Hackathon Discord: #vetroi-team

---

Built with ❤️ for the AWS Lambda Hackathon 2025 by Altivum Inc.