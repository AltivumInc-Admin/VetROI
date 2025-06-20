# Enhanced DD214 AI Prompts for VetROI
# This module contains the advanced prompts for generating transformative veteran insights

COMPREHENSIVE_DD214_ANALYSIS_PROMPT = """
You are an elite military transition strategist with deep expertise in translating military experience into civilian career success. You understand the nuances of military culture, the hidden value in military roles, and how to position veterans for maximum career impact.

ANALYSIS FRAMEWORK:

1. DEEP PROFILE EXTRACTION
Extract and interpret these elements from the DD214:
- Service timeline and progression (what does their advancement rate say?)
- Combat indicators (deployments, combat badges, hazardous duty)
- Leadership progression (NCO/Officer timeline)
- Technical depth (schools, additional duties, special qualifications)
- Character indicators (awards for valor vs achievement vs service)
- Clearance implications (what their MOS suggests about trust level)

2. HIDDEN TALENT IDENTIFICATION
Look beyond the obvious to identify:
- Crisis management capability (from deployment patterns)
- Cross-cultural competence (overseas service, language training)
- Security awareness (clearance level + handling classified)
- Budget management (supply roles often manage millions)
- Training/mentorship ability (NCO development responsibilities)
- Innovation under constraints (making do with limited resources)

3. CIVILIAN CAREER INTELLIGENCE
Generate specific, actionable career paths with:
- Exact job titles that value military experience
- Companies known to hire from this MOS/branch
- Certifications that complement military training
- Salary ranges adjusted for clearance premiums
- Geographic hotspots for veteran hiring

4. QUANTIFIED ACHIEVEMENTS
Transform military accomplishments into metrics:
- Team sizes led → "Managed cross-functional teams of 30+"
- Equipment value → "Responsible for $2.5M in assets"
- Operational tempo → "Sustained 98% readiness during 12-month deployment"
- Training delivered → "Developed and delivered training to 200+ personnel"

5. STRATEGIC POSITIONING
Create narratives that resonate with civilian employers:
- Leadership philosophy developed through service
- Problem-solving examples from military experience
- Adaptability demonstrated through diverse assignments
- Results-oriented mindset from mission focus

DOCUMENT TO ANALYZE:
{redacted_dd214_text}

DELIVERABLE FORMAT:
{{
  "veteran_intelligence": {{
    "executive_summary": "2-3 sentence high-impact summary of this veteran's unique value proposition",
    
    "service_analysis": {{
      "rank_progression": "Analysis of advancement speed and what it indicates",
      "leadership_tier": "Entry/Team Lead/Manager/Director/Executive equivalent",
      "technical_depth": "Specialist/Generalist/Expert classification with evidence",
      "operational_experience": "Combat/Support/Strategic with implications",
      "clearance_value": "Estimated clearance level and market premium ($X additional)"
    }},
    
    "hidden_strengths": [
      {{
        "strength": "Specific capability often overlooked",
        "evidence": "What in their record proves this",
        "civilian_value": "Why employers should care"
      }}
    ],
    
    "career_paths": [
      {{
        "title": "Specific job title",
        "fit_score": 95,
        "reasoning": "Why this is an exceptional match",
        "companies": ["Company 1", "Company 2", "Company 3"],
        "entry_salary": "$X",
        "cleared_salary": "$X+30%",
        "progression": "Typical 5-year career progression",
        "first_steps": "Immediate actions to pursue this path"
      }}
    ],
    
    "market_differentiators": [
      "What makes this veteran stand out from other candidates"
    ],
    
    "achievement_translations": [
      {{
        "military": "Original military accomplishment",
        "civilian": "Powerful civilian translation",
        "impact": "Quantified business impact"
      }}
    ],
    
    "90_day_action_plan": {{
      "immediate": ["Week 1-2 priorities"],
      "short_term": ["Week 3-8 skill building"],
      "positioning": ["Week 9-12 market entry"]
    }},
    
    "interview_arsenal": {{
      "elevator_pitch": "30-second personal brand statement",
      "leadership_story": "STAR format story showcasing leadership",
      "problem_solving_story": "STAR format story showcasing analytical skills",
      "teamwork_story": "STAR format story showcasing collaboration",
      "adversity_story": "STAR format story showcasing resilience",
      "questions_to_ask": ["Thoughtful questions that show business acumen"]
    }},
    
    "compensation_intelligence": {{
      "base_range": "$X - $Y",
      "clearance_premium": "+$X",
      "location_adjustments": {{"City": "±%"}},
      "negotiation_leverage": ["Your unique points of leverage"],
      "total_comp_potential": "$X - $Y including benefits"
    }},
    
    "network_activation": {{
      "linkedin_headline": "Compelling 120-character headline",
      "linkedin_summary": "First paragraph of LinkedIn summary that hooks readers",
      "target_connections": [
        {{
          "title": "Who to connect with",
          "reason": "Why they're valuable",
          "approach": "How to reach out"
        }}
      ],
      "veteran_groups": ["Specific groups to join"],
      "industry_associations": ["Professional associations to pursue"]
    }},
    
    "skill_gaps_roadmap": {{
      "critical_gaps": [
        {{
          "skill": "What's missing",
          "importance": "Why it matters",
          "timeline": "How long to acquire",
          "resources": ["Specific courses/certs/programs"],
          "gi_bill_eligible": true
        }}
      ],
      "nice_to_have": ["Secondary skills that add value"],
      "leverage_existing": ["Military skills that transfer directly"]
    }},
    
    "transition_confidence": {{
      "strengths_validation": ["Specific evidence of your market value"],
      "imposter_syndrome_counters": ["Proof you belong in civilian roles"],
      "success_indicators": ["Why you're positioned to succeed"],
      "support_resources": ["Veteran-specific resources for transition"]
    }},
    
    "risk_mitigation": {{
      "common_pitfalls": ["What to avoid in transition"],
      "bias_navigation": ["How to handle civilian misconceptions"],
      "backup_plans": ["Alternative paths if primary doesn't work"]
    }}
  }}
}}

IMPORTANT INSTRUCTIONS:
1. Be SPECIFIC - use actual company names, exact salary figures, real certification names
2. Be ACTIONABLE - every recommendation should have a clear next step
3. Be CONFIDENT - help the veteran see their true value
4. Be COMPREHENSIVE - this may be their only professional guidance
5. Focus on HIDDEN VALUE - surface strengths they don't know they have
"""

MOS_SPECIFIC_ENHANCEMENTS = {
    "11B": {  # Infantry
        "hidden_strengths": [
            "Operates effectively with minimal resources",
            "Rapid decision-making under extreme pressure",
            "Physical and mental resilience",
            "Team cohesion in diverse groups"
        ],
        "civilian_translations": {
            "squad_leader": "First-line supervisor managing 9-12 direct reports",
            "platoon_sergeant": "Operations manager overseeing 30-40 personnel",
            "combat_patrol": "High-risk project management with zero failure tolerance"
        },
        "target_industries": ["Security", "Law Enforcement", "Project Management", "Operations", "Logistics"]
    },
    
    "68W": {  # Combat Medic
        "hidden_strengths": [
            "Triage and prioritization under pressure",
            "Medical care with limited resources",
            "Training and certifying others",
            "Calm presence in chaos"
        ],
        "civilian_translations": {
            "combat_medic": "Emergency medical provider with advanced trauma training",
            "medical_training": "Healthcare educator and clinical instructor",
            "field_medicine": "Remote/austere medicine specialist"
        },
        "target_industries": ["Healthcare", "Emergency Services", "Medical Device", "Pharmaceutical", "Public Health"]
    },
    
    "25B": {  # Information Technology Specialist
        "hidden_strengths": [
            "Cybersecurity in hostile environments",
            "Network operations under attack",
            "Classified systems management",
            "Rapid technology deployment"
        ],
        "civilian_translations": {
            "network_admin": "IT infrastructure manager with security clearance",
            "cyber_defense": "Cybersecurity analyst with combat-tested experience",
            "comms_chief": "IT operations manager for mission-critical systems"
        },
        "target_industries": ["Cybersecurity", "Cloud Computing", "Defense Contractors", "Financial Services", "Healthcare IT"]
    },
    
    "18 Series": {  # Special Forces
        "hidden_strengths": [
            "Unconventional problem solving",
            "Cross-cultural relationship building",
            "Operating independently with minimal supervision",
            "Training indigenous forces",
            "Language capabilities"
        ],
        "civilian_translations": {
            "team_leader": "Executive-level strategic operations leader",
            "foreign_internal_defense": "International business development and partnerships",
            "unconventional_warfare": "Disruption strategy and innovation leadership"
        ],
        "target_industries": ["Executive Leadership", "International Business", "Security Consulting", "Medical Device", "Strategic Consulting"]
    }
}

RANK_TO_LEADERSHIP_MAPPING = {
    # Enlisted
    "E-1": {"level": "Entry", "civilian": "Individual Contributor", "years_experience": "0-1"},
    "E-2": {"level": "Entry", "civilian": "Individual Contributor", "years_experience": "0-2"},
    "E-3": {"level": "Entry", "civilian": "Individual Contributor", "years_experience": "1-3"},
    "E-4": {"level": "Team Lead", "civilian": "Team Lead/Senior Individual", "years_experience": "2-4"},
    "E-5": {"level": "Supervisor", "civilian": "Supervisor/Team Manager", "years_experience": "4-6"},
    "E-6": {"level": "Manager", "civilian": "Manager/Department Lead", "years_experience": "6-10"},
    "E-7": {"level": "Senior Manager", "civilian": "Senior Manager/Operations Manager", "years_experience": "10-15"},
    "E-8": {"level": "Director", "civilian": "Director/Site Manager", "years_experience": "15-20"},
    "E-9": {"level": "Executive", "civilian": "VP/Executive Director", "years_experience": "20+"},
    
    # Warrant Officers
    "W-1": {"level": "Technical Expert", "civilian": "Senior Technical Specialist", "years_experience": "Varies"},
    "W-2": {"level": "Senior Expert", "civilian": "Principal Technical Expert", "years_experience": "Varies"},
    "W-3": {"level": "Master Expert", "civilian": "Chief Technical Officer", "years_experience": "Varies"},
    "W-4": {"level": "Senior Master", "civilian": "VP Technical Operations", "years_experience": "Varies"},
    "W-5": {"level": "Chief Expert", "civilian": "Chief Technology Officer", "years_experience": "Varies"},
    
    # Officers
    "O-1": {"level": "Entry Manager", "civilian": "Management Trainee", "years_experience": "0-2"},
    "O-2": {"level": "Team Manager", "civilian": "Assistant Manager", "years_experience": "2-4"},
    "O-3": {"level": "Department Manager", "civilian": "Manager/Department Head", "years_experience": "4-8"},
    "O-4": {"level": "Senior Manager", "civilian": "Senior Manager/Assistant Director", "years_experience": "10-15"},
    "O-5": {"level": "Director", "civilian": "Director/VP", "years_experience": "15-20"},
    "O-6": {"level": "Senior Director", "civilian": "Senior VP/Executive Director", "years_experience": "20-25"},
    "O-7": {"level": "Executive", "civilian": "EVP/President", "years_experience": "25+"},
    "O-8": {"level": "Senior Executive", "civilian": "President/CEO", "years_experience": "25+"},
    "O-9": {"level": "C-Suite", "civilian": "CEO/President", "years_experience": "30+"},
    "O-10": {"level": "C-Suite", "civilian": "CEO/Chairman", "years_experience": "30+"}
}

CLEARANCE_VALUE_MATRIX = {
    "Secret": {
        "premium": "$10,000 - $15,000",
        "industries": ["Defense", "Federal Contracting", "Cybersecurity", "Aerospace"],
        "value_prop": "Saves employers 6-12 months and $3,000-$5,000 in clearance processing"
    },
    "Top Secret": {
        "premium": "$15,000 - $25,000",
        "industries": ["Intelligence", "Defense", "Cybersecurity", "Federal IT"],
        "value_prop": "Saves employers 12-18 months and $5,000-$15,000 in clearance processing"
    },
    "Top Secret/SCI": {
        "premium": "$25,000 - $40,000",
        "industries": ["Intelligence Community", "Special Programs", "Cyber Operations"],
        "value_prop": "Provides immediate access to classified programs, saving 18-24 months"
    }
}

DEPLOYMENT_VALUE_TRANSLATION = {
    "combat_deployment": {
        "skills": ["Crisis management", "Decision under pressure", "Resource optimization", "Cross-cultural operations"],
        "value": "Proven ability to maintain operations in highest-stress environments"
    },
    "humanitarian_deployment": {
        "skills": ["Stakeholder management", "Community relations", "Project management", "Cultural sensitivity"],
        "value": "Experience building partnerships and delivering results in complex environments"
    },
    "training_deployment": {
        "skills": ["Knowledge transfer", "Curriculum development", "Cross-cultural training", "Capacity building"],
        "value": "Demonstrated ability to develop others and build organizational capability"
    }
}

def get_specialized_prompt(mos_code: str, rank: str, branch: str) -> str:
    """
    Generate specialized prompts based on MOS, rank, and branch
    """
    base_prompt = COMPREHENSIVE_DD214_ANALYSIS_PROMPT
    
    # Add MOS-specific enhancements
    if mos_code in MOS_SPECIFIC_ENHANCEMENTS:
        mos_data = MOS_SPECIFIC_ENHANCEMENTS[mos_code]
        enhancement = f"""
SPECIAL FOCUS FOR {mos_code}:
Hidden Strengths: {', '.join(mos_data['hidden_strengths'])}
Target Industries: {', '.join(mos_data['target_industries'])}
Translation Guide: {mos_data['civilian_translations']}
"""
        base_prompt = base_prompt.replace("DELIVERABLE FORMAT:", f"{enhancement}\nDELIVERABLE FORMAT:")
    
    # Add rank-specific leadership context
    if rank in RANK_TO_LEADERSHIP_MAPPING:
        rank_data = RANK_TO_LEADERSHIP_MAPPING[rank]
        rank_context = f"""
LEADERSHIP CONTEXT FOR {rank}:
Leadership Level: {rank_data['level']}
Civilian Equivalent: {rank_data['civilian']}
Years of Experience: {rank_data['years_experience']}
"""
        base_prompt = base_prompt.replace("DELIVERABLE FORMAT:", f"{rank_context}\nDELIVERABLE FORMAT:")
    
    return base_prompt

def get_interview_prep_prompt(veteran_profile: dict, target_company: str, target_role: str) -> str:
    """
    Generate interview preparation specific to company and role
    """
    return f"""
You are preparing a veteran for a specific interview opportunity.

VETERAN PROFILE:
{veteran_profile}

TARGET POSITION:
Company: {target_company}
Role: {target_role}

Generate comprehensive interview preparation including:

1. COMPANY RESEARCH BRIEF
- Why this company values veterans
- Recent news/initiatives relevant to role
- Company culture fit with military background
- Key executives to know about

2. ROLE-SPECIFIC PREPARATION
- How military experience maps to job requirements
- Technical skills to emphasize
- Potential concerns to address proactively
- Salary range and negotiation points

3. BEHAVIORAL INTERVIEW ANSWERS (STAR Format)
Generate 5 answers to common questions:
- "Tell me about a time you led a team through change"
- "Describe a situation where you had to work with limited resources"
- "Give an example of when you had to learn something quickly"
- "Tell me about a time you failed and what you learned"
- "Describe your most challenging project"

4. TECHNICAL DEMONSTRATION
- How to demonstrate technical competence
- Military projects that showcase relevant skills
- Metrics and outcomes to highlight

5. QUESTIONS TO ASK
- 5 thoughtful questions specific to this company/role
- Questions that demonstrate research and strategic thinking

6. CLOSING STRATEGY
- How to reinforce fit in closing
- Next steps to request
- Follow-up timeline

Format as actionable preparation guide with specific examples.
"""

def get_salary_negotiation_prompt(veteran_profile: dict, job_offer: dict) -> str:
    """
    Generate salary negotiation strategy based on veteran's unique value
    """
    return f"""
You are a salary negotiation expert for veterans. Create a comprehensive negotiation strategy.

VETERAN PROFILE:
{veteran_profile}

JOB OFFER:
{job_offer}

Generate negotiation strategy including:

1. MARKET ANALYSIS
- Base salary range for role/location
- Clearance premium calculation
- Military experience premium
- Total compensation valuation

2. UNIQUE VALUE PROPOSITIONS
- Quantified military achievements
- Cost savings from clearance
- Leadership experience premium
- Technical skills market value

3. NEGOTIATION SCRIPT
- Initial counter-offer language
- Responses to common pushbacks
- Non-salary negotiation points
- Win-win positioning

4. BATNA (Best Alternative)
- Minimum acceptable offer
- Walk-away points
- Alternative opportunities

5. NEGOTIATION TIMELINE
- When to negotiate
- How many rounds
- Decision timeline

Provide specific numbers and exact language to use.
"""