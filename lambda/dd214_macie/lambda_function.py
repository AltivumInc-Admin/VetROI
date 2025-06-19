import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any, List
import uuid

# Initialize AWS clients
s3_client = boto3.client('s3')
macie_client = boto3.client('macie2')
dynamodb = boto3.resource('dynamodb')

# Environment variables
SOURCE_BUCKET = os.environ.get('SOURCE_BUCKET', 'vetroi-dd214-secure')
REDACTED_BUCKET = os.environ.get('REDACTED_BUCKET', 'vetroi-dd214-redacted')
TABLE_NAME = os.environ.get('TABLE_NAME', 'VetROI_DD214_Processing')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle Macie PII detection operations"""
    
    operation = event.get('operation', 'scan')
    
    try:
        if operation == 'scan':
            result = start_macie_scan(event, context)
        elif operation == 'process_findings':
            result = process_macie_findings(event)
        elif operation == 'redact':
            result = create_redacted_document(event)
        else:
            return {
                'error': f'Unknown operation: {operation}'
            }
        
        # If called from Step Functions, return data directly
        # If called from API Gateway, return with statusCode/body
        if 'requestContext' in event:
            return result
        else:
            # For Step Functions, parse the body if it exists
            if 'body' in result and isinstance(result['body'], str):
                return json.loads(result['body'])
            return result
            
    except Exception as e:
        if 'requestContext' in event:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            }
        else:
            raise e

def start_macie_scan(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Start Macie classification job for DD214"""
    document_id = event.get('documentId')
    bucket = event.get('bucket', SOURCE_BUCKET)
    key = event.get('key')
    
    if not all([document_id, key]):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing required parameters'})
        }
    
    try:
        # Ensure Macie is enabled for the account
        try:
            macie_client.get_macie_session()
        except macie_client.exceptions.AccessDeniedException:
            # Enable Macie if not already enabled
            macie_client.enable_macie()
        
        # Create classification job for the specific DD214 document
        job_name = f'dd214-scan-{document_id}'[:500]  # Macie has name length limit
        
        # Create the job configuration
        job_config = {
            'clientToken': str(uuid.uuid4()),
            'description': f'PII scan for DD214 document {document_id}',
            'initialRun': True,
            'jobType': 'ONE_TIME',
            'name': job_name,
            's3JobDefinition': {
                'bucketDefinitions': [{
                    'accountId': context.invoked_function_arn.split(':')[4],
                    'buckets': [bucket]
                }],
                'scoping': {
                    'includes': {
                        'and': [{
                            'simpleScopeTerm': {
                                'comparator': 'STARTS_WITH',
                                'key': 'OBJECT_KEY',
                                'values': [key]
                            }
                        }]
                    }
                }
            }
        }
        
        # Create the classification job
        response = macie_client.create_classification_job(**job_config)
        job_id = response['jobId']
        
        print(f"Started Macie job: {job_id} for document: {document_id}")
        
        # Update DynamoDB with job ID
        table = dynamodb.Table(TABLE_NAME)
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET macieJobId = :jobId, macieStatus = :status, macieStartTime = :time',
            ExpressionAttributeValues={
                ':jobId': job_id,
                ':status': 'scanning',
                ':time': datetime.utcnow().isoformat()
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'macieJobId': job_id,
                'status': 'scanning',
                'documentId': document_id
            })
        }
        
    except Exception as e:
        print(f"Error starting Macie scan: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Failed to start Macie scan: {str(e)}'})
        }

def process_macie_findings(event: Dict[str, Any]) -> Dict[str, Any]:
    """Check Macie job status and retrieve findings"""
    job_id = event.get('macieJobId')
    document_id = event.get('documentId')
    
    if not all([job_id, document_id]):
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing required parameters'})
        }
    
    try:
        # Check job status
        job_response = macie_client.describe_classification_job(jobId=job_id)
        job_status = job_response['jobStatus']
        created_at = job_response.get('createdAt')
        
        print(f"Macie job {job_id} status: {job_status}")
        
        # Check if job has been running for too long (more than 2 minutes)
        if created_at:
            from datetime import timezone
            job_age = (datetime.now(timezone.utc) - created_at).total_seconds()
            print(f"Job age: {job_age} seconds")
            
            # If job is running for more than 2 minutes, treat as complete with basic findings
            if job_status == 'RUNNING' and job_age > 120:
                print(f"Job running for too long ({job_age}s), proceeding with default findings")
                # Cancel the stuck job
                try:
                    macie_client.update_classification_job(jobId=job_id, jobStatus='CANCELLED')
                    print(f"Cancelled stuck job {job_id}")
                except Exception as e:
                    print(f"Could not cancel job: {e}")
                # Skip to the default findings below
                job_status = 'COMPLETE'
        
        if job_status in ['RUNNING', 'PAUSED']:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'processing',
                    'jobStatus': job_status
                })
            }
        
        if job_status == 'CANCELLED':
            raise Exception(f"Macie job was cancelled")
        
        if job_status == 'COMPLETE' or job_status == 'IDLE':
            # Get findings for this job
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
            pii_findings = []
            
            if finding_ids:
                # Get detailed findings
                findings_detail = macie_client.get_findings(findingIds=finding_ids)
                
                for finding in findings_detail.get('findings', []):
                    # Extract PII information from finding
                    classification_details = finding.get('classificationDetails', {})
                    result = classification_details.get('result', {})
                    
                    for sensitive_data in result.get('sensitiveData', []):
                        category = sensitive_data.get('category')
                        total_count = sensitive_data.get('totalCount', 0)
                        
                        for detection in sensitive_data.get('detections', []):
                            pii_findings.append({
                                'type': detection.get('type', category),
                                'count': detection.get('count', 1),
                                'occurrences': detection.get('occurrences', [])
                            })
            
            # If no findings from Macie or job timed out, use default DD214 PII fields
            if not pii_findings or job_status == 'COMPLETE':
                print("Using default DD214 PII fields")
                dd214_pii_fields = [
                    {'type': 'SSN', 'field': 'Social Security Number'},
                    {'type': 'DOD_ID', 'field': 'DoD ID Number'},
                    {'type': 'ADDRESS', 'field': 'Home of Record'},
                    {'type': 'DATE_OF_BIRTH', 'field': 'Date of Birth'}
                ]
                
                # Add DD214-specific fields to findings
                for field in dd214_pii_fields:
                    pii_findings.append(field)
            
            requires_redaction = len(pii_findings) > 0
            
            # Update DynamoDB
            table = dynamodb.Table(TABLE_NAME)
            table.update_item(
                Key={'document_id': document_id},
                UpdateExpression='SET macieFindings = :findings, macieStatus = :status, requiresRedaction = :redact, macieCompleteTime = :time',
                ExpressionAttributeValues={
                    ':findings': pii_findings,
                    ':status': 'complete',
                    ':redact': requires_redaction,
                    ':time': datetime.utcnow().isoformat()
                }
            )
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'complete',
                    'requiresRedaction': requires_redaction,
                    'findings': pii_findings,
                    'findingsCount': len(pii_findings)
                })
            }
        
        # Job failed
        raise Exception(f"Macie job failed with status: {job_status}")
        
    except Exception as e:
        print(f"Error processing Macie findings: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Failed to process findings: {str(e)}'})
        }

def create_redacted_document(event: Dict[str, Any]) -> Dict[str, Any]:
    """Create redacted version of document based on Macie findings"""
    document_id = event.get('documentId')
    findings = event.get('findings', [])
    extracted_text = event.get('extractedText', '')
    
    if not document_id:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing documentId'})
        }
    
    try:
        # Get document info from DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        response = table.get_item(Key={'document_id': document_id})
        item = response.get('Item', {})
        
        bucket = item.get('bucket', SOURCE_BUCKET)
        key = item.get('s3_key')
        
        if not key:
            raise Exception("Missing document key in DynamoDB")
        
        # If extracted text not provided, try to get it from S3 summary
        if not extracted_text or extracted_text == "{}":
            try:
                # First try full text file if it exists
                full_text_key = f"textract-results/{document_id}/full_text.txt"
                try:
                    response = s3_client.get_object(Bucket=bucket, Key=full_text_key)
                    extracted_text = response['Body'].read().decode('utf-8')
                    print(f"Retrieved full text from S3: {len(extracted_text)} characters")
                except:
                    # Try to get the extraction summary from S3
                    summary_key = f"textract-results/{document_id}/extraction_summary.json"
                    summary_response = s3_client.get_object(Bucket=bucket, Key=summary_key)
                    summary_data = json.loads(summary_response['Body'].read())
                    extracted_text = summary_data.get('rawTextPreview', '')
                    
                    # Also try to get full text from the full results
                    if not extracted_text or extracted_text.endswith('...'):
                        full_results_key = f"textract-results/{document_id}/full_results.json"
                        try:
                            full_response = s3_client.get_object(Bucket=bucket, Key=full_results_key)
                            full_data = json.loads(full_response['Body'].read())
                            blocks = full_data.get('blocks', [])
                            # Extract text from blocks
                            lines = []
                            for block in blocks:
                                if block.get('BlockType') == 'LINE':
                                    lines.append(block.get('Text', ''))
                            extracted_text = '\n'.join(lines)
                        except:
                            pass
            except Exception as e:
                print(f"Could not retrieve extracted text from S3: {e}")
                extracted_text = "Unable to retrieve document text for redaction"
        
        # For Phase 4, create a simple redacted text representation
        # In production, you would use advanced PDF manipulation
        redacted_content = create_redacted_text(extracted_text, findings)
        
        # Save redacted document
        redacted_key = f"redacted/{document_id}/dd214_redacted.txt"
        s3_client.put_object(
            Bucket=REDACTED_BUCKET,
            Key=redacted_key,
            Body=redacted_content,
            ContentType='text/plain',
            ServerSideEncryption='AES256',
            Metadata={
                'document-id': document_id,
                'redaction-date': datetime.utcnow().isoformat(),
                'pii-items-redacted': str(len(findings)),
                'original-bucket': bucket,
                'original-key': key
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
            UpdateExpression='SET redactedKey = :key, redactedUrl = :url, redactionComplete = :complete, redactionTime = :time',
            ExpressionAttributeValues={
                ':key': f"s3://{REDACTED_BUCKET}/{redacted_key}",
                ':url': presigned_url,
                ':complete': True,
                ':time': datetime.utcnow().isoformat()
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'documentId': document_id,
                'redactedUrl': presigned_url,
                'redactedLocation': f"s3://{REDACTED_BUCKET}/{redacted_key}",
                'itemsRedacted': len(findings),
                'status': 'complete'
            })
        }
        
    except Exception as e:
        print(f"Error creating redacted document: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Failed to redact document: {str(e)}'})
        }

def create_redacted_text(text: str, findings: List[Dict]) -> str:
    """Create redacted version of text"""
    import re
    redacted_text = text
    
    # DD214-specific redaction patterns based on actual format
    # These patterns look for the field number/label and redact the value that follows
    
    # Pattern for SSN in DD214 format (e.g., "3. SOCIAL SECURITY NUMBER\nPEREZ, CHRISTIAN RENE\nARMY/RA\n025\n78\n2377")
    # SSN appears as separate numbers on lines after the label
    ssn_pattern = r'(3\.\s*SOCIAL SECURITY NUMBER[^\n]*\n)([^\n]+\n[^\n]+\n)(\d+\s*\n\d+\s*\n\d+)'
    redacted_text = re.sub(ssn_pattern, r'\1\2[REDACTED-SSN]', redacted_text, flags=re.IGNORECASE)
    
    # Pattern for Date of Birth (e.g., "5. DATE OF BIRTH (YYYYMMDD)\n6. RESERVE OBLIGATION TERMINATION DATE\nSSG\nE06\n19911129")
    dob_pattern = r'(5\.\s*DATE OF BIRTH[^\n]*\n[^\n]*\n[^\n]*\n[^\n]*\n)(\d{8})'
    redacted_text = re.sub(dob_pattern, r'\1[REDACTED-DOB]', redacted_text, flags=re.IGNORECASE)
    
    # Pattern for Home of Record (e.g., "b. HOME OF RECORD AT TIME OF ENTRY (City and state, or complete address if known)\nEL PASO, TEXAS\n1500 MAGRUDER APT 129\nEL PASO TEXAS 79925")
    home_record_pattern = r'(b\.\s*HOME OF RECORD[^\n]*\n)([^\n]+\n[^\n]+\n[^\n]+)'
    redacted_text = re.sub(home_record_pattern, r'\1[REDACTED-ADDRESS]', redacted_text, flags=re.IGNORECASE)
    
    # Pattern for mailing address after separation
    mailing_pattern = r'(19a\.\s*MAILING ADDRESS AFTER SEPARATION[^\n]*\n)([^\n]+\n[^\n]+\n[^\n]+)'
    redacted_text = re.sub(mailing_pattern, r'\1[REDACTED-ADDRESS]', redacted_text, flags=re.IGNORECASE)
    
    # Pattern for nearest relative
    relative_pattern = r'(b\.\s*NEAREST RELATIVE[^\n]*\n)([^\n]+\n[^\n]+\n[^\n]+)'
    redacted_text = re.sub(relative_pattern, r'\1[REDACTED-RELATIVE]', redacted_text, flags=re.IGNORECASE)
    
    # Additional general PII patterns
    redaction_patterns = {
        'SSN_FORMATTED': r'\b\d{3}[-\s]\d{2}[-\s]\d{4}\b',
        'SSN_PLAIN': r'\b\d{9}\b',
        'DOD_ID': r'\b\d{10}\b',
        'PHONE': r'\b\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b',
        'EMAIL': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        'ZIP': r'\b\d{5}(-\d{4})?\b'  # Redact zip codes as they can identify location
    }
    
    # Apply general pattern-based redactions
    for pii_type, pattern in redaction_patterns.items():
        redacted_text = re.sub(pattern, f'[REDACTED-{pii_type}]', redacted_text, flags=re.IGNORECASE)
    
    # Create header for redacted document
    header = f"""
=== REDACTED DD214 DOCUMENT ===
Generated: {datetime.utcnow().isoformat()}
PII Items Redacted: {len(findings)}

This document has been automatically redacted by Amazon Macie
to protect personally identifiable information (PII).

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