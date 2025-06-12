import json
import os
import time
import uuid
from datetime import datetime
from typing import Dict, List, Any

import boto3

from models import VeteranRequest, RecommendationResponse, Career

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', 'VetROI_Sessions')
table = dynamodb.Table(table_name)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for VetROI recommendations - Minimal version
    """
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        
        # Basic validation
        required_fields = ['branch', 'code', 'homeState', 'relocate', 'education']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Create mock recommendations for now
        recommendations = generate_mock_recommendations(body)
        
        # Store session in DynamoDB
        store_session(session_id, body, recommendations)
        
        # Prepare response
        response_data = {
            'sessionId': session_id,
            'recommendations': [rec.dict() for rec in recommendations],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }


def generate_mock_recommendations(request: Dict[str, Any]) -> List[Career]:
    """Generate mock recommendations based on military background"""
    
    # Base recommendations by branch
    branch_careers = {
        'army': [
            ('Project Manager', '11-9199.00', 95000, 'Your Army leadership experience in managing squads and operations'),
            ('Operations Manager', '11-1021.00', 85000, 'Your expertise in logistics and resource management'),
            ('Security Manager', '11-3013.01', 92000, 'Your military security protocols and risk assessment skills'),
            ('Training Specialist', '13-1151.00', 65000, 'Your experience in military training and instruction'),
            ('Emergency Management Director', '11-9161.00', 78000, 'Your crisis response and emergency planning background')
        ],
        'navy': [
            ('Marine Engineer', '17-2121.01', 88000, 'Your naval engineering and systems experience'),
            ('Logistics Analyst', '13-1081.00', 77000, 'Your supply chain and maritime logistics expertise'),
            ('Port Manager', '11-3071.03', 95000, 'Your naval operations and port security knowledge'),
            ('Navigation Systems Specialist', '17-3027.01', 82000, 'Your navigation and communications skills'),
            ('Project Coordinator', '13-1082.00', 71000, 'Your experience coordinating complex naval operations')
        ],
        'air_force': [
            ('Aviation Manager', '11-3071.01', 115000, 'Your aircraft operations and maintenance leadership'),
            ('Air Traffic Controller', '53-2021.00', 85000, 'Your air traffic management experience'),
            ('Aerospace Engineer', '17-2011.00', 105000, 'Your technical expertise with aircraft systems'),
            ('Cybersecurity Analyst', '15-1212.00', 98000, 'Your experience with secure communications systems'),
            ('Logistics Coordinator', '13-1081.02', 78000, 'Your supply chain and equipment management skills')
        ],
        'marine_corps': [
            ('Security Director', '11-3013.01', 105000, 'Your combat leadership and force protection expertise'),
            ('Operations Manager', '11-1021.00', 92000, 'Your tactical planning and execution skills'),
            ('Fitness Program Manager', '11-9179.01', 68000, 'Your physical training and conditioning experience'),
            ('Law Enforcement Supervisor', '33-1012.00', 85000, 'Your military police and security background'),
            ('Crisis Manager', '11-1021.00', 98000, 'Your rapid response and decision-making abilities')
        ],
        'space_force': [
            ('Satellite Operations Manager', '11-9121.01', 125000, 'Your space systems operations expertise'),
            ('Cybersecurity Manager', '11-3021.00', 118000, 'Your secure communications and cyber defense skills'),
            ('Data Analyst', '15-2051.00', 95000, 'Your experience with satellite data analysis'),
            ('Systems Engineer', '17-2199.08', 110000, 'Your complex systems integration background'),
            ('Project Manager - Tech', '11-9199.00', 105000, 'Your experience managing high-tech military projects')
        ],
        'coast_guard': [
            ('Port Security Manager', '11-3071.03', 92000, 'Your maritime security and inspection expertise'),
            ('Search and Rescue Coordinator', '11-9179.02', 78000, 'Your SAR operations and emergency response skills'),
            ('Marine Safety Inspector', '19-5011.00', 72000, 'Your vessel inspection and safety enforcement background'),
            ('Environmental Compliance Manager', '11-9199.02', 85000, 'Your marine environmental protection experience'),
            ('Maritime Operations Manager', '11-1021.00', 88000, 'Your coastal operations and navigation expertise')
        ]
    }
    
    # Get careers for the branch
    branch = request.get('branch', 'army')
    careers_list = branch_careers.get(branch, branch_careers['army'])
    
    # Adjust salaries based on state
    state = request.get('relocateState') if request.get('relocate') else request.get('homeState', 'TX')
    salary_multiplier = get_state_multiplier(state)
    
    # Create Career objects
    recommendations = []
    for i, (title, soc, base_salary, match_reason) in enumerate(careers_list[:5]):
        adjusted_salary = int(base_salary * salary_multiplier)
        
        career = Career(
            title=title,
            soc=soc,
            summary=f"Leverage your military experience in this {request.get('education', 'bachelor').replace('_', ' ')}-level position that values leadership, discipline, and strategic thinking.",
            medianSalary=adjusted_salary,
            matchReason=f"{match_reason} translates directly to this civilian role.",
            nextStep=get_next_step(i)
        )
        recommendations.append(career)
    
    return recommendations


def get_state_multiplier(state: str) -> float:
    """Get salary multiplier based on state cost of living"""
    high_cost = ['CA', 'NY', 'WA', 'MA', 'CT', 'NJ', 'MD', 'HI', 'AK']
    medium_high = ['VA', 'CO', 'OR', 'IL', 'MN', 'NH', 'RI']
    low_cost = ['MS', 'AR', 'WV', 'AL', 'KY', 'OK', 'IA', 'KS']
    
    if state in high_cost:
        return 1.25
    elif state in medium_high:
        return 1.10
    elif state in low_cost:
        return 0.85
    else:
        return 1.0


def get_next_step(index: int) -> str:
    """Get next step advice based on recommendation priority"""
    steps = [
        "Update your resume highlighting relevant military leadership experience and apply within 48 hours.",
        "Connect with veterans in this field through LinkedIn and professional associations.",
        "Research industry-specific certifications that complement your military training.",
        "Attend a job fair or networking event focused on veteran career transitions.",
        "Schedule informational interviews with professionals currently in this role."
    ]
    return steps[index]


def store_session(session_id: str, request: Dict[str, Any], recommendations: List[Career]) -> None:
    """Store session data in DynamoDB"""
    
    timestamp = int(time.time())
    
    item = {
        'session_id': session_id,
        'timestamp': timestamp,
        'request': request,
        'recommendations': [rec.dict() for rec in recommendations],
        'created_at': datetime.utcnow().isoformat(),
        'ttl': timestamp + (90 * 24 * 60 * 60)  # 90 days TTL
    }
    
    try:
        table.put_item(Item=item)
        print(f"Stored session: {session_id}")
    except Exception as e:
        print(f"Error storing session: {str(e)}")