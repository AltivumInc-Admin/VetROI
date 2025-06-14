#!/usr/bin/env python3
"""
VetROI Lambda Function - REAL O*NET API Calls Only
"""

import json
import urllib3
import xml.etree.ElementTree as ET
from typing import Dict, Any
from datetime import datetime
import uuid
import base64


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler that makes REAL O*NET API calls - NO HARDCODING
    """
    
    # Handle CORS preflight requests - check multiple possible event structures
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
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Check if this is a career detail request
    path = event.get('path') or event.get('rawPath') or ''
    print(f"Lambda received path: {path}")
    print(f"Full event: {json.dumps(event)}")
    if '/career/' in path:
        return handle_career_detail(event, context)
    
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        
        # Validation
        required_fields = ['branch', 'code', 'homeState', 'relocate', 'education']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Call REAL O*NET API
        onet_data = call_onet_api_real(body['code'], body['branch'])
        
        # Generate response message
        message = generate_message_from_onet(body, onet_data)
        
        response_data = {
            'sessionId': session_id,
            'message': message,
            'timestamp': datetime.utcnow().isoformat(),
            'raw_onet_data': onet_data
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept'
            },
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        print(f"Lambda error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }


def call_onet_api_real(military_code: str, branch: str) -> Dict[str, Any]:
    """
    Make REAL call to O*NET API with proper authentication using urllib3
    """
    try:
        # O*NET credentials
        username = "altivum_io"
        password = "6992jxi"
        
        # Create basic auth header
        credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
        headers = {
            'Authorization': f'Basic {credentials}',
            'User-Agent': 'VetROI/1.0'
        }
        
        # Create HTTP pool manager
        http = urllib3.PoolManager()
        
        # O*NET API endpoint
        base_url = "https://services.onetcenter.org/ws/online/crosswalks/military"
        api_url = f"{base_url}?keyword={military_code}&branch={branch}"
        
        print(f"Calling O*NET API: {api_url}")
        
        # Make the API call
        response = http.request('GET', api_url, headers=headers, timeout=10)
        
        if response.status == 200:
            # Parse XML response
            xml_data = response.data.decode('utf-8')
            root = ET.fromstring(xml_data)
            
            # Convert XML to JSON structure
            matches = []
            for match in root.findall('match'):
                if match.get('active') == 'true':
                    match_data = {
                        'active': True,
                        'code': match.find('code').text if match.find('code') is not None else military_code,
                        'title': match.find('title').text if match.find('title') is not None else f"Unknown ({military_code})",
                        'occupations': {'occupation': []}
                    }
                    
                    # Parse occupations
                    occupations = match.find('occupations')
                    if occupations is not None:
                        for occ in occupations.findall('occupation'):
                            tags = occ.find('tags')
                            occ_data = {
                                'href': occ.get('href', ''),
                                'code': occ.find('code').text if occ.find('code') is not None else '',
                                'title': occ.find('title').text if occ.find('title') is not None else '',
                                'tags': {
                                    'bright_outlook': tags.get('bright_outlook') == 'true' if tags is not None else False,
                                    'green': tags.get('green') == 'true' if tags is not None else False
                                }
                            }
                            match_data['occupations']['occupation'].append(occ_data)
                    
                    matches.append(match_data)
            
            return {
                'success': True,
                'api_url': api_url,
                'timestamp': datetime.utcnow().isoformat(),
                'data': {
                    'keyword': military_code,
                    'branch': branch,
                    'total': len(matches),
                    'match': matches
                }
            }
        else:
            error_msg = response.data.decode('utf-8') if response.data else 'No response data'
            print(f"O*NET API error: {response.status} - {error_msg}")
            return {
                'success': False,
                'error': f"O*NET API returned {response.status}",
                'api_url': api_url,
                'timestamp': datetime.utcnow().isoformat(),
                'response_text': error_msg
            }
            
    except Exception as e:
        print(f"Error calling O*NET API: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'api_url': f"https://services.onetcenter.org/ws/online/crosswalks/military?keyword={military_code}&branch={branch}",
            'timestamp': datetime.utcnow().isoformat()
        }


def generate_message_from_onet(request: Dict[str, Any], onet_data: Dict[str, Any]) -> str:
    """
    Generate message based on REAL O*NET response
    """
    try:
        if onet_data.get('success') and onet_data.get('data', {}).get('match'):
            message = f"## O*NET API Response for Military Code: {request['code']}\\n\\n"
            message += f"**API URL Called:** `{onet_data.get('api_url', 'N/A')}`\\n\\n"
            message += f"**Timestamp:** {onet_data.get('timestamp', 'N/A')}\\n\\n"
            message += f"**Raw JSON Response:**\\n```json\\n{json.dumps(onet_data.get('data', {}), indent=2)}\\n```\\n\\n"
            message += f"**Status:** ✅ SUCCESS - Live data retrieved\\n"
            return message
        else:
            return f"## O*NET API Call Failed\\n\\nError: {onet_data.get('error', 'Unknown error')}\\n\\nAPI URL: {onet_data.get('api_url', 'N/A')}"
            
    except Exception as e:
        return f"Error generating message: {str(e)}"


def handle_career_detail(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle career detail requests by proxying to O*NET API
    """
    try:
        # Extract SOC code from path
        path = event.get('path') or event.get('rawPath') or ''
        soc_code = path.split('/career/')[-1].strip('/')
        
        if not soc_code:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing SOC code'})
            }
        
        # Call O*NET career report API
        career_data = get_onet_career_report(soc_code)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps(career_data)
        }
        
    except Exception as e:
        print(f"Career detail error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }


def get_onet_career_report(soc_code: str) -> Dict[str, Any]:
    """
    Get career report from O*NET API
    """
    try:
        # O*NET credentials
        username = "altivum_io"
        password = "6992jxi"
        
        # Create basic auth header
        credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
        headers = {
            'Authorization': f'Basic {credentials}',
            'Accept': 'application/json',
            'User-Agent': 'VetROI/1.0'
        }
        
        # Create HTTP pool manager
        http = urllib3.PoolManager()
        
        # O*NET API endpoint for career report
        api_url = f"https://services.onetcenter.org/ws/mnm/careers/{soc_code}/report"
        
        print(f"Calling O*NET Career Report API: {api_url}")
        
        # Make the API call
        response = http.request('GET', api_url, headers=headers, timeout=10)
        
        if response.status == 200:
            # Parse JSON response
            json_data = json.loads(response.data.decode('utf-8'))
            
            # Add SOC code and title for easy access
            return {
                'soc': soc_code,
                'title': json_data.get('career', {}).get('title', 'Unknown Career'),
                **json_data
            }
        else:
            error_msg = response.data.decode('utf-8') if response.data else 'No response data'
            print(f"O*NET Career Report API error: {response.status} - {error_msg}")
            return {
                'error': f"O*NET API returned {response.status}",
                'soc': soc_code
            }
            
    except Exception as e:
        print(f"Error calling O*NET Career Report API: {str(e)}")
        return {
            'error': str(e),
            'soc': soc_code
        }