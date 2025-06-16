#!/usr/bin/env python3
"""
VetROI Lambda Handler - ONLY O*NET crosswalk API
No Bedrock, No AI, No recommendations
Just returns O*NET crosswalk data from /online/crosswalks/military
"""

import json
import uuid
import time
import boto3
import base64
import urllib3
from datetime import datetime
from typing import Dict, Any


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler that ONLY returns O*NET crosswalk data"""
    
    # Log the event to debug
    print(f"Event received: {json.dumps(event)}")
    
    # Handle CORS preflight - check multiple possible event structures
    http_method = (
        event.get('httpMethod') or 
        event.get('requestContext', {}).get('http', {}).get('method') or
        event.get('requestContext', {}).get('httpMethod')
    )
    
    if http_method == 'OPTIONS':
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
    
    # Check if this is a career detail request
    path = event.get('path') or event.get('rawPath', '')
    if '/career/' in path and http_method == 'GET':
        return handle_career_detail(event, context)
    
    try:
        # Parse request for recommend endpoint
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        required = ['branch', 'code', 'homeState', 'relocate', 'education']
        for field in required:
            if field not in body:
                return error_response(400, f'Missing required field: {field}')
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Get O*NET crosswalk data - THE CORRECT ENDPOINT
        onet_data = get_onet_crosswalk_data(body['code'])
        
        # Store session in DynamoDB
        store_session(session_id, body, onet_data)
        
        # Return response with ONLY O*NET data
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
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
            },
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        print(f"Lambda error: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, str(e))


def get_onet_crosswalk_data(military_code: str) -> Dict[str, Any]:
    """
    Get O*NET military crosswalk data from the CORRECT endpoint
    /online/crosswalks/military - returns nested structure with occupations
    """
    try:
        # Get credentials from Secrets Manager
        secret_name = "ONET"
        secrets_client = boto3.client('secretsmanager')
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret = json.loads(response['SecretString'])
        
        # Make O*NET API call using urllib3
        http = urllib3.PoolManager()
        
        # CORRECT ENDPOINT - /online/crosswalks/military
        url = "https://services.onetcenter.org/ws/online/crosswalks/military"
        
        # Create basic auth header
        credentials = f"{secret['username']}:{secret['password']}"
        auth_header = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'VetROI/1.0',
            'Authorization': f'Basic {auth_header}'
        }
        
        # Only pass keyword parameter
        params = {
            'keyword': military_code
        }
        
        print(f"Calling O*NET API: {url} with params: {params}")
        
        response = http.request(
            'GET',
            url,
            fields=params,
            headers=headers,
            timeout=10.0
        )
        
        if response.status != 200:
            raise Exception(f"O*NET API returned status {response.status}")
        
        data = json.loads(response.data.decode('utf-8'))
        print(f"O*NET returned {data.get('total', 0)} matches")
        
        # Log the structure for debugging
        if data.get('match') and len(data['match']) > 0:
            first_match = data['match'][0]
            if 'occupations' in first_match:
                occupation_count = len(first_match['occupations'].get('occupation', []))
                print(f"First match contains {occupation_count} occupations")
        
        return data
        
    except Exception as e:
        print(f"O*NET API error: {str(e)}")
        # Return empty structure matching expected format
        return {
            'keyword': military_code,
            'branch': 'all',
            'total': 0,
            'match': [],
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
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        },
        'body': json.dumps({'error': message})
    }


def handle_career_detail(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle career detail requests from O*NET /mnm/careers/{soc}/report endpoint"""
    try:
        # Extract SOC code from path
        path = event.get('path') or event.get('rawPath', '')
        path_params = event.get('pathParameters', {})
        
        # Try to get SOC from pathParameters first
        soc_code = path_params.get('socCode') or path_params.get('soc')
        
        # If not found, extract from path
        if not soc_code and '/career/' in path:
            soc_code = path.split('/career/')[-1].strip('/')
        
        if not soc_code:
            return error_response(400, 'Missing SOC code in path')
        
        print(f"Fetching career details for SOC: {soc_code}")
        
        # Get O*NET credentials
        secret_name = "ONET"
        secrets_client = boto3.client('secretsmanager')
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret = json.loads(response['SecretString'])
        
        # Call O*NET career report API
        http = urllib3.PoolManager()
        url = f"https://services.onetcenter.org/ws/mnm/careers/{soc_code}/report"
        
        # Create basic auth header
        credentials = f"{secret['username']}:{secret['password']}"
        auth_header = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'VetROI/1.0',
            'Authorization': f'Basic {auth_header}'
        }
        
        print(f"Calling O*NET API: {url}")
        
        response = http.request(
            'GET',
            url,
            headers=headers,
            timeout=10.0
        )
        
        if response.status != 200:
            print(f"O*NET API error: Status {response.status}")
            return error_response(response.status, f"O*NET API error: {response.data.decode('utf-8')}")
        
        # Parse and return the O*NET response as-is
        data = json.loads(response.data.decode('utf-8'))
        print(f"Successfully fetched career data for {soc_code}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
            },
            'body': json.dumps(data)
        }
        
    except Exception as e:
        print(f"Error fetching career details: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, f"Error fetching career details: {str(e)}")