import json
import boto3
import os
from typing import Dict, Any, List
import uuid
from datetime import datetime

# Initialize AWS clients
s3 = boto3.client('s3')
textract = boto3.client('textract')
comprehend = boto3.client('comprehend')
bedrock_runtime = boto3.client('bedrock-runtime')
dynamodb = boto3.resource('dynamodb')
stepfunctions = boto3.client('stepfunctions')

# Environment variables
BUCKET_NAME = os.environ.get('DD214_BUCKET')
TABLE_NAME = os.environ.get('PROFILE_TABLE')
STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN')

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
    
    # Get Textract results
    textract_response = textract.get_document_analysis(JobId=job_id)
    
    # Extract key DD214 fields
    extracted_data = {
        'name': extract_field(textract_response, 'Name'),
        'ssn_last_four': extract_field(textract_response, 'SSN')[-4:] if extract_field(textract_response, 'SSN') else None,
        'branch': extract_field(textract_response, 'Branch of Service'),
        'rank': extract_field(textract_response, 'Rank/Grade'),
        'mos': extract_field(textract_response, 'Primary Specialty'),
        'service_dates': {
            'start': extract_field(textract_response, 'Date Entered Active Duty'),
            'end': extract_field(textract_response, 'Date of Separation')
        },
        'decorations': extract_field(textract_response, 'Decorations, Medals'),
        'education': extract_field(textract_response, 'Education'),
        'additional_mos': extract_field(textract_response, 'Additional MOS')
    }
    
    # Redact sensitive information
    redacted_data = redact_pii(extracted_data)
    
    return {
        'documentId': document_id,
        'extractedData': redacted_data,
        'stepType': 'comprehend_start'
    }

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