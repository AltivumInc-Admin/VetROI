import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any, List
import re
import sys

# Add the parent directory to the path to import enhanced_prompts
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from enhanced_prompts import (
    get_specialized_prompt,
    get_interview_prep_prompt,
    get_salary_negotiation_prompt,
    MOS_SPECIFIC_ENHANCEMENTS,
    RANK_TO_LEADERSHIP_MAPPING,
    CLEARANCE_VALUE_MATRIX,
    DEPLOYMENT_VALUE_TRANSLATION
)
from enhanced_prompts_v2 import get_dynamic_prompt

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime')
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
TABLE_NAME = os.environ.get('TABLE_NAME', 'VetROI_DD214_Processing')
INSIGHTS_TABLE = os.environ.get('INSIGHTS_TABLE', 'VetROI_CareerInsights')
MODEL_ID = os.environ.get('MODEL_ID', 'us.amazon.nova-lite-v1:0')
S3_DATA_BUCKET = os.environ.get('S3_DATA_BUCKET', 'altroi-data')
REDACTED_BUCKET = os.environ.get('REDACTED_BUCKET', 'vetroi-dd214-redacted')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Generate AI-powered career insights from DD214 data"""
    
    document_id = event.get('documentId')
    extracted_data = event.get('extractedData', {})
    insight_type = event.get('insightType', 'comprehensive')  # New parameter for specific insights
    
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
        
        # Get the redacted DD214 document
        redacted_text = get_redacted_document(document_id)
        
        if redacted_text:
            # Use enhanced AI to analyze the full redacted document
            if insight_type == 'interview_prep':
                # Interview preparation for specific opportunity
                target_company = event.get('targetCompany', 'Unknown Company')
                target_role = event.get('targetRole', 'Unknown Role')
                veteran_profile = extract_profile_from_dd214(redacted_text)
                insights = generate_interview_prep(veteran_profile, target_company, target_role)
            elif insight_type == 'salary_negotiation':
                # Salary negotiation strategy
                job_offer = event.get('jobOffer', {})
                veteran_profile = extract_profile_from_dd214(redacted_text)
                insights = generate_salary_negotiation(veteran_profile, job_offer)
            else:
                # Comprehensive career intelligence (default)
                insights = generate_enhanced_ai_insights(redacted_text, document_id)
        else:
            # Fallback to old method if redacted document not available
            veteran_profile = build_veteran_profile(extracted_data)
            onet_matches = fetch_onet_matches(veteran_profile.get('mos', ''), veteran_profile.get('branch', ''))
            insights = generate_ai_insights(veteran_profile, onet_matches)
            
        # Extract profile from insights for storage
        veteran_profile = insights.get('veteran_intelligence', {}).get('service_analysis', {})
        if not veteran_profile:
            veteran_profile = insights.get('extracted_profile', build_veteran_profile(extracted_data))
        
        # Store insights with enhanced metadata
        store_enhanced_insights(document_id, veteran_profile, insights)
        
        # Update processing status
        update_processing_status(document_id, 'insights', 'complete')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'documentId': document_id,
                'status': 'complete',
                'insightType': insight_type,
                'insights': insights
            })
        }
        
    except Exception as e:
        print(f"Error generating insights: {str(e)}")
        update_processing_status(document_id, 'insights', 'error', str(e))
        return error_response(500, f'Failed to generate insights: {str(e)}')

def get_redacted_document(document_id: str) -> str:
    """Fetch the redacted DD214 document from S3"""
    try:
        redacted_key = f"redacted/{document_id}/dd214_redacted.txt"
        response = s3_client.get_object(Bucket=REDACTED_BUCKET, Key=redacted_key)
        return response['Body'].read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching redacted document: {str(e)}")
        return None

def extract_profile_from_dd214(redacted_text: str) -> Dict[str, Any]:
    """Extract key profile information from DD214 text"""
    profile = {
        'full_text': redacted_text[:1000],  # First 1000 chars for context
        'branch': extract_branch_from_text(redacted_text),
        'rank': extract_rank_from_text(redacted_text),
        'mos': extract_mos_from_text(redacted_text),
        'deployments': extract_deployments_from_text(redacted_text),
        'decorations': extract_decorations_from_text(redacted_text),
        'clearance_indicators': extract_clearance_indicators(redacted_text)
    }
    return profile

def extract_branch_from_text(text: str) -> str:
    """Extract military branch from DD214 text"""
    text_upper = text.upper()
    if 'UNITED STATES ARMY' in text_upper or 'U.S. ARMY' in text_upper:
        return 'ARMY'
    elif 'UNITED STATES NAVY' in text_upper or 'U.S. NAVY' in text_upper:
        return 'NAVY'
    elif 'UNITED STATES AIR FORCE' in text_upper or 'U.S. AIR FORCE' in text_upper:
        return 'AIR FORCE'
    elif 'UNITED STATES MARINE' in text_upper or 'U.S. MARINE' in text_upper:
        return 'MARINES'
    elif 'UNITED STATES COAST GUARD' in text_upper or 'U.S. COAST GUARD' in text_upper:
        return 'COAST GUARD'
    elif 'UNITED STATES SPACE FORCE' in text_upper or 'U.S. SPACE FORCE' in text_upper:
        return 'SPACE FORCE'
    return 'Unknown'

def extract_rank_from_text(text: str) -> str:
    """Extract rank from DD214 text"""
    # Look for pay grade patterns
    pay_grade_pattern = r'[EWO]-\d+'
    match = re.search(pay_grade_pattern, text)
    if match:
        return match.group()
    
    # Look for common rank abbreviations
    rank_patterns = ['SSG', 'SGT', 'CPL', 'SPC', 'PFC', 'PVT', 'SFC', 'MSG', 'SGM', 
                    'LT', 'CPT', 'MAJ', 'LTC', 'COL', 'BG', 'MG', 'LTG', 'GEN']
    for rank in rank_patterns:
        if rank in text.upper():
            return rank
    
    return 'Unknown'

def extract_mos_from_text(text: str) -> str:
    """Extract MOS from DD214 text"""
    # Look for common MOS patterns
    mos_patterns = [
        r'\b\d{2}[A-Z]\d*\b',  # Army MOS (e.g., 11B, 68W, 18D3P)
        r'\b[A-Z]{2}\b',        # Navy Rate (e.g., IT, BM)
        r'\b\d[A-Z]\d[A-Z]\d\b',  # Air Force AFSC (e.g., 3D0X2)
        r'\b\d{4}\b'            # Marine MOS (e.g., 0311)
    ]
    
    for pattern in mos_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group()
    
    return 'Unknown'

def extract_deployments_from_text(text: str) -> List[str]:
    """Extract deployment information from DD214 text"""
    deployments = []
    
    # Look for deployment indicators
    deployment_keywords = ['afghanistan', 'iraq', 'kuwait', 'syria', 'somalia', 
                          'deployment', 'oif', 'oef', 'operation']
    
    lines = text.split('\n')
    for line in lines:
        line_lower = line.lower()
        for keyword in deployment_keywords:
            if keyword in line_lower:
                deployments.append(line.strip())
                break
    
    return deployments[:5]  # Limit to top 5

def extract_decorations_from_text(text: str) -> List[str]:
    """Extract decorations and awards from DD214 text"""
    decorations = []
    
    # Common military decorations
    medal_patterns = [
        'bronze star', 'silver star', 'purple heart', 'distinguished service',
        'meritorious service', 'commendation', 'achievement', 'good conduct',
        'national defense', 'combat action', 'combat infantry', 'combat medical',
        'ranger tab', 'airborne', 'air assault', 'special forces tab'
    ]
    
    text_lower = text.lower()
    for medal in medal_patterns:
        if medal in text_lower:
            decorations.append(medal.title())
    
    return list(set(decorations))  # Remove duplicates

def extract_clearance_indicators(text: str) -> Dict[str, Any]:
    """Extract security clearance indicators"""
    clearance_info = {
        'level': 'Unknown',
        'indicators': []
    }
    
    text_upper = text.upper()
    
    # Direct clearance mentions
    if 'TOP SECRET' in text_upper or 'TS/SCI' in text_upper:
        clearance_info['level'] = 'Top Secret'
        clearance_info['indicators'].append('Direct TS mention')
    elif 'SECRET' in text_upper:
        clearance_info['level'] = 'Secret'
        clearance_info['indicators'].append('Direct Secret mention')
    
    # MOS-based inference
    mos = extract_mos_from_text(text)
    if mos.startswith('18'):  # Special Forces
        clearance_info['indicators'].append('Special Forces MOS')
        if clearance_info['level'] == 'Unknown':
            clearance_info['level'] = 'Top Secret (likely)'
    elif mos.startswith('35'):  # Military Intelligence
        clearance_info['indicators'].append('Intelligence MOS')
        if clearance_info['level'] == 'Unknown':
            clearance_info['level'] = 'Top Secret (likely)'
    elif mos.startswith('25'):  # Signal/Cyber
        clearance_info['indicators'].append('Signal/Cyber MOS')
        if clearance_info['level'] == 'Unknown':
            clearance_info['level'] = 'Secret (likely)'
    
    return clearance_info

def generate_enhanced_ai_insights(redacted_text: str, document_id: str) -> Dict[str, Any]:
    """Generate comprehensive AI insights using enhanced prompts"""
    
    # Extract basic info for specialized prompt
    mos = extract_mos_from_text(redacted_text)
    rank = extract_rank_from_text(redacted_text)
    branch = extract_branch_from_text(redacted_text)
    
    # Use dynamic prompt for variability
    # Could also check if user has previous analyses to increment count
    prompt = get_dynamic_prompt(redacted_text, previous_analysis_count=0)
    
    try:
        # Call Bedrock with higher token limit for comprehensive response
        response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{
                'role': 'user',
                'content': [{'text': prompt}]
            }],
            inferenceConfig={
                'maxTokens': 8000,  # Increased for comprehensive insights
                'temperature': 0.85,  # Increased for more variability
                'topP': 0.95  # Increased for more creative outputs
            }
        )
        
        # Extract response
        ai_response = response['output']['message']['content'][0]['text']
        
        # Clean up response - remove markdown code blocks if present
        if '```json' in ai_response:
            ai_response = ai_response.split('```json')[1].split('```')[0].strip()
        elif '```' in ai_response:
            ai_response = ai_response.split('```')[1].split('```')[0].strip()
            
        # Parse JSON response
        insights = json.loads(ai_response)
        
        # Add metadata
        insights['metadata'] = {
            'generated_at': datetime.utcnow().isoformat(),
            'model_version': MODEL_ID,
            'analysis_method': 'enhanced_comprehensive',
            'mos_detected': mos,
            'rank_detected': rank,
            'branch_detected': branch,
            'enhancement_version': '2.0'
        }
        
        # Add clearance value information if detected
        clearance_info = extract_clearance_indicators(redacted_text)
        if clearance_info['level'] != 'Unknown':
            insights['clearance_analysis'] = {
                'detected_level': clearance_info['level'],
                'indicators': clearance_info['indicators'],
                'value_matrix': CLEARANCE_VALUE_MATRIX.get(
                    clearance_info['level'].split(' ')[0], 
                    CLEARANCE_VALUE_MATRIX.get('Secret')
                )
            }
        
        return insights
        
    except json.JSONDecodeError as e:
        print(f"Error parsing AI response as JSON: {str(e)}")
        print(f"Raw response: {ai_response[:500]}...")
        return generate_enhanced_fallback_insights(redacted_text, mos, rank, branch)
    except Exception as e:
        print(f"Error calling Bedrock for enhanced DD214 analysis: {str(e)}")
        return generate_enhanced_fallback_insights(redacted_text, mos, rank, branch)

def generate_interview_prep(veteran_profile: Dict[str, Any], target_company: str, target_role: str) -> Dict[str, Any]:
    """Generate interview preparation insights"""
    
    prompt = get_interview_prep_prompt(veteran_profile, target_company, target_role)
    
    try:
        response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{
                'role': 'user',
                'content': [{'text': prompt}]
            }],
            inferenceConfig={
                'maxTokens': 4000,
                'temperature': 0.7,
                'topP': 0.9
            }
        )
        
        ai_response = response['output']['message']['content'][0]['text']
        
        # Parse and structure the response
        interview_prep = {
            'type': 'interview_preparation',
            'target_company': target_company,
            'target_role': target_role,
            'preparation': ai_response,
            'generated_at': datetime.utcnow().isoformat()
        }
        
        return interview_prep
        
    except Exception as e:
        print(f"Error generating interview prep: {str(e)}")
        return {
            'type': 'interview_preparation',
            'error': 'Failed to generate interview preparation',
            'fallback_tips': [
                'Research the company\'s veteran hiring initiatives',
                'Prepare STAR format stories from your military experience',
                'Translate military jargon to civilian terms',
                'Emphasize leadership and problem-solving skills'
            ]
        }

def generate_salary_negotiation(veteran_profile: Dict[str, Any], job_offer: Dict[str, Any]) -> Dict[str, Any]:
    """Generate salary negotiation strategy"""
    
    prompt = get_salary_negotiation_prompt(veteran_profile, job_offer)
    
    try:
        response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{
                'role': 'user',
                'content': [{'text': prompt}]
            }],
            inferenceConfig={
                'maxTokens': 3000,
                'temperature': 0.6,
                'topP': 0.9
            }
        )
        
        ai_response = response['output']['message']['content'][0]['text']
        
        # Parse and structure the response
        negotiation_strategy = {
            'type': 'salary_negotiation',
            'job_offer': job_offer,
            'strategy': ai_response,
            'generated_at': datetime.utcnow().isoformat()
        }
        
        return negotiation_strategy
        
    except Exception as e:
        print(f"Error generating salary negotiation: {str(e)}")
        return {
            'type': 'salary_negotiation',
            'error': 'Failed to generate negotiation strategy',
            'fallback_advice': [
                'Research market rates for your clearance level',
                'Emphasize leadership experience value',
                'Consider total compensation, not just base salary',
                'Be prepared to discuss your unique military skills'
            ]
        }

def generate_enhanced_fallback_insights(redacted_text: str, mos: str, rank: str, branch: str) -> Dict[str, Any]:
    """Generate enhanced fallback insights with more value than before"""
    
    # Use detected information to provide better fallback insights
    leadership_info = RANK_TO_LEADERSHIP_MAPPING.get(rank, {
        'level': 'Unknown',
        'civilian': 'Professional',
        'years_experience': 'Varies'
    })
    
    # Check for MOS-specific enhancements
    mos_enhancements = MOS_SPECIFIC_ENHANCEMENTS.get(mos[:3], {})  # Use first 3 chars for series
    
    return {
        'veteran_intelligence': {
            'executive_summary': f"{branch} veteran with {rank} rank and {mos} specialty. {leadership_info['civilian']} level professional with military leadership experience.",
            
            'service_analysis': {
                'rank_progression': f"{rank} indicates {leadership_info['level']} leadership level",
                'leadership_tier': leadership_info['civilian'],
                'technical_depth': 'Specialist' if mos != 'Unknown' else 'Generalist',
                'operational_experience': 'Military service verified',
                'clearance_value': 'Minimum Secret clearance likely based on service'
            },
            
            'career_paths': [
                {
                    'title': 'Operations Manager',
                    'fit_score': 85,
                    'reasoning': 'Military leadership experience translates directly to operations management',
                    'companies': ['Amazon', 'FedEx', 'UPS', 'Walmart', 'Target'],
                    'entry_salary': '$65,000',
                    'cleared_salary': '$75,000',
                    'progression': 'Operations Manager → Senior Manager → Director',
                    'first_steps': 'Get PMP certification and apply to military-friendly companies'
                },
                {
                    'title': 'Project Manager',
                    'fit_score': 80,
                    'reasoning': 'Military planning and execution skills align with project management',
                    'companies': ['Lockheed Martin', 'Boeing', 'Raytheon', 'General Dynamics'],
                    'entry_salary': '$70,000',
                    'cleared_salary': '$85,000',
                    'progression': 'Project Manager → Senior PM → Program Manager',
                    'first_steps': 'Pursue PMP certification through military education benefits'
                }
            ],
            
            'hidden_strengths': [
                {
                    'strength': 'Crisis Management',
                    'evidence': 'Military service requires constant readiness for unexpected situations',
                    'civilian_value': 'Valuable for operations roles requiring quick decision-making'
                },
                {
                    'strength': 'Team Building',
                    'evidence': f"{rank} rank indicates experience leading and developing teams",
                    'civilian_value': 'Critical for management positions in any industry'
                }
            ],
            
            'market_differentiators': [
                'Security clearance eligibility saves employers time and money',
                'Proven ability to work under pressure and meet deadlines',
                'Strong ethics and integrity from military service',
                'Experience with diverse teams and cultures'
            ],
            
            '90_day_action_plan': {
                'immediate': [
                    'Create LinkedIn profile highlighting military leadership',
                    'Research veteran-friendly companies in your area',
                    'Connect with veteran transition assistance programs'
                ],
                'short_term': [
                    'Pursue industry certifications (PMP, Six Sigma, etc.)',
                    'Attend veteran job fairs and networking events',
                    'Practice translating military experience to civilian terms'
                ],
                'positioning': [
                    'Apply to 5-10 positions per week at target companies',
                    'Follow up with recruiters and hiring managers',
                    'Leverage veteran networks for referrals'
                ]
            },
            
            'metadata': {
                'generated_at': datetime.utcnow().isoformat(),
                'analysis_method': 'enhanced_fallback',
                'enhancement_version': '2.0'
            }
        }
    }

def store_enhanced_insights(document_id: str, profile: Dict[str, Any], insights: Dict[str, Any]):
    """Store enhanced insights with additional metadata"""
    
    insights_table = dynamodb.Table(INSIGHTS_TABLE)
    
    try:
        # Extract key information for quick queries
        veteran_intelligence = insights.get('veteran_intelligence', {})
        service_analysis = veteran_intelligence.get('service_analysis', {})
        
        insights_table.put_item(
            Item={
                'document_id': document_id,
                'created_at': datetime.utcnow().isoformat(),
                'veteran_profile': profile,
                'ai_insights': insights,
                'insight_type': insights.get('type', 'comprehensive'),
                'enhancement_version': '2.0',
                
                # Denormalized fields for querying
                'branch': service_analysis.get('branch', 'Unknown'),
                'rank': service_analysis.get('rank', 'Unknown'),
                'leadership_tier': service_analysis.get('leadership_tier', 'Unknown'),
                'clearance_level': service_analysis.get('clearance_value', 'Unknown'),
                
                # Analytics fields
                'career_paths_count': len(veteran_intelligence.get('career_paths', [])),
                'hidden_strengths_count': len(veteran_intelligence.get('hidden_strengths', [])),
                'has_clearance_analysis': 'clearance_analysis' in insights,
                
                'ttl': int(datetime.utcnow().timestamp()) + (365 * 24 * 60 * 60)  # 1 year
            }
        )
    except Exception as e:
        print(f"Error storing enhanced insights: {str(e)}")
        # Fallback to main table
        table = dynamodb.Table(TABLE_NAME)
        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET ai_insights = :insights, enhancement_version = :version',
            ExpressionAttributeValues={
                ':insights': insights,
                ':version': '2.0'
            }
        )

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
    
    branch_text = str(branch_text or '').lower()
    
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
    
    text_lower = str(decorations_text or '').lower()
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
    
    text_lower = str(education_text or '').lower()
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
    
    mos = str(data.get('primary_specialty', '') or '').lower()
    education = str(data.get('military_education', '') or '').lower()
    
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
    
    mos = str(data.get('primary_specialty', '') or '').lower()
    
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
    """Generate AI-powered career insights using Bedrock (legacy method)"""
    
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
    """Build comprehensive prompt for AI insights (legacy)"""
    
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

IMPORTANT: Format your ENTIRE response as valid JSON following this exact structure:
{
  "career_recommendations": [
    {
      "title": "Job Title",
      "match_reason": "Why this is a good match",
      "required_training": "Additional certifications needed",
      "salary_range": "$X - $Y",
      "growth_outlook": "Growth percentage or description"
    }
  ],
  "transferable_skills": [
    "Skill 1",
    "Skill 2",
    "Skill 3"
  ],
  "action_steps": [
    "Step 1",
    "Step 2", 
    "Step 3"
  ],
  "education_priorities": [
    "Priority 1",
    "Priority 2"
  ],
  "networking_strategy": {
    "industries": ["Industry 1", "Industry 2"],
    "associations": ["Association 1", "Association 2"],
    "companies": ["Company 1", "Company 2"]
  }
}
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
    """Generate fallback insights if AI fails (legacy)"""
    
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