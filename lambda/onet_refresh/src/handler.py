import json
import os
from datetime import datetime
from typing import Dict, Any, List

import boto3
import requests
from aws_lambda_powertools import Logger, Tracer

logger = Logger()
tracer = Tracer()

s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')

CACHE_BUCKET = os.environ.get('CACHE_BUCKET')
ONET_API_URL = os.environ.get('ONET_API_URL', 'https://services.onetcenter.org/ws')
SECRET_NAME = os.environ.get('ONET_SECRET_NAME', 'VetROI/ONet/ApiCredentials')

# Common military codes to refresh
MILITARY_CODES = [
    '11B', '11C', '13B', '19D', '25B', '31B', '35S', '68W', '88M', '92Y',  # Army
    'IT', 'ET', 'HM', 'MA', 'OS', 'YN',  # Navy
    '0311', '0331', '0651', '1371', '2311', '3451',  # Marines
    '1A1X1', '2A3X3', '3D1X2', '3E7X1', '4N0X1', '6F0X1',  # Air Force
]


@logger.inject_lambda_context
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Refresh O*NET data cache
    """
    try:
        # Get O*NET credentials
        auth = get_onet_credentials()
        
        # Initialize session
        session = requests.Session()
        session.auth = (auth['username'], auth['password'])
        
        success_count = 0
        error_count = 0
        
        # Refresh data for each military code
        for military_code in MILITARY_CODES:
            try:
                refresh_military_code(session, military_code)
                success_count += 1
            except Exception as e:
                logger.error(f"Failed to refresh {military_code}: {e}")
                error_count += 1
        
        # Refresh general career data
        refresh_top_careers(session)
        
        logger.info(f"Refresh complete. Success: {success_count}, Errors: {error_count}")
        
        return {
            'status': 'success' if error_count == 0 else 'partial',
            'message': f'Refreshed {success_count} military codes with {error_count} errors',
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.exception("O*NET refresh failed")
        return {
            'status': 'error',
            'error': str(e)
        }


@tracer.capture_method
def get_onet_credentials() -> Dict[str, str]:
    """Get O*NET API credentials from Secrets Manager"""
    
    response = secrets_client.get_secret_value(SecretId=SECRET_NAME)
    return json.loads(response['SecretString'])


@tracer.capture_method
def refresh_military_code(session: requests.Session, military_code: str) -> None:
    """Refresh O*NET data for a specific military code"""
    
    logger.info(f"Refreshing data for military code: {military_code}")
    
    # Get crosswalk data
    crosswalk_data = get_military_crosswalk(session, military_code)
    
    # Get detailed career data for top matches
    careers = []
    for soc_code in crosswalk_data[:10]:  # Top 10 matches
        career_data = get_career_details(session, soc_code)
        if career_data:
            careers.append(career_data)
    
    # Cache the data
    cache_key = f"military/{military_code}/careers.json"
    cache_data = {
        'military_code': military_code,
        'careers': careers,
        'refreshed_at': datetime.utcnow().isoformat()
    }
    
    s3_client.put_object(
        Bucket=CACHE_BUCKET,
        Key=cache_key,
        Body=json.dumps(cache_data),
        ContentType='application/json'
    )


@tracer.capture_method
def get_military_crosswalk(session: requests.Session, military_code: str) -> List[str]:
    """Get O*NET SOC codes for a military code"""
    
    # This is a simplified version - real implementation would use actual O*NET API
    # For now, return mock data
    mock_mappings = {
        '11B': ['11-1011.00', '33-3051.01', '13-1111.00', '11-9199.00', '43-5031.00'],
        '25B': ['15-1211.00', '15-1212.00', '15-1231.00', '15-1244.00', '15-1299.00'],
        '68W': ['29-2041.00', '31-9092.00', '29-2042.00', '29-1141.00', '29-2061.00'],
        '92Y': ['43-5071.00', '11-3071.00', '13-1081.00', '43-5061.00', '43-5111.00'],
    }
    
    return mock_mappings.get(military_code, [])


@tracer.capture_method
def get_career_details(session: requests.Session, soc_code: str) -> Dict[str, Any]:
    """Get detailed career information from O*NET"""
    
    try:
        # Get occupation details
        url = f"{ONET_API_URL}/occupations/{soc_code}"
        response = session.get(url, timeout=10)
        
        if response.status_code != 200:
            return None
        
        data = response.json()
        
        # Get additional details (tasks, skills, etc.)
        tasks = get_occupation_tasks(session, soc_code)
        skills = get_occupation_skills(session, soc_code)
        
        return {
            'soc': soc_code,
            'title': data.get('title', ''),
            'description': data.get('description', ''),
            'tasks': tasks[:5],
            'skills': skills[:10],
            'job_zones': data.get('job_zones', [])
        }
        
    except Exception as e:
        logger.error(f"Failed to get details for {soc_code}: {e}")
        return None


@tracer.capture_method
def get_occupation_tasks(session: requests.Session, soc_code: str) -> List[str]:
    """Get tasks for an occupation"""
    
    try:
        url = f"{ONET_API_URL}/occupations/{soc_code}/tasks"
        response = session.get(url, timeout=10)
        
        if response.status_code == 200:
            tasks = response.json().get('tasks', [])
            return [task['statement'] for task in tasks]
        
        return []
        
    except Exception:
        return []


@tracer.capture_method
def get_occupation_skills(session: requests.Session, soc_code: str) -> List[str]:
    """Get skills for an occupation"""
    
    try:
        url = f"{ONET_API_URL}/occupations/{soc_code}/skills"
        response = session.get(url, timeout=10)
        
        if response.status_code == 200:
            skills = response.json().get('skills', [])
            return [skill['name'] for skill in skills]
        
        return []
        
    except Exception:
        return []


@tracer.capture_method
def refresh_top_careers(session: requests.Session) -> None:
    """Refresh general top careers data"""
    
    logger.info("Refreshing top careers data")
    
    # Get top growing occupations
    top_careers = [
        {
            'soc': '15-1252.00',
            'title': 'Software Developers',
            'growth_rate': 25,
            'median_salary': 120730
        },
        {
            'soc': '29-1141.00',
            'title': 'Registered Nurses',
            'growth_rate': 6,
            'median_salary': 77600
        },
        {
            'soc': '13-1111.00',
            'title': 'Management Analysts',
            'growth_rate': 11,
            'median_salary': 93000
        },
        {
            'soc': '15-1211.00',
            'title': 'Computer Systems Analysts',
            'growth_rate': 9,
            'median_salary': 99270
        },
        {
            'soc': '11-9199.00',
            'title': 'Project Management Specialists',
            'growth_rate': 7,
            'median_salary': 94500
        }
    ]
    
    # Cache the data
    cache_key = "general/top_careers.json"
    cache_data = {
        'careers': top_careers,
        'refreshed_at': datetime.utcnow().isoformat()
    }
    
    s3_client.put_object(
        Bucket=CACHE_BUCKET,
        Key=cache_key,
        Body=json.dumps(cache_data),
        ContentType='application/json'
    )