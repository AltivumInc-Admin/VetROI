import json
import boto3
import os
from typing import Dict, Any
from datetime import datetime
import urllib.parse
from aws_xray_sdk.core import patch_all
from aws_lambda_powertools import Logger, Tracer

# Enable X-Ray tracing
patch_all()

logger = Logger()
tracer = Tracer()

stepfunctions = boto3.client('stepfunctions')
dynamodb = boto3.resource('dynamodb')

STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN')
TABLE_NAME = os.environ.get('TABLE_NAME')

@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Triggered by S3 upload to start DD214 processing pipeline
    """
    logger.info(f"Received S3 event: {json.dumps(event)}")
    
    try:
        # Extract S3 event details
        for record in event['Records']:
            # Get bucket and key
            bucket = record['s3']['bucket']['name']
            key = urllib.parse.unquote_plus(record['s3']['object']['key'])
            
            logger.info(f"Processing file: s3://{bucket}/{key}")
            
            # Add X-Ray annotations
            tracer.put_annotation("bucket", bucket)
            tracer.put_annotation("file_key", key)
            
            # Extract document ID from S3 key
            # Expected format: uploads/{veteranId}/{timestamp}-{documentId}/{filename}
            key_parts = key.split('/')
            if len(key_parts) < 4:
                logger.error(f"Invalid key format: {key}")
                continue
                
            # Extract IDs from the path
            path_segment = key_parts[2]  # {timestamp}-{documentId}
            document_id = path_segment.split('-')[-1]  # Get documentId after last hyphen
            veteran_id = key_parts[1]
            
            # Add document annotations
            tracer.put_annotation("document_id", document_id)
            tracer.put_annotation("veteran_id", veteran_id)
            
            logger.info(f"Document ID: {document_id}, Veteran ID: {veteran_id}")
            
            # Update status in DynamoDB
            if TABLE_NAME:
                table = dynamodb.Table(TABLE_NAME)
                table.update_item(
                    Key={'documentId': document_id},
                    UpdateExpression='SET #status = :status, s3UploadComplete = :time',
                    ExpressionAttributeNames={
                        '#status': 'status'
                    },
                    ExpressionAttributeValues={
                        ':status': 'starting_processing',
                        ':time': datetime.utcnow().isoformat()
                    }
                )
            
            # Start Step Functions execution
            execution_name = f"dd214-{document_id}-{int(datetime.utcnow().timestamp())}"
            
            execution_input = {
                'documentId': document_id,
                'veteranId': veteran_id,
                'bucket': bucket,
                'key': key,
                'uploadTime': datetime.utcnow().isoformat()
            }
            
            response = stepfunctions.start_execution(
                stateMachineArn=STATE_MACHINE_ARN,
                name=execution_name,
                input=json.dumps(execution_input)
            )
            
            print(f"Started Step Functions execution: {response['executionArn']}")
            
            # Update DynamoDB with execution ARN
            if TABLE_NAME:
                table.update_item(
                    Key={'documentId': document_id},
                    UpdateExpression='SET executionArn = :arn, executionName = :name',
                    ExpressionAttributeValues={
                        ':arn': response['executionArn'],
                        ':name': execution_name
                    }
                )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'DD214 processing started successfully'
            })
        }
        
    except Exception as e:
        print(f"Error processing S3 event: {str(e)}")
        raise