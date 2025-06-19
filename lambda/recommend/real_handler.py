import json
import boto3
import base64
import urllib.request
import urllib.parse
from datetime import datetime
import uuid

def lambda_handler(event, context):
    """REAL O*NET API calls only - no hardcoded responses"""
    
    # Handle CORS preflight
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
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Get O*NET credentials from Secrets Manager
        secrets_client = boto3.client('secretsmanager')
        response = secrets_client.get_secret_value(SecretId='ONET')
        secret = json.loads(response['SecretString'])
        username = secret['username']
        password = secret['password']
        
        # Build O*NET request
        military_code = body.get('code', '11B')
        branch = body.get('branch', 'army')
        
        url = "https://services.onetcenter.org/ws/online/crosswalks/military"
        params = urllib.parse.urlencode({
            'keyword': military_code,
            'branch': branch
        })
        
        full_url = f"{url}?{params}"
        
        # Create auth header
        auth_string = base64.b64encode(f"{username}:{password}".encode()).decode()
        
        # Make request to O*NET
        req = urllib.request.Request(full_url)
        req.add_header('Accept', 'application/json')
        req.add_header('Authorization', f'Basic {auth_string}')
        
        with urllib.request.urlopen(req, timeout=20) as response:
            onet_data = json.loads(response.read())
        
        # Generate session ID and store in DynamoDB
        session_id = str(uuid.uuid4())
        
        # Store session
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('VetROI_Sessions')
        table.put_item(
            Item={
                'session_id': session_id,
                'timestamp': int(datetime.utcnow().timestamp()),
                'profile': body,
                'onet_data': onet_data,
                'created_at': datetime.utcnow().isoformat()
            }
        )
        
        # Return REAL O*NET data
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
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }