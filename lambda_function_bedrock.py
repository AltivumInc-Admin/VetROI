import json
import uuid
from datetime import datetime
import boto3
from botocore.exceptions import ClientError


def build_initial_prompt(veteran_profile):
    """Build the initial conversation prompt with veteran context"""
    branch_names = {
        'army': 'U.S. Army',
        'navy': 'U.S. Navy',
        'marine_corps': 'U.S. Marine Corps',
        'air_force': 'U.S. Air Force',
        'space_force': 'U.S. Space Force',
        'coast_guard': 'U.S. Coast Guard'
    }
    
    education_levels = {
        'high_school': 'High School Diploma',
        'associate': 'Associate Degree',
        'bachelor': "Bachelor's Degree",
        'master': "Master's Degree",
        'doctorate': 'Doctorate'
    }
    
    branch_name = branch_names.get(veteran_profile.get('branch', 'army'), 'military')
    education = education_levels.get(veteran_profile.get('education', 'high_school'), 'High School')
    
    prompt = f"""You are VetROI™, an AI assistant specializing in helping military veterans transition to civilian careers. You provide personalized, actionable career guidance based on military experience.

VETERAN PROFILE:
- Branch of Service: {branch_name}
- Military Occupational Specialty (MOS/Rate/AFSC): {veteran_profile.get('code', 'Not specified')}
- Current Location: {veteran_profile.get('homeState', 'Not specified')}
- Education Level: {education}
- Willing to Relocate: {'Yes, to ' + veteran_profile.get('relocateState', '') if veteran_profile.get('relocate') else 'No'}

YOUR ROLE:
1. Acknowledge their military service respectfully
2. Ask about their specific career interests or transition concerns
3. Provide guidance that connects their military skills to civilian opportunities
4. Be conversational, supportive, and practical
5. Focus on actionable next steps

Start by greeting this veteran and asking what kind of civilian career path interests them most."""
    
    return prompt


def lambda_handler(event, context):
    """
    VetROI Lambda with Amazon Nova Lite integration
    Handles both initial profile submission and conversation messages
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
    
    # Determine if this is an initial profile submission or ongoing conversation
    is_initial = all(key in body for key in ['branch', 'code', 'homeState'])
    
    try:
        # Create Bedrock Runtime client
        bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
        
        # Model configuration
        model_id = 'amazon.nova-lite-v1:0'
        
        if is_initial:
            # Initial conversation - build context from veteran profile
            system_prompt = build_initial_prompt(body)
            conversation = [
                {
                    "role": "user",
                    "content": [{"text": system_prompt}],
                }
            ]
        else:
            # Ongoing conversation - use the user's message
            user_message = body.get('message', 'Hello')
            conversation = [
                {
                    "role": "user",
                    "content": [{"text": user_message}],
                }
            ]
        
        # Call Amazon Nova Lite
        response = bedrock.converse(
            modelId=model_id,
            messages=conversation,
            inferenceConfig={
                "maxTokens": 512,
                "temperature": 0.7,
                "topP": 0.9
            }
        )
        
        # Extract response
        ai_response = response["output"]["message"]["content"][0]["text"]
        
        # Build response
        session_id = body.get('sessionId', str(uuid.uuid4()))
        
        response_data = {
            "sessionId": session_id,
            "message": ai_response,
            "timestamp": datetime.utcnow().isoformat(),
            "isInitial": is_initial
        }
        
    except ClientError as e:
        # Fallback to a helpful error message
        print(f"Bedrock error: {e}")
        response_data = {
            "sessionId": str(uuid.uuid4()),
            "message": "I apologize, but I'm having trouble connecting to my AI service. As a veteran career counselor, I'd still love to help! Could you tell me about your military experience and what kind of civilian career interests you?",
            "timestamp": datetime.utcnow().isoformat(),
            "isInitial": is_initial,
            "error": True
        }
    except Exception as e:
        print(f"General error: {e}")
        response_data = {
            "sessionId": str(uuid.uuid4()),
            "message": "I'm experiencing technical difficulties, but I'm here to help with your career transition. What specific questions do you have about moving from military to civilian work?",
            "timestamp": datetime.utcnow().isoformat(),
            "isInitial": is_initial,
            "error": True
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
        'body': json.dumps(response_data)
    }