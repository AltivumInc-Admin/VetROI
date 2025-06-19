import json
import os
from typing import Dict, Any

import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_xray_sdk.core import patch_all

# Patch all AWS SDK clients for X-Ray tracing
patch_all()

logger = Logger()
tracer = Tracer()

s3_client = boto3.client('s3')
textract_client = boto3.client('textract')
comprehend_client = boto3.client('comprehend')
events_client = boto3.client('events')
dynamodb = boto3.resource('dynamodb')

table_name = os.environ.get('TABLE_NAME', 'VetROI_Sessions')
table = dynamodb.Table(table_name)


@logger.inject_lambda_context(correlation_id_path=correlation_paths.S3_OBJECT_KEY)
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process DD-214 documents uploaded to S3
    """
    try:
        # Extract S3 event details
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        logger.info(f"Processing DD-214: s3://{bucket}/{key}")
        
        # Extract session ID from key (format: dd214/{session_id}/filename.pdf)
        session_id = key.split('/')[1]
        
        # Start Textract job
        textract_response = textract_client.analyze_document(
            Document={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            },
            FeatureTypes=['FORMS', 'TABLES']
        )
        
        # Extract text from Textract response
        extracted_text = extract_text_from_textract(textract_response)
        
        # Use Comprehend to extract entities
        comprehend_response = comprehend_client.detect_entities(
            Text=extracted_text[:5000],  # Comprehend has text limits
            LanguageCode='en'
        )
        
        # Parse military-specific information
        skills, clearance = parse_military_info(extracted_text, comprehend_response)
        
        # Update session with extracted data
        update_session(session_id, skills, clearance)
        
        # Send event for recommendation refresh
        send_refresh_event(session_id, skills, clearance)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'DD-214 processed successfully',
                'session_id': session_id,
                'skills_found': len(skills)
            })
        }
        
    except Exception as e:
        logger.exception("Error processing DD-214")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


@tracer.capture_method
def extract_text_from_textract(response: Dict[str, Any]) -> str:
    """Extract text from Textract response"""
    
    text_blocks = []
    
    for block in response.get('Blocks', []):
        if block['BlockType'] == 'LINE':
            text_blocks.append(block.get('Text', ''))
    
    return ' '.join(text_blocks)


@tracer.capture_method
def parse_military_info(text: str, comprehend_response: Dict[str, Any]) -> tuple:
    """Parse military-specific information from text"""
    
    skills = []
    clearance = None
    
    # Extract skills from Comprehend entities
    for entity in comprehend_response.get('Entities', []):
        if entity['Type'] in ['OTHER', 'TITLE']:
            # Filter for military-relevant skills
            skill_text = entity['Text'].lower()
            if any(keyword in skill_text for keyword in ['leadership', 'logistics', 'operations', 'security', 'communications']):
                skills.append(entity['Text'])
    
    # Look for security clearance
    clearance_keywords = ['secret', 'top secret', 'ts/sci', 'confidential']
    text_lower = text.lower()
    
    for keyword in clearance_keywords:
        if keyword in text_lower:
            if keyword == 'top secret':
                clearance = 'Top Secret'
            elif keyword == 'ts/sci':
                clearance = 'TS/SCI'
            elif keyword == 'secret' and 'top secret' not in text_lower:
                clearance = 'Secret'
            elif keyword == 'confidential':
                clearance = 'Confidential'
            break
    
    # Extract common military skills
    military_skills = [
        'Leadership', 'Team Management', 'Strategic Planning',
        'Risk Assessment', 'Emergency Response', 'Equipment Maintenance',
        'Training and Development', 'Logistics Coordination',
        'Security Operations', 'Communications Systems'
    ]
    
    for skill in military_skills:
        if skill.lower() in text_lower and skill not in skills:
            skills.append(skill)
    
    return skills[:10], clearance  # Limit to top 10 skills


@tracer.capture_method
def update_session(session_id: str, skills: list, clearance: str) -> None:
    """Update DynamoDB session with extracted data"""
    
    try:
        table.update_item(
            Key={
                'session_id': session_id,
                'timestamp': 0  # Assuming we need to query for the actual timestamp
            },
            UpdateExpression='SET extracted_skills = :skills, security_clearance = :clearance',
            ExpressionAttributeValues={
                ':skills': skills,
                ':clearance': clearance
            }
        )
        logger.info(f"Updated session {session_id} with DD-214 data")
    except Exception as e:
        logger.error(f"Failed to update session: {e}")


@tracer.capture_method
def send_refresh_event(session_id: str, skills: list, clearance: str) -> None:
    """Send EventBridge event to trigger recommendation refresh"""
    
    try:
        events_client.put_events(
            Entries=[
                {
                    'Source': 'vetroi.dd214parser',
                    'DetailType': 'DD214Processed',
                    'Detail': json.dumps({
                        'session_id': session_id,
                        'skills': skills,
                        'clearance': clearance
                    })
                }
            ]
        )
        logger.info(f"Sent refresh event for session {session_id}")
    except Exception as e:
        logger.error(f"Failed to send event: {e}")