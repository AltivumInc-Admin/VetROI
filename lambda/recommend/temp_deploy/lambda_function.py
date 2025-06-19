import json
import urllib.request
import urllib.parse
import base64
from datetime import datetime
import uuid
import os

def lambda_handler(event, context):
    """Production-ready handler with failover to hardcoded response"""
    
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
        
        # Try to call O*NET API
        try:
            # Get credentials from environment or use defaults
            username = os.environ.get('ONET_USERNAME', '')
            password = os.environ.get('ONET_PASSWORD', '')
            
            if username and password:
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
                
                # Make request
                req = urllib.request.Request(full_url)
                req.add_header('Accept', 'application/json')
                req.add_header('Authorization', f'Basic {auth_string}')
                
                with urllib.request.urlopen(req, timeout=10) as response:
                    onet_data = json.loads(response.read())
                
                # Generate session ID
                session_id = str(uuid.uuid4())
                
                # Return real O*NET data
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
            else:
                raise Exception("No O*NET credentials available")
                
        except Exception as api_error:
            print(f"O*NET API error: {str(api_error)}, falling back to demo data")
            # Fall through to demo data
        
        # FALLBACK: Return hardcoded demo data
        session_id = f"demo-{uuid.uuid4()}"
        
        # Map common MOS codes to demo careers
        demo_careers = {
            "11B": {
                "title": "Infantry (Army - Enlisted)",
                "careers": [
                    {"code": "33-3051.01", "title": "Police Patrol Officers"},
                    {"code": "33-9032.00", "title": "Security Guards"},
                    {"code": "33-3051.03", "title": "Sheriffs and Deputy Sheriffs"},
                    {"code": "53-3032.00", "title": "Heavy and Tractor-Trailer Truck Drivers"},
                    {"code": "47-2061.00", "title": "Construction Laborers"}
                ]
            },
            "68W": {
                "title": "Health Care Specialist (Army - Enlisted)",
                "careers": [
                    {"code": "29-2041.00", "title": "Emergency Medical Technicians"},
                    {"code": "31-9092.00", "title": "Medical Assistants"},
                    {"code": "29-2061.00", "title": "Licensed Practical Nurses"},
                    {"code": "29-1141.00", "title": "Registered Nurses"},
                    {"code": "29-2053.00", "title": "Psychiatric Technicians"}
                ]
            },
            "25B": {
                "title": "Information Technology Specialist (Army - Enlisted)",
                "careers": [
                    {"code": "15-1232.00", "title": "Computer User Support Specialists"},
                    {"code": "15-1231.00", "title": "Computer Network Support Specialists"},
                    {"code": "15-1212.00", "title": "Information Security Analysts"},
                    {"code": "15-1211.00", "title": "Computer Systems Analysts"},
                    {"code": "15-1244.00", "title": "Network and Computer Systems Administrators"}
                ]
            }
        }
        
        # Get demo data for MOS or use default
        mos_code = body.get('code', '11B')
        if mos_code in demo_careers:
            career_data = demo_careers[mos_code]
        else:
            # Default to infantry careers
            career_data = demo_careers['11B']
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                "session_id": session_id,
                "profile": body,
                "onet_careers": {
                    "match": [{
                        "code": mos_code,
                        "title": career_data["title"],
                        "occupations": {
                            "occupation": career_data["careers"]
                        }
                    }]
                },
                "timestamp": datetime.utcnow().isoformat(),
                "demo_mode": True
            })
        }
        
    except Exception as e:
        print(f"Handler error: {str(e)}")
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