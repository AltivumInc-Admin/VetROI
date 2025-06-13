#!/usr/bin/env python3
"""
VetROI Lambda Function Entry Point
Handles CORS and routes to appropriate handler
"""

import json
import os
from typing import Dict, Any

# Import the actual handler
from src.handler_minimal import lambda_handler as minimal_handler


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
        response = minimal_handler(event, context)
        
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