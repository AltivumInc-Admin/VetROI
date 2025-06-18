# DD214 Processing Pipeline with Amazon Macie

## Overview
The VetROI DD214 processing pipeline uses Amazon Macie for automatic PII detection and redaction. This ensures veteran privacy while extracting valuable career insights.

## Complete Flow

### 1. Document Upload
- Veteran uploads DD214 to S3 bucket: `vetroi-dd214-secure`
- File is encrypted at rest with AES256
- Pre-signed URL ensures secure upload

### 2. Textract Processing
- Step Function starts automatically via S3 event
- Amazon Textract extracts text from DD214 (PDF or image)
- Full text and structured data saved to S3
- Results include confidence scores and field mappings

### 3. Macie PII Detection (REAL Implementation)
- **Macie Classification Job** created for specific document
- Scans the uploaded DD214 in `vetroi-dd214-secure` bucket
- Detects standard PII types:
  - Social Security Numbers (SSN)
  - DoD ID Numbers
  - Addresses
  - Phone Numbers
  - Email Addresses
  - Dates of Birth
- Also identifies DD214-specific sensitive fields:
  - Home of Record
  - Place of Birth
  - Service Member Identification

### 4. PII Findings Processing
- Macie job runs asynchronously (typically 1-3 minutes)
- Lambda polls for job completion
- Findings include:
  - PII type and category
  - Number of occurrences
  - Confidence levels
  - Location within document

### 5. Document Redaction
- If PII found, redaction process begins
- Creates new version with [REDACTED] markers
- Preserves document structure and non-PII content
- Redacted document saved to: `vetroi-dd214-redacted`

### 6. LLM Insights Generation
- Bedrock/Nova processes ONLY the redacted content
- Generates career insights without exposure to PII
- Insights include:
  - Transferable skills
  - Recommended career paths
  - Certifications to pursue
  - Resume keywords

## Architecture Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   DD214     │     │   Textract   │     │   Macie     │
│   Upload    │────▶│  Processing  │────▶│  PII Scan   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐     ┌─────────────┐
                    │ S3: Secure   │     │   Macie     │
                    │   Bucket     │◀────│  Findings   │
                    └──────────────┘     └─────────────┘
                                                 │
                                                 ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│     LLM     │     │ S3: Redacted │     │  Redaction  │
│  Insights   │◀────│    Bucket    │◀────│   Lambda    │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Security Features

### Encryption
- All S3 buckets use AES256 encryption
- KMS permissions restricted to specific services
- Pre-signed URLs expire after 1 hour

### Access Control
- Separate buckets for original and redacted documents
- IAM policies enforce least privilege
- Macie service role has minimal permissions

### Compliance
- HIPAA-compliant infrastructure
- Audit trail in CloudTrail
- DynamoDB tracks all processing steps

## Lambda Functions

### VetROI_DD214_Processor
- Handles Textract results
- Extracts structured DD214 fields
- Saves results to S3 and DynamoDB

### VetROI_DD214_Macie
- Operations:
  - `scan`: Creates Macie classification job
  - `process_findings`: Retrieves and processes PII findings
  - `redact`: Creates redacted document version

### VetROI_DD214_Insights
- Processes redacted content through LLM
- Generates career recommendations
- Returns structured insights

## Environment Variables
```bash
SOURCE_BUCKET=vetroi-dd214-secure
REDACTED_BUCKET=vetroi-dd214-redacted
TABLE_NAME=VetROI_DD214_Processing
```

## IAM Permissions Required

### Macie Permissions
```json
{
  "Effect": "Allow",
  "Action": [
    "macie2:GetMacieSession",
    "macie2:CreateClassificationJob",
    "macie2:DescribeClassificationJob",
    "macie2:ListFindings",
    "macie2:GetFindings"
  ],
  "Resource": "*"
}
```

### S3 Permissions
- Read from source bucket
- Write to redacted bucket
- Generate pre-signed URLs

### KMS Permissions
- Decrypt for Macie service
- Encrypt for redacted documents

## Monitoring and Troubleshooting

### CloudWatch Logs
- Lambda execution logs
- Macie job status updates
- Error messages with context

### DynamoDB Tracking
```
document_id: UUID
macieJobId: Macie job identifier
macieStatus: scanning|complete|failed
macieFindings: Array of PII findings
requiresRedaction: Boolean
redactedKey: S3 location of redacted document
```

### Common Issues
1. **Macie not enabled**: Lambda automatically enables Macie if needed
2. **KMS permissions**: Ensure Macie can decrypt S3 objects
3. **Job timeouts**: Macie jobs may take 1-3 minutes for large documents

## Cost Considerations
- Macie charges per GB scanned (~$1/GB)
- Classification jobs are one-time scans
- Consider batching multiple documents

## Future Enhancements
1. PDF-native redaction (preserve formatting)
2. Custom data identifiers for military-specific PII
3. Batch processing for unit transitions
4. Integration with VA systems

---

This is a production-ready implementation using real Amazon Macie for PII detection and protection.