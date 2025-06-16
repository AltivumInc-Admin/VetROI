import json
import os
import time
from datetime import datetime
from typing import Dict, Any

import boto3
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit

from .models import VeteranRequest
from .bedrock_client import BedrockClient

logger = Logger()
tracer = Tracer()
metrics = Metrics()

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'VetROI_Sessions')
table = dynamodb.Table(table_name)


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for VetROI chat interface
    This is called when veteran clicks "Talk to Sentra"
    """
    
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        session_id = body.get('session_id')
        message = body.get('message', '')
        
        if not session_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Session ID required'})
            }
        
        # Retrieve session data from DynamoDB
        session_data = get_session_data(session_id)
        if not session_data:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Session not found'})
            }
        
        # Extract veteran profile and O*NET careers
        veteran_profile = VeteranRequest(**session_data['veteran_profile'])
        onet_careers = session_data['onet_careers']
        
        # Initialize Bedrock client
        bedrock_client = BedrockClient()
        
        # Generate personalized response using all collected data
        response = bedrock_client.generate_chat_response(
            veteran_profile=veteran_profile,
            onet_careers=onet_careers,
            user_message=message,
            conversation_history=session_data.get('conversation_history', [])
        )
        
        # Update conversation history
        update_conversation_history(session_id, message, response)
        
        # Track metrics
        metrics.add_metric(name="ChatInteractions", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'response': response,
                'session_id': session_id,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        logger.exception("Unexpected error in chat handler")
        metrics.add_metric(name="ChatErrors", unit=MetricUnit.Count, value=1)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }


@tracer.capture_method
def get_session_data(session_id: str) -> Dict[str, Any]:
    """Retrieve session data from DynamoDB"""
    try:
        response = table.get_item(Key={'session_id': session_id})
        return response.get('Item')
    except Exception as e:
        logger.error(f"Error retrieving session: {e}")
        return None


@tracer.capture_method
def update_conversation_history(session_id: str, user_message: str, ai_response: str) -> None:
    """Update conversation history in DynamoDB"""
    try:
        timestamp = datetime.utcnow().isoformat()
        
        # Update the session with new conversation history
        table.update_item(
            Key={'session_id': session_id},
            UpdateExpression='SET conversation_history = list_append(if_not_exists(conversation_history, :empty), :new_messages)',
            ExpressionAttributeValues={
                ':empty': [],
                ':new_messages': [
                    {
                        'role': 'user',
                        'content': user_message,
                        'timestamp': timestamp
                    },
                    {
                        'role': 'assistant',
                        'content': ai_response,
                        'timestamp': timestamp
                    }
                ]
            }
        )
        logger.info(f"Updated conversation history for session: {session_id}")
    except Exception as e:
        logger.error(f"Error updating conversation history: {e}")