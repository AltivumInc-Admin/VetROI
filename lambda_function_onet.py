import json
import uuid
import os
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

# Import O*NET client
import sys
sys.path.append('/opt')  # For Lambda layers in the future
try:
    from onet_client import ONetClient, enhance_ai_response_with_onet
    ONET_AVAILABLE = True
except ImportError:
    ONET_AVAILABLE = False
    print("O*NET client not available, will use AI without real-time data")


def get_onet_credentials():
    """Retrieve O*NET API credentials from environment or Secrets Manager"""
    # First try environment variables
    username = os.environ.get('ONET_USERNAME')
    password = os.environ.get('ONET_PASSWORD')
    
    if username and password:
        return username, password
    
    # Try AWS Secrets Manager
    try:
        secrets_client = boto3.client('secretsmanager', region_name='us-east-2')
        secret_name = "VetROI/ONet/ApiCredentials"
        
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret = json.loads(response['SecretString'])
        return secret.get('username'), secret.get('password')
    except Exception as e:
        print(f"Could not retrieve O*NET credentials: {e}")
        return None, None


def build_initial_prompt(veteran_profile, onet_context=""):
    """Build the initial conversation prompt with veteran context and O*NET data"""
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
    
    prompt = f"""You are VetROI™, an AI assistant specializing in helping military veterans transition to civilian careers. You provide personalized, actionable career guidance based on military experience and real Department of Labor data.

VETERAN PROFILE:
- Branch of Service: {branch_name}
- Military Occupational Specialty (MOS/Rate/AFSC): {veteran_profile.get('code', 'Not specified')}
- Current Location: {veteran_profile.get('homeState', 'Not specified')}
- Education Level: {education}
- Willing to Relocate: {'Yes, to ' + veteran_profile.get('relocateState', '') if veteran_profile.get('relocate') else 'No'}

{onet_context}

YOUR ROLE:
1. Acknowledge their military service respectfully
2. If O*NET data is available, reference specific career matches and real salary/outlook data
3. Ask about their specific career interests or transition concerns
4. Provide guidance that connects their military skills to civilian opportunities
5. Be conversational, supportive, and practical
6. Focus on actionable next steps

Start by greeting this veteran and asking what kind of civilian career path interests them most. If you have O*NET data, mention you have access to real Department of Labor career information."""
    
    return prompt


def lambda_handler(event, context):
    """
    VetROI Lambda with Amazon Nova Lite and O*NET integration
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
    
    # Initialize O*NET client if available
    onet_client = None
    onet_context = ""
    
    if ONET_AVAILABLE:
        username, password = get_onet_credentials()
        if username and password:
            try:
                onet_client = ONetClient(username, password)
                print("O*NET client initialized successfully")
            except Exception as e:
                print(f"Failed to initialize O*NET client: {e}")
    
    # Determine if this is an initial profile submission or ongoing conversation
    is_initial = all(key in body for key in ['branch', 'code', 'homeState'])
    
    try:
        # Create Bedrock Runtime client
        bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
        
        # Model configuration
        model_id = 'amazon.nova-lite-v1:0'
        
        if is_initial:
            # Get O*NET data if available
            if onet_client and body.get('code'):
                try:
                    # Import enhanced S3 integration
                    from onet_s3_integration import integrate_with_lambda
                    
                    # Get military crosswalk data
                    enhancement = integrate_with_lambda(body, onet_client)
                    onet_context = enhancement.get('ai_context', '')
                    
                    # Store crosswalk data for frontend if needed
                    if enhancement.get('type') == 'crosswalk':
                        # Could store in DynamoDB for session persistence
                        crosswalk_careers = enhancement.get('crosswalk_data', {}).get('careers', [])[:10]
                        print(f"Found {len(crosswalk_careers)} career matches for MOS {body.get('code')}")
                    
                except Exception as e:
                    print(f"Failed to get O*NET data: {e}")
            
            # Initial conversation - build context from veteran profile
            system_prompt = build_initial_prompt(body, onet_context)
            conversation = [
                {
                    "role": "user",
                    "content": [{"text": system_prompt}],
                }
            ]
        else:
            # Ongoing conversation - check if asking about specific careers
            user_message = body.get('message', 'Hello')
            
            # Simple keyword detection for career queries
            if onet_client and any(word in user_message.lower() for word in ['salary', 'pay', 'outlook', 'growth', 'skills']):
                # Extract potential career terms and search O*NET
                # This is simplified - in production we'd use NLP
                try:
                    careers = onet_client.search_careers(user_message, limit=3)
                    if careers:
                        onet_context = "\n\nRELEVANT O*NET DATA:\n"
                        for career in careers:
                            onet_context += f"- {career.get('title', '')}: {career.get('description', '')}\n"
                        user_message += onet_context
                except Exception as e:
                    print(f"Failed to search O*NET: {e}")
            
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
            "isInitial": is_initial,
            "hasOnetData": bool(onet_context)
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