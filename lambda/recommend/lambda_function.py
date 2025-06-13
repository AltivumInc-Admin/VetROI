#!/usr/bin/env python3
"""
VetROI Lambda Function Entry Point
Handles CORS and routes to appropriate handler
"""

import json
import os
from typing import Dict, Any

# Import the actual handler - try different import paths
try:
    from src.handler_minimal import lambda_handler as minimal_handler
except ImportError:
    try:
        from handler_minimal import lambda_handler as minimal_handler
    except ImportError:
        # Fallback to inline minimal handler
        minimal_handler = None


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main entry point for VetROI Lambda function
    Handles CORS preflight and routes to appropriate handler
    """
    
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS' or event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
                'Access-Control-Max-Age': '86400',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'CORS preflight successful'})
        }
    
    # Route to the actual handler
    try:
        if minimal_handler:
            response = minimal_handler(event, context)
        else:
            # Inline minimal handler as fallback
            response = handle_request_inline(event, context)
        
        # Ensure CORS headers are always present
        if 'headers' not in response:
            response['headers'] = {}
        
        response['headers'].update({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept'
        })
        
        return response
        
    except Exception as e:
        print(f"Lambda error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }


def handle_request_inline(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Inline minimal handler as fallback
    """
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        
        # Basic validation
        required_fields = ['branch', 'code', 'homeState', 'relocate', 'education']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Generate mock response
        import uuid
        from datetime import datetime
        
        session_id = str(uuid.uuid4())
        
        response_data = {
            'sessionId': session_id,
            'message': f'Thank you for your service! Based on your {body.get("branch", "military")} background with code {body.get("code", "N/A")}, I can help you explore civilian career opportunities.',
            'timestamp': datetime.utcnow().isoformat(),
            'raw_onet_data': {
                'success': True,
                'data': {
                    'match': [{
                        'title': f'{body.get("branch", "Military")} Specialist ({body.get("code", "N/A")})',
                        'code': body.get('code', 'N/A')
                    }]
                }
            }
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
        print(f'Inline handler error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }