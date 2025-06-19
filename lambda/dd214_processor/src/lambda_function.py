import json
import boto3
import os
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime
import re
from decimal import Decimal
import logging

# Set up logging instead of aws_lambda_powertools
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
textract_client = boto3.client('textract')
comprehend_client = boto3.client('comprehend')
bedrock_runtime = boto3.client('bedrock-runtime')
dynamodb = boto3.resource('dynamodb')
stepfunctions = boto3.client('stepfunctions')

# Environment variables
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'vetroi-dd214-secure')
REDACTED_BUCKET = os.environ.get('REDACTED_BUCKET', 'vetroi-dd214-redacted')
TABLE_NAME = os.environ.get('TABLE_NAME', 'VetROI_DD214_Processing')
STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN')

# AWS resource references
s3 = s3_client
textract = textract_client
comprehend = comprehend_client

# Helper Functions
def extract_text_from_blocks(blocks: List[Dict[str, Any]]) -> str:
    """Extract all text from Textract blocks"""
    lines = []
    for block in blocks:
        if block.get('BlockType') == 'LINE':
            lines.append(block.get('Text', ''))
    return '\n'.join(lines)

def extract_dd214_fields(blocks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract DD214 fields from Textract blocks"""
    # Build text lines for better extraction
    lines = []
    for block in blocks:
        if block.get('BlockType') == 'LINE':
            lines.append({
                'text': block.get('Text', ''),
                'confidence': block.get('Confidence', 0)
            })
    
    # Extract specific DD214 fields
    extracted_data = {
        'name': extract_field_by_pattern(lines, r'NAME.*?([A-Z]+,?\s+[A-Z]+(?:\s+[A-Z])?)', 'name'),
        'ssn': extract_field_by_pattern(lines, r'SOCIAL SECURITY NUMBER.*?(\d{3}-?\d{2}-?\d{4})', 'ssn'),
        'grade_rate_rank': extract_field_by_pattern(lines, r'GRADE.*?RATE.*?RANK.*?([A-Z0-9-]+)', 'grade'),
        'service_branch': extract_service_branch(lines),
        'dates_of_service': extract_dates_of_service(lines),
        'military_education': extract_military_education(lines),
        'decorations_medals': extract_decorations(lines),
        'character_of_service': extract_field_by_pattern(lines, r'CHARACTER OF SERVICE.*?(HONORABLE|GENERAL|OTHER)', 'character'),
        'separation_code': extract_field_by_pattern(lines, r'SEPARATION CODE.*?([A-Z0-9]+)', 'separation_code'),
        're_code': extract_field_by_pattern(lines, r'REENTRY CODE.*?([A-Z0-9]+)', 're_code'),
        'primary_specialty': extract_primary_specialty(lines)
    }
    
    # Clean None values
    return {k: v for k, v in extracted_data.items() if v is not None}

def extract_field_by_pattern(lines: List[Dict], pattern: str, field_name: str) -> Optional[str]:
    """Extract field using regex pattern"""
    full_text = '\n'.join([line['text'] for line in lines])
    match = re.search(pattern, full_text, re.IGNORECASE | re.MULTILINE)
    if match:
        return match.group(1).strip()
    return None

def extract_service_branch(lines: List[Dict]) -> Optional[str]:
    """Extract service branch"""
    branches = ['ARMY', 'NAVY', 'AIR FORCE', 'MARINE CORPS', 'COAST GUARD', 'SPACE FORCE']
    full_text = '\n'.join([line['text'] for line in lines]).upper()
    
    for branch in branches:
        if branch in full_text:
            return branch
    return None

def extract_dates_of_service(lines: List[Dict]) -> Dict[str, Optional[str]]:
    """Extract service dates"""
    full_text = '\n'.join([line['text'] for line in lines])
    
    # Look for entry and separation dates
    entry_pattern = r'(?:ENTERED|ENTRY).*?(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{8})'
    separation_pattern = r'(?:SEPARATED|SEPARATION|RELEASED).*?(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{8})'
    
    entry_match = re.search(entry_pattern, full_text, re.IGNORECASE)
    separation_match = re.search(separation_pattern, full_text, re.IGNORECASE)
    
    return {
        'entry': entry_match.group(1) if entry_match else None,
        'separation': separation_match.group(1) if separation_match else None
    }

def extract_military_education(lines: List[Dict]) -> List[str]:
    """Extract military education and training"""
    education_keywords = ['SCHOOL', 'COURSE', 'TRAINING', 'QUALIFICATION']
    education_items = []
    
    for line in lines:
        text = line['text'].upper()
        if any(keyword in text for keyword in education_keywords):
            # Clean and add if it looks like education
            if len(text) > 10 and len(text) < 100:
                education_items.append(line['text'])
    
    return education_items[:10]  # Limit to top 10

def extract_decorations(lines: List[Dict]) -> List[str]:
    """Extract decorations and medals"""
    decoration_keywords = ['MEDAL', 'RIBBON', 'COMMENDATION', 'ACHIEVEMENT', 'STAR', 'CROSS', 'HEART']
    decorations = []
    
    for line in lines:
        text = line['text'].upper()
        if any(keyword in text for keyword in decoration_keywords):
            decorations.append(line['text'])
    
    return decorations[:15]  # Limit to top 15

def extract_primary_specialty(lines: List[Dict]) -> Optional[str]:
    """Extract primary military specialty"""
    specialty_pattern = r'(?:PRIMARY|MILITARY)?\s*(?:SPECIALTY|MOS|AFSC|RATE).*?([A-Z0-9]+(?:\s+[A-Z0-9]+)?)'
    full_text = '\n'.join([line['text'] for line in lines])
    
    match = re.search(specialty_pattern, full_text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None

def identify_pii(text: str) -> List[Dict[str, Any]]:
    """Identify PII in text using patterns"""
    pii_items = []
    
    # SSN pattern
    ssn_pattern = r'\b\d{3}-?\d{2}-?\d{4}\b'
    for match in re.finditer(ssn_pattern, text):
        pii_items.append({
            'type': 'SSN',
            'start': match.start(),
            'end': match.end(),
            'text': match.group()
        })
    
    # Date of birth pattern
    dob_pattern = r'\b(?:DOB|DATE OF BIRTH|BIRTH DATE)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b'
    for match in re.finditer(dob_pattern, text, re.IGNORECASE):
        pii_items.append({
            'type': 'DATE_OF_BIRTH',
            'start': match.start(),
            'end': match.end(),
            'text': match.group()
        })
    
    # Add other PII patterns as needed
    
    return pii_items

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Main Lambda handler for DD214 processing"""
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        step_type = event.get('stepType', 'unknown')
        
        if step_type == 'textract_complete':
            return handle_textract_complete(event)
        elif step_type == 'macie_complete':
            return handle_macie_complete(event)
        elif step_type == 'generate_insights':
            return handle_generate_insights(event)
        else:
            # Handle direct invocation or S3 trigger
            return handle_document_upload(event)
            
    except Exception as e:
        logger.error(f"Error processing DD214: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Error processing DD214 document'
            })
        }

def handle_textract_complete(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle Textract completion"""
    logger.info("Processing Textract results")
    
    document_id = event.get('documentId')
    textract_job_id = event.get('textractJobId')
    
    if not document_id or not textract_job_id:
        raise ValueError("Missing documentId or textractJobId")
    
    # Get Textract results
    try:
        response = textract.get_document_text_detection(JobId=textract_job_id)
        blocks = response.get('Blocks', [])
        
        # Extract text and fields
        full_text = extract_text_from_blocks(blocks)
        dd214_fields = extract_dd214_fields(blocks)
        
        # Identify PII
        pii_locations = identify_pii(full_text)
        
        # Update DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET #status = :status, textract_complete = :complete, extracted_text = :text, dd214_fields = :fields, pii_locations = :pii, updated_at = :updated',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'textract_complete',
                ':complete': True,
                ':text': full_text[:5000],  # Limit size
                ':fields': dd214_fields,
                ':pii': pii_locations,
                ':updated': datetime.utcnow().isoformat()
            }
        )
        
        return {
            'statusCode': 200,
            'documentId': document_id,
            'status': 'textract_complete',
            'extractedFields': dd214_fields,
            'piiFound': len(pii_locations) > 0
        }
        
    except Exception as e:
        logger.error(f"Error getting Textract results: {str(e)}")
        raise

def handle_macie_complete(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle Macie scan completion"""
    logger.info("Processing Macie results")
    
    document_id = event.get('documentId')
    findings = event.get('findings', [])
    
    # Update DynamoDB with Macie results
    table = dynamodb.Table(TABLE_NAME)
    table.update_item(
        Key={'document_id': document_id},
        UpdateExpression='SET #status = :status, macie_complete = :complete, macie_findings = :findings, updated_at = :updated',
        ExpressionAttributeNames={
            '#status': 'status'
        },
        ExpressionAttributeValues={
            ':status': 'macie_complete',
            ':complete': True,
            ':findings': findings,
            ':updated': datetime.utcnow().isoformat()
        }
    )
    
    return {
        'statusCode': 200,
        'documentId': document_id,
        'status': 'macie_complete',
        'findingsCount': len(findings)
    }

def handle_generate_insights(event: Dict[str, Any]) -> Dict[str, Any]:
    """Generate insights using Bedrock"""
    logger.info("Generating DD214 insights")
    
    document_id = event.get('documentId')
    
    # Get document data from DynamoDB
    table = dynamodb.Table(TABLE_NAME)
    response = table.get_item(Key={'document_id': document_id})
    item = response.get('Item', {})
    
    dd214_fields = item.get('dd214_fields', {})
    
    # Generate insights using Bedrock
    insights = generate_bedrock_insights(dd214_fields)
    
    # Update DynamoDB
    table.update_item(
        Key={'document_id': document_id},
        UpdateExpression='SET #status = :status, insights = :insights, insights_generated = :generated, updated_at = :updated',
        ExpressionAttributeNames={
            '#status': 'status'
        },
        ExpressionAttributeValues={
            ':status': 'complete',
            ':insights': insights,
            ':generated': True,
            ':updated': datetime.utcnow().isoformat()
        }
    )
    
    return {
        'statusCode': 200,
        'documentId': document_id,
        'status': 'complete',
        'insights': insights
    }

def generate_bedrock_insights(dd214_fields: Dict[str, Any]) -> Dict[str, Any]:
    """Generate insights using Bedrock"""
    try:
        # Prepare prompt
        prompt = f"""Based on the following DD214 military service information, provide career transition insights:

Service Member Information:
- Branch: {dd214_fields.get('service_branch', 'Unknown')}
- Grade/Rank: {dd214_fields.get('grade_rate_rank', 'Unknown')}
- Primary Specialty: {dd214_fields.get('primary_specialty', 'Unknown')}
- Character of Service: {dd214_fields.get('character_of_service', 'Unknown')}
- Military Education: {', '.join(dd214_fields.get('military_education', [])[:5])}
- Decorations: {', '.join(dd214_fields.get('decorations_medals', [])[:5])}

Please provide:
1. Top 3 civilian career matches
2. Key transferable skills
3. Recommended certifications or education
4. Expected salary range
5. Job search tips specific to this military background

Format the response as JSON."""

        # Call Bedrock
        response = bedrock_runtime.invoke_model(
            modelId="anthropic.claude-v2",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "prompt": f"\n\nHuman: {prompt}\n\nAssistant:",
                "max_tokens_to_sample": 1000,
                "temperature": 0.7
            })
        )
        
        result = json.loads(response['body'].read())
        insights_text = result.get('completion', '')
        
        # Try to parse JSON from response
        try:
            # Extract JSON from the response
            json_start = insights_text.find('{')
            json_end = insights_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                insights = json.loads(insights_text[json_start:json_end])
            else:
                insights = {'raw_insights': insights_text}
        except:
            insights = {'raw_insights': insights_text}
        
        return insights
        
    except Exception as e:
        logger.error(f"Error generating Bedrock insights: {str(e)}")
        return {
            'error': 'Unable to generate insights',
            'message': str(e)
        }

def handle_document_upload(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle new document upload"""
    logger.info("Processing new document upload")
    
    # Extract S3 information
    if 'Records' in event:
        # S3 trigger
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
    else:
        # Direct invocation
        bucket = event.get('bucket', BUCKET_NAME)
        key = event.get('key')
    
    if not key:
        raise ValueError("No document key provided")
    
    # Generate document ID
    document_id = str(uuid.uuid4())
    
    # Extract user ID from key (assuming format: uploads/{userId}/{filename})
    user_id = key.split('/')[1] if '/' in key else 'unknown'
    
    # Create DynamoDB entry
    table = dynamodb.Table(TABLE_NAME)
    table.put_item(
        Item={
            'document_id': document_id,
            'user_id': user_id,
            'bucket': bucket,
            'key': key,
            'status': 'uploaded',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
    )
    
    # Start Step Functions execution if configured
    if STATE_MACHINE_ARN:
        stepfunctions.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            name=f"dd214-processing-{document_id}",
            input=json.dumps({
                'documentId': document_id,
                'bucket': bucket,
                'key': key,
                'userId': user_id
            })
        )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'documentId': document_id,
            'status': 'processing_started',
            'message': 'DD214 processing initiated'
        })
    }