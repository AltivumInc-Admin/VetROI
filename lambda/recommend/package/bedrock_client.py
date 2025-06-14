import os
import json
from typing import List, Dict, Any

import boto3
from aws_lambda_powertools import Logger, Tracer
from botocore.exceptions import ClientError

from .models import VeteranRequest, Career

logger = Logger()
tracer = Tracer()


class BedrockClient:
    """Client for Amazon Bedrock LLM interactions"""
    
    def __init__(self):
        self.client = boto3.client('bedrock-runtime')
        self.model_id = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-sonnet-20240229')
    
    @tracer.capture_method
    def generate_recommendations(self, request: VeteranRequest, onet_data: Dict[str, Any]) -> List[Career]:
        """
        Generate career recommendations using Bedrock LLM
        
        Args:
            request: Veteran profile request
            onet_data: O*NET career data
            
        Returns:
            List of recommended careers
        """
        try:
            # Build the prompt
            prompt = self._build_prompt(request, onet_data)
            
            # Call Bedrock
            response = self._invoke_bedrock(prompt)
            
            # Parse response into Career objects
            careers = self._parse_response(response)
            
            return careers[:5]  # Ensure we return exactly 5
            
        except Exception as e:
            logger.error(f"Bedrock generation error: {e}")
            # Return fallback recommendations
            return self._get_fallback_recommendations(request)
    
    def _build_prompt(self, request: VeteranRequest, onet_data: Dict[str, Any]) -> str:
        """Build the prompt for Bedrock"""
        
        state_pref = request.relocateState if request.relocate else request.homeState
        reloc_clause = f"to {request.relocateState}" if request.relocate else "in current location"
        
        # Extract skills if provided
        skills_list = ", ".join(request.skills) if request.skills else "Not specified"
        
        # Format O*NET data
        onet_snippet = self._format_onet_data(onet_data)
        
        prompt = f"""System: You are VetROI, an employment transition expert for U.S. military veterans.

User profile:
- Branch: {request.branch.value}
- Job Code: {request.code}
- State Preference: {state_pref}
- Education: {request.education.value.replace('_', ' ').title()}
- Relocation: {'Yes' if request.relocate else 'No'} {reloc_clause}
- Extracted DD-214 skills: {skills_list}
- Security Clearance: {request.clearance or 'None specified'}

O*NET data:
{onet_snippet}

Task: Recommend the FIVE best-fit civilian careers. For each, give:
1. SOC code & title
2. Why it matches the veteran's skills
3. Expected median salary in {state_pref}
4. 1-sentence next-step advice

Format your response as a JSON array with exactly 5 objects, each containing:
- "title": career title
- "soc": SOC code
- "summary": 2-3 sentence career description
- "medianSalary": salary as integer
- "matchReason": why this matches their background
- "nextStep": actionable next step

Limit to 120 words per career. Write in second person."""
        
        return prompt
    
    def _format_onet_data(self, onet_data: Dict[str, Any]) -> str:
        """Format O*NET data for the prompt"""
        careers = onet_data.get('careers', [])
        
        if not careers:
            return "No direct O*NET matches found. Please provide general recommendations."
        
        formatted = []
        for career in careers[:3]:  # Top 3 matches
            formatted.append(f"""
Career: {career.get('title', 'Unknown')} (SOC: {career.get('soc', 'N/A')})
Description: {career.get('description', 'N/A')}
Median Salary: ${career.get('median_salary', 0):,}
Key Tasks: {', '.join(career.get('tasks', [])[:2])}
Key Skills: {', '.join(career.get('skills', [])[:3])}
""")
        
        return "\n".join(formatted)
    
    @tracer.capture_method
    def _invoke_bedrock(self, prompt: str) -> str:
        """Invoke Bedrock model"""
        try:
            # Prepare the request based on model type
            if 'claude' in self.model_id:
                request_body = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 2000,
                    "temperature": 0.7,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                }
            else:
                # Generic format for other models
                request_body = {
                    "prompt": prompt,
                    "max_tokens": 2000,
                    "temperature": 0.7
                }
            
            response = self.client.invoke_model(
                modelId=self.model_id,
                contentType='application/json',
                accept='application/json',
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            
            # Extract text based on model response format
            if 'claude' in self.model_id:
                return response_body['content'][0]['text']
            else:
                return response_body.get('completion', response_body.get('text', ''))
                
        except ClientError as e:
            logger.error(f"Bedrock invocation error: {e}")
            raise
    
    def _parse_response(self, response_text: str) -> List[Career]:
        """Parse Bedrock response into Career objects"""
        try:
            # Try to extract JSON from the response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                careers_data = json.loads(json_str)
            else:
                # If no JSON array found, try to parse the entire response
                careers_data = json.loads(response_text)
            
            careers = []
            for career_data in careers_data:
                career = Career(
                    title=career_data.get('title', 'Unknown'),
                    soc=career_data.get('soc', '00-0000.00'),
                    summary=career_data.get('summary', 'No description available'),
                    medianSalary=career_data.get('medianSalary', 50000),
                    matchReason=career_data.get('matchReason', 'Matches military experience'),
                    nextStep=career_data.get('nextStep', 'Research this career further')
                )
                careers.append(career)
            
            return careers
            
        except Exception as e:
            logger.error(f"Error parsing Bedrock response: {e}")
            logger.error(f"Response text: {response_text[:500]}")
            return []
    
    def _get_fallback_recommendations(self, request: VeteranRequest) -> List[Career]:
        """Get fallback recommendations when Bedrock fails"""
        
        # Base recommendations by education level
        education_careers = {
            'high_school': [
                ('Transportation Manager', '11-3071.00', 75000),
                ('Sales Representative', '41-4011.00', 60000),
            ],
            'associate': [
                ('Network Administrator', '15-1244.00', 85000),
                ('Logistics Coordinator', '13-1081.00', 70000),
            ],
            'bachelor': [
                ('Project Manager', '11-9199.00', 95000),
                ('Operations Manager', '11-1021.00', 105000),
            ],
            'master': [
                ('Management Analyst', '13-1111.00', 95000),
                ('Information Security Analyst', '15-1212.00', 115000),
            ],
            'doctorate': [
                ('Research Director', '19-3011.00', 130000),
                ('Chief Executive', '11-1011.00', 185000),
            ]
        }
        
        base_careers = education_careers.get(request.education.value, education_careers['bachelor'])
        
        careers = []
        for i, (title, soc, salary) in enumerate(base_careers[:5]):
            careers.append(Career(
                title=title,
                soc=soc,
                summary=f"This role leverages your military leadership and {request.education.value.replace('_', ' ')} education.",
                medianSalary=salary,
                matchReason="Your military experience provides excellent preparation for this civilian role.",
                nextStep="Update your resume to highlight relevant military experience for this position."
            ))
        
        # Add generic recommendations to fill to 5
        while len(careers) < 5:
            careers.append(Career(
                title="General Manager",
                soc="11-1021.00",
                summary="Oversee operations and lead teams in various industries.",
                medianSalary=85000,
                matchReason="Military leadership translates directly to civilian management.",
                nextStep="Consider industry-specific certifications to enhance your qualifications."
            ))
        
        return careers[:5]