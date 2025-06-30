# Evolution of VetROI Architecture

This folder contains historical architecture diagrams showing the evolution of VetROI's serverless architecture.

## Contents

### vetroi_architecture.png
The original VetROI architecture diagram showing the serverless infrastructure before the USAJOBS API integration. This diagram illustrates:
- 9 Lambda functions for document processing
- Step Functions orchestration
- S3 storage for DD214 documents
- DynamoDB for session management
- Amazon Textract, Macie, and Bedrock integration

### vetroi_lambda_focus.png
A detailed view of the Lambda functions and their interactions within the VetROI system, showing:
- Document upload and processing flow
- PII redaction pipeline
- AI insights generation
- Career recommendation engine
- Real-time status updates

## Architecture Evolution

The VetROI architecture has evolved to include additional features:
1. **Original Release**: Core DD214 processing with AI-powered career insights
2. **USAJOBS Integration**: Added federal job search capabilities
3. **Enhanced AI Models**: Upgraded to Amazon Nova Lite for improved insights

These diagrams represent the foundation upon which VetROI was built, demonstrating our commitment to serverless, scalable, and secure architecture patterns.