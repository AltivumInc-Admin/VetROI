import json
import uuid
from datetime import datetime


def lambda_handler(event, context):
    """
    Minimal VetROI Lambda - Returns mock recommendations
    No external dependencies, guaranteed to work
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
    
    # Generate mock recommendations based on branch
    branch = body.get('branch', 'army')
    state = body.get('homeState', 'TX')
    
    # Mock data - no external dependencies
    recommendations = [
        {
            "title": "Project Manager",
            "soc": "11-9199.00",
            "summary": "Lead cross-functional teams and manage complex projects using your military leadership experience.",
            "medianSalary": 95000,
            "matchReason": "Your military command experience translates directly to civilian project leadership.",
            "nextStep": "Get PMP certification to validate your project management skills."
        },
        {
            "title": "Operations Manager",
            "soc": "11-1021.00",
            "summary": "Oversee daily operations and optimize organizational efficiency with your logistics expertise.",
            "medianSalary": 85000,
            "matchReason": "Military operations planning directly applies to business operations management.",
            "nextStep": "Research Lean Six Sigma certification to enhance your credentials."
        },
        {
            "title": "Security Manager",
            "soc": "11-3013.01",
            "summary": "Protect organizational assets using your military security and risk assessment background.",
            "medianSalary": 92000,
            "matchReason": "Your force protection and security protocols experience is highly valued.",
            "nextStep": "Connect with corporate security professionals on LinkedIn."
        },
        {
            "title": "Training Coordinator",
            "soc": "13-1151.00",
            "summary": "Design and deliver training programs leveraging your military instruction experience.",
            "medianSalary": 65000,
            "matchReason": "Military training expertise transfers seamlessly to corporate training roles.",
            "nextStep": "Explore SHRM certification for HR and training professionals."
        },
        {
            "title": "Emergency Management Director",
            "soc": "11-9161.00",
            "summary": "Plan and coordinate emergency response using your crisis management experience.",
            "medianSalary": 78000,
            "matchReason": "Combat and emergency response skills are perfect for disaster management.",
            "nextStep": "Research FEMA certification programs in emergency management."
        }
    ]
    
    # Adjust salaries for state (simple mock logic)
    if state in ['CA', 'NY', 'WA']:
        for rec in recommendations:
            rec['medianSalary'] = int(rec['medianSalary'] * 1.25)
    elif state in ['TX', 'FL', 'NC']:
        for rec in recommendations:
            rec['medianSalary'] = int(rec['medianSalary'] * 0.95)
    
    # Build response
    response = {
        "sessionId": str(uuid.uuid4()),
        "recommendations": recommendations,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            'Access-Control-Allow-Credentials': 'true'
        },
        'body': json.dumps(response)
    }