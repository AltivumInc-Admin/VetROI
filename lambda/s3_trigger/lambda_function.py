import json
import boto3
import os
from datetime import datetime

# Initialize AWS clients
stepfunctions = boto3.client('stepfunctions')
dynamodb = boto3.resource('dynamodb')

# Environment variables
STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN', 'arn:aws:states:us-east-2:205930636302:stateMachine:VetROI-DD214-Processing')
TABLE_NAME = os.environ.get('TABLE_NAME', 'VetROI_DD214_Processing')

def lambda_handler(event, context):
    """
    Triggered by S3 upload events to start DD214 processing
    """
    print(f"Event: {json.dumps(event)}")
    
    for record in event.get('Records', []):
        # Only process ObjectCreated events
        if not record['eventName'].startswith('ObjectCreated'):
            continue
            
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        # Only process files in the original/ folder
        if '/original/' not in key:
            print(f"Skipping non-original file: {key}")
            continue
            
        # Extract document ID from key
        # Format: users/{user_id}/original/{timestamp}_{document_id}.{ext}
        try:
            parts = key.split('/')
            if len(parts) >= 4:
                filename = parts[-1]  # e.g., "20240617_123456_uuid.pdf"
                document_id = filename.split('_')[-1].split('.')[0]
            else:
                print(f"Invalid key format: {key}")
                continue
        except Exception as e:
            print(f"Error parsing key {key}: {str(e)}")
            continue
        
        # Update DynamoDB status
        table = dynamodb.Table(TABLE_NAME)
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET #status = :status, processing_started_at = :timestamp',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'processing',
                ':timestamp': datetime.utcnow().isoformat()
            }
        )
        
        # Start Step Functions execution
        execution_input = {
            'documentId': document_id,
            'bucket': bucket,
            'key': key,
            'uploadTime': datetime.utcnow().isoformat()
        }
        
        try:
            response = stepfunctions.start_execution(
                stateMachineArn=STATE_MACHINE_ARN,
                name=f'dd214-{document_id}',
                input=json.dumps(execution_input)
            )
            
            print(f"Started Step Functions execution: {response['executionArn']}")
            
            # Update DynamoDB with execution ARN
            table.update_item(
                Key={'document_id': document_id},
                UpdateExpression='SET execution_arn = :arn',
                ExpressionAttributeValues={
                    ':arn': response['executionArn']
                }
            )
            
        except Exception as e:
            print(f"Error starting Step Functions: {str(e)}")
            # Update status to error
            table.update_item(
                Key={'document_id': document_id},
                UpdateExpression='SET #status = :status, #error = :error',
                ExpressionAttributeNames={
                    '#status': 'status',
                    '#error': 'error'
                },
                ExpressionAttributeValues={
                    ':status': 'error',
                    ':error': str(e)
                }
            )
            raise
    
    return {
        'statusCode': 200,
        'body': json.dumps('Processing started')
    }