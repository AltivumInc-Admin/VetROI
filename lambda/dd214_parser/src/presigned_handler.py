import json
import boto3
import os
import uuid
from datetime import datetime
from typing import Dict, Any

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
stepfunctions = boto3.client('stepfunctions')

BUCKET_NAME = os.environ.get('DD214_BUCKET')
STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN', '')
TABLE_NAME = os.environ.get('TABLE_NAME', '')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Generate pre-signed URL for DD214 upload
    """
    # Enable CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        file_name = body.get('fileName', 'dd214.pdf')
        file_type = body.get('fileType', 'application/pdf')
        veteran_id = body.get('veteranId', str(uuid.uuid4()))
        
        # Validate file type
        allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
        if file_type not in allowed_types:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Invalid file type. Allowed types: PDF, JPG, PNG'
                })
            }
        
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # Create S3 key
        timestamp = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
        s3_key = f"uploads/{veteran_id}/{timestamp}-{document_id}/{file_name}"
        
        # Generate pre-signed URL
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': s3_key,
                'ContentType': file_type,
                'Metadata': {
                    'documentId': document_id,
                    'veteranId': veteran_id,
                    'uploadTime': datetime.utcnow().isoformat()
                }
            },
            ExpiresIn=3600  # 1 hour
        )
        
        # Store initial status in DynamoDB
        if TABLE_NAME:
            table = dynamodb.Table(TABLE_NAME)
            table.put_item(
                Item={
                    'documentId': document_id,
                    'veteranId': veteran_id,
                    'status': 'pending_upload',
                    'uploadTime': datetime.utcnow().isoformat(),
                    's3Key': s3_key,
                    'fileName': file_name,
                    'fileType': file_type,
                    'processingSteps': {
                        'Document Validation': {'status': 'pending'},
                        'Text Extraction': {'status': 'pending'},
                        'Security Scan': {'status': 'pending'},
                        'AI Enhancement': {'status': 'pending'},
                        'Profile Generation': {'status': 'pending'}
                    }
                }
            )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'uploadUrl': presigned_url,
                'documentId': document_id,
                's3Key': s3_key,
                'expiresIn': 3600
            })
        }
        
    except Exception as e:
        print(f"Error generating pre-signed URL: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Failed to generate upload URL',
                'message': str(e)
            })
        }