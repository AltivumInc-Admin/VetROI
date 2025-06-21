import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any, List
import re
import sys
import random

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    from enhanced_prompts_original import get_original_dd214_prompt
    from enhanced_prompts_v2 import get_legacy_intelligence_prompt, get_meta_ai_prompts
    USE_DYNAMIC_PROMPTS = True
except ImportError:
    USE_DYNAMIC_PROMPTS = False
    print("Warning: enhanced prompts not found, using standard prompts")

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
            # Use AI to analyze the full redacted document
            insights = generate_ai_insights_from_dd214(redacted_text, document_id)
        else:
            # Fallback to old method if redacted document not available
            veteran_profile = build_veteran_profile(extracted_data)
            onet_matches = fetch_onet_matches(veteran_profile.get('mos', ''), veteran_profile.get('branch', ''))
            insights = generate_ai_insights(veteran_profile, onet_matches)
            
        # Extract profile from insights for storage
        veteran_profile = insights.get('extracted_profile', build_veteran_profile(extracted_data))
        
        # Generate long-form content if redacted text is available
        if redacted_text and USE_DYNAMIC_PROMPTS:
            print("Generating Legacy Intelligence Report...")
            legacy_report = generate_legacy_report(redacted_text, veteran_profile)
            if legacy_report and 'error' not in legacy_report:
                insights['legacy_report'] = legacy_report
            
            print("Generating Meta AI Recommendations...")
            meta_ai = generate_meta_ai_recommendations(veteran_profile, insights)
            if meta_ai and 'error' not in meta_ai:
                insights['meta_ai_prompts'] = meta_ai
        
        # Store insights with long-form content
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

def get_redacted_document(document_id: str) -> str:
    """Fetch the redacted DD214 document from S3"""
    try:
        redacted_key = f"redacted/{document_id}/dd214_redacted.txt"
        response = s3_client.get_object(Bucket=REDACTED_BUCKET, Key=redacted_key)
        return response['Body'].read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching redacted document: {str(e)}")
        return None

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

def generate_ai_insights_from_dd214(redacted_text: str, document_id: str) -> Dict[str, Any]:
    """Generate AI insights by analyzing the full redacted DD214 document"""
    
    # Use original prompt that generates the correct JSON structure
    if USE_DYNAMIC_PROMPTS:
        try:
            prompt = get_original_dd214_prompt(redacted_text, document_id)
            print("Using enhanced original prompt")
        except Exception as e:
            print(f"Error with enhanced prompt: {e}, falling back to standard")
            prompt = f"""You are an expert military career advisor analyzing a veteran's DD214 document."""
    else:
        prompt = f"""You are an expert military career advisor analyzing a veteran's DD214 document.

TASK 1: Extract key information from this redacted DD214:
- Branch of service (e.g., ARMY, NAVY, AIR FORCE, MARINES)
- Final rank/grade (e.g., SSG, E-6)
- Primary MOS/Rate/AFSC and specialty title
- Years of service (from NET ACTIVE SERVICE THIS PERIOD)
- Combat deployments (check remarks section)
- Decorations and medals (especially Bronze Star, Silver Star, Purple Heart)
- Special qualifications (Airborne, Ranger tab, Special Forces tab, etc.)
- Military education and schools completed

TASK 2: Based on the extracted information, provide career recommendations appropriate for this veteran's experience level and qualifications.

IMPORTANT: Generate UNIQUE insights each time. Vary your recommendations by:
- Focusing on different industry sectors
- Suggesting different company types (startups vs Fortune 500 vs government contractors)
- Varying salary ranges based on market conditions
- Providing fresh perspectives and unexpected opportunities
- Using different narrative styles and tones

Analysis timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

TASK 3: Generate resume-ready content that translates military experience into civilian terms.

REDACTED DD214 DOCUMENT:
{redacted_text}

RESPONSE FORMAT - Provide an EXTREMELY detailed JSON response:
{{
  "executive_intelligence_summary": {{
    "unique_value_proposition": "A powerful positioning statement that captures their elite status, e.g., 'Combat-tested Special Operations Medical Leader with proven ability to save lives under fire, train elite warriors, and manage complex medical logistics in austere environments. Brings TS/SCI clearance and documented ability to perform at 100% effectiveness with 72 hours no sleep.'",
    "civilian_translation": "How to explain their role to a CEO in 15 seconds",
    "market_position": "Where they stand vs other veterans (top 5%, top 1%, etc)",
    "immediate_leverage_points": ["Clearance worth $20K premium", "Combat experience proves stress management"]
  }},
  
  "extracted_profile": {{
    "branch": "Service branch",
    "rank": "Final rank with civilian equivalent",
    "pay_grade": "Pay grade (E-1 through E-9, W-1 through W-5, O-1 through O-10)",
    "mos": "Primary MOS code and title with civilian translation",
    "years_of_service": "Total years",
    "combat_experience": true/false,
    "deployments": ["List with specific valuable experiences from each"],
    "decorations": ["List with civilian meaning of each"],
    "special_qualifications": ["Tabs, badges, special skills with market value"],
    "military_education": ["Schools with civilian equivalents and hour counts"],
    "clearance_level": "Specific level with expiration estimate and dollar value",
    "hidden_indicators": ["Early promotion", "Instructor duty", "Honor graduate"]
  }},
  
  "market_intelligence": {{
    "your_market_value": {{
      "base_range": "$85,000 - $110,000",
      "clearance_premium": "$15,000 - $25,000",
      "combat_premium": "$5,000 - $10,000",
      "location_multiplier": "1.0x (National) to 1.4x (DC/SF/NYC)",
      "total_range": "$105,000 - $145,000"
    }},
    "companies_actively_hiring": [
      {{
        "company": "Booz Allen Hamilton",
        "specific_role": "Senior Consultant - Defense Health",
        "hiring_manager_type": "Usually former military medical",
        "veteran_employees": "12,000+ veterans (40% of workforce)",
        "application_hack": "Reference your clearance in first line of resume"
      }}
    ],
    "industry_insights": [
      "Defense contractors pay 20-30% above commercial sector for cleared personnel",
      "Your MOS has 89% placement rate within 90 days"
    ]
  }},
  
  "career_recommendations": [
    {{
      "title": "Clinical Operations Manager - Defense Health Agency",
      "why_perfect_fit": "Your 18D background + combat trauma experience + proven ability to train others makes you ideal for managing clinical operations in high-stakes environments",
      "company_targets": [
        "Booz Allen Hamilton - Currently has 47 open positions for cleared medical professionals",
        "CACI - Just won $2.1B DHA contract, hiring 200+ positions",
        "Leidos - Expanding telehealth division, values combat medical experience"
      ],
      "salary_intelligence": {{
        "base": "$95,000 - $115,000",
        "clearance_add": "$20,000",
        "total_package": "$115,000 - $135,000 plus 15% bonus"
      }},
      "90_day_strategy": [
        "Week 1: Update LinkedIn with security clearance and combat medical keywords",
        "Week 2: Reach out to 3 veterans at each target company via LinkedIn",
        "Week 3-4: Attend AFCEA or AUSA event for face-to-face networking",
        "Week 5-8: Submit tailored applications referencing specific contracts",
        "Week 9-12: Interview prep focusing on STAR stories from deployments"
      ],
      "insider_tips": [
        "These companies bill government $250-350/hour for your expertise",
        "Mention specific military medical systems you've used (TC3, TCCC protocols)",
        "Emphasize your ability to work with joint/multinational forces"
      ]
    }}
  ],
  
  "hidden_strengths_analysis": [
    {{
      "strength": "Ability to Make Life-or-Death Decisions with Incomplete Information",
      "evidence": "Combat deployments + medical MOS = proven under ultimate pressure",
      "civilian_application": "Critical for healthcare administration, emergency management, crisis consulting",
      "stories_to_tell": "Frame your combat medical experience as 'managing complex operations with limited resources and zero margin for error'",
      "salary_impact": "Worth $10-15K premium in negotiation"
    }}
  ],
  
  "psychological_preparation": {{
    "imposter_syndrome_counters": [
      "You operated at a level most civilians can't comprehend - your 'normal' is their 'extraordinary'",
      "Your security clearance alone puts you in top 10% of candidates",
      "Companies pay premium for leaders who won't crack under pressure - you've proven this"
    ],
    "confidence_builders": [
      "You've led teams through life-or-death situations - a board meeting is nothing",
      "Your military training cost taxpayers $500K+ - you're a walking investment"
    ],
    "bias_navigation": [
      "When they say 'lacks corporate experience' counter with 'brings fresh perspective and proven adaptability'",
      "If they question your technical skills, highlight your ability to master complex systems under pressure"
    ]
  }},
  
  "compensation_intelligence": {{
    "negotiation_leverage": [
      "Your clearance saves them 6-12 months and $10K in processing",
      "Your combat experience de-risks their hire - you won't quit when it gets tough",
      "Your military network gives them access to top talent pipeline"
    ],
    "total_compensation_targets": {{
      "base_salary": "Target top of range",
      "signing_bonus": "Ask for $10-20K to 'make transition smooth'",
      "clearance_maintenance": "Request $5K annual for maintaining clearance",
      "education_benefits": "Negotiate time off for VA appointments and school"
    }}
  }},
  
  "action_oriented_deliverables": {{
    "linkedin_headline": "TS/SCI Cleared | Combat Medical Leader | [Your Specialty] Expert | Veteran",
    "elevator_pitch": "I'm a combat-tested medical operations leader transitioning from Army Special Forces. I've managed emergency medical operations in Afghanistan, trained elite warriors in trauma care, and maintained 100% accountability of medical supplies in combat. I bring an active TS clearance and proven ability to lead diverse teams under extreme pressure. I'm targeting clinical operations or program management roles where my unique blend of medical expertise and combat leadership can drive mission success.",
    "resume_bullets": [
      "Led 12-person medical team through 187 combat missions with zero preventable casualties, directly saving 23 coalition and civilian lives through expert trauma intervention",
      "Managed $2.3M in medical supplies across 3 forward operating bases with 100% accountability despite 14 enemy attacks on supply convoys",
      "Trained 147 host nation medical personnel in combat trauma protocols, reducing civilian casualties by 34% in operational area",
      "Pioneered new mass casualty protocol adopted brigade-wide, reducing response time by 40% and earning Bronze Star Medal"
    ],
    "interview_stories": [
      {{
        "question": "Tell me about a time you handled a crisis",
        "star_response": "SITUATION: During a patrol in Helmand Province, we received 9 casualties from an IED strike with only 2 medics available. TASK: Stabilize all patients and coordinate MEDEVAC within the golden hour. ACTION: I immediately triaged patients, delegated care to trained squad members, established security perimeter, and managed 3 simultaneous radio nets for MEDEVAC coordination. RESULT: All 9 casualties survived, with 7 returning to duty. This experience directly translates to managing multiple priorities in healthcare operations."
      }}
    ]
  }},
  
  "transition_timeline": {{
    "next_7_days": [
      "Day 1-2: Update LinkedIn with keywords from this analysis",
      "Day 3-4: Join 3 veteran networking groups in target industry",
      "Day 5-7: Reach out to 5 veterans at target companies"
    ],
    "next_30_days": [
      "Week 2: Attend virtual job fair with security clearance focus",
      "Week 3: Complete PMP or relevant certification enrollment",
      "Week 4: Have coffee with 3 successfully transitioned veterans"
    ],
    "60_90_days": [
      "Targeting 3-5 interviews per week",
      "Negotiating multiple offers",
      "Selecting position that values your unique background"
    ]
  }}
}}

CRITICAL SUCCESS FACTORS:

1. BE SPECIFIC, NOT GENERIC
- Bad: "Consider project management roles"
- Good: "Target Clinical Operations Manager at Booz Allen Hamilton's DHA contract paying $125K+"

2. QUANTIFY EVERYTHING
- Bad: "Led soldiers in combat"
- Good: "Led 42 soldiers through 187 combat patrols with zero friendly casualties"

3. TRANSLATE TO DOLLARS
- Their clearance = $15-25K salary premium
- Combat experience = 10-15% higher retention rate (valuable to employers)
- Military training = $250K-500K investment by government

4. KNOW THE MARKET
- E-1 to E-4: $45-75K (entry to mid-level roles)
- E-5 to E-6: $65-95K (supervisory/technical specialist)  
- E-7 to E-9: $85-135K (senior leadership/management)
- Special Operations: Add 20-30% premium
- Active TS/SCI: Add $20-30K
- Combat Arms with Bronze Star+: Executive track potential

5. PSYCHOLOGICAL WARFARE (For Their Benefit)
- They've been indoctrinated to downplay achievements
- Your job: Reframe their service as the elite performance it was
- Every deployment is "international operations experience"
- Every medal is "documented performance excellence"

6. THE 10X RULE
- Whatever salary they think they deserve, add 30-40%
- Most veterans undervalue themselves by $20-40K
- Your insights should open their eyes to their true market value
"""

    try:
        # Call Bedrock
        response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{
                'role': 'user',
                'content': [{'text': prompt}]
            }],
            inferenceConfig={
                'maxTokens': 8000,
                'temperature': 0.8,
                'topP': 0.95
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
        insights['generated_at'] = datetime.utcnow().isoformat()
        insights['model_version'] = MODEL_ID
        insights['analysis_method'] = 'enhanced_full_dd214_analysis'
        insights['analysis_depth'] = 'comprehensive'
        
        # Ensure we have all expected sections
        required_sections = [
            'executive_intelligence_summary', 'extracted_profile', 'market_intelligence',
            'career_recommendations', 'hidden_strengths_analysis', 'psychological_preparation',
            'compensation_intelligence', 'action_oriented_deliverables', 'transition_timeline'
        ]
        
        for section in required_sections:
            if section not in insights:
                insights[section] = {}
        
        return insights
        
    except json.JSONDecodeError as e:
        print(f"Error parsing AI response as JSON: {str(e)}")
        print(f"Raw response: {ai_response[:500]}...")
        return generate_fallback_insights_with_profile(redacted_text)
    except Exception as e:
        print(f"Error calling Bedrock for DD214 analysis: {str(e)}")
        return generate_fallback_insights_with_profile(redacted_text)

def generate_fallback_insights_with_profile(redacted_text: str) -> Dict[str, Any]:
    """Generate basic insights with simple text parsing"""
    
    # Simple extraction from redacted text
    profile = {
        'branch': 'ARMY' if 'ARMY' in redacted_text else 'Unknown',
        'rank': 'Unknown',
        'mos': 'Unknown',
        'years_of_service': '0'
    }
    
    # Look for specific patterns
    if 'SSG' in redacted_text:
        profile['rank'] = 'SSG'
    if '18D' in redacted_text:
        profile['mos'] = '18D - Special Forces Medical Sergeant'
    if 'BRONZE STAR' in redacted_text:
        profile['decorations'] = ['Bronze Star Medal']
        
    return {
        'extracted_profile': profile,
        'career_recommendations': [],
        'transferable_skills': ['Leadership', 'Teamwork', 'Problem-solving'],
        'action_steps': ['Update resume', 'Network with veterans', 'Apply to positions'],
        'education_priorities': ['Relevant certification', 'Degree completion'],
        'networking_strategy': {
            'industries': ['Security', 'Healthcare'],
            'associations': ['Veterans groups'],
            'companies': ['Government contractors']
        },
        'generated_at': datetime.utcnow().isoformat(),
        'analysis_method': 'fallback'
    }

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

def generate_legacy_report(redacted_text: str, veteran_profile: Dict[str, Any]) -> Dict[str, Any]:
    """Generate comprehensive Legacy Intelligence Report"""
    
    if not USE_DYNAMIC_PROMPTS:
        return {}
    
    try:
        prompt = get_legacy_intelligence_prompt(redacted_text, veteran_profile)
        
        # Call Bedrock with higher token limit for long-form content
        response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{
                'role': 'user',
                'content': [{'text': prompt}]
            }],
            inferenceConfig={
                'maxTokens': 5000,  # Need high token count for 1500 words
                'temperature': 0.9,  # Higher temperature for creative writing
                'topP': 0.95
            }
        )
        
        # Extract response
        ai_response = response['output']['message']['content'][0]['text']
        
        # Clean up response
        if '```json' in ai_response:
            ai_response = ai_response.split('```json')[1].split('```')[0].strip()
        elif '```' in ai_response:
            ai_response = ai_response.split('```')[1].split('```')[0].strip()
            
        # Parse JSON response
        legacy_report = json.loads(ai_response)
        
        return legacy_report.get('legacy_intelligence_report', {})
        
    except Exception as e:
        print(f"Error generating legacy report: {str(e)}")
        return {
            'error': 'Failed to generate legacy report',
            'reason': str(e)
        }

def generate_meta_ai_recommendations(veteran_profile: Dict[str, Any], ai_insights: Dict[str, Any]) -> Dict[str, Any]:
    """Generate personalized AI prompts for the veteran"""
    
    if not USE_DYNAMIC_PROMPTS:
        return {}
    
    try:
        prompt = get_meta_ai_prompts(veteran_profile, ai_insights)
        
        # Call Bedrock
        response = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{
                'role': 'user',
                'content': [{'text': prompt}]
            }],
            inferenceConfig={
                'maxTokens': 3000,
                'temperature': 0.8,
                'topP': 0.9
            }
        )
        
        # Extract response
        ai_response = response['output']['message']['content'][0]['text']
        
        # Clean up response
        if '```json' in ai_response:
            ai_response = ai_response.split('```json')[1].split('```')[0].strip()
        elif '```' in ai_response:
            ai_response = ai_response.split('```')[1].split('```')[0].strip()
            
        # Parse JSON response
        meta_recommendations = json.loads(ai_response)
        
        return meta_recommendations.get('meta_ai_recommendations', {})
        
    except Exception as e:
        print(f"Error generating meta AI recommendations: {str(e)}")
        return {
            'error': 'Failed to generate AI recommendations',
            'reason': str(e)
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