"""
O*NET Web Services API Client for VetROI™
Integrates real-time career data from the U.S. Department of Labor
"""

import json
import urllib3
import base64
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

class ONetClient:
    """Client for interacting with O*NET Web Services API"""
    
    def __init__(self, username: str, password: str):
        """
        Initialize O*NET client with API credentials
        
        Args:
            username: O*NET Web Services username
            password: O*NET Web Services password
        """
        self.base_url = "https://services.onetcenter.org/ws"
        self.http = urllib3.PoolManager()
        
        # Create basic auth header
        credentials = f"{username}:{password}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        self.headers = {
            'Authorization': f'Basic {encoded_credentials}',
            'Accept': 'application/json',
            'User-Agent': 'VetROI/1.0 (https://vetroi.altivum.ai)'
        }
        
        # Cache for API responses (in-memory for Lambda)
        self.cache = {}
        self.cache_ttl = timedelta(hours=24)
    
    def _get_cached_or_fetch(self, endpoint: str, params: Dict[str, str] = None) -> Dict:
        """Check cache before making API call"""
        cache_key = f"{endpoint}:{json.dumps(params or {}, sort_keys=True)}"
        
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if datetime.now() - cached_time < self.cache_ttl:
                return cached_data
        
        # Make API call
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.http.request(
                'GET',
                url,
                headers=self.headers,
                fields=params
            )
            
            if response.status == 200:
                data = json.loads(response.data.decode('utf-8'))
                self.cache[cache_key] = (data, datetime.now())
                return data
            else:
                print(f"O*NET API error: {response.status} - {response.data}")
                return {}
                
        except Exception as e:
            print(f"O*NET API exception: {str(e)}")
            return {}
    
    def search_careers(self, keyword: str, limit: int = 10) -> List[Dict]:
        """
        Search for careers by keyword
        
        Args:
            keyword: Search term (e.g., "project manager", "logistics")
            limit: Maximum number of results
            
        Returns:
            List of career matches with basic info
        """
        endpoint = "/online/search"
        params = {
            'keyword': keyword,
            'start': '1',
            'end': str(limit)
        }
        
        result = self._get_cached_or_fetch(endpoint, params)
        return result.get('occupation', [])
    
    def get_career_details(self, onet_soc: str) -> Dict:
        """
        Get detailed information about a specific career
        
        Args:
            onet_soc: O*NET-SOC code (e.g., "11-1021.00")
            
        Returns:
            Detailed career information including tasks, skills, etc.
        """
        endpoint = f"/online/occupations/{onet_soc}"
        return self._get_cached_or_fetch(endpoint)
    
    def get_career_outlook(self, onet_soc: str) -> Dict:
        """
        Get job outlook data for a career
        
        Args:
            onet_soc: O*NET-SOC code
            
        Returns:
            Career outlook including growth projections
        """
        endpoint = f"/online/occupations/{onet_soc}/job_outlook"
        return self._get_cached_or_fetch(endpoint)
    
    def get_salary_data(self, onet_soc: str) -> Dict:
        """
        Get salary information for a career
        
        Args:
            onet_soc: O*NET-SOC code
            
        Returns:
            Salary data including median, percentiles
        """
        # Note: O*NET doesn't provide state-specific salary data
        # We'll need to supplement with BLS data in the future
        endpoint = f"/online/occupations/{onet_soc}/summary/wages_employment"
        return self._get_cached_or_fetch(endpoint)
    
    def get_military_crosswalk(self, military_code: str) -> List[Dict]:
        """
        Find civilian careers that match military experience
        
        Args:
            military_code: Military code (MOS, Rate, AFSC)
            
        Returns:
            List of matching civilian careers
        """
        # O*NET has limited military crosswalk data
        # This is a simplified implementation
        # In production, we'd use a more comprehensive crosswalk database
        
        # Map common military roles to search terms
        military_keywords = {
            '11B': 'security management operations',
            '11C': 'operations management logistics',
            '25B': 'information technology network',
            '35S': 'intelligence analyst research',
            '42A': 'human resources administration',
            '68W': 'emergency medical healthcare',
            '88M': 'transportation logistics driver',
            '92Y': 'supply chain logistics inventory'
        }
        
        # Get keywords for this MOS or use the code itself
        keywords = military_keywords.get(military_code.upper(), military_code)
        
        # Search for related careers
        careers = []
        for keyword in keywords.split():
            careers.extend(self.search_careers(keyword, limit=5))
        
        # Remove duplicates and return
        seen = set()
        unique_careers = []
        for career in careers:
            if career.get('code') not in seen:
                seen.add(career.get('code'))
                unique_careers.append(career)
        
        return unique_careers[:10]  # Top 10 matches

    def format_career_for_ai(self, career_data: Dict) -> str:
        """
        Format career data for inclusion in AI prompts
        
        Args:
            career_data: Raw career data from O*NET
            
        Returns:
            Formatted string for AI context
        """
        title = career_data.get('title', 'Unknown')
        code = career_data.get('code', '')
        description = career_data.get('description', '')
        
        # Get additional details if available
        tasks = career_data.get('tasks', [])
        skills = career_data.get('skills', [])
        
        formatted = f"Career: {title} (O*NET-SOC: {code})\n"
        formatted += f"Description: {description}\n"
        
        if tasks:
            formatted += f"Key Tasks: {', '.join([t.get('statement', '') for t in tasks[:3]])}\n"
        
        if skills:
            formatted += f"Required Skills: {', '.join([s.get('name', '') for s in skills[:5]])}\n"
        
        return formatted


# Example usage in Lambda
def enhance_ai_response_with_onet(veteran_profile: Dict, onet_client: ONetClient) -> str:
    """
    Enhance AI prompts with real O*NET data
    
    Args:
        veteran_profile: Veteran's profile data
        onet_client: Initialized O*NET client
        
    Returns:
        Enhanced context for AI prompt
    """
    military_code = veteran_profile.get('code', '')
    
    # Get matching civilian careers
    careers = onet_client.get_military_crosswalk(military_code)
    
    if not careers:
        return ""
    
    context = "\n\nREAL CAREER DATA FROM O*NET:\n"
    
    for i, career in enumerate(careers[:5], 1):
        career_code = career.get('code', '')
        if career_code:
            # Get detailed info
            details = onet_client.get_career_details(career_code)
            if details:
                context += f"\n{i}. {onet_client.format_career_for_ai(details)}"
    
    context += "\n\nUse this O*NET data to provide specific, data-driven career recommendations."
    
    return context