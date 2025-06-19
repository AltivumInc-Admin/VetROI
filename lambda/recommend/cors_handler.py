import json

def lambda_handler(event, context):
    """Minimal handler for CORS preflight"""
    
    # Handle CORS preflight requests
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
    
    # For non-OPTIONS requests, return error with CORS headers
    return {
        'statusCode': 503,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'error': 'Service temporarily unavailable. Lambda configuration in progress.'
        })
    }