import json
import boto3
import os
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime
import re
from decimal import Decimal

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
            lines.append(block.get('Text', ''))
    
    # Join all text for pattern matching
    full_text = '\n'.join(lines)
    
    # Extract specific fields using patterns
    extracted = {
        'name': extract_field_pattern(full_text, [r'1\.\s*NAME[:\s]+(.+?)(?:\n|$)', r'NAME OF VETERAN[:\s]+(.+?)(?:\n|$)']),
        'ssn': extract_field_pattern(full_text, [r'2\.\s*SOCIAL SECURITY[:\s]+(.+?)(?:\n|$)', r'SSN[:\s]+(.+?)(?:\n|$)']),
        'branch': extract_field_pattern(full_text, [r'4\.\s*BRANCH[:\s]+(.+?)(?:\n|$)', r'BRANCH OF SERVICE[:\s]+(.+?)(?:\n|$)']),
        'rank': extract_field_pattern(full_text, [r'5\.\s*GRADE[:\s]+(.+?)(?:\n|$)', r'RANK[:\s]+(.+?)(?:\n|$)']),
        'pay_grade': extract_field_pattern(full_text, [r'6\.\s*PAY GRADE[:\s]+(.+?)(?:\n|$)']),
        'home_of_record': extract_field_pattern(full_text, [r'8\.\s*HOME OF RECORD[:\s]+(.+?)(?:\n|$)']),
        'last_duty': extract_field_pattern(full_text, [r'9\.\s*LAST DUTY ASSIGNMENT[:\s]+(.+?)(?:\n|$)']),
        'mos': extract_field_pattern(full_text, [r'11\.\s*PRIMARY SPECIALTY[:\s]+(.+?)(?:\n|$)', r'MOS[:\s]+(.+?)(?:\n|$)']),
        'service_start': extract_field_pattern(full_text, [r'12a\.\s*DATE ENTERED[:\s]+(.+?)(?:\n|$)']),
        'service_end': extract_field_pattern(full_text, [r'12b\.\s*SEPARATION DATE[:\s]+(.+?)(?:\n|$)']),
        'foreign_service': extract_field_pattern(full_text, [r'12c\.\s*FOREIGN SERVICE[:\s]+(.+?)(?:\n|$)']),
        'decorations': extract_field_pattern(full_text, [r'13\.\s*DECORATIONS[:\s]+(.+?)(?:\n|$)']),
        'education': extract_field_pattern(full_text, [r'14\.\s*MILITARY EDUCATION[:\s]+(.+?)(?:\n|$)']),
        'discharge_type': extract_field_pattern(full_text, [r'24\.\s*CHARACTER OF SERVICE[:\s]+(.+?)(?:\n|$)']),
        'separation_code': extract_field_pattern(full_text, [r'26\.\s*SEPARATION CODE[:\s]+(.+?)(?:\n|$)']),
        'reentry_code': extract_field_pattern(full_text, [r'27\.\s*REENTRY CODE[:\s]+(.+?)(?:\n|$)'])
    }
    
    # Clean empty values
    extracted = {k: v for k, v in extracted.items() if v}
    
    return extracted

def extract_field_pattern(text: str, patterns: List[str]) -> Optional[str]:
    """Extract field value using regex patterns"""
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            return match.group(1).strip()
    return None

def find_field_value(text_map: Dict[str, str], field_patterns: List[str]) -> Optional[str]:
    """Find field value from text map using patterns"""
    for pattern in field_patterns:
        for key, value in text_map.items():
            if pattern in key:
                # Try to get the value after the field name
                parts = value.split(pattern, 1)
                if len(parts) > 1:
                    return parts[1].strip()
    return None

def calculate_average_confidence(blocks: List[Dict[str, Any]]) -> Decimal:
    """Calculate average confidence score from blocks"""
    confidences = []
    for block in blocks:
        if 'Confidence' in block:
            confidences.append(Decimal(str(block['Confidence'])))
    if confidences:
        return sum(confidences) / Decimal(str(len(confidences)))
    return Decimal('0.0')

def count_data_points(extracted_data: Dict[str, Any]) -> int:
    """Count non-empty data points"""
    count = 0
    for key, value in extracted_data.items():
        if value:
            if isinstance(value, dict):
                count += count_data_points(value)
            else:
                count += 1
    return count

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main handler for DD214 processing pipeline
    Triggered by S3 upload or Step Function state
    """
    
    # Determine which step we're in
    step_type = event.get('stepType', 'initial')
    
    # Handle S3 trigger
    if 'Records' in event and event['Records'][0].get('s3'):
        return handle_document_upload(event)
    
    # Handle Step Functions steps
    if step_type == 'validate':
        return handle_document_validation(event)
    elif step_type == 'textract_complete':
        return handle_textract_results(event)
    elif step_type == 'enhance_profile':
        return handle_ai_enhancement(event)
    else:
        raise ValueError(f"Unknown step type: {step_type}")

def handle_document_validation(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate document for processing
    """
    document_id = event['documentId']
    bucket = event['bucket']
    key = event['key']
    
    try:
        # Validate file exists and is accessible
        response = s3.head_object(Bucket=bucket, Key=key)
        file_size = response['ContentLength']
        content_type = response.get('ContentType', '')
        
        # Update status in DynamoDB
        if TABLE_NAME:
            table = dynamodb.Table(TABLE_NAME)
            table.update_item(
                Key={'documentId': document_id},
                UpdateExpression='SET #status = :status, processingStartTime = :time, executionArn = :arn',
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':status': 'processing',
                    ':time': datetime.utcnow().isoformat(),
                    ':arn': os.environ.get('AWS_STEP_FUNCTIONS_EXECUTION_ARN', '')
                }
            )
        
        return {
            'documentId': document_id,
            'bucket': bucket,
            'key': key,
            'fileSize': file_size,
            'contentType': content_type,
            'validationStatus': 'passed'
        }
        
    except Exception as e:
        print(f"Validation error: {str(e)}")
        raise

def handle_document_upload(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Step 1: Validate and initiate document processing
    """
    # Extract S3 event details
    s3_event = event['Records'][0]['s3']
    bucket = s3_event['bucket']['name']
    key = s3_event['object']['key']
    
    # Generate unique document ID
    document_id = str(uuid.uuid4())
    
    # Validate file type and size
    response = s3.head_object(Bucket=bucket, Key=key)
    file_size = response['ContentLength']
    
    if file_size > 10 * 1024 * 1024:  # 10MB limit
        raise ValueError("File too large")
    
    # Start Step Function execution
    execution_input = {
        'documentId': document_id,
        'bucket': bucket,
        'key': key,
        'uploadTime': datetime.utcnow().isoformat(),
        'stepType': 'textract_start'
    }
    
    stepfunctions.start_execution(
        stateMachineArn=STATE_MACHINE_ARN,
        name=f"dd214-processing-{document_id}",
        input=json.dumps(execution_input)
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'documentId': document_id,
            'status': 'processing_started'
        })
    }

def handle_textract_results(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Step 2: Process Textract results and extract structured data
    """
    job_id = event['textractJobId']
    document_id = event['documentId']
    bucket = event.get('bucket')
    key = event.get('key')
    
    # Get ALL Textract results with pagination
    all_blocks = []
    next_token = None
    page_count = 0
    
    while True:
        if next_token:
            textract_response = textract.get_document_text_detection(
                JobId=job_id,
                NextToken=next_token
            )
        else:
            textract_response = textract.get_document_text_detection(JobId=job_id)
        
        all_blocks.extend(textract_response.get('Blocks', []))
        page_count += 1
        
        next_token = textract_response.get('NextToken')
        if not next_token:
            break
            
    print(f"Fetched {len(all_blocks)} blocks across {page_count} pages")
    
    # Save full Textract results to S3 for demo purposes
    full_results_key = f"textract-results/{document_id}/full_results.json"
    s3.put_object(
        Bucket=bucket,
        Key=full_results_key,
        Body=json.dumps({
            'jobId': job_id,
            'blockCount': len(all_blocks),
            'blocks': all_blocks,
            'timestamp': datetime.utcnow().isoformat()
        }),
        ContentType='application/json'
    )
    
    # Extract text and build structured response
    extracted_text = extract_text_from_blocks(all_blocks)
    
    # Extract key DD214 fields using the blocks
    extracted_data = extract_dd214_fields(all_blocks)
    
    # Generate demo insights
    demo_stats = {
        'totalBlocksFound': len(all_blocks),
        'totalLinesExtracted': len([b for b in all_blocks if b.get('BlockType') == 'LINE']),
        'totalWordsExtracted': len([b for b in all_blocks if b.get('BlockType') == 'WORD']),
        'confidenceScore': str(calculate_average_confidence(all_blocks)),  # Convert Decimal to string for DynamoDB
        'fieldsIdentified': len([k for k, v in extracted_data.items() if v]),
        'dataPoints': count_data_points(extracted_data)
    }
    
    # Save extraction summary for demo
    summary_key = f"textract-results/{document_id}/extraction_summary.json"
    s3.put_object(
        Bucket=bucket,
        Key=summary_key,
        Body=json.dumps({
            'documentId': document_id,
            'extractedData': extracted_data,
            'statistics': demo_stats,
            'rawTextPreview': extracted_text[:500] + '...' if len(extracted_text) > 500 else extracted_text,
            'timestamp': datetime.utcnow().isoformat()
        }),
        ContentType='application/json'
    )
    
    # Update DynamoDB with progress
    if TABLE_NAME:
        table = dynamodb.Table(TABLE_NAME)
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET textractStatus = :status, extractionStats = :stats, lastUpdated = :time',
            ExpressionAttributeValues={
                ':status': 'completed',
                ':stats': demo_stats,
                ':time': datetime.utcnow().isoformat()
            }
        )
        
        # Also update user documents table
        try:
            # Get user ID from processing table
            proc_response = table.get_item(Key={'document_id': document_id})
            if 'Item' in proc_response and 'user_id' in proc_response['Item']:
                user_id = proc_response['Item']['user_id']
                
                user_docs_table = dynamodb.Table('VetROI_UserDocuments')
                user_docs_table.update_item(
                    Key={
                        'userId': user_id,
                        'documentId': document_id
                    },
                    UpdateExpression='SET processingStatus = :status, lastUpdated = :time',
                    ExpressionAttributeValues={
                        ':status': 'textract_complete',
                        ':time': datetime.utcnow().isoformat()
                    }
                )
        except Exception as e:
            print(f"Error updating user documents table: {str(e)}")
    
    # Return complete data to Step Function (with size limit protection)
    response_data = {
        'documentId': document_id,
        'extractedText': extracted_text[:5000] if len(extracted_text) > 5000 else extracted_text,  # Limit text size
        'extractedFields': extracted_data,
        'fieldCount': len([k for k, v in extracted_data.items() if v]),
        'dataPoints': demo_stats['dataPoints'],
        'resultsLocation': f"s3://{bucket}/{summary_key}",
        'fullResultsLocation': f"s3://{bucket}/{full_results_key}",
        'stepType': 'textract_complete'
    }
    
    # If text is too large, store reference only
    if len(extracted_text) > 5000:
        response_data['textTruncated'] = True
        response_data['fullTextLocation'] = f"s3://{bucket}/textract-results/{document_id}/full_text.txt"
        # Save full text to S3
        s3.put_object(
            Bucket=bucket,
            Key=f"textract-results/{document_id}/full_text.txt",
            Body=extracted_text,
            ContentType='text/plain'
        )
    
    return response_data

def handle_comprehend_results(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Step 3: Use Comprehend to extract entities and key phrases
    """
    document_id = event['documentId']
    extracted_data = event['extractedData']
    
    # Combine relevant text for analysis
    text_for_analysis = f"""
    Military Service: {extracted_data.get('branch', '')}
    Rank: {extracted_data.get('rank', '')}
    Primary Specialty: {extracted_data.get('mos', '')}
    Decorations: {extracted_data.get('decorations', '')}
    Additional Training: {extracted_data.get('additional_mos', '')}
    """
    
    # Extract entities
    entities_response = comprehend.detect_entities(
        Text=text_for_analysis,
        LanguageCode='en'
    )
    
    # Extract key phrases
    key_phrases_response = comprehend.detect_key_phrases(
        Text=text_for_analysis,
        LanguageCode='en'
    )
    
    # Structure the results
    comprehend_results = {
        'entities': [
            {'text': e['Text'], 'type': e['Type'], 'score': e['Score']}
            for e in entities_response['Entities']
        ],
        'keyPhrases': [
            {'text': kp['Text'], 'score': kp['Score']}
            for kp in key_phrases_response['KeyPhrases']
        ],
        'skills': extract_skills_from_text(text_for_analysis)
    }
    
    return {
        'documentId': document_id,
        'extractedData': extracted_data,
        'comprehendResults': comprehend_results,
        'stepType': 'enhance_profile'
    }

def handle_ai_enhancement(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Step 4: Use Bedrock to enhance profile with AI insights
    """
    document_id = event['documentId']
    extracted_data = event['extractedData']
    comprehend_results = event['comprehendResults']
    
    # Create prompt for Bedrock
    prompt = f"""
    Based on this military profile, provide civilian career insights:
    
    Branch: {extracted_data.get('branch')}
    Rank: {extracted_data.get('rank')}
    MOS: {extracted_data.get('mos')}
    Key Skills: {', '.join([kp['text'] for kp in comprehend_results['keyPhrases'][:5]])}
    
    Please provide:
    1. Top 3 transferable skills for civilian careers
    2. Recommended job titles (3-5)
    3. Key resume keywords
    4. Potential certifications to pursue
    
    Format as JSON.
    """
    
    # Call Bedrock
    bedrock_response = bedrock_runtime.invoke_model(
        modelId='amazon.nova-lite-v1:0',
        contentType='application/json',
        accept='application/json',
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'messages': [{
                'role': 'user',
                'content': prompt
            }],
            'max_tokens': 1000,
            'temperature': 0.7
        })
    )
    
    # Parse AI response
    ai_insights = json.loads(bedrock_response['body'].read())
    
    # Combine all data
    enhanced_profile = {
        'documentId': document_id,
        'basicInfo': extracted_data,
        'nlpAnalysis': comprehend_results,
        'aiInsights': ai_insights,
        'createdAt': datetime.utcnow().isoformat()
    }
    
    return {
        'documentId': document_id,
        'enhancedProfile': enhanced_profile,
        'stepType': 'final_store'
    }

def handle_final_storage(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Step 5: Store enhanced profile in DynamoDB
    """
    document_id = event['documentId']
    enhanced_profile = event['enhancedProfile']
    
    # Store in DynamoDB
    table = dynamodb.Table(TABLE_NAME)
    table.put_item(Item=enhanced_profile)
    
    # Generate pre-signed URL for results
    results_key = f"processed/{document_id}/profile.json"
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=results_key,
        Body=json.dumps(enhanced_profile),
        ContentType='application/json'
    )
    
    presigned_url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET_NAME, 'Key': results_key},
        ExpiresIn=3600  # 1 hour
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'documentId': document_id,
            'status': 'complete',
            'profileUrl': presigned_url,
            'message': 'DD214 processing complete. Enhanced profile ready.'
        })
    }

# Helper functions
def extract_field(textract_response: Dict, field_name: str) -> str:
    """Extract specific field from Textract response"""
    for block in textract_response.get('Blocks', []):
        if block['BlockType'] == 'LINE' and field_name.lower() in block.get('Text', '').lower():
            # Look for the next LINE block as the value
            return get_next_value(textract_response, block)
    return None

def get_next_value(textract_response: Dict, current_block: Dict) -> str:
    """Get the value following a label in Textract results"""
    # Implementation depends on DD214 structure
    # This is a simplified version
    return "extracted_value"

def redact_pii(data: Dict) -> Dict:
    """Redact sensitive information"""
    redacted = data.copy()
    # Remove full SSN, keep only last 4
    if 'ssn' in redacted:
        del redacted['ssn']
    return redacted

def extract_skills_from_text(text: str) -> List[str]:
    """Extract military skills and qualifications"""
    # This would use a more sophisticated NLP approach
    # For now, a simple keyword extraction
    military_skills = [
        'leadership', 'logistics', 'communications',
        'medical', 'security', 'intelligence'
    ]
    
    found_skills = []
    for skill in military_skills:
        if skill in text.lower():
            found_skills.append(skill)
    
    return found_skills