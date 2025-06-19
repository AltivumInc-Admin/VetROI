import json
import urllib.request
import urllib.parse
import base64
from datetime import datetime

def lambda_handler(event, context):
    # CORS check
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Api-Key'
            },
            'body': ''
        }
    
    # HARDCODED DEMO RESPONSE
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            "session_id": "demo-session-12345",
            "profile": {
                "branch": "army",
                "code": "11B",
                "homeState": "CA",
                "relocate": False,
                "education": "high_school"
            },
            "onet_careers": {
                "match": [{
                    "code": "11B",
                    "title": "Infantry (Army - Enlisted)",
                    "occupations": {
                        "occupation": [
                            {"code": "33-3051.01", "title": "Police Patrol Officers"},
                            {"code": "33-9032.00", "title": "Security Guards"},
                            {"code": "33-3051.03", "title": "Sheriffs and Deputy Sheriffs"},
                            {"code": "53-3032.00", "title": "Heavy and Tractor-Trailer Truck Drivers"},
                            {"code": "47-2061.00", "title": "Construction Laborers"}
                        ]
                    }
                }]
            },
            "timestamp": datetime.utcnow().isoformat()
        })
    }