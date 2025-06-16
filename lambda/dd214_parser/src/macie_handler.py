import json
import boto3
import os
from typing import Dict, Any, List
from datetime import datetime
import re

macie = boto3.client('macie2')
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

BUCKET_NAME = os.environ.get('DD214_BUCKET')
TABLE_NAME = os.environ.get('TABLE_NAME')
FINDINGS_BUCKET = os.environ.get('FINDINGS_BUCKET', f"{BUCKET_NAME}-macie-findings")

# PII patterns specific to DD214 documents
PII_PATTERNS = {
    'SSN': r'\b\d{3}-\d{2}-\d{4}\b',
    'DOB': r'\b(0[1-9]|1[0-2])/(0[1-9]|[12]\d|3[01])/\d{4}\b',
    'SERVICE_NUMBER': r'\b[A-Z]{2}\d{7,8}\b',
    'VA_FILE_NUMBER': r'\bC\d{8}\b',
    'DOD_ID': r'\b\d{10}\b',
    'ADDRESS': r'\b\d{1,5}\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Plaza|Pl)\b'
}

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle Macie operations for DD214 processing
    """
    operation = event.get('operation', 'scan')
    
    if operation == 'setup':
        return setup_macie_for_dd214()
    elif operation == 'scan':
        return scan_document_for_pii(event)
    elif operation == 'process_findings':
        return process_macie_findings(event)
    elif operation == 'redact':
        return redact_pii_from_document(event)
    else:
        raise ValueError(f"Unknown operation: {operation}")

def setup_macie_for_dd214() -> Dict[str, Any]:
    """
    One-time setup of Macie for DD214 processing
    """
    try:
        # Enable Macie if not already enabled
        try:
            macie.enable_macie()
            print("Macie enabled successfully")
        except macie.exceptions.ConflictException:
            print("Macie already enabled")
        
        # Create custom data identifiers for military-specific PII
        custom_identifiers = []
        
        # Military Service Number
        try:
            response = macie.create_custom_data_identifier(
                name='VetROI-Military-Service-Number',
                description='Detects military service numbers',
                regex=PII_PATTERNS['SERVICE_NUMBER'],
                severityLevels=[{
                    'severity': 'HIGH',
                    'occurrencesThreshold': 1
                }],
                tags={'Application': 'VetROI', 'Type': 'DD214'}
            )
            custom_identifiers.append(response['customDataIdentifierId'])
        except macie.exceptions.ValidationException:
            print("Military service number identifier already exists")
        
        # VA File Number
        try:
            response = macie.create_custom_data_identifier(
                name='VetROI-VA-File-Number',
                description='Detects VA file numbers',
                regex=PII_PATTERNS['VA_FILE_NUMBER'],
                severityLevels=[{
                    'severity': 'HIGH',
                    'occurrencesThreshold': 1
                }],
                tags={'Application': 'VetROI', 'Type': 'DD214'}
            )
            custom_identifiers.append(response['customDataIdentifierId'])
        except macie.exceptions.ValidationException:
            print("VA file number identifier already exists")
        
        # DOD ID Number
        try:
            response = macie.create_custom_data_identifier(
                name='VetROI-DOD-ID',
                description='Detects DOD ID numbers',
                regex=PII_PATTERNS['DOD_ID'],
                severityLevels=[{
                    'severity': 'HIGH',
                    'occurrencesThreshold': 1
                }],
                tags={'Application': 'VetROI', 'Type': 'DD214'}
            )
            custom_identifiers.append(response['customDataIdentifierId'])
        except macie.exceptions.ValidationException:
            print("DOD ID identifier already exists")
        
        # Create findings bucket if it doesn't exist
        try:
            s3.create_bucket(
                Bucket=FINDINGS_BUCKET,
                CreateBucketConfiguration={'LocationConstraint': os.environ.get('AWS_REGION', 'us-east-2')}
            )
            
            # Enable encryption on findings bucket
            s3.put_bucket_encryption(
                Bucket=FINDINGS_BUCKET,
                ServerSideEncryptionConfiguration={
                    'Rules': [{
                        'ApplyServerSideEncryptionByDefault': {
                            'SSEAlgorithm': 'aws:kms'
                        }
                    }]
                }
            )
        except s3.exceptions.BucketAlreadyExists:
            print("Findings bucket already exists")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Macie setup complete',
                'customIdentifiers': custom_identifiers,
                'findingsBucket': FINDINGS_BUCKET
            })
        }
        
    except Exception as e:
        print(f"Error setting up Macie: {str(e)}")
        raise

def scan_document_for_pii(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Trigger Macie scan for a specific DD214 document
    """
    document_id = event['documentId']
    bucket = event['bucket']
    key = event['key']
    
    try:
        # Create a one-time classification job for this document
        job_name = f"dd214-scan-{document_id}-{int(datetime.utcnow().timestamp())}"
        
        response = macie.create_classification_job(
            clientToken=document_id,
            name=job_name,
            description=f'PII scan for DD214 document {document_id}',
            initialRun=True,
            jobType='ONE_TIME',
            managedDataIdentifierSelector={
                'includedManagedDataIdentifierIds': [
                    'SSN',
                    'USA_PASSPORT_NUMBER',
                    'PHONE_NUMBER',
                    'EMAIL_ADDRESS',
                    'USA_DRIVING_LICENSE'
                ]
            },
            s3JobDefinition={
                'bucketDefinitions': [{
                    'accountId': boto3.client('sts').get_caller_identity()['Account'],
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
            samplingPercentage=100,
            tags={'DocumentId': document_id}
        )
        
        # Update DynamoDB with job ID
        if TABLE_NAME:
            table = dynamodb.Table(TABLE_NAME)
            table.update_item(
                Key={'documentId': document_id},
                UpdateExpression='SET macieJobId = :jobId, macieStatus = :status',
                ExpressionAttributeValues={
                    ':jobId': response['jobId'],
                    ':status': 'scanning'
                }
            )
        
        return {
            'documentId': document_id,
            'macieJobId': response['jobId'],
            'status': 'scanning'
        }
        
    except Exception as e:
        print(f"Error creating Macie job: {str(e)}")
        raise

def process_macie_findings(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process Macie findings and determine PII locations
    """
    job_id = event.get('macieJobId')
    document_id = event.get('documentId')
    
    try:
        # Get job status
        job_response = macie.describe_classification_job(jobId=job_id)
        job_status = job_response['jobStatus']
        
        if job_status != 'COMPLETE':
            return {
                'documentId': document_id,
                'status': 'processing',
                'jobStatus': job_status
            }
        
        # Get findings
        findings_response = macie.list_findings(
            findingCriteria={
                'criterion': {
                    'classificationDetails.jobId': {
                        'eq': [job_id]
                    }
                }
            },
            maxResults=50
        )
        
        # Get detailed findings
        findings_summary = []
        if findings_response['findingIds']:
            findings_details = macie.get_findings(
                findingIds=findings_response['findingIds']
            )
            
            for finding in findings_details['findings']:
                findings_summary.append({
                    'type': finding['type'],
                    'severity': finding['severity']['description'],
                    'count': finding.get('count', 0),
                    'category': finding['category'],
                    'location': extract_pii_locations(finding)
                })
        
        # Determine redaction requirements
        requires_redaction = any(
            f['severity'] in ['HIGH', 'MEDIUM'] 
            for f in findings_summary
        )
        
        # Update DynamoDB
        if TABLE_NAME:
            table = dynamodb.Table(TABLE_NAME)
            table.update_item(
                Key={'documentId': document_id},
                UpdateExpression='SET macieFindings = :findings, requiresRedaction = :redact, macieStatus = :status',
                ExpressionAttributeValues={
                    ':findings': findings_summary,
                    ':redact': requires_redaction,
                    ':status': 'complete'
                }
            )
        
        return {
            'documentId': document_id,
            'findingsCount': len(findings_summary),
            'requiresRedaction': requires_redaction,
            'findings': findings_summary
        }
        
    except Exception as e:
        print(f"Error processing Macie findings: {str(e)}")
        raise

def redact_pii_from_document(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Redact PII from document based on Macie findings
    """
    document_id = event['documentId']
    findings = event['findings']
    original_text = event.get('extractedText', '')
    
    try:
        redacted_text = original_text
        redaction_map = []
        
        # Apply redactions based on findings
        for finding in findings:
            if finding['severity'] in ['HIGH', 'MEDIUM']:
                pii_type = finding['type']
                
                # Use appropriate pattern for redaction
                if pii_type == 'USA_SSN':
                    pattern = PII_PATTERNS['SSN']
                    replacement = '[REDACTED-SSN]'
                elif pii_type == 'DATE_OF_BIRTH':
                    pattern = PII_PATTERNS['DOB']
                    replacement = '[REDACTED-DOB]'
                elif pii_type == 'ADDRESS':
                    pattern = PII_PATTERNS['ADDRESS']
                    replacement = '[REDACTED-ADDRESS]'
                else:
                    continue
                
                # Find and replace
                matches = list(re.finditer(pattern, redacted_text))
                for match in reversed(matches):  # Reverse to maintain positions
                    start, end = match.span()
                    original_value = redacted_text[start:end]
                    redacted_text = redacted_text[:start] + replacement + redacted_text[end:]
                    
                    redaction_map.append({
                        'type': pii_type,
                        'start': start,
                        'end': end,
                        'replacement': replacement
                    })
        
        # Store redacted version
        redacted_key = f"redacted/{document_id}/document.json"
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=redacted_key,
            Body=json.dumps({
                'documentId': document_id,
                'redactedText': redacted_text,
                'redactionMap': redaction_map,
                'redactedAt': datetime.utcnow().isoformat()
            }),
            ServerSideEncryption='aws:kms'
        )
        
        return {
            'documentId': document_id,
            'redactedKey': redacted_key,
            'redactionCount': len(redaction_map),
            'status': 'redacted'
        }
        
    except Exception as e:
        print(f"Error redacting document: {str(e)}")
        raise

def extract_pii_locations(finding: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract specific PII locations from Macie finding
    """
    locations = []
    
    if 'classificationDetails' in finding and 'result' in finding['classificationDetails']:
        for result in finding['classificationDetails']['result']['sensitiveData']:
            if 'detections' in result:
                for detection in result['detections']:
                    locations.append({
                        'type': detection.get('type'),
                        'occurrences': detection.get('count', 0)
                    })
    
    return locations