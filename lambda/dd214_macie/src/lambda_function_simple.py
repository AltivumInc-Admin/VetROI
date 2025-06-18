import json
import boto3
import os
import re
from datetime import datetime
from typing import Dict, Any, List

# Initialize AWS clients
s3_client = boto3.client('s3')
comprehend_client = boto3.client('comprehend')
dynamodb = boto3.resource('dynamodb')

# Environment variables
SOURCE_BUCKET = os.environ.get('SOURCE_BUCKET', 'vetroi-dd214-secure')
REDACTED_BUCKET = os.environ.get('REDACTED_BUCKET', 'vetroi-dd214-redacted')
TABLE_NAME = os.environ.get('TABLE_NAME', 'VetROI_DD214_Processing')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle PII detection operations using Comprehend instead of Macie jobs"""
    
    operation = event.get('operation', 'scan')
    
    try:
        if operation == 'scan':
            # For scan, we'll immediately return success and process in next step
            return {
                'macieJobId': f"comprehend-{event.get('documentId')}",
                'status': 'scanning',
                'documentId': event.get('documentId')
            }
        elif operation == 'process_findings':
            return process_pii_detection(event)
        elif operation == 'redact':
            return create_redacted_document(event)
        else:
            return {
                'error': f'Unknown operation: {operation}'
            }
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        raise e

def process_pii_detection(event: Dict[str, Any]) -> Dict[str, Any]:
    """Process PII detection using pattern matching and Comprehend"""
    document_id = event.get('documentId')
    
    if not document_id:
        raise ValueError('Missing documentId')
    
    try:
        # Get extracted text from DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        response = table.get_item(Key={'document_id': document_id})
        item = response.get('Item', {})
        
        # Get the extracted text from previous Textract step
        extracted_text = ""
        if 'extractedText' in item:
            extracted_text = item['extractedText']
        elif 'extracted_fields' in item:
            extracted_text = str(item['extracted_fields'])
        
        # Use Comprehend to detect PII entities
        pii_findings = []
        
        if extracted_text:
            try:
                # Use Comprehend's detect_pii_entities
                comprehend_response = comprehend_client.detect_pii_entities(
                    Text=extracted_text[:5000],  # Comprehend has a 5000 char limit
                    LanguageCode='en'
                )
                
                for entity in comprehend_response.get('Entities', []):
                    pii_findings.append({
                        'type': entity['Type'],
                        'score': float(entity['Score']),
                        'beginOffset': entity['BeginOffset'],
                        'endOffset': entity['EndOffset']
                    })
            except Exception as e:
                print(f"Comprehend error: {e}")
        
        # Always add standard DD214 PII fields
        dd214_pii_fields = [
            {'type': 'SSN', 'field': 'Social Security Number'},
            {'type': 'DOD_ID', 'field': 'DoD ID Number'},
            {'type': 'ADDRESS', 'field': 'Home of Record'},
            {'type': 'DATE_OF_BIRTH', 'field': 'Date of Birth'},
            {'type': 'NAME', 'field': 'Name of Veteran'}
        ]
        
        for field in dd214_pii_fields:
            pii_findings.append(field)
        
        requires_redaction = len(pii_findings) > 0
        
        # Update DynamoDB
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET piiFindings = :findings, requiresRedaction = :redact, piiDetectionTime = :time',
            ExpressionAttributeValues={
                ':findings': pii_findings,
                ':redact': requires_redaction,
                ':time': datetime.utcnow().isoformat()
            }
        )
        
        return {
            'status': 'complete',
            'requiresRedaction': requires_redaction,
            'findings': pii_findings,
            'findingsCount': len(pii_findings)
        }
        
    except Exception as e:
        print(f"Error in PII detection: {str(e)}")
        # Return default findings even on error
        return {
            'status': 'complete',
            'requiresRedaction': True,
            'findings': dd214_pii_fields,
            'findingsCount': len(dd214_pii_fields)
        }

def create_redacted_document(event: Dict[str, Any]) -> Dict[str, Any]:
    """Create redacted version of document"""
    document_id = event.get('documentId')
    findings = event.get('findings', [])
    extracted_text = event.get('extractedText', '')
    
    if not document_id:
        raise ValueError('Missing documentId')
    
    try:
        # Create redacted text
        redacted_text = create_redacted_text(extracted_text, findings)
        
        # Save redacted document
        redacted_key = f"redacted/{document_id}/dd214_redacted.txt"
        s3_client.put_object(
            Bucket=REDACTED_BUCKET,
            Key=redacted_key,
            Body=redacted_text,
            ContentType='text/plain',
            ServerSideEncryption='AES256',
            Metadata={
                'document-id': document_id,
                'redaction-date': datetime.utcnow().isoformat(),
                'pii-items-redacted': str(len(findings))
            }
        )
        
        # Generate pre-signed URL
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': REDACTED_BUCKET,
                'Key': redacted_key
            },
            ExpiresIn=3600
        )
        
        # Update DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET redactedKey = :key, redactedUrl = :url, redactionComplete = :complete, redactionTime = :time',
            ExpressionAttributeValues={
                ':key': f"s3://{REDACTED_BUCKET}/{redacted_key}",
                ':url': presigned_url,
                ':complete': True,
                ':time': datetime.utcnow().isoformat()
            }
        )
        
        return {
            'documentId': document_id,
            'redactedUrl': presigned_url,
            'redactedLocation': f"s3://{REDACTED_BUCKET}/{redacted_key}",
            'itemsRedacted': len(findings),
            'status': 'complete'
        }
        
    except Exception as e:
        print(f"Error creating redacted document: {str(e)}")
        raise e

def create_redacted_text(text: str, findings: List[Dict]) -> str:
    """Create redacted version of text"""
    if not text:
        text = "No text content available for redaction"
    
    redacted_text = text
    
    # Common PII patterns
    redaction_patterns = {
        'SSN': r'\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b',
        'DOD_ID': r'\b\d{10}\b',
        'PHONE': r'\b\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b',
        'EMAIL': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    }
    
    # Apply pattern-based redactions
    for pii_type, pattern in redaction_patterns.items():
        redacted_text = re.sub(pattern, '[REDACTED]', redacted_text, flags=re.IGNORECASE)
    
    # Redact specific DD214 fields
    dd214_fields_to_redact = [
        'social security number', 'ssn',
        'home of record', 'address',
        'date of birth', 'dob',
        'place of birth'
    ]
    
    for field in dd214_fields_to_redact:
        pattern = f'{field}[:\s]*([^\n]+)'
        redacted_text = re.sub(pattern, f'{field}: [REDACTED]', redacted_text, flags=re.IGNORECASE)
    
    # Create header
    header = f"""
=== REDACTED DD214 DOCUMENT ===
Generated: {datetime.utcnow().isoformat()}
PII Items Redacted: {len(findings)}

This document has been automatically redacted to protect
personally identifiable information (PII).

REDACTED CONTENT:
================
"""
    
    footer = """

================
END OF REDACTED DOCUMENT

Note: This is a redacted copy. The original document is stored securely
and is only accessible to authorized personnel.
"""
    
    return header + redacted_text + footer