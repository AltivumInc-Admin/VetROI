import json
import boto3
import os
from typing import Dict, Any
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
stepfunctions = boto3.client('stepfunctions')

TABLE_NAME = os.environ.get('TABLE_NAME')
STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Get DD214 processing status
    """
    # Enable CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }
    
    try:
        # Get document ID from path parameters
        document_id = event['pathParameters']['documentId']
        
        # Get status from DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        response = table.get_item(Key={'documentId': document_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Document not found',
                    'documentId': document_id
                })
            }
        
        item = response['Item']
        
        # Check Step Functions execution status if available
        if item.get('executionArn'):
            try:
                execution_response = stepfunctions.describe_execution(
                    executionArn=item['executionArn']
                )
                
                # Map Step Functions status to our status
                sf_status = execution_response['status']
                if sf_status == 'RUNNING':
                    item['status'] = 'processing'
                elif sf_status == 'SUCCEEDED':
                    item['status'] = 'complete'
                elif sf_status in ['FAILED', 'TIMED_OUT', 'ABORTED']:
                    item['status'] = 'error'
                    item['error'] = f"Processing failed: {sf_status}"
                
                # Update processing steps based on execution events
                update_processing_steps(item, execution_response)
                
            except Exception as e:
                print(f"Error checking Step Functions: {str(e)}")
        
        # Format response
        response_data = {
            'documentId': document_id,
            'status': item.get('status', 'unknown'),
            'uploadTime': item.get('uploadTime'),
            'processingStartTime': item.get('processingStartTime'),
            'processingEndTime': item.get('processingEndTime'),
            'steps': item.get('processingSteps', {}),
            'error': item.get('error'),
            'enhancedProfileUrl': item.get('enhancedProfileUrl')
        }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        print(f"Error getting status: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Failed to get status',
                'message': str(e)
            })
        }

def update_processing_steps(item: Dict[str, Any], execution_response: Dict[str, Any]) -> None:
    """
    Update processing steps based on Step Functions execution history
    """
    try:
        # This is a simplified version - in production, you'd parse the execution history
        # to determine which steps have completed
        
        # For now, we'll use a simple mapping based on overall status
        if execution_response['status'] == 'SUCCEEDED':
            for step in item.get('processingSteps', {}):
                item['processingSteps'][step] = {
                    'status': 'complete',
                    'timestamp': datetime.utcnow().isoformat()
                }
        elif execution_response['status'] == 'RUNNING':
            # Mark first few steps as complete based on execution time
            steps = list(item.get('processingSteps', {}).keys())
            start_time = execution_response['startDate']
            current_time = datetime.utcnow()
            # Convert AWS datetime to naive datetime for comparison
            start_time_naive = start_time.replace(tzinfo=None) if hasattr(start_time, 'replace') else start_time
            elapsed_seconds = (current_time - start_time_naive).total_seconds()
            
            # Rough estimate: each step takes about 10 seconds
            completed_steps = min(int(elapsed_seconds / 10), len(steps))
            
            for i, step in enumerate(steps):
                if i < completed_steps:
                    item['processingSteps'][step] = {
                        'status': 'complete',
                        'timestamp': (start_time_naive + 
                                    timedelta(seconds=i * 10)).isoformat()
                    }
                elif i == completed_steps:
                    item['processingSteps'][step] = {
                        'status': 'in-progress',
                        'timestamp': datetime.utcnow().isoformat()
                    }
                else:
                    item['processingSteps'][step] = {'status': 'pending'}
                    
    except Exception as e:
        print(f"Error updating processing steps: {str(e)}")