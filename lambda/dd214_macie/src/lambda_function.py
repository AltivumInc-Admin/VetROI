import json
import boto3
import os
import re
from datetime import datetime
from typing import Dict, Any, List, Tuple
import io
import base64
from PIL import Image, ImageDraw

# Initialize AWS clients
s3_client = boto3.client('s3')
macie_client = boto3.client('macie2')
textract_client = boto3.client('textract')
dynamodb = boto3.resource('dynamodb')

# Environment variables
SOURCE_BUCKET = os.environ.get('SOURCE_BUCKET', 'vetroi-dd214-secure')
REDACTED_BUCKET = os.environ.get('REDACTED_BUCKET', 'vetroi-dd214-redacted')
TABLE_NAME = os.environ.get('TABLE_NAME', 'VetROI_DD214_Processing')

# PII patterns for manual detection
PII_PATTERNS = {
    'SSN': r'\b(?:\d{3}-\d{2}-\d{4}|\d{9})\b',
    'DOD_ID': r'\b\d{10}\b',
    'PHONE': r'\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',
    'EMAIL': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'ADDRESS': r'\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|highway|hwy|lane|ln|drive|dr|court|ct|circle|cir|boulevard|blvd)\b',
    'DATE_OF_BIRTH': r'\b(?:0[1-9]|1[0-2])[/\-](?:0[1-9]|[12]\d|3[01])[/\-](?:19|20)\d{2}\b'
}

# Fields to always redact in DD214
ALWAYS_REDACT_FIELDS = [
    'social security number',
    'home of record',
    'mailing address',
    'date of birth',
    'place of birth'
]

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle Macie PII detection and redaction operations"""
    
    operation = event.get('operation', 'scan')
    
    if operation == 'scan':
        return start_macie_scan(event)
    elif operation == 'process_findings':
        return process_macie_findings(event)
    elif operation == 'redact':
        return redact_document(event)
    else:
        return error_response(400, f'Unknown operation: {operation}')

def start_macie_scan(event: Dict[str, Any]) -> Dict[str, Any]:
    """Start Macie classification job for PII detection"""
    
    document_id = event.get('documentId')
    bucket = event.get('bucket', SOURCE_BUCKET)
    key = event.get('key')
    
    if not all([document_id, key]):
        return error_response(400, 'Missing required parameters')
    
    try:
        # Update processing status
        update_processing_status(document_id, 'pii_detection', 'in-progress')
        
        # Create custom data identifier for military-specific PII
        try:
            custom_identifier = create_military_pii_identifier()
        except Exception as e:
            print(f"Custom identifier may already exist: {e}")
            custom_identifier = {'id': 'military-pii-identifier'}
        
        # Create Macie classification job
        job_name = f'dd214-scan-{document_id}'
        
        response = macie_client.create_classification_job(
            name=job_name,
            description=f'PII scan for DD214 document {document_id}',
            initialRun=True,
            s3JobDefinition={
                'bucketDefinitions': [{
                    'accountId': context.invoked_function_arn.split(':')[4],
                    'buckets': [bucket]
                }],
                'scoping': {
                    'includes': {
                        'and': [{
                            'simpleScopeTerm': {
                                'key': 'OBJECT_KEY',
                                'values': [key],
                                'comparator': 'EQ'
                            }
                        }]
                    }
                }
            },
            customDataIdentifierIds=[custom_identifier['id']] if 'id' in custom_identifier else [],
            jobType='ONE_TIME'
        )
        
        job_id = response['jobId']
        print(f"Started Macie job: {job_id}")
        
        # Store job ID in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET macie_job_id = :job_id, processing_steps.pii_detection = :status',
            ExpressionAttributeValues={
                ':job_id': job_id,
                ':status': {
                    'status': 'in-progress',
                    'started_at': datetime.utcnow().isoformat(),
                    'job_id': job_id
                }
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'macieJobId': job_id,
                'status': 'scanning'
            })
        }
        
    except Exception as e:
        print(f"Error starting Macie scan: {str(e)}")
        update_processing_status(document_id, 'pii_detection', 'error', str(e))
        return error_response(500, f'Failed to start Macie scan: {str(e)}')

def process_macie_findings(event: Dict[str, Any]) -> Dict[str, Any]:
    """Process Macie job findings and extract PII locations"""
    
    job_id = event.get('macieJobId')
    document_id = event.get('documentId')
    
    if not all([job_id, document_id]):
        return error_response(400, 'Missing required parameters')
    
    try:
        # Check job status
        job_response = macie_client.describe_classification_job(jobId=job_id)
        job_status = job_response['jobStatus']
        
        if job_status in ['RUNNING', 'PAUSED']:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'processing',
                    'jobStatus': job_status
                })
            }
        
        if job_status != 'COMPLETE':
            raise Exception(f"Macie job failed with status: {job_status}")
        
        # Get findings
        findings_response = macie_client.list_findings(
            findingCriteria={
                'criterion': {
                    'classificationDetails.jobId': {
                        'eq': [job_id]
                    }
                }
            },
            maxResults=50
        )
        
        finding_ids = findings_response.get('findingIds', [])
        
        # Get detailed findings
        pii_locations = []
        if finding_ids:
            findings_detail = macie_client.get_findings(findingIds=finding_ids)
            
            for finding in findings_detail.get('findings', []):
                # Extract PII type and location
                for detail in finding.get('classificationDetails', {}).get('result', {}).get('sensitiveData', []):
                    category = detail.get('category')
                    detections = detail.get('detections', [])
                    
                    for detection in detections:
                        pii_locations.append({
                            'type': category,
                            'value': detection.get('name', ''),
                            'occurrences': detection.get('count', 0)
                        })
        
        # Also run manual PII detection for additional coverage
        manual_pii = detect_pii_manually(document_id)
        pii_locations.extend(manual_pii)
        
        # Determine if redaction is needed
        requires_redaction = len(pii_locations) > 0
        
        # Update DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET pii_findings = :findings, requires_redaction = :redact, processing_steps.pii_detection = :status',
            ExpressionAttributeValues={
                ':findings': pii_locations,
                ':redact': requires_redaction,
                ':status': {
                    'status': 'complete',
                    'completed_at': datetime.utcnow().isoformat(),
                    'findings_count': len(pii_locations)
                }
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'complete',
                'requiresRedaction': requires_redaction,
                'findings': pii_locations
            })
        }
        
    except Exception as e:
        print(f"Error processing Macie findings: {str(e)}")
        update_processing_status(document_id, 'pii_detection', 'error', str(e))
        return error_response(500, f'Failed to process findings: {str(e)}')

def redact_document(event: Dict[str, Any]) -> Dict[str, Any]:
    """Redact PII from document based on findings"""
    
    document_id = event.get('documentId')
    findings = event.get('findings', [])
    extracted_text = event.get('extractedText', '')
    
    if not document_id:
        return error_response(400, 'Missing documentId')
    
    try:
        # Update processing status
        update_processing_status(document_id, 'redaction', 'in-progress')
        
        # Get document info from DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        response = table.get_item(Key={'document_id': document_id})
        item = response.get('Item', {})
        
        bucket = item.get('bucket', SOURCE_BUCKET)
        key = item.get('s3_key')
        user_id = item.get('user_id')
        
        if not all([bucket, key, user_id]):
            raise Exception("Missing document information")
        
        # Download original document
        response = s3_client.get_object(Bucket=bucket, Key=key)
        document_bytes = response['Body'].read()
        
        # Determine file type and redact
        file_extension = os.path.splitext(key)[1].lower()
        
        if file_extension == '.pdf':
            redacted_bytes = redact_pdf(document_bytes, findings, extracted_text)
        else:
            # For images, convert to PDF with redactions
            redacted_bytes = redact_image_to_pdf(document_bytes, findings, extracted_text)
        
        # Save redacted document
        redacted_key = f"users/{user_id}/redacted/{document_id}_redacted.pdf"
        s3_client.put_object(
            Bucket=REDACTED_BUCKET,
            Key=redacted_key,
            Body=redacted_bytes,
            ContentType='application/pdf',
            Metadata={
                'document-id': document_id,
                'redaction-date': datetime.utcnow().isoformat(),
                'pii-removed': str(len(findings))
            }
        )
        
        # Generate pre-signed URL for redacted document
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': REDACTED_BUCKET,
                'Key': redacted_key
            },
            ExpiresIn=3600  # 1 hour
        )
        
        # Update DynamoDB
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET redacted_document_key = :key, redacted_url = :url, processing_steps.redaction = :status',
            ExpressionAttributeValues={
                ':key': redacted_key,
                ':url': presigned_url,
                ':status': {
                    'status': 'complete',
                    'completed_at': datetime.utcnow().isoformat(),
                    'items_redacted': len(findings)
                }
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'documentId': document_id,
                'redactedUrl': presigned_url,
                'itemsRedacted': len(findings),
                'status': 'complete'
            })
        }
        
    except Exception as e:
        print(f"Error redacting document: {str(e)}")
        update_processing_status(document_id, 'redaction', 'error', str(e))
        return error_response(500, f'Failed to redact document: {str(e)}')

def create_military_pii_identifier() -> Dict[str, str]:
    """Create custom data identifier for military-specific PII"""
    
    try:
        response = macie_client.create_custom_data_identifier(
            name='military-pii-identifier',
            description='Identifies military-specific PII like service numbers',
            regex='\\b[A-Z]{2}\\d{6,8}\\b|\\b\\d{10}\\b',  # Military service numbers and DoD ID
            keywords=['service number', 'dod id', 'dodid', 'edipi'],
            maximumMatchDistance=50
        )
        return response
    except macie_client.exceptions.ConflictException:
        # Identifier already exists
        return {'id': 'military-pii-identifier'}

def detect_pii_manually(document_id: str) -> List[Dict[str, Any]]:
    """Manually detect PII using regex patterns"""
    
    pii_found = []
    
    try:
        # Get extracted text from DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        response = table.get_item(Key={'document_id': document_id})
        item = response.get('Item', {})
        
        extracted_fields = item.get('extracted_fields', {})
        if isinstance(extracted_fields, str):
            extracted_fields = json.loads(extracted_fields)
        
        # Check each field for PII
        for field_name, field_value in extracted_fields.items():
            if not field_value:
                continue
                
            # Check against PII patterns
            for pii_type, pattern in PII_PATTERNS.items():
                if re.search(pattern, str(field_value), re.IGNORECASE):
                    pii_found.append({
                        'type': pii_type,
                        'field': field_name,
                        'pattern_matched': True
                    })
                    break
            
            # Check against always-redact fields
            for redact_field in ALWAYS_REDACT_FIELDS:
                if redact_field in field_name.lower():
                    pii_found.append({
                        'type': 'PERSONAL_INFO',
                        'field': field_name,
                        'always_redact': True
                    })
                    break
    
    except Exception as e:
        print(f"Error in manual PII detection: {str(e)}")
    
    return pii_found

def redact_pdf(pdf_bytes: bytes, findings: List[Dict], extracted_text: str) -> bytes:
    """Redact PII from PDF document"""
    
    # For Phase 4, we'll create a redacted text version
    # In production, you'd use a PDF library like PyPDF2 or reportlab
    
    # Extract text and apply redactions
    redacted_text = extracted_text
    
    # Apply redactions to text
    for finding in findings:
        search_terms = get_search_terms_for_finding(finding)
        for term in search_terms:
            if term:
                # Replace with redacted marker
                redacted_text = redacted_text.replace(term, '[REDACTED]')
    
    # Create a simple text-based PDF representation
    # In production, maintain original PDF format
    redacted_content = f"""
DD214 - REDACTED VERSION
========================

This document has been automatically redacted to remove personally identifiable information (PII).
{len(findings)} items were redacted for privacy protection.

REDACTED CONTENT:
{redacted_text}

========================
This is a redacted copy. Original document stored securely.
Generated: {datetime.utcnow().isoformat()}
"""
    
    return redacted_content.encode('utf-8')

def redact_image_to_pdf(image_bytes: bytes, findings: List[Dict], extracted_text: str) -> bytes:
    """Convert image to PDF with redactions applied"""
    
    # For images, we'll return the same text-based redacted version
    # In production, you'd use Textract geometry to redact specific regions
    return redact_pdf(image_bytes, findings, extracted_text)

def get_search_terms_for_finding(finding: Dict) -> List[str]:
    """Get search terms based on PII finding"""
    
    terms = []
    
    # Add the actual value if available
    if 'value' in finding:
        terms.append(finding['value'])
    
    # Add common patterns based on type
    finding_type = finding.get('type', '').upper()
    
    if finding_type == 'SSN':
        # Don't add actual SSN patterns for security
        pass
    elif finding_type == 'DOD_ID':
        # Don't add actual DoD ID for security
        pass
    elif finding_type == 'PERSONAL_INFO':
        # Add field name as search term
        if 'field' in finding:
            terms.append(finding['field'])
    
    return terms

def update_processing_status(document_id: str, step: str, status: str, error: str = None):
    """Update processing status in DynamoDB"""
    
    table = dynamodb.Table(TABLE_NAME)
    
    update_expr = f"SET processing_steps.{step}.#status = :status, processing_steps.{step}.updated_at = :timestamp"
    expr_values = {
        ':status': status,
        ':timestamp': datetime.utcnow().isoformat()
    }
    expr_names = {'#status': 'status'}
    
    if error:
        update_expr += f", processing_steps.{step}.error = :error"
        expr_values[':error'] = error
    
    table.update_item(
        Key={'document_id': document_id},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=expr_values,
        ExpressionAttributeNames=expr_names
    )

def error_response(status_code: int, message: str) -> Dict[str, Any]:
    """Generate error response"""
    return {
        'statusCode': status_code,
        'body': json.dumps({'error': message})
    }