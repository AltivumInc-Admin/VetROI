import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any, List
import re

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime')
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
TABLE_NAME = os.environ.get('TABLE_NAME', 'VetROI_DD214_Processing')
INSIGHTS_TABLE = os.environ.get('INSIGHTS_TABLE', 'VetROI_CareerInsights')
MODEL_ID = os.environ.get('MODEL_ID', 'amazon.nova-lite-v1:0')
S3_DATA_BUCKET = os.environ.get('S3_DATA_BUCKET', 'altroi-data')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Generate AI-powered career insights from DD214 data"""
    
    document_id = event.get('documentId')
    extracted_data = event.get('extractedData', {})
    
    if not document_id:
        return error_response(400, 'Missing documentId')
    
    try:
        # Update processing status
        update_processing_status(document_id, 'insights', 'in-progress')
        
        # Get the actual extracted data from S3
        if 'resultsLocation' in extracted_data:
            # Extract bucket and key from S3 URL
            s3_url = extracted_data['resultsLocation']
            # Parse s3://bucket/key format
            s3_parts = s3_url.replace('s3://', '').split('/', 1)
            bucket = s3_parts[0]
            key = s3_parts[1]
            
            # Get the extraction summary from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            summary_data = json.loads(response['Body'].read())
            extracted_data = summary_data.get('extractedData', {})
        elif not extracted_data or 'branch' not in extracted_data:
            # Try to get from DynamoDB
            table = dynamodb.Table(TABLE_NAME)
            response = table.get_item(Key={'document_id': document_id})
            item = response.get('Item', {})
            
            # Parse extracted fields
            if 'extracted_fields' in item:
                if isinstance(item['extracted_fields'], str):
                    extracted_data = json.loads(item['extracted_fields'])
                else:
                    extracted_data = item['extracted_fields']
        
        # Generate comprehensive profile
        veteran_profile = build_veteran_profile(extracted_data)
        
        # Fetch relevant O*NET data for the MOS
        onet_matches = fetch_onet_matches(veteran_profile.get('mos', ''), veteran_profile.get('branch', ''))
        
        # Generate AI insights
        insights = generate_ai_insights(veteran_profile, onet_matches)
        
        # Store insights
        store_insights(document_id, veteran_profile, insights)
        
        # Update processing status
        update_processing_status(document_id, 'insights', 'complete')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'documentId': document_id,
                'status': 'complete',
                'insights': insights
            })
        }
        
    except Exception as e:
        print(f"Error generating insights: {str(e)}")
        update_processing_status(document_id, 'insights', 'error', str(e))
        return error_response(500, f'Failed to generate insights: {str(e)}')

def build_veteran_profile(extracted_data: Dict[str, Any]) -> Dict[str, Any]:
    """Build comprehensive veteran profile from DD214 data"""
    
    # Handle None or empty extracted_data
    if not extracted_data:
        extracted_data = {}
    
    profile = {
        'branch': extract_branch(extracted_data),
        'rank': extracted_data.get('rank', extracted_data.get('grade_rate_rank', '')),
        'mos': extract_mos(extracted_data),
        'service_duration': calculate_service_duration(extracted_data),
        'decorations': parse_decorations(extracted_data.get('decorations', '')),
        'military_education': parse_military_education(extracted_data.get('education', extracted_data.get('military_education', ''))),
        'character_of_service': extracted_data.get('discharge_type', extracted_data.get('character_of_service', '')),
        'leadership_indicators': extract_leadership_indicators(extracted_data),
        'technical_skills': extract_technical_skills(extracted_data),
        'security_clearance': infer_security_clearance(extracted_data)
    }
    
    return profile

def extract_branch(data: Dict[str, Any]) -> str:
    """Extract and normalize military branch"""
    branch_text = data.get('branch', '')
    
    # Handle None or empty values
    if not branch_text:
        return 'unknown'
    
    branch_text = str(branch_text).lower()
    
    if 'army' in branch_text:
        return 'army'
    elif 'navy' in branch_text:
        return 'navy'
    elif 'marine' in branch_text or 'usmc' in branch_text:
        return 'marines'
    elif 'air force' in branch_text or 'usaf' in branch_text:
        return 'air_force'
    elif 'coast guard' in branch_text or 'uscg' in branch_text:
        return 'coast_guard'
    elif 'space force' in branch_text or 'ussf' in branch_text:
        return 'space_force'
    
    return 'unknown'

def extract_mos(data: Dict[str, Any]) -> str:
    """Extract MOS/Rate/AFSC code"""
    mos = data.get('mos', data.get('primary_specialty', ''))
    
    if not mos:
        return 'unknown'
    
    # Extract code pattern (e.g., "11B", "68W", "IT", "3D0X2")
    patterns = [
        r'\b\d{2}[A-Z]\b',  # Army MOS (e.g., 11B, 68W)
        r'\b[A-Z]{2}\b',    # Navy Rate (e.g., IT, BM)
        r'\b\d[A-Z]\d[A-Z]\d\b',  # Air Force AFSC (e.g., 3D0X2)
        r'\b\d{4}\b'        # Marine MOS (e.g., 0311)
    ]
    
    for pattern in patterns:
        match = re.search(pattern, mos)
        if match:
            return match.group()
    
    return mos.split()[0] if mos else 'unknown'

def calculate_service_duration(data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate service duration and experience level"""
    
    # Extract dates
    start_date = data.get('date_entered_active_duty', '')
    end_date = data.get('separation_date', '')
    
    # Parse total service if available
    total_service = data.get('total_service', '')
    
    # Extract years from total service
    years_match = re.search(r'(\d+)\s*year', total_service, re.IGNORECASE)
    months_match = re.search(r'(\d+)\s*month', total_service, re.IGNORECASE)
    
    years = int(years_match.group(1)) if years_match else 0
    months = int(months_match.group(1)) if months_match else 0
    
    total_months = years * 12 + months
    
    return {
        'years': years,
        'months': months,
        'total_months': total_months,
        'experience_level': categorize_experience(total_months)
    }

def categorize_experience(months: int) -> str:
    """Categorize experience level based on service duration"""
    if months < 24:
        return 'entry'
    elif months < 48:
        return 'junior'
    elif months < 96:
        return 'mid-level'
    elif months < 144:
        return 'senior'
    else:
        return 'expert'

def parse_decorations(decorations_text: str) -> List[str]:
    """Parse decorations and awards"""
    if not decorations_text:
        return []
    
    # Common military decorations patterns
    decorations = []
    
    # Look for common medals/ribbons
    medal_patterns = [
        'bronze star', 'silver star', 'purple heart',
        'meritorious service', 'commendation', 'achievement',
        'good conduct', 'national defense', 'combat action',
        'expert marksmanship', 'sharpshooter'
    ]
    
    text_lower = decorations_text.lower()
    for medal in medal_patterns:
        if medal in text_lower:
            decorations.append(medal.title())
    
    return decorations

def parse_military_education(education_text: str) -> List[str]:
    """Parse military education and training"""
    if not education_text:
        return []
    
    education = []
    
    # Common military schools/training
    school_patterns = [
        'basic training', 'ait', 'advanced individual training',
        'nco academy', 'leadership', 'airborne', 'ranger',
        'special forces', 'officer candidate', 'warrant officer',
        'technical school', 'c school', 'a school'
    ]
    
    text_lower = education_text.lower()
    for school in school_patterns:
        if school in text_lower:
            education.append(school.title())
    
    return education

def extract_leadership_indicators(data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract leadership indicators from rank and experience"""
    
    rank = data.get('grade_rate_rank', '').upper()
    
    # NCO/Officer detection
    nco_ranks = ['E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9', 'SGT', 'CPL', 'SSGT', 'MSGT']
    officer_ranks = ['O-', 'W-', 'LT', 'CPT', 'MAJ', 'COL', 'GEN', 'ADM']
    
    is_nco = any(r in rank for r in nco_ranks)
    is_officer = any(r in rank for r in officer_ranks)
    
    # Extract pay grade
    pay_grade_match = re.search(r'[EWO]-\d+', rank)
    pay_grade = pay_grade_match.group() if pay_grade_match else ''
    
    return {
        'is_nco': is_nco,
        'is_officer': is_officer,
        'pay_grade': pay_grade,
        'leadership_level': determine_leadership_level(pay_grade, is_nco, is_officer)
    }

def determine_leadership_level(pay_grade: str, is_nco: bool, is_officer: bool) -> str:
    """Determine leadership level from rank"""
    if is_officer:
        return 'executive'
    elif is_nco:
        if pay_grade in ['E-7', 'E-8', 'E-9']:
            return 'senior'
        else:
            return 'mid-level'
    else:
        return 'individual contributor'

def extract_technical_skills(data: Dict[str, Any]) -> List[str]:
    """Extract technical skills from MOS and training"""
    skills = []
    
    mos = data.get('primary_specialty', '').lower()
    education = data.get('military_education', '').lower()
    
    # Technical skill patterns
    tech_patterns = {
        'communications': ['signal', 'comm', 'radio', 'satellite'],
        'medical': ['medic', 'corpsman', 'medical', 'health'],
        'logistics': ['supply', 'logistics', 'transportation', 'quartermaster'],
        'intelligence': ['intel', 'analyst', 'cryptologic'],
        'maintenance': ['mechanic', 'maintenance', 'repair', 'aviation'],
        'information technology': ['cyber', 'network', 'computer', 'signal'],
        'security': ['military police', 'security forces', 'master at arms'],
        'engineering': ['engineer', 'construction', 'utilities']
    }
    
    combined_text = f"{mos} {education}"
    
    for skill, patterns in tech_patterns.items():
        if any(p in combined_text for p in patterns):
            skills.append(skill)
    
    return skills

def infer_security_clearance(data: Dict[str, Any]) -> str:
    """Infer likely security clearance level from MOS"""
    
    mos = data.get('primary_specialty', '').lower()
    
    # High clearance indicators
    ts_indicators = ['intel', 'crypto', 'signal', 'cyber', 'special forces']
    secret_indicators = ['military police', 'communications', 'aviation']
    
    if any(ind in mos for ind in ts_indicators):
        return 'Top Secret (likely)'
    elif any(ind in mos for ind in secret_indicators):
        return 'Secret (likely)'
    else:
        return 'Confidential (minimum)'

def fetch_onet_matches(mos: str, branch: str) -> List[Dict[str, Any]]:
    """Fetch O*NET occupation matches for the MOS"""
    
    try:
        # Check if we have cached data for this MOS
        cache_key = f"military-crosswalk/{branch}/{mos}.json"
        
        response = s3_client.get_object(Bucket=S3_DATA_BUCKET, Key=cache_key)
        return json.loads(response['Body'].read())
        
    except s3_client.exceptions.NoSuchKey:
        # If no cached data, return empty list
        # In production, this would call the O*NET API
        return []
    except Exception as e:
        print(f"Error fetching O*NET data: {str(e)}")
        return []

def generate_ai_insights(profile: Dict[str, Any], onet_matches: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate AI-powered career insights using Bedrock"""
    
    # Build comprehensive prompt
    prompt = build_insights_prompt(profile, onet_matches)
    
    try:
        # Call Bedrock
        response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{
                'role': 'user',
                'content': [{'text': prompt}]
            }],
            inferenceConfig={
                'maxTokens': 2000,
                'temperature': 0.7,
                'topP': 0.9
            }
        )
        
        # Extract response
        ai_response = response['output']['message']['content'][0]['text']
        
        # Parse structured insights
        insights = parse_ai_response(ai_response)
        
        # Add metadata
        insights['generated_at'] = datetime.utcnow().isoformat()
        insights['model_version'] = MODEL_ID
        
        return insights
        
    except Exception as e:
        print(f"Error calling Bedrock: {str(e)}")
        return generate_fallback_insights(profile)

def build_insights_prompt(profile: Dict[str, Any], onet_matches: List[Dict[str, Any]]) -> str:
    """Build comprehensive prompt for AI insights"""
    
    prompt = f"""You are a career advisor specializing in military-to-civilian transitions. 
Analyze this veteran's profile and provide actionable career insights.

VETERAN PROFILE:
- Branch: {profile.get('branch', 'Unknown')}
- Rank: {profile.get('rank', 'Unknown')}
- MOS/Specialty: {profile.get('mos', 'Unknown')}
- Service Duration: {profile['service_duration']['years']} years, {profile['service_duration']['months'] % 12} months
- Experience Level: {profile['service_duration']['experience_level']}
- Leadership Level: {profile['leadership_indicators']['leadership_level']}
- Decorations: {', '.join(profile.get('decorations', [])) or 'None listed'}
- Military Education: {', '.join(profile.get('military_education', [])) or 'None listed'}
- Technical Skills: {', '.join(profile.get('technical_skills', [])) or 'None identified'}
- Likely Clearance: {profile.get('security_clearance', 'Unknown')}

"""

    if onet_matches:
        prompt += f"""
MATCHED CIVILIAN CAREERS (from O*NET):
"""
        for i, match in enumerate(onet_matches[:5], 1):
            prompt += f"{i}. {match.get('title', 'Unknown')} (SOC: {match.get('code', 'N/A')})\n"

    prompt += """
Please provide:

1. TOP 5 CIVILIAN CAREER RECOMMENDATIONS
   - Job title
   - Why it's a good match
   - Required additional training/certifications
   - Expected salary range
   - Growth outlook

2. TRANSFERABLE SKILLS ANALYSIS
   - Top 5 transferable skills
   - How to translate military experience to civilian terms

3. IMMEDIATE ACTION STEPS
   - 3 specific actions to take within 30 days
   - Resources or programs to leverage

4. EDUCATION/CERTIFICATION PRIORITIES
   - Most valuable certifications for their career path
   - GI Bill optimization strategy

5. NETWORKING STRATEGY
   - Key industries to target
   - Professional associations to join
   - Veteran-friendly companies

Format your response as structured JSON for easy parsing.
"""
    
    return prompt

def parse_ai_response(response_text: str) -> Dict[str, Any]:
    """Parse AI response into structured insights"""
    
    try:
        # Try to extract JSON if the model provided it
        json_match = re.search(r'\{[\s\S]+\}', response_text)
        if json_match:
            return json.loads(json_match.group())
    except:
        pass
    
    # Fallback parsing for non-JSON responses
    insights = {
        'career_recommendations': [],
        'transferable_skills': [],
        'action_steps': [],
        'education_priorities': [],
        'networking_strategy': {},
        'raw_insights': response_text
    }
    
    # Extract sections using patterns
    sections = {
        'career_recommendations': r'(?:career recommendations?|recommended careers?)(.*?)(?=transferable|$)',
        'transferable_skills': r'(?:transferable skills?)(.*?)(?=action|immediate|$)',
        'action_steps': r'(?:action steps?|immediate actions?)(.*?)(?=education|certification|$)',
        'education_priorities': r'(?:education|certification)(.*?)(?=networking|$)',
        'networking_strategy': r'(?:networking)(.*?)$'
    }
    
    for key, pattern in sections.items():
        match = re.search(pattern, response_text, re.IGNORECASE | re.DOTALL)
        if match:
            insights[key] = match.group(1).strip()
    
    return insights

def generate_fallback_insights(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Generate fallback insights if AI fails"""
    
    # Basic insights based on profile data
    skills = profile.get('technical_skills', [])
    leadership = profile['leadership_indicators']['leadership_level']
    
    career_recs = []
    
    # Generate basic recommendations based on skills
    if 'medical' in skills:
        career_recs.append({
            'title': 'Healthcare Administrator',
            'reason': 'Medical background with leadership experience'
        })
    
    if 'logistics' in skills:
        career_recs.append({
            'title': 'Supply Chain Manager',
            'reason': 'Direct logistics experience from military service'
        })
    
    if 'information technology' in skills:
        career_recs.append({
            'title': 'IT Project Manager',
            'reason': 'Technical skills combined with military leadership'
        })
    
    if leadership in ['senior', 'executive']:
        career_recs.append({
            'title': 'Operations Manager',
            'reason': 'Strong leadership and organizational experience'
        })
    
    return {
        'career_recommendations': career_recs,
        'transferable_skills': skills + ['leadership', 'teamwork', 'discipline'],
        'action_steps': [
            'Update LinkedIn profile with military experience',
            'Research veteran job fairs in your area',
            'Connect with local veteran service organizations'
        ],
        'education_priorities': [
            'Project Management Professional (PMP)',
            'Industry-specific certifications'
        ],
        'networking_strategy': {
            'focus': 'Leverage veteran networks and military-friendly employers'
        },
        'generated_at': datetime.utcnow().isoformat()
    }

def store_insights(document_id: str, profile: Dict[str, Any], insights: Dict[str, Any]):
    """Store insights in DynamoDB"""
    
    # Create insights table if it doesn't exist
    insights_table = dynamodb.Table(INSIGHTS_TABLE)
    
    try:
        insights_table.put_item(
            Item={
                'document_id': document_id,
                'created_at': datetime.utcnow().isoformat(),
                'veteran_profile': profile,
                'ai_insights': insights,
                'ttl': int(datetime.utcnow().timestamp()) + (90 * 24 * 60 * 60)  # 90 days
            }
        )
    except Exception as e:
        print(f"Error storing insights: {str(e)}")
        # If table doesn't exist, store in main table
        table = dynamodb.Table(TABLE_NAME)
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET ai_insights = :insights',
            ExpressionAttributeValues={':insights': insights}
        )

def update_processing_status(document_id: str, step: str, status: str, error: str = None):
    """Update processing status in DynamoDB"""
    
    table = dynamodb.Table(TABLE_NAME)
    
    # Use simpler update expression to avoid nested attribute issues
    update_expr = "SET #status = :status, last_updated = :timestamp"
    expr_values = {
        ':status': f"{step}_{status}",
        ':timestamp': datetime.utcnow().isoformat()
    }
    expr_names = {'#status': 'status'}
    
    if error:
        update_expr += ", #error_msg = :error"
        expr_values[':error'] = f"{step}: {error}"
        expr_names['#error_msg'] = 'error_message'
    
    try:
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ExpressionAttributeNames=expr_names
        )
    except Exception as e:
        print(f"Error updating DynamoDB status: {e}")
        # Continue processing even if status update fails

def error_response(status_code: int, message: str) -> Dict[str, Any]:
    """Generate error response"""
    return {
        'statusCode': status_code,
        'body': json.dumps({'error': message})
    }