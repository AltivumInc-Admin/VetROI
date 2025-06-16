#!/usr/bin/env python3
"""
VetROI Lambda Handler - ONLY O*NET crosswalk API
No Bedrock, No AI, No recommendations
Just returns O*NET crosswalk data from /online/crosswalks/military
"""

import json
import uuid
import time
import boto3
import base64
import urllib3
from datetime import datetime
from typing import Dict, Any


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for O*NET crosswalk data and Lex integration"""
    
    # Log the event to debug
    print(f"Event received: {json.dumps(event)}")
    
    # Check if this is a Lex event
    if 'bot' in event and 'name' in event['bot']:
        return handle_lex_intent(event, context)
    
    # Handle frontend request to invoke Lex
    if event.get('httpMethod') == 'POST' or event.get('requestContext', {}).get('http', {}).get('method') == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            if body.get('action') == 'lexMission':
                return handle_lex_proxy(body, context)
        except:
            pass
    
    # Handle CORS preflight - check multiple possible event structures
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
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Check if this is a career detail request
    path = event.get('path') or event.get('rawPath', '')
    if '/career/' in path and http_method == 'GET':
        return handle_career_detail(event, context)
    
    # Check if this is a Sentra conversation request
    if '/sentra/conversation' in path:
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                    'Access-Control-Max-Age': '86400'
                },
                'body': ''
            }
        elif http_method == 'POST':
            return handle_sentra_conversation(event, context)
    
    try:
        # Parse request for recommend endpoint
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        required = ['branch', 'code', 'homeState', 'relocate', 'education']
        for field in required:
            if field not in body:
                return error_response(400, f'Missing required field: {field}')
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Get O*NET crosswalk data - THE CORRECT ENDPOINT
        onet_data = get_onet_crosswalk_data(body['code'])
        
        # Store session in DynamoDB
        store_session(session_id, body, onet_data)
        
        # Return response with ONLY O*NET data
        response_data = {
            'session_id': session_id,
            'profile': body,
            'onet_careers': onet_data,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
            },
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        print(f"Lambda error: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, str(e))


def get_onet_crosswalk_data(military_code: str) -> Dict[str, Any]:
    """
    Get O*NET military crosswalk data from the CORRECT endpoint
    /online/crosswalks/military - returns nested structure with occupations
    """
    try:
        # Get credentials from Secrets Manager
        secret_name = "ONET"
        secrets_client = boto3.client('secretsmanager')
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret = json.loads(response['SecretString'])
        
        # Make O*NET API call using urllib3
        http = urllib3.PoolManager()
        
        # CORRECT ENDPOINT - /online/crosswalks/military
        url = "https://services.onetcenter.org/ws/online/crosswalks/military"
        
        # Create basic auth header
        credentials = f"{secret['username']}:{secret['password']}"
        auth_header = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'VetROI/1.0',
            'Authorization': f'Basic {auth_header}'
        }
        
        # Only pass keyword parameter
        params = {
            'keyword': military_code
        }
        
        print(f"Calling O*NET API: {url} with params: {params}")
        
        response = http.request(
            'GET',
            url,
            fields=params,
            headers=headers,
            timeout=10.0
        )
        
        if response.status != 200:
            raise Exception(f"O*NET API returned status {response.status}")
        
        data = json.loads(response.data.decode('utf-8'))
        print(f"O*NET returned {data.get('total', 0)} matches")
        
        # Log the structure for debugging
        if data.get('match') and len(data['match']) > 0:
            first_match = data['match'][0]
            if 'occupations' in first_match:
                occupation_count = len(first_match['occupations'].get('occupation', []))
                print(f"First match contains {occupation_count} occupations")
        
        return data
        
    except Exception as e:
        print(f"O*NET API error: {str(e)}")
        # Return empty structure matching expected format
        return {
            'keyword': military_code,
            'branch': 'all',
            'total': 0,
            'match': [],
            'error': str(e)
        }


def store_session(session_id: str, profile: Dict, onet_data: Dict) -> None:
    """Store session in DynamoDB"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('VetROI_Sessions')
        
        timestamp = int(time.time())
        
        item = {
            'session_id': session_id,
            'timestamp': timestamp,
            'veteran_profile': profile,
            'onet_careers': onet_data,
            'created_at': datetime.utcnow().isoformat(),
            'ttl': timestamp + (90 * 24 * 60 * 60)  # 90 days
        }
        
        table.put_item(Item=item)
        print(f"Stored session: {session_id}")
        
    except Exception as e:
        print(f"Error storing session: {e}")
        # Don't fail the request if storage fails


def error_response(status_code: int, message: str) -> Dict[str, Any]:
    """Generate error response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        },
        'body': json.dumps({'error': message})
    }


def handle_career_detail(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle career detail requests from O*NET /mnm/careers/{soc}/report endpoint"""
    try:
        # Extract SOC code from path
        path = event.get('path') or event.get('rawPath', '')
        path_params = event.get('pathParameters', {})
        
        # Try to get SOC from pathParameters first
        soc_code = path_params.get('socCode') or path_params.get('soc')
        
        # If not found, extract from path
        if not soc_code and '/career/' in path:
            soc_code = path.split('/career/')[-1].strip('/')
        
        if not soc_code:
            return error_response(400, 'Missing SOC code in path')
        
        print(f"Fetching career details for SOC: {soc_code}")
        
        # Get O*NET credentials
        secret_name = "ONET"
        secrets_client = boto3.client('secretsmanager')
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret = json.loads(response['SecretString'])
        
        # Call O*NET career report API
        http = urllib3.PoolManager()
        url = f"https://services.onetcenter.org/ws/mnm/careers/{soc_code}/report"
        
        # Create basic auth header
        credentials = f"{secret['username']}:{secret['password']}"
        auth_header = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'VetROI/1.0',
            'Authorization': f'Basic {auth_header}'
        }
        
        print(f"Calling O*NET API: {url}")
        
        response = http.request(
            'GET',
            url,
            headers=headers,
            timeout=10.0
        )
        
        if response.status != 200:
            print(f"O*NET API error: Status {response.status}")
            return error_response(response.status, f"O*NET API error: {response.data.decode('utf-8')}")
        
        # Parse and return the O*NET response as-is
        data = json.loads(response.data.decode('utf-8'))
        print(f"Successfully fetched career data for {soc_code}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
            },
            'body': json.dumps(data)
        }
        
    except Exception as e:
        print(f"Error fetching career details: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, f"Error fetching career details: {str(e)}")


def handle_sentra_conversation(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle Sentra AI career counselor conversations"""
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        if not body.get('sessionId'):
            return error_response(400, 'Missing sessionId')
        
        session_id = body['sessionId']
        user_message = body.get('message', '')
        conversation_id = body.get('conversationId')  # For continuing conversations
        
        print(f"Sentra conversation for session: {session_id}")
        
        # Get veteran context from their journey
        veteran_context = prepare_veteran_context(session_id, body.get('veteranContext', {}))
        
        # Initialize or get conversation history
        if conversation_id:
            print(f"Continuing conversation: {conversation_id}")
            conversation_history = get_conversation_history(conversation_id)
            print(f"Retrieved {len(conversation_history)} historical messages")
        else:
            conversation_id = str(uuid.uuid4())
            conversation_history = []
            print(f"Starting new conversation: {conversation_id}")
        
        # Build the system prompt with context
        is_new_conversation = len(conversation_history) == 0
        system_prompt = build_sentra_system_prompt(veteran_context, is_new_conversation)
        
        # Prepare messages for Claude
        messages = []
        
        # Add conversation history (if any)
        for msg in conversation_history:
            messages.append({
                "role": msg['role'],
                "content": [{"text": msg['content']}]
            })
        
        # Add current user message (unless it's the initial greeting)
        if user_message != "INITIAL_GREETING":
            messages.append({
                "role": "user",
                "content": [{"text": user_message}]
            })
        else:
            # For initial greeting, add a system message to start the conversation
            messages.append({
                "role": "user",
                "content": [{"text": "I'm ready to discuss my career transition. Please introduce yourself and ask me about my goals."}]
            })
        
        # Call Claude 3.5 Sonnet v2 via Bedrock Converse API using inference profile
        bedrock_client = boto3.client('bedrock-runtime', region_name='us-east-2')
        
        response = bedrock_client.converse(
            modelId="us.anthropic.claude-3-5-sonnet-20241022-v2:0",  # Using inference profile ID
            messages=messages,
            system=[{"text": system_prompt}],
            inferenceConfig={
                "maxTokens": 4096,
                "temperature": 0.7,
                "topP": 0.9
            }
        )
        
        # Extract response
        assistant_message = response["output"]["message"]["content"][0]["text"]
        
        # Store conversation turn
        store_conversation_turn(conversation_id, session_id, user_message, assistant_message)
        
        # Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
            },
            'body': json.dumps({
                'conversationId': conversation_id,
                'response': assistant_message,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        print(f"Error in Sentra conversation: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, f"Error in conversation: {str(e)}")


def prepare_veteran_context(session_id: str, provided_context: Dict) -> Dict[str, Any]:
    """Prepare comprehensive context for Sentra from the veteran's journey"""
    
    # If context was provided by frontend, use it
    if provided_context:
        return provided_context
    
    # Otherwise, fetch from DynamoDB
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('VetROI_Sessions')
        
        response = table.get_item(Key={'session_id': session_id})
        if 'Item' not in response:
            return {}
        
        session = response['Item']
        
        # Build context from session data
        context = {
            'veteranProfile': session.get('veteran_profile', {}),
            'careersExplored': session.get('careers_explored', []),
            'onetMatches': session.get('onet_careers', {})
        }
        
        return context
        
    except Exception as e:
        print(f"Error fetching session context: {e}")
        return {}


def build_sentra_system_prompt(veteran_context: Dict, is_new_conversation: bool = True) -> str:
    """Build a comprehensive system prompt for Sentra with veteran context"""
    
    profile = veteran_context.get('veteranProfile', {})
    careers = veteran_context.get('careerJourney', {}).get('careersViewed', [])
    
    prompt = """You are Sentra, a knowledgeable and empathetic AI career counselor for military veterans. 

"""
    if is_new_conversation:
        prompt += "You're meeting a veteran for the first time who has the following background:\n"
    else:
        prompt += "You're continuing a conversation with a veteran. Their background:\n"
    
    # Add profile information
    if profile:
        prompt += f"\n- Branch: {profile.get('branch', 'Unknown')}"
        prompt += f"\n- Military Occupation: {profile.get('mosTitle', profile.get('mos', 'Unknown'))}"
        prompt += f"\n- Current Education: {profile.get('education', 'Unknown').replace('_', ' ').title()}"
        prompt += f"\n- Home State: {profile.get('homeState', 'Unknown')}"
        if profile.get('relocate'):
            prompt += f"\n- Willing to relocate to: {profile.get('relocateState', 'Anywhere')}"
    
    # Add careers explored
    if careers:
        prompt += "\n\nCareers they've explored:"
        for career in careers:
            prompt += f"\n- {career.get('title', 'Unknown')} (SOC: {career.get('soc', 'Unknown')})"
    
    prompt += """

Your role is to:
1. Build on their exploration, not start from scratch
2. Address gaps between their current qualifications and career goals
3. Suggest specific, actionable next steps
4. Be conversational and supportive, like a trusted mentor
5. Reference specific schools, programs, or resources when relevant
6. Consider their geographic preferences and constraints
7. Leverage their military experience as a strength

Key areas to explore:
- Education gaps and how to bridge them
- Geographic opportunities in their preferred locations
- How their military experience translates to civilian roles
- Financial planning and salary expectations
- GI Bill and other veteran benefits
- Specific schools, certifications, or training programs

This is a 30-minute career counseling session. Be warm, professional, and focused on actionable guidance.

IMPORTANT: 
- Build on previous messages in the conversation - don't repeat information
- Keep responses concise and conversational
- Ask one clear question at a time to guide the discussion forward
- Provide specific, actionable advice when asked
- Remember what the veteran has already told you in this conversation

"""
    if is_new_conversation:
        prompt += "\nFor this first interaction, briefly introduce yourself and ask what brings them to career counseling today."
    else:
        prompt += "\nContinue the conversation naturally from where you left off. Don't re-introduce yourself or their background."
    
    return prompt


def get_conversation_history(conversation_id: str) -> list:
    """Get previous conversation turns from DynamoDB"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('VetROI_Conversations')
        
        response = table.query(
            KeyConditionExpression='conversation_id = :cid',
            ExpressionAttributeValues={':cid': conversation_id},
            ScanIndexForward=True  # Sort by timestamp ascending
        )
        
        history = []
        for item in response.get('Items', []):
            history.append({
                'role': 'user',
                'content': item['user_message']
            })
            history.append({
                'role': 'assistant',
                'content': item['assistant_message']
            })
        
        return history
        
    except Exception as e:
        print(f"Error fetching conversation history: {e}")
        return []


def store_conversation_turn(conversation_id: str, session_id: str, user_message: str, assistant_message: str):
    """Store conversation turn in DynamoDB"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('VetROI_Conversations')
        
        timestamp = int(time.time() * 1000)  # Millisecond timestamp
        
        table.put_item(
            Item={
                'conversation_id': conversation_id,
                'timestamp': timestamp,
                'session_id': session_id,
                'user_message': user_message,
                'assistant_message': assistant_message,
                'created_at': datetime.utcnow().isoformat(),
                'ttl': int(time.time()) + (30 * 24 * 60 * 60)  # 30 days
            }
        )
        
    except Exception as e:
        print(f"Error storing conversation: {e}")
        # Don't fail the request if storage fails


def handle_lex_proxy(body: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Proxy Lex invocation from frontend"""
    try:
        # Initialize Lex runtime client
        lex_client = boto3.client('lexv2-runtime', region_name='us-east-1')
        
        # Get session ID or create new one
        session_id = body.get('sessionId', str(uuid.uuid4()))
        
        # Invoke Lex with "What is my next mission?" text
        response = lex_client.recognize_text(
            botId='IV2NSREVFS',
            botAliasId='TSTALIASID',  # TestBotAlias
            localeId='en_US',
            sessionId=session_id,
            text='What is my next mission?'
        )
        
        print(f"Lex response: {json.dumps(response)}")
        
        # Extract the message from Lex response
        messages = response.get('messages', [])
        message_content = messages[0]['content'] if messages else "No response from Lex"
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
            },
            'body': json.dumps({
                'message': message_content,
                'sessionId': session_id,
                'source': 'lex'
            })
        }
        
    except Exception as e:
        print(f"Error in Lex proxy: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Error communicating with Lex'
            })
        }


def handle_lex_intent(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle Lex bot intents - just pass through for fulfillment"""
    
    print(f"Lex event received: {json.dumps(event)}")
    
    # This handler is called when Lex needs fulfillment
    # Since you're configuring the response in Lex console, 
    # we just need to return a success response
    
    session_attributes = event.get('sessionState', {}).get('sessionAttributes', {}) or {}
    intent_name = event.get('sessionState', {}).get('intent', {}).get('name', '')
    
    # Return success so Lex can use its configured response
    response = {
        'sessionState': {
            'dialogAction': {
                'type': 'Close'
            },
            'intent': {
                'name': intent_name,
                'state': 'Fulfilled',
                'confirmationState': 'None'
            },
            'sessionAttributes': session_attributes
        }
    }
    
    # Add requestAttributes if present
    if 'requestAttributes' in event:
        response['requestAttributes'] = event['requestAttributes']
    
    return response


def store_lex_interaction(session_id: str, veteran_context: Dict, message: str) -> None:
    """Store Lex interaction in DynamoDB"""
    try:
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('VetROI_Sessions')
        
        timestamp = int(time.time())
        
        item = {
            'session_id': f"lex_{session_id}",
            'timestamp': timestamp,
            'interaction_type': 'lex_mission',
            'veteran_context': veteran_context,
            'message_delivered': message,
            'created_at': datetime.utcnow().isoformat(),
            'ttl': timestamp + (90 * 24 * 60 * 60)  # 90 days
        }
        
        table.put_item(Item=item)
        print(f"Stored Lex interaction: lex_{session_id}")
        
    except Exception as e:
        print(f"Error storing Lex interaction: {e}")
        # Don't fail the request if storage fails