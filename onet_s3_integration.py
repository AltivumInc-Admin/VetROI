"""
Enhanced O*NET integration with S3 career data cache
Provides two-stage lookup: MOS crosswalk → Detailed SOC data
"""

import json
import boto3
from typing import Dict, List, Optional, Any
from datetime import datetime
from onet_client import ONetClient

class VetROICareerIntelligence:
    """Enhanced career intelligence system combining O*NET API and S3 cache"""
    
    def __init__(self, onet_client: ONetClient, s3_bucket: str = "altroi-data"):
        self.onet = onet_client
        self.s3_bucket = s3_bucket
        self.s3 = boto3.client('s3')
        
    def get_military_crosswalk(self, military_code: str) -> Dict[str, Any]:
        """
        Stage 1: Get all civilian careers matching a military code
        
        Args:
            military_code: MOS, NEC, AFSC, Rate (e.g., "18D")
            
        Returns:
            Crosswalk data with career matches
        """
        # Use O*NET military crosswalk endpoint
        endpoint = f"/online/crosswalks/military"
        params = {'keyword': military_code}
        
        try:
            result = self.onet._get_cached_or_fetch(endpoint, params)
            
            if result and 'match' in result:
                # Process matches to extract key info
                matches = result['match'][0] if result['match'] else {}
                careers = matches.get('occupations', {}).get('occupation', [])
                
                # Sort by bright outlook first
                careers_sorted = sorted(
                    careers,
                    key=lambda x: (
                        x.get('tags', {}).get('bright_outlook', False),
                        x.get('title', '')
                    ),
                    reverse=True
                )
                
                return {
                    'military_code': military_code,
                    'military_title': matches.get('title', ''),
                    'total_matches': len(careers),
                    'careers': careers_sorted
                }
            
        except Exception as e:
            print(f"Error fetching military crosswalk: {e}")
            
        return {'military_code': military_code, 'careers': []}
    
    def get_detailed_career_data(self, soc_code: str) -> Optional[Dict[str, Any]]:
        """
        Stage 2: Get detailed career data from S3 cache
        
        Args:
            soc_code: O*NET-SOC code (e.g., "29-1141.00")
            
        Returns:
            Comprehensive career data including salary, skills, outlook
        """
        # Fetch from S3
        key = f"soc-details/{soc_code}.json"
        
        try:
            response = self.s3.get_object(Bucket=self.s3_bucket, Key=key)
            data = json.loads(response['Body'].read())
            return data
            
        except self.s3.exceptions.NoSuchKey:
            print(f"No S3 data for SOC {soc_code}, falling back to O*NET API")
            # Fallback to direct O*NET API call
            return self.onet.get_career_details(soc_code)
            
        except Exception as e:
            print(f"Error fetching S3 data: {e}")
            return None
    
    def analyze_career_fit(self, veteran_profile: Dict, career_data: Dict) -> Dict[str, Any]:
        """
        Analyze how well a career fits a veteran's profile
        
        Args:
            veteran_profile: Veteran's input data
            career_data: Detailed career data from S3
            
        Returns:
            Fit analysis with recommendations
        """
        analysis = {
            'career_title': career_data.get('title', ''),
            'soc_code': career_data.get('soc', ''),
            'fit_score': 0,
            'strengths': [],
            'gaps': [],
            'recommendations': []
        }
        
        # Extract key data
        report = career_data.get('data', {}).get('report_raw', {})
        job_outlook = report.get('job_outlook', {})
        education = report.get('education', {})
        personality = report.get('personality', {})
        
        # Analyze salary for veteran's state
        if job_outlook:
            salary = job_outlook.get('salary', {})
            analysis['salary_data'] = {
                'national_median': salary.get('annual_median', 0),
                'entry_level': salary.get('annual_10th_percentile', 0),
                'experienced': salary.get('annual_90th_percentile', 0),
                'hourly_median': salary.get('hourly_median', 0)
            }
        
        # Check state employment outlook
        state = veteran_profile.get('homeState', 'TX')
        state_data = self._analyze_state_outlook(report, state)
        analysis['state_outlook'] = state_data
        
        # Education gap analysis
        veteran_ed = veteran_profile.get('education', 'high_school')
        required_ed = education.get('education_usually_needed', {}).get('category', [])
        
        if self._check_education_gap(veteran_ed, required_ed):
            analysis['gaps'].append({
                'type': 'education',
                'current': veteran_ed,
                'required': required_ed,
                'recommendation': self._get_education_recommendation(veteran_ed, required_ed)
            })
        else:
            analysis['strengths'].append('Education requirements met')
            analysis['fit_score'] += 25
        
        # Military experience match
        military_matches = career_data.get('military_service_details', [])
        if any(m['code'] == veteran_profile.get('code') for m in military_matches):
            analysis['strengths'].append('Direct military experience match')
            analysis['fit_score'] += 50
        
        # Bright outlook bonus
        if job_outlook.get('bright_outlook'):
            analysis['strengths'].append('High growth career field')
            analysis['fit_score'] += 25
            
        return analysis
    
    def _analyze_state_outlook(self, report: Dict, state: str) -> Dict[str, Any]:
        """Analyze employment outlook for specific state"""
        check_state = report.get('check_out_my_state', {})
        
        # Find state in the data
        for category in ['above_average', 'average', 'below_average']:
            states = check_state.get(category, {}).get('state', [])
            for s in states:
                if s.get('postal_code') == state:
                    return {
                        'state': state,
                        'category': category,
                        'location_quotient': s.get('location_quotient', 1.0),
                        'recommendation': self._get_state_recommendation(category)
                    }
        
        return {
            'state': state,
            'category': 'average',
            'location_quotient': 1.0,
            'recommendation': 'Average demand in your state'
        }
    
    def _get_state_recommendation(self, category: str) -> str:
        """Get recommendation based on state employment category"""
        if category == 'above_average':
            return "Excellent job market in your state - high demand for this role"
        elif category == 'below_average':
            return "Consider relocating - limited opportunities in your state"
        else:
            return "Steady job market - competitive but achievable"
    
    def _check_education_gap(self, current: str, required: List[str]) -> bool:
        """Check if veteran meets education requirements"""
        edu_levels = {
            'high_school': 1,
            'certificate after high school': 2,
            'associate': 3,
            'bachelor': 4,
            'master': 5,
            'doctorate': 6
        }
        
        current_level = edu_levels.get(current, 1)
        min_required = min(edu_levels.get(r, 4) for r in required)
        
        return current_level < min_required
    
    def _get_education_recommendation(self, current: str, required: List[str]) -> str:
        """Provide specific education pathway recommendation"""
        if 'bachelor' in str(required).lower() and current in ['high_school', 'associate']:
            return "Consider online BSN programs that credit military experience"
        elif 'certificate' in str(required).lower():
            return "Short-term certification may be all you need - check VA education benefits"
        else:
            return f"Education needed: {', '.join(required)}"
    
    def create_ai_context(self, 
                         veteran_profile: Dict,
                         crosswalk_data: Dict,
                         selected_career: Optional[Dict] = None) -> str:
        """
        Create rich context for AI based on O*NET data
        
        Args:
            veteran_profile: Veteran input data
            crosswalk_data: Military crosswalk results
            selected_career: Detailed career data if user selected one
            
        Returns:
            Enhanced context string for AI prompt
        """
        context = f"\n\nCAREER INTELLIGENCE DATA:\n"
        context += f"Military Role: {crosswalk_data.get('military_title', '')}\n"
        context += f"Total Career Matches: {crosswalk_data.get('total_matches', 0)}\n\n"
        
        if selected_career:
            # Deep dive on selected career
            report = selected_career.get('data', {}).get('report_raw', {})
            career = report.get('career', {})
            job_outlook = report.get('job_outlook', {})
            
            context += f"SELECTED CAREER: {career.get('title', '')}\n"
            context += f"What They Do: {career.get('what_they_do', '')}\n\n"
            
            # Key tasks
            tasks = career.get('on_the_job', {}).get('task', [])[:3]
            if tasks:
                context += "Key Responsibilities:\n"
                for task in tasks:
                    context += f"- {task}\n"
            
            # Salary data
            salary = job_outlook.get('salary', {})
            if salary:
                context += f"\nSALARY DATA:\n"
                context += f"- Entry Level: ${salary.get('annual_10th_percentile', 0):,}/year\n"
                context += f"- Median: ${salary.get('annual_median', 0):,}/year (${salary.get('hourly_median', 0)}/hour)\n"
                context += f"- Experienced: ${salary.get('annual_90th_percentile', 0):,}/year\n"
            
            # Fit analysis
            fit_analysis = self.analyze_career_fit(veteran_profile, selected_career)
            if fit_analysis['strengths']:
                context += f"\nSTRENGTHS: {', '.join(fit_analysis['strengths'])}\n"
            if fit_analysis['gaps']:
                context += f"\nGAPS TO ADDRESS:\n"
                for gap in fit_analysis['gaps']:
                    context += f"- {gap['recommendation']}\n"
            
            # State outlook
            state_outlook = fit_analysis.get('state_outlook', {})
            context += f"\n{state} JOB MARKET: {state_outlook.get('recommendation', '')}\n"
            
        else:
            # Show top 5 matches
            context += "TOP CAREER MATCHES:\n"
            for i, career in enumerate(crosswalk_data.get('careers', [])[:5], 1):
                tags = []
                if career.get('tags', {}).get('bright_outlook'):
                    tags.append("High Growth")
                if career.get('tags', {}).get('green'):
                    tags.append("Green Job")
                    
                tag_str = f" [{', '.join(tags)}]" if tags else ""
                context += f"{i}. {career.get('title', '')} (SOC: {career.get('code', '')}){tag_str}\n"
        
        context += "\nUse this real Department of Labor data to provide specific, actionable guidance."
        
        return context


def integrate_with_lambda(event_body: Dict, onet_client: ONetClient) -> Dict[str, Any]:
    """
    Integration function for Lambda handler
    
    Args:
        event_body: Request body from API
        onet_client: Initialized O*NET client
        
    Returns:
        Enhanced data for AI conversation
    """
    intelligence = VetROICareerIntelligence(onet_client)
    
    # Check if this is initial profile or career selection
    if 'selectedCareer' in event_body:
        # User selected a specific career
        soc_code = event_body['selectedCareer']
        career_data = intelligence.get_detailed_career_data(soc_code)
        
        return {
            'type': 'career_detail',
            'career_data': career_data,
            'ai_context': intelligence.create_ai_context(
                event_body.get('profile', {}),
                {},
                career_data
            )
        }
    
    elif event_body.get('code'):
        # Initial military code lookup
        military_code = event_body['code']
        crosswalk_data = intelligence.get_military_crosswalk(military_code)
        
        return {
            'type': 'crosswalk',
            'crosswalk_data': crosswalk_data,
            'ai_context': intelligence.create_ai_context(
                event_body,
                crosswalk_data
            )
        }
    
    return {
        'type': 'general',
        'ai_context': ''
    }