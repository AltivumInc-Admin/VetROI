import json
import boto3
import os
from typing import Dict, Any

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
TABLE_NAME = os.environ.get('TABLE_NAME', 'VetROI_DD214_Processing')
REDACTED_BUCKET = os.environ.get('REDACTED_BUCKET', 'vetroi-dd214-redacted')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Get redacted DD214 document"""
    
    # Extract document ID from path parameters
    path_params = event.get('pathParameters', {})
    document_id = path_params.get('documentId')
    
    if not document_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Missing documentId parameter'})
        }
    
    try:
        # Get document info from DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        response = table.get_item(Key={'document_id': document_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Document not found'})
            }
        
        item = response['Item']
        
        # Check if redaction is complete
        redacted_key = item.get('redacted_document_key')
        if not redacted_key:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Redacted document not available'})
            }
        
        # Generate pre-signed URL for redacted document
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': REDACTED_BUCKET,
                'Key': redacted_key
            },
            ExpiresIn=3600  # 1 hour
        )
        
        # Build response
        redacted_info = {
            'documentId': document_id,
            'redactedUrl': presigned_url,
            'redactedAt': item.get('processing_steps', {}).get('redaction', {}).get('completed_at'),
            'itemsRedacted': item.get('processing_steps', {}).get('redaction', {}).get('items_redacted', 0),
            'status': 'available'
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps(redacted_info)
        }
        
    except Exception as e:
        print(f"Error getting redacted document: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to get redacted document'})
        }