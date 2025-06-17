import json
import boto3
import os
from typing import Dict, Any

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
PROCESSING_TABLE = os.environ.get('PROCESSING_TABLE', 'VetROI_DD214_Processing')
INSIGHTS_TABLE = os.environ.get('INSIGHTS_TABLE', 'VetROI_CareerInsights')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Get DD214 processing insights"""
    
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
        # Try to get from insights table first
        insights_table = dynamodb.Table(INSIGHTS_TABLE)
        response = insights_table.get_item(Key={'document_id': document_id})
        
        if 'Item' in response:
            insights_data = response['Item']
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                },
                'body': json.dumps({
                    'documentId': document_id,
                    'status': 'available',
                    'veteranProfile': insights_data.get('veteran_profile', {}),
                    'insights': insights_data.get('ai_insights', {}),
                    'generatedAt': insights_data.get('created_at')
                })
            }
        
        # If not in insights table, check processing table
        processing_table = dynamodb.Table(PROCESSING_TABLE)
        response = processing_table.get_item(Key={'document_id': document_id})
        
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
        
        # Check if insights are available in main table
        if 'ai_insights' in item:
            insights = item['ai_insights']
            if isinstance(insights, str):
                insights = json.loads(insights)
            
            # Extract profile from extracted fields
            extracted_fields = item.get('extracted_fields', {})
            if isinstance(extracted_fields, str):
                extracted_fields = json.loads(extracted_fields)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                },
                'body': json.dumps({
                    'documentId': document_id,
                    'status': 'available',
                    'extractedData': extracted_fields,
                    'insights': insights,
                    'processingStatus': item.get('status', 'unknown')
                })
            }
        
        # Check processing status
        status = item.get('status', 'unknown')
        processing_steps = item.get('processing_steps', {})
        
        # Check if insights generation is complete
        insights_step = processing_steps.get('insights', {})
        insights_status = insights_step.get('status', 'pending')
        
        if insights_status == 'complete':
            # Insights should be available but aren't found
            return {
                'statusCode': 202,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'documentId': document_id,
                    'status': 'processing',
                    'message': 'Insights generation complete, retrieving data...'
                })
            }
        elif insights_status == 'in-progress':
            return {
                'statusCode': 202,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'documentId': document_id,
                    'status': 'generating',
                    'message': 'AI insights are being generated...'
                })
            }
        elif insights_status == 'error':
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'documentId': document_id,
                    'status': 'error',
                    'error': insights_step.get('error', 'Insights generation failed')
                })
            }
        else:
            # Still processing earlier steps
            current_step = 'unknown'
            for step, details in processing_steps.items():
                if details.get('status') == 'in-progress':
                    current_step = step
                    break
            
            return {
                'statusCode': 202,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'documentId': document_id,
                    'status': 'processing',
                    'currentStep': current_step,
                    'message': f'Document is being processed. Current step: {current_step}'
                })
            }
        
    except Exception as e:
        print(f"Error getting insights: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to retrieve insights'})
        }