# VetROI - Validated Infrastructure Description
## Official Technical Architecture Reference
**DO NOT MODIFY WITHOUT EXPLICIT APPROVAL**

---

## Overview
VetROI is a production-grade serverless application that helps veterans translate their military experience into civilian career opportunities. The application uses 9 Lambda functions orchestrated through API Gateway and Step Functions.

---

## User Journey

### 1. Career Discovery Flow
**Entry Point**: https://vetroi.altivum.ai

1. Veteran enters profile information:
   - Branch of service
   - Military Occupational Specialty (MOS/Rate/AFSC)
   - Education level
   - Home state
   - Relocation preference

2. **API Call**: POST /recommend
   - **Lambda**: VetROI_Recommend
   - **Action**: Calls O*NET API to translate military code to civilian careers
   - **Returns**: 25 career matches with basic information
   - **Stores**: Session data in DynamoDB

3. Veteran selects careers to explore

4. **API Call**: GET /career/{socCode}
   - **Lambda**: VetROI_Recommend (same function, different route)
   - **Action**: Calls O*NET API for detailed career report
   - **Returns**: Full career details (salary, growth, skills, education)

### 2. DD214 Processing Flow
**Entry Point**: DD214 Upload component (requires authentication)

1. **Authentication**: Cognito User Pool login

2. **API Call**: POST /dd214/upload-url
   - **Lambda**: VetROI_DD214_GenerateUploadURL
   - **Action**: Generates pre-signed S3 URL
   - **Returns**: Upload URL and documentId

3. **Direct Upload**: Browser → S3 (vetroi-dd214-secure bucket)

4. **S3 Event Trigger**:
   - **Lambda**: VetROI_S3_DD214_Trigger
   - **Action**: Starts Step Function execution

5. **Step Function Workflow**:
   
   a. **Text Extraction**:
      - **Lambda**: VetROI_DD214_Processor
      - **Service**: Amazon Textract
      - **Action**: OCR processing of DD214
      - **Stores**: Extracted text in DynamoDB
   
   b. **PII Detection & Redaction**:
      - **Lambda**: VetROI_DD214_Macie
      - **Service**: Amazon Macie
      - **Action**: Identifies and redacts SSN, addresses, etc.
      - **Stores**: Redacted document in vetroi-dd214-redacted bucket
   
   c. **AI Analysis**:
      - **Lambda**: VetROI_DD214_Insights
      - **Service**: Amazon Bedrock (Nova Lite)
      - **Action**: Generates career insights from DD214 data
      - **Stores**: Insights in DynamoDB

6. **Result Access**:
   - **API Call**: GET /dd214/status/{documentId}
     - **Lambda**: VetROI_DD214_GetStatus
   - **API Call**: GET /dd214/insights/{documentId}
     - **Lambda**: VetROI_DD214_GetInsights
   - **API Call**: GET /dd214/redacted/{documentId}
     - **Lambda**: VetROI_DD214_GetRedacted

### 3. Sentra Chat (Lex Integration)
**Entry Point**: "What's my next mission?" button in SentraChat component

1. **API Call**: POST /recommend with `action: 'lexMission'`
   - **Lambda**: VetROI_Recommend (acts as Lex proxy)
   - **Action**: Calls Amazon Lex bot in us-east-1
   - **Bot**: SentraCareerBot (ID: IV2NSREVFS)
   - **Message**: "What is my next mission?"
   - **Returns**: Lex response directing to NextMission.ai

---

## Infrastructure Components

### Lambda Functions (9 Total)
1. **VetROI_Recommend** - Career matching (handles 2 endpoints)
2. **VetROI_DD214_GenerateUploadURL** - Pre-signed URL generation
3. **VetROI_DD214_GetStatus** - Processing status check
4. **VetROI_DD214_GetInsights** - Retrieve AI insights
5. **VetROI_DD214_GetRedacted** - Access redacted document
6. **VetROI_DD214_Processor** - Textract OCR processing
7. **VetROI_DD214_Macie** - PII detection/redaction
8. **VetROI_DD214_Insights** - AI career analysis
9. **VetROI_S3_DD214_Trigger** - S3 event handler

### API Gateways
- **HTTP API**: jg5fae61lj (Career discovery endpoints)
- **REST API**: wzj49zuaaa (DD214 endpoints)

### Storage
- **S3 Buckets**:
  - vetroi-dd214-secure (encrypted uploads)
  - vetroi-dd214-redacted (PII removed)
- **DynamoDB Tables**:
  - VetROI_Sessions
  - VetROI_DD214_Processing
  - VetROI_CareerInsights
  - VetROI_Conversations
  - VetROI_UserDocuments

### Orchestration
- **Step Function**: VetROI-DD214-Processing

### External Services
- **O*NET API**: Real-time career data (no caching)
- **Amazon Textract**: Document OCR
- **Amazon Macie**: PII detection
- **Amazon Bedrock**: AI insights (Nova Lite model)
- **Amazon Lex**: SentraCareerBot (us-east-1)

### Authentication
- **Cognito User Pool**: us-east-2_zVjrLf0jA
- **Cognito Identity Pool**: us-east-2:10f0038f-acb9-44c2-a433-c9aa12185217

### Frontend
- **Amplify App**: d34razwlkdgpdv
- **Technology**: React + TypeScript + Vite
- **Deployment**: GitHub → Amplify CI/CD

---

## Data Flow Summary

1. **Career Discovery**: 
   Frontend → API Gateway → Lambda → O*NET API → Lambda → DynamoDB → Frontend

2. **DD214 Upload**: 
   Frontend → API Gateway → Lambda → S3 Pre-signed URL → Frontend → S3

3. **DD214 Processing**: 
   S3 Event → Lambda → Step Function → [Textract → Macie → Bedrock] → DynamoDB

4. **Results Retrieval**: 
   Frontend → API Gateway → Lambda → DynamoDB/S3 → Frontend

5. **Lex Mission**: 
   Frontend → API Gateway → Lambda → Amazon Lex (us-east-1) → Lambda → Frontend

---

## Important Notes
- NO data lake or cached O*NET data - all API calls are real-time
- NO background refresh processes
- Lambda functions deployed individually (not via SAM/CloudFormation in production)
- All services in us-east-2 except Lex bot (us-east-1)
- VetROI_Recommend Lambda handles BOTH career endpoints AND Lex proxy functionality
- Altivum_Lex_Gateway Lambda (us-east-1) is NOT part of VetROI

---

**Last Validated**: June 19, 2025
**Status**: PRODUCTION ACCURATE