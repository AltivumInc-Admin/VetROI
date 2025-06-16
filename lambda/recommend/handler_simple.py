#!/usr/bin/env python3
"""
Simplified VetROI Lambda Handler - No Pydantic, No Bedrock
Just returns O*NET data for the data collection phase
"""

import json
import uuid
import time
import boto3
import requests
from datetime import datetime
from typing import Dict, Any


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Simple handler that only returns O*NET data"""
    
    # Handle CORS preflight
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
        
        # Validate required fields
        required = ['branch', 'code', 'homeState', 'relocate', 'education']
        for field in required:
            if field not in body:
                return error_response(400, f'Missing required field: {field}')
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Get O*NET data
        onet_data = get_onet_data(body['code'], body['branch'])
        
        # Store session in DynamoDB
        store_session(session_id, body, onet_data)
        
        # Return response
        response_data = {
            'session_id': session_id,
            'profile': body,
            'onet_careers': onet_data,
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
        
    except Exception as e:
        print(f"Lambda error: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, 'Internal server error')


def get_onet_data(military_code: str, branch: str) -> Dict[str, Any]:
    """Get O*NET military crosswalk data"""
    try:
        # Get credentials from Secrets Manager
        secret_name = "ONET"
        secrets_client = boto3.client('secretsmanager')
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret = json.loads(response['SecretString'])
        
        # Make O*NET API call
        url = "https://services.onetcenter.org/ws/veterans/military"
        params = {
            'keyword': military_code,
            'branch': branch
        }
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'VetROI/1.0'
        }
        auth = (secret['username'], secret['password'])
        
        print(f"Calling O*NET API: {url} with params: {params}")
        
        response = requests.get(url, params=params, headers=headers, auth=auth, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        print(f"O*NET returned {data.get('total', 0)} careers")
        
        return data
        
    except Exception as e:
        print(f"O*NET API error: {str(e)}")
        # Return empty structure on error
        return {
            'keyword': military_code,
            'branch': branch,
            'total': 0,
            'career': [],
            'error': str(e)
        }


def store_session(session_id: str, profile: Dict, onet_data: Dict) -> None:
    """Store session in DynamoDB"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('VetROI_Sessions')
        
        timestamp = int(time.time())
        
        item = {
            'session_id': session_id,
            'timestamp': timestamp,
            'veteran_profile': profile,
            'onet_careers': onet_data,
            'created_at': datetime.utcnow().isoformat(),
            'ttl': timestamp + (90 * 24 * 60 * 60)  # 90 days
        }
        
        table.put_item(Item=item)
        print(f"Stored session: {session_id}")
        
    except Exception as e:
        print(f"Error storing session: {e}")
        # Don't fail the request if storage fails


def error_response(status_code: int, message: str) -> Dict[str, Any]:
    """Generate error response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message})
    }