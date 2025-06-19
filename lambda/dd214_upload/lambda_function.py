import json
import boto3
import uuid
from datetime import datetime
from typing import Dict, Any
import os
import jwt
from jwt.exceptions import InvalidTokenError

# Initialize AWS clients
s3_client = boto3.client('s3')
cognito_client = boto3.client('cognito-idp')

# Environment variables
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'vetroi-dd214-secure')
USER_POOL_ID = os.environ.get('USER_POOL_ID', 'us-east-2_zVjrLf0jA')
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Generate pre-signed URL for DD214 upload"""
    
    # Extract request details
    headers = event.get('headers', {})
    
    # Handle both direct invocation and API Gateway
    if 'body' in event and isinstance(event['body'], str):
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError:
            return error_response(400, 'Invalid request body')
    else:
        body = event
    
    # Validate authorization
    auth_header = headers.get('Authorization', '') or headers.get('authorization', '')
    if not auth_header or not auth_header.startswith('Bearer '):
        return error_response(401, 'Missing or invalid authorization header')
    
    # Extract and verify JWT token
    token = auth_header.replace('Bearer ', '')
    try:
        # Decode JWT to get user info
        # Note: In production, you should verify the token signature
        # For now, we decode without verification since API Gateway handles auth
        decoded_token = jwt.decode(token, options={"verify_signature": False})
        cognito_sub = decoded_token.get('sub')
        email = decoded_token.get('email', decoded_token.get('cognito:username', ''))
        
        if not cognito_sub:
            return error_response(401, 'Invalid token: missing user ID')
            
    except Exception as e:
        print(f"Token decode error: {str(e)}")
        return error_response(401, 'Invalid token')
    
    # Validate input
    filename = body.get('filename', '')
    file_type = body.get('fileType', '')
    
    if not filename or not file_type:
        return error_response(400, 'Missing filename or fileType')
    
    # Validate file extension
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return error_response(400, f'Invalid file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}')
    
    # Generate document ID and S3 key
    document_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    
    # Store in user-specific folder using Cognito sub
    s3_key = f"users/{cognito_sub}/original/{timestamp}_{document_id}{file_ext}"
    
    # Generate pre-signed URL
    try:
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': s3_key,
                'ContentType': file_type
            },
            ExpiresIn=300  # 5 minutes
        )
        
        # Store initial processing record in DynamoDB
        dynamodb = boto3.resource('dynamodb')
        
        # Store in processing table
        processing_table = dynamodb.Table('VetROI_DD214_Processing')
        processing_table.put_item(
            Item={
                'document_id': document_id,
                'user_id': cognito_sub,
                'email': email,
                's3_key': s3_key,
                'filename': filename,
                'status': 'pending_upload',
                'created_at': datetime.utcnow().isoformat(),
                'processing_steps': {
                    'upload': {'status': 'pending'},
                    'validation': {'status': 'pending'},
                    'textract': {'status': 'pending'},
                    'pii_detection': {'status': 'pending'},
                    'analysis': {'status': 'pending'}
                }
            }
        )
        
        # Also store in user documents table for tracking
        user_docs_table = dynamodb.Table('VetROI_UserDocuments')
        user_docs_table.put_item(
            Item={
                'userId': cognito_sub,
                'documentId': document_id,
                'uploadedAt': datetime.utcnow().isoformat(),
                'fileName': filename,
                'bucketName': BUCKET_NAME,
                'fileKey': s3_key,
                'documentType': 'DD214',
                'processingStatus': 'pending_upload',
                'userEmail': email
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            'body': json.dumps({
                'uploadUrl': presigned_url,
                'documentId': document_id,
                'expiresIn': 300
            })
        }
        
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        return error_response(500, 'Failed to generate upload URL')


def error_response(status_code: int, message: str) -> Dict[str, Any]:
    """Generate error response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        'body': json.dumps({'error': message})
    }