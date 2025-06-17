import json
import boto3
import os
from typing import Dict, Any

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
stepfunctions = boto3.client('stepfunctions')
s3_client = boto3.client('s3')

# Environment variables
TABLE_NAME = os.environ.get('TABLE_NAME', 'VetROI_DD214_Processing')
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'vetroi-dd214-secure')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Get DD214 processing status"""
    
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
        # Get status from DynamoDB
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
        status = item.get('status', 'unknown')
        
        # Build response
        status_response = {
            'documentId': document_id,
            'status': status,
            'uploadedAt': item.get('created_at'),
            'processingStartedAt': item.get('processing_started_at'),
            'completedAt': item.get('completed_at')
        }
        
        # Add processing steps if available
        if 'processing_steps' in item:
            status_response['steps'] = item['processing_steps']
        
        # If processing, check Step Functions execution status
        if status == 'processing' and 'execution_arn' in item:
            try:
                exec_response = stepfunctions.describe_execution(
                    executionArn=item['execution_arn']
                )
                status_response['executionStatus'] = exec_response['status']
                
                # Update if execution completed/failed
                if exec_response['status'] in ['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']:
                    new_status = 'complete' if exec_response['status'] == 'SUCCEEDED' else 'error'
                    table.update_item(
                        Key={'document_id': document_id},
                        UpdateExpression='SET #status = :status',
                        ExpressionAttributeNames={'#status': 'status'},
                        ExpressionAttributeValues={':status': new_status}
                    )
                    status_response['status'] = new_status
            except Exception as e:
                print(f"Error checking execution status: {str(e)}")
        
        # If complete, add extracted fields
        if status == 'complete' and 'extracted_fields' in item:
            try:
                # Parse extracted fields if stored as string
                if isinstance(item['extracted_fields'], str):
                    status_response['extractedFields'] = json.loads(item['extracted_fields'])
                else:
                    status_response['extractedFields'] = item['extracted_fields']
            except:
                pass
        
        # If complete, generate pre-signed URL for results
        if status == 'complete':
            try:
                results_key = f"users/{item.get('user_id', 'unknown')}/processed/{document_id}_results.json"
                presigned_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': BUCKET_NAME,
                        'Key': results_key
                    },
                    ExpiresIn=3600  # 1 hour
                )
                status_response['resultsUrl'] = presigned_url
            except Exception as e:
                print(f"Error generating presigned URL: {str(e)}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            'body': json.dumps(status_response)
        }
        
    except Exception as e:
        print(f"Error getting status: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to get status'})
        }