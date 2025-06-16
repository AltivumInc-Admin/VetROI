import json
import boto3
import os
from typing import Dict, Any, List
import uuid
from datetime import datetime, timedelta
import hashlib

bedrock_runtime = boto3.client('bedrock-runtime')
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')
CONVERSATION_TABLE = os.environ.get('CONVERSATION_TABLE')
SESSION_TABLE = os.environ.get('SESSION_TABLE')
DD214_BUCKET = os.environ.get('DD214_BUCKET')
DATA_BUCKET = os.environ.get('DATA_BUCKET', 'altroi-data')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle Sentra AI conversations with full veteran context
    """
    # Enable CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        session_id = body.get('sessionId')
        message = body.get('message')
        conversation_id = body.get('conversationId', str(uuid.uuid4()))
        veteran_context = body.get('veteranContext', {})
        
        # Load enhanced context
        full_context = load_comprehensive_context(session_id, veteran_context)
        
        # Load conversation history
        conversation_history = load_conversation_history(conversation_id)
        
        # Build Sentra's system prompt
        system_prompt = build_sentra_system_prompt(full_context)
        
        # Prepare messages for Bedrock
        messages = build_conversation_messages(conversation_history, message)
        
        # Call Bedrock Converse API
        response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            system=[{"text": system_prompt}],
            messages=messages,
            inferenceConfig={
                "maxTokens": 2048,
                "temperature": 0.7,
                "topP": 0.95
            }
        )
        
        # Extract response
        ai_response = response["output"]["message"]["content"][0]["text"]
        
        # Save conversation turn
        save_conversation_turn(
            conversation_id, 
            session_id,
            message, 
            ai_response, 
            full_context
        )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'conversationId': conversation_id,
                'response': ai_response,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        print(f"Error in Sentra conversation: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Failed to process conversation',
                'message': str(e)
            })
        }

def load_comprehensive_context(session_id: str, veteran_context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Load all available context including DD214 data if available
    """
    context = {
        'veteranProfile': veteran_context.get('veteranProfile', {}),
        'careerJourney': veteran_context.get('careerJourney', {}),
        'dd214Profile': None,
        'onetData': {},
        'sessionHistory': []
    }
    
    # Load DD214 enhanced profile if available
    if veteran_context.get('dd214Profile', {}).get('hasDD214'):
        document_id = veteran_context['dd214Profile'].get('documentId')
        if document_id:
            dd214_data = load_dd214_profile(document_id)
            if dd214_data:
                # Sanitize PII before including
                context['dd214Profile'] = sanitize_dd214_data(dd214_data)
    
    # Load O*NET data for viewed careers
    careers_viewed = veteran_context.get('careerJourney', {}).get('careersViewed', [])
    for career in careers_viewed[:5]:  # Limit to top 5 to manage context size
        soc_code = career.get('soc')
        if soc_code:
            onet_data = load_onet_data(soc_code)
            if onet_data:
                context['onetData'][soc_code] = {
                    'title': onet_data.get('title'),
                    'salary': onet_data.get('data', {}).get('job_outlook', {}).get('salary', {}),
                    'outlook': onet_data.get('data', {}).get('job_outlook', {}).get('outlook', {}),
                    'skills': extract_key_skills(onet_data)
                }
    
    # Load session history for continuity
    if SESSION_TABLE and session_id:
        try:
            table = dynamodb.Table(SESSION_TABLE)
            response = table.get_item(Key={'session_id': session_id})
            if 'Item' in response:
                context['sessionHistory'] = response['Item'].get('interactions', [])[-5:]  # Last 5 interactions
        except Exception as e:
            print(f"Error loading session history: {str(e)}")
    
    return context

def build_sentra_system_prompt(context: Dict[str, Any]) -> str:
    """
    Build comprehensive system prompt for Sentra
    """
    profile = context.get('veteranProfile', {})
    dd214 = context.get('dd214Profile', {})
    journey = context.get('careerJourney', {})
    
    prompt = f"""You are Sentra, an expert AI career counselor specifically designed for military veterans transitioning to civilian careers.

PERSONALITY & APPROACH:
- Warm, professional, and deeply respectful of military service
- Expert understanding of military culture, terminology, and values
- Conversational yet focused on actionable outcomes
- Empathetic to the challenges of civilian transition
- Direct communication style that veterans appreciate

VETERAN PROFILE:
- Branch: {profile.get('branch', 'Unknown')}
- MOS/Rate/AFSC: {profile.get('mos', 'Unknown')} - {profile.get('mosTitle', 'Military Specialist')}
- Education Level: {profile.get('education', 'Not specified')}
- Current Location: {profile.get('homeState', 'Not specified')}
- Relocation Preference: {'Open to relocating to ' + profile.get('relocateState', 'anywhere') if profile.get('relocate') else 'Prefers to stay in ' + profile.get('homeState', 'current location')}
"""
    
    # Add DD214 enhanced data if available
    if dd214 and dd214.get('hasDD214'):
        service_data = dd214.get('serviceData', {})
        ai_enhancements = dd214.get('aiEnhancements', {})
        
        prompt += f"""
ENHANCED SERVICE PROFILE (from DD214):
- Rank Achieved: {service_data.get('rank', 'Not specified')}
- Years of Service: {service_data.get('yearsOfService', 'Not specified')}
- Primary Specialty: {service_data.get('primaryMOS', profile.get('mos', 'Unknown'))}
- Additional Training: {', '.join(service_data.get('additionalMOS', [])[:3]) or 'None listed'}
- Key Decorations: {', '.join(service_data.get('decorations', [])[:3]) or 'Not specified'}

IDENTIFIED STRENGTHS:
- Transferable Skills: {', '.join(ai_enhancements.get('transferableSkills', [])[:5])}
- Recommended Career Paths: {', '.join(ai_enhancements.get('recommendedCareers', [])[:3])}
- Suggested Certifications: {', '.join(ai_enhancements.get('certificationSuggestions', [])[:3])}
"""
    
    # Add career exploration context
    careers_viewed = journey.get('careersViewed', [])
    if careers_viewed:
        prompt += f"""
CAREER EXPLORATION HISTORY:
The veteran has shown interest in the following careers:
"""
        for career in careers_viewed[:5]:
            prompt += f"- {career.get('title', 'Unknown')} (SOC: {career.get('soc', 'N/A')})\n"
    
    # Add O*NET data context if available
    onet_data = context.get('onetData', {})
    if onet_data:
        prompt += """
CAREER DATA AVAILABLE:
I have access to detailed O*NET data for careers the veteran has explored, including:
- Salary ranges by location
- Growth outlook and job availability
- Required skills and education
- Industry trends
"""
    
    prompt += """
CONVERSATION GUIDELINES:
1. Start by acknowledging their service and what you understand about their goals
2. Ask clarifying questions to better understand their priorities (salary, location, work-life balance, mission)
3. Provide specific, actionable advice with concrete next steps
4. Reference real data (salaries, growth rates, job openings) when available
5. Be encouraging but realistic about timelines and requirements
6. If discussing careers, reference the O*NET data to provide accurate information
7. Help translate military experience into civilian terms
8. Suggest specific certifications, education paths, or skill development
9. Address common veteran concerns (imposter syndrome, cultural adjustment, networking)
10. Always end with clear action items they can take immediately

Remember: Veterans value directness, practical advice, and respect for their experience. Be conversational but purposeful."""
    
    return prompt

def build_conversation_messages(history: List[Dict], new_message: str) -> List[Dict]:
    """
    Build message array for Bedrock Converse API
    """
    messages = []
    
    # Add conversation history
    for turn in history:
        messages.append({
            "role": turn["role"],
            "content": [{"text": turn["content"]}]
        })
    
    # Add new user message
    messages.append({
        "role": "user",
        "content": [{"text": new_message}]
    })
    
    return messages

def load_conversation_history(conversation_id: str) -> List[Dict]:
    """
    Load previous conversation turns
    """
    if not CONVERSATION_TABLE:
        return []
    
    try:
        table = dynamodb.Table(CONVERSATION_TABLE)
        response = table.get_item(Key={'conversationId': conversation_id})
        
        if 'Item' in response:
            return response['Item'].get('messages', [])
        return []
        
    except Exception as e:
        print(f"Error loading conversation history: {str(e)}")
        return []

def save_conversation_turn(
    conversation_id: str, 
    session_id: str,
    user_message: str, 
    ai_response: str, 
    context: Dict[str, Any]
) -> None:
    """
    Save conversation turn to DynamoDB
    """
    if not CONVERSATION_TABLE:
        return
    
    try:
        table = dynamodb.Table(CONVERSATION_TABLE)
        timestamp = datetime.utcnow()
        
        # Get existing conversation or create new
        response = table.get_item(Key={'conversationId': conversation_id})
        
        if 'Item' in response:
            # Append to existing conversation
            messages = response['Item'].get('messages', [])
            messages.extend([
                {
                    'role': 'user',
                    'content': user_message,
                    'timestamp': timestamp.isoformat()
                },
                {
                    'role': 'assistant',
                    'content': ai_response,
                    'timestamp': timestamp.isoformat()
                }
            ])
            
            table.update_item(
                Key={'conversationId': conversation_id},
                UpdateExpression='SET messages = :messages, lastActive = :timestamp',
                ExpressionAttributeValues={
                    ':messages': messages,
                    ':timestamp': timestamp.isoformat()
                }
            )
        else:
            # Create new conversation
            table.put_item(
                Item={
                    'conversationId': conversation_id,
                    'sessionId': session_id,
                    'veteranId': hashlib.sha256(session_id.encode()).hexdigest()[:16],  # Anonymized ID
                    'messages': [
                        {
                            'role': 'user',
                            'content': user_message,
                            'timestamp': timestamp.isoformat()
                        },
                        {
                            'role': 'assistant',
                            'content': ai_response,
                            'timestamp': timestamp.isoformat()
                        }
                    ],
                    'contextUsed': {
                        'hasDD214': bool(context.get('dd214Profile')),
                        'careersViewed': len(context.get('careerJourney', {}).get('careersViewed', [])),
                        'branch': context.get('veteranProfile', {}).get('branch', 'Unknown')
                    },
                    'created': timestamp.isoformat(),
                    'lastActive': timestamp.isoformat(),
                    'ttl': int((timestamp + timedelta(days=90)).timestamp())  # 90-day retention
                }
            )
            
    except Exception as e:
        print(f"Error saving conversation: {str(e)}")

def load_dd214_profile(document_id: str) -> Dict[str, Any]:
    """
    Load sanitized DD214 profile from DynamoDB
    """
    try:
        table = dynamodb.Table(SESSION_TABLE)
        response = table.get_item(Key={'documentId': document_id})
        
        if 'Item' in response:
            return response['Item']
        return None
        
    except Exception as e:
        print(f"Error loading DD214 profile: {str(e)}")
        return None

def sanitize_dd214_data(dd214_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove PII from DD214 data before sending to AI
    """
    # List of fields to exclude
    pii_fields = ['ssn', 'ssnLastFour', 'dateOfBirth', 'address', 'phone', 'email']
    
    # Deep copy and sanitize
    sanitized = {
        'hasDD214': True,
        'serviceData': {},
        'aiEnhancements': dd214_data.get('aiEnhancements', {})
    }
    
    # Copy only non-PII service data
    service_data = dd214_data.get('basicInfo', {})
    for key, value in service_data.items():
        if key not in pii_fields:
            sanitized['serviceData'][key] = value
    
    return sanitized

def load_onet_data(soc_code: str) -> Dict[str, Any]:
    """
    Load O*NET data from S3 data lake
    """
    try:
        key = f"soc-details/{soc_code}.json"
        response = s3.get_object(Bucket=DATA_BUCKET, Key=key)
        return json.loads(response['Body'].read())
        
    except Exception as e:
        print(f"Error loading O*NET data for {soc_code}: {str(e)}")
        return None

def extract_key_skills(onet_data: Dict[str, Any]) -> List[str]:
    """
    Extract top skills from O*NET data
    """
    skills = []
    
    # Extract from skills section
    skills_data = onet_data.get('data', {}).get('skills', {})
    if skills_data and 'group' in skills_data:
        for group in skills_data['group'][:2]:  # Top 2 groups
            for element in group.get('element', [])[:3]:  # Top 3 skills per group
                skills.append(element.get('name', ''))
    
    return [s for s in skills if s][:5]  # Return top 5 skills