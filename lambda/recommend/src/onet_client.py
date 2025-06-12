import os
import json
import base64
from datetime import datetime
from typing import Dict, Any, Optional
from functools import lru_cache

import boto3
import requests
from aws_lambda_powertools import Logger, Tracer
from botocore.exceptions import ClientError

logger = Logger()
tracer = Tracer()


class ONetClient:
    """Client for interacting with O*NET Web Services"""
    
    def __init__(self):
        self.base_url = os.environ.get('ONET_API_URL', 'https://services.onetcenter.org/ws')
        self.secret_name = os.environ.get('ONET_SECRET_NAME', 'VetROI/ONet/ApiCredentials')
        self.session = requests.Session()
        self._setup_auth()
    
    @tracer.capture_method
    def _setup_auth(self):
        """Set up authentication for O*NET API"""
        try:
            # Get credentials from Secrets Manager
            secrets_client = boto3.client('secretsmanager')
            response = secrets_client.get_secret_value(SecretId=self.secret_name)
            secret = json.loads(response['SecretString'])
            
            # Set up basic auth
            username = secret['username']
            password = secret['password']
            self.session.auth = (username, password)
            
        except ClientError as e:
            logger.error(f"Failed to retrieve O*NET credentials: {e}")
            raise
    
    @tracer.capture_method
    @lru_cache(maxsize=128)
    def get_career_data(self, military_code: str, state: str) -> Dict[str, Any]:
        """
        Get career data from O*NET for a military occupation code
        
        Args:
            military_code: Military occupation code (MOS/AFSC/Rate)
            state: US state code for salary data
            
        Returns:
            Dictionary containing O*NET career data
        """
        try:
            # First, try to get cached data from S3
            cached_data = self._get_cached_data(military_code, state)
            if cached_data:
                return cached_data
            
            # Crosswalk military code to O*NET SOC
            crosswalk_data = self._military_to_onet(military_code)
            
            if not crosswalk_data:
                logger.warning(f"No O*NET mapping found for military code: {military_code}")
                return self._get_fallback_careers(state)
            
            # Get detailed occupation data
            career_data = []
            for soc_code in crosswalk_data[:5]:  # Top 5 matches
                occupation_data = self._get_occupation_details(soc_code, state)
                if occupation_data:
                    career_data.append(occupation_data)
            
            # Cache the results
            self._cache_data(military_code, state, career_data)
            
            return {
                'military_code': military_code,
                'careers': career_data
            }
            
        except Exception as e:
            logger.error(f"Error fetching O*NET data: {e}")
            return self._get_fallback_careers(state)
    
    @tracer.capture_method
    def _military_to_onet(self, military_code: str) -> Optional[list]:
        """Crosswalk military code to O*NET SOC codes"""
        try:
            # This would typically call the O*NET military crosswalk endpoint
            # For now, returning mock data
            # Real implementation would use: /mnm/careers/{code}
            
            # Mock crosswalk for common military codes
            mock_crosswalk = {
                "11B": ["11-1011.00", "33-3051.01", "13-1111.00"],  # Infantry
                "68W": ["29-2041.00", "31-9092.00", "29-2042.00"],  # Combat Medic
                "25B": ["15-1211.00", "15-1212.00", "15-1231.00"],  # IT Specialist
                "92Y": ["43-5071.00", "11-3071.00", "13-1081.00"],  # Supply
            }
            
            return mock_crosswalk.get(military_code, [])
            
        except Exception as e:
            logger.error(f"Crosswalk error: {e}")
            return None
    
    @tracer.capture_method
    def _get_occupation_details(self, soc_code: str, state: str) -> Optional[Dict[str, Any]]:
        """Get detailed occupation data including salary for state"""
        try:
            # Get occupation details
            url = f"{self.base_url}/occupations/{soc_code}"
            response = self.session.get(url)
            response.raise_for_status()
            
            occupation_data = response.json()
            
            # Get state-specific salary data
            # Real implementation would use BLS or O*NET wage data
            # Mock salary data for now
            salary_data = self._get_state_salary(soc_code, state)
            
            return {
                'soc': soc_code,
                'title': occupation_data.get('title', 'Unknown'),
                'description': occupation_data.get('description', ''),
                'median_salary': salary_data.get('median', 50000),
                'tasks': occupation_data.get('tasks', [])[:3],  # Top 3 tasks
                'skills': occupation_data.get('skills', [])[:5],  # Top 5 skills
            }
            
        except Exception as e:
            logger.error(f"Error getting occupation details: {e}")
            return None
    
    def _get_state_salary(self, soc_code: str, state: str) -> Dict[str, int]:
        """Get state-specific salary data"""
        # Mock implementation - real would query BLS or O*NET wage data
        base_salaries = {
            "11-1011.00": 130000,  # Chief Executives
            "15-1211.00": 95000,   # Computer Systems Analysts
            "29-2041.00": 48000,   # Emergency Medical Technicians
            "33-3051.01": 52000,   # Police Patrol Officers
        }
        
        # State cost-of-living adjustment (mock)
        state_multipliers = {
            "CA": 1.3, "NY": 1.25, "TX": 0.95, "FL": 0.90,
            "WA": 1.15, "CO": 1.1, "VA": 1.05
        }
        
        base = base_salaries.get(soc_code, 50000)
        multiplier = state_multipliers.get(state, 1.0)
        
        return {
            'median': int(base * multiplier),
            'percentile_25': int(base * multiplier * 0.8),
            'percentile_75': int(base * multiplier * 1.2)
        }
    
    def _get_cached_data(self, military_code: str, state: str) -> Optional[Dict[str, Any]]:
        """Get cached O*NET data from S3"""
        try:
            s3 = boto3.client('s3')
            bucket = os.environ.get('CACHE_BUCKET', f'vetroi-onet-cache-{boto3.client("sts").get_caller_identity()["Account"]}')
            key = f"cache/{military_code}/{state}.json"
            
            response = s3.get_object(Bucket=bucket, Key=key)
            return json.loads(response['Body'].read())
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                return None
            logger.error(f"Error reading cache: {e}")
            return None
    
    def _cache_data(self, military_code: str, state: str, data: list):
        """Cache O*NET data to S3"""
        try:
            s3 = boto3.client('s3')
            bucket = os.environ.get('CACHE_BUCKET', f'vetroi-onet-cache-{boto3.client("sts").get_caller_identity()["Account"]}')
            key = f"cache/{military_code}/{state}.json"
            
            cache_data = {
                'military_code': military_code,
                'state': state,
                'careers': data,
                'cached_at': datetime.utcnow().isoformat()
            }
            
            s3.put_object(
                Bucket=bucket,
                Key=key,
                Body=json.dumps(cache_data),
                ContentType='application/json'
            )
            
        except Exception as e:
            logger.error(f"Error caching data: {e}")
    
    def _get_fallback_careers(self, state: str) -> Dict[str, Any]:
        """Get fallback careers when O*NET is unavailable"""
        return {
            'military_code': 'FALLBACK',
            'careers': [
                {
                    'soc': '11-9199.00',
                    'title': 'Project Manager',
                    'description': 'Plan, direct, or coordinate activities in various fields',
                    'median_salary': 85000,
                    'tasks': ['Coordinate project activities', 'Monitor progress', 'Manage resources'],
                    'skills': ['Leadership', 'Communication', 'Problem Solving']
                },
                {
                    'soc': '13-1071.00',
                    'title': 'Human Resources Specialist',
                    'description': 'Recruit, screen, interview, or place individuals within an organization',
                    'median_salary': 65000,
                    'tasks': ['Screen candidates', 'Conduct interviews', 'Process paperwork'],
                    'skills': ['Communication', 'Organization', 'Attention to Detail']
                }
            ]
        }