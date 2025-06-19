import json
import os
import boto3
import requests
from base64 import b64encode
from datetime import datetime
import uuid

# Initialize clients
dynamodb = boto3.resource('dynamodb')
secrets_client = boto3.client('secretsmanager')

def lambda_handler(event, context):
    """Emergency handler without complex dependencies"""
    
    # Handle CORS
    request_context = event.get('requestContext', {})
    http_method = request_context.get('http', {}).get('method') or event.get('httpMethod')
    
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Api-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        
        # Get O*NET credentials
        response = secrets_client.get_secret_value(SecretId='ONET')
        secret = json.loads(response['SecretString'])
        username = secret['username']
        password = secret['password']
        
        # Call O*NET API
        military_code = body.get('code', '11B')
        branch = body.get('branch', 'army')
        
        url = f"https://services.onetcenter.org/ws/online/crosswalks/military"
        params = {
            'keyword': military_code,
            'branch': branch
        }
        
        auth_string = b64encode(f"{username}:{password}".encode()).decode()
        headers = {
            'Accept': 'application/json',
            'Authorization': f'Basic {auth_string}'
        }
        
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        
        onet_data = response.json()
        
        # Store in session
        session_id = str(uuid.uuid4())
        table = dynamodb.Table(os.environ.get('TABLE_NAME', 'VetROI_Sessions'))
        
        table.put_item(
            Item={
                'session_id': session_id,
                'timestamp': int(datetime.utcnow().timestamp()),
                'profile': body,
                'onet_data': onet_data,
                'created_at': datetime.utcnow().isoformat()
            }
        )
        
        # Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'session_id': session_id,
                'profile': body,
                'onet_careers': onet_data,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }