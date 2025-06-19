import json
import os
import time
import uuid
from datetime import datetime
from typing import Dict, List, Any

import boto3
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths
from pydantic import BaseModel, Field, validator
from aws_xray_sdk.core import patch_all

# Patch all AWS SDK calls and HTTP calls for X-Ray tracing
patch_all()

from .models import VeteranRequest, RecommendationResponse, Career
from .onet_client import ONetClient
from .bedrock_client import BedrockClient

logger = Logger()
tracer = Tracer()
metrics = Metrics()

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'VetROI_Sessions')
table = dynamodb.Table(table_name)


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for VetROI recommendations
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
        veteran_request = VeteranRequest(**body)
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Initialize O*NET client only (no Bedrock during data collection phase)
        onet_client = ONetClient()
        
        # Get O*NET data for the military code with branch filter
        logger.info(f"Fetching O*NET data for code: {veteran_request.code}, branch: {veteran_request.branch}")
        onet_data = onet_client.get_career_data(
            veteran_request.code,
            veteran_request.homeState if not veteran_request.relocate else veteran_request.relocateState,
            veteran_request.branch
        )
        
        # Store the veteran profile and O*NET data in session
        store_profile_session(session_id, veteran_request, onet_data)
        
        # Track metrics
        metrics.add_metric(name="ProfilesCollected", unit=MetricUnit.Count, value=1)
        metrics.add_metadata(key="branch", value=veteran_request.branch)
        
        # Return the O*NET data directly without AI processing
        response_data = {
            'session_id': session_id,
            'profile': veteran_request.dict(),
            'onet_careers': onet_data,  # Full O*NET military crosswalk response
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data)
        }
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
    except Exception as e:
        logger.exception("Unexpected error")
        metrics.add_metric(name="Errors", unit=MetricUnit.Count, value=1)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }


@tracer.capture_method
def store_profile_session(session_id: str, request: VeteranRequest, onet_data: Dict[str, Any]) -> None:
    """Store veteran profile and O*NET data in DynamoDB"""
    
    timestamp = int(time.time())
    
    item = {
        'session_id': session_id,
        'timestamp': timestamp,
        'veteran_profile': request.dict(),
        'onet_careers': onet_data,
        'created_at': datetime.utcnow().isoformat(),
        'ttl': timestamp + (90 * 24 * 60 * 60)  # 90 days TTL
    }
    
    table.put_item(Item=item)
    logger.info(f"Stored profile session: {session_id}")