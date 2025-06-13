import json
import uuid
import os
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
import urllib3

# Initialize clients
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
http = urllib3.PoolManager()

# O*NET API Configuration
ONET_BASE_URL = "https://services.onetcenter.org/ws/online/crosswalks/military"

def get_military_crosswalk(military_code: str) -> dict:
    """
    Call O*NET Military Crosswalk API in real-time
    
    Args:
        military_code: MOS/Rate/AFSC/NEC code from any branch
        
    Returns:
        Raw JSON response from O*NET API
    """
    try:
        # Build the URL with the military code
        url = f"{ONET_BASE_URL}?keyword={military_code}"
        
        # Headers with O*NET authentication
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'VetROI/1.0 (https://vetroi.altivum.ai)',
            'Authorization': 'Basic YWx0aXZ1bV9pbzo2OTkyanhp'
        }
        
        print(f"Calling O*NET API: {url}")
        
        # Make the API call - domain is registered with O*NET
        response = http.request('GET', url, headers=headers)
        
        if response.status == 200:
            data = json.loads(response.data.decode('utf-8'))
            print(f"O*NET API returned data for {military_code}")
            return {
                "success": True,
                "api_url": url,
                "timestamp": datetime.utcnow().isoformat(),
                "data": data
            }
        else:
            print(f"O*NET API error: {response.status}")
            return {
                "success": False,
                "api_url": url,
                "error": f"API returned status {response.status}",
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except Exception as e:
        print(f"Error calling O*NET API: {str(e)}")
        return {
            "success": False,
            "api_url": url,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

def lambda_handler(event, context):
    """
    VetROI Lambda - Now with LIVE O*NET data
    """
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS' or event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': ''
        }
    
    # Parse request body
    try:
        body = json.loads(event.get('body', '{}'))
    except:
        body = {}
    
    # Check if this is an initial profile submission
    if all(key in body for key in ['branch', 'code', 'homeState']):
        military_code = body.get('code', '')
        
        # Get LIVE O*NET data
        crosswalk_data = get_military_crosswalk(military_code)
        
        # For now, return the raw O*NET response for verification
        response_message = f"""## O*NET API Response for Military Code: {military_code}

**API URL Called:** `{crosswalk_data.get('api_url', 'N/A')}`

**Timestamp:** {crosswalk_data.get('timestamp', 'N/A')}

**Raw JSON Response:**
```json
{json.dumps(crosswalk_data.get('data', {}), indent=2)}
```

**Status:** {'✅ SUCCESS - Live data retrieved' if crosswalk_data.get('success') else '❌ ERROR - ' + crosswalk_data.get('error', 'Unknown error')}
"""
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({
                "sessionId": str(uuid.uuid4()),
                "message": response_message,
                "timestamp": datetime.utcnow().isoformat(),
                "raw_onet_data": crosswalk_data,
                "dataSource": "O*NET_LIVE_API"
            })
        }
    
    # Handle other conversation messages
    else:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': json.dumps({
                "sessionId": str(uuid.uuid4()),
                "message": "Please submit your military profile to see live O*NET data.",
                "timestamp": datetime.utcnow().isoformat()
            })
        }