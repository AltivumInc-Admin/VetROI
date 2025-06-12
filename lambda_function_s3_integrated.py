import json
import uuid
import os
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
import time
from functools import lru_cache

# Initialize AWS clients
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
s3 = boto3.client('s3')

# Environment variables
DATA_BUCKET = os.environ.get('DATA_BUCKET', 'altroi-data')
SOC_PREFIX = os.environ.get('SOC_PREFIX', 'soc-details/')
ENABLE_S3_DATA = os.environ.get('ENABLE_S3_DATA', 'true').lower() == 'true'

# Import O*NET client if available
try:
    from onet_client import ONetClient
    from onet_s3_integration import VetROICareerIntelligence
    ONET_AVAILABLE = True
except ImportError:
    ONET_AVAILABLE = False
    print("O*NET client not available, will use S3 data only")


class S3CareerDataClient:
    """Client for accessing career data from S3 with caching"""
    
    def __init__(self, bucket: str, prefix: str):
        self.bucket = bucket
        self.prefix = prefix
        self._cache = {}
        self._cache_ttl = 3600  # 1 hour cache
        
    @lru_cache(maxsize=128)
    def get_career_data(self, soc_code: str) -> dict:
        """
        Fetch career data from S3 with caching
        
        Args:
            soc_code: O*NET-SOC code (e.g., "29-1141.00")
            
        Returns:
            Career data dictionary or None if not found
        """
        cache_key = f"career_{soc_code}"
        
        # Check memory cache
        if cache_key in self._cache:
            cached_data, cached_time = self._cache[cache_key]
            if time.time() - cached_time < self._cache_ttl:
                print(f"Cache hit for {soc_code}")
                return cached_data
        
        # Fetch from S3
        try:
            key = f"{self.prefix}{soc_code}.json"
            response = s3.get_object(Bucket=self.bucket, Key=key)
            data = json.loads(response['Body'].read())
            
            # Update cache
            self._cache[cache_key] = (data, time.time())
            print(f"Fetched {soc_code} from S3")
            return data
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                print(f"No data found for SOC {soc_code}")
            else:
                print(f"S3 error: {e}")
            return None
    
    def get_military_crosswalk(self, military_code: str) -> list:
        """
        Get civilian careers matching a military code
        Uses O*NET API or cached crosswalk data
        
        Args:
            military_code: MOS/Rate/AFSC code
            
        Returns:
            List of matching careers with SOC codes
        """
        # For now, use simplified mapping
        # In production, this would call O*NET crosswalk API
        military_mappings = {
            '18D': ['29-1141.00', '29-2042.00', '11-9111.00', '29-2043.00', '21-1094.00'],
            '11B': ['33-3051.00', '33-3051.04', '33-9032.00', '11-1021.00', '13-1151.00'],
            '25B': ['15-1232.00', '15-1231.00', '15-1244.00', '15-1252.00', '15-1299.00'],
            '68W': ['29-2042.00', '29-2043.00', '29-1141.00', '31-9092.00', '29-2061.00'],
            '42A': ['11-3121.00', '13-1071.00', '13-1141.00', '43-4161.00', '43-6011.00'],
            '88M': ['53-3032.00', '53-3033.00', '53-1047.00', '11-3071.00', '43-5071.00']
        }
        
        # Get mapped SOCs or search all healthcare for medical MOS
        soc_codes = military_mappings.get(military_code.upper(), [])
        
        if not soc_codes and military_code.upper().startswith('68'):
            # Medical MOS - return healthcare careers
            soc_codes = ['29-1141.00', '29-2042.00', '29-2061.00', '31-9092.00', '29-1171.00']
        
        # Fetch details for each SOC
        careers = []
        for soc in soc_codes[:10]:  # Limit to top 10
            career_data = self.get_career_data(soc)
            if career_data:
                career_info = career_data.get('data', {}).get('report_raw', {}).get('career', {})
                job_outlook = career_data.get('data', {}).get('report_raw', {}).get('job_outlook', {})
                
                careers.append({
                    'code': soc,
                    'title': career_data.get('title', 'Unknown'),
                    'summary': career_info.get('what_they_do', ''),
                    'bright_outlook': job_outlook.get('bright_outlook', {}) is not False,
                    'median_salary': job_outlook.get('salary', {}).get('annual_median', 0)
                })
        
        # Sort by bright outlook and salary
        careers.sort(key=lambda x: (x['bright_outlook'], x['median_salary']), reverse=True)
        
        return careers


def build_initial_prompt_with_data(veteran_profile, career_matches=[]):
    """Build prompt with veteran context and real career data"""
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
    
    prompt = f"""You are VetROI™, an AI assistant specializing in helping military veterans transition to civilian careers. You have access to real Department of Labor O*NET data for 1,139 occupations.

VETERAN PROFILE:
- Branch of Service: {branch_name}
- Military Occupational Specialty (MOS/Rate/AFSC): {veteran_profile.get('code', 'Not specified')}
- Current Location: {veteran_profile.get('homeState', 'Not specified')}
- Education Level: {education}
- Willing to Relocate: {'Yes, to ' + veteran_profile.get('relocateState', '') if veteran_profile.get('relocate') else 'No'}

"""
    
    if career_matches:
        prompt += "\nTOP CAREER MATCHES BASED ON YOUR MILITARY EXPERIENCE:\n"
        for i, career in enumerate(career_matches[:5], 1):
            prompt += f"\n{i}. {career['title']} (SOC: {career['code']})"
            if career.get('bright_outlook'):
                prompt += " 🟢 HIGH GROWTH"
            if career.get('median_salary'):
                prompt += f"\n   Median Salary: ${career['median_salary']:,}/year"
            if career.get('summary'):
                prompt += f"\n   What they do: {career['summary'][:150]}..."
        
        prompt += "\n\nI have detailed information about each of these careers including education requirements, salary by state, and growth outlook."
    
    prompt += """

YOUR ROLE:
1. Acknowledge their military service respectfully
2. Present career matches based on their military experience
3. Ask which career path interests them most
4. Provide detailed, data-driven guidance when they select a career
5. Calculate ROI based on education costs and salary projections

Start by greeting this veteran and presenting their top career matches."""
    
    return prompt


def build_career_detail_prompt(career_data, veteran_profile):
    """Build prompt for detailed career exploration"""
    career = career_data.get('data', {}).get('report_raw', {}).get('career', {})
    job_outlook = career_data.get('data', {}).get('report_raw', {}).get('job_outlook', {})
    education = career_data.get('data', {}).get('report_raw', {}).get('education', {})
    state_data = career_data.get('data', {}).get('report_raw', {}).get('check_out_my_state', {})
    
    # Find state employment category
    state = veteran_profile.get('homeState', 'TX')
    state_category = 'average'
    location_quotient = 1.0
    
    for category in ['above_average', 'average', 'below_average']:
        states = state_data.get(category, {}).get('state', [])
        for s in states:
            if s.get('postal_code') == state:
                state_category = category
                location_quotient = s.get('location_quotient', 1.0)
                break
    
    prompt = f"""The veteran has selected: {career_data.get('title')} (SOC: {career_data.get('soc')})

DETAILED CAREER INTELLIGENCE:

What They Do:
{career.get('what_they_do', 'No description available')}

Key Tasks:
"""
    
    tasks = career.get('on_the_job', {}).get('task', [])[:3]
    for task in tasks:
        prompt += f"- {task}\n"
    
    prompt += f"""
Salary Information:
- Entry Level (10th percentile): ${job_outlook.get('salary', {}).get('annual_10th_percentile', 0):,}/year
- Median: ${job_outlook.get('salary', {}).get('annual_median', 0):,}/year (${job_outlook.get('salary', {}).get('hourly_median', 0)}/hour)
- Experienced (90th percentile): ${job_outlook.get('salary', {}).get('annual_90th_percentile', 0):,}/year

Job Outlook: {job_outlook.get('outlook', {}).get('description', 'Not available')}
Growth Category: {job_outlook.get('outlook', {}).get('category', 'Unknown')}

Education Requirements:
"""
    
    edu_needed = education.get('education_usually_needed', {}).get('category', [])
    for edu in edu_needed:
        prompt += f"- {edu}\n"
    
    prompt += f"""
Job Market in {state}:
- Demand Level: {state_category.replace('_', ' ').title()}
- Location Quotient: {location_quotient:.2f} (1.0 = national average)
"""
    
    if state_category == 'below_average':
        prompt += f"- Consider relocating for better opportunities\n"
    elif state_category == 'above_average':
        prompt += f"- Excellent job market in your state!\n"
    
    prompt += """
Based on this data, provide:
1. How their military experience translates
2. Specific education path recommendations
3. Estimated time to break even on education investment
4. Next concrete steps they should take

Be specific and reference the actual data."""
    
    return prompt


def lambda_handler(event, context):
    """
    VetROI Lambda with S3 data integration
    Handles initial profile, career selection, and ongoing conversation
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
    
    # Initialize S3 data client
    s3_client = S3CareerDataClient(DATA_BUCKET, SOC_PREFIX) if ENABLE_S3_DATA else None
    
    # Determine request type
    is_initial = all(key in body for key in ['branch', 'code', 'homeState'])
    is_career_selection = 'selectedCareer' in body
    
    try:
        # Model configuration
        model_id = 'amazon.nova-lite-v1:0'
        
        if is_initial and s3_client:
            # Initial profile - get career matches from military code
            military_code = body.get('code', '')
            career_matches = s3_client.get_military_crosswalk(military_code)
            
            # Build prompt with real career data
            system_prompt = build_initial_prompt_with_data(body, career_matches)
            
            # Store career matches in response for frontend
            response_metadata = {
                'type': 'career_list',
                'data': {
                    'careers': career_matches[:5],
                    'total_matches': len(career_matches)
                }
            }
            
        elif is_career_selection and s3_client:
            # User selected a specific career - fetch detailed data
            soc_code = body['selectedCareer']
            career_data = s3_client.get_career_data(soc_code)
            
            if career_data:
                # Build detailed prompt with career data
                system_prompt = build_career_detail_prompt(career_data, body.get('profile', {}))
                
                response_metadata = {
                    'type': 'career_detail',
                    'data': {
                        'career': career_data,
                        'hasDetailedData': True
                    }
                }
            else:
                system_prompt = f"I couldn't find detailed data for SOC {soc_code}. Let me help you explore other options."
                response_metadata = {'type': 'error'}
                
        else:
            # Regular conversation
            user_message = body.get('message', 'Hello')
            system_prompt = user_message
            response_metadata = {'type': 'conversation'}
        
        # Call Bedrock
        conversation = [
            {
                "role": "user",
                "content": [{"text": system_prompt}],
            }
        ]
        
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
            "metadata": response_metadata,
            "dataSource": "S3" if ENABLE_S3_DATA else "mock"
        }
        
    except ClientError as e:
        print(f"Bedrock error: {e}")
        response_data = {
            "sessionId": str(uuid.uuid4()),
            "message": "I'm having trouble connecting to my AI service, but I can still help with your career transition. What specific questions do you have?",
            "timestamp": datetime.utcnow().isoformat(),
            "error": True
        }
    except Exception as e:
        print(f"General error: {e}")
        response_data = {
            "sessionId": str(uuid.uuid4()),
            "message": "I encountered an error, but I'm here to help. What would you like to know about transitioning to civilian careers?",
            "timestamp": datetime.utcnow().isoformat(),
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