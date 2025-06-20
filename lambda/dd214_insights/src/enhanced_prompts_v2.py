"""
Enhanced AI Prompts V2 - With Dynamic Variability
This module generates truly unique insights for each DD214 analysis
"""

import random
from datetime import datetime
from typing import Dict, List, Any

# Analysis Perspectives - Each run picks one randomly
ANALYSIS_PERSPECTIVES = [
    {
        'name': 'Executive Strategist',
        'style': 'You are a former Fortune 500 CEO who now specializes in placing veterans in C-suite roles',
        'focus': 'executive potential, leadership transformation, board-level thinking',
        'tone': 'authoritative, strategic, visionary'
    },
    {
        'name': 'Tech Innovator',
        'style': 'You are a Silicon Valley veteran entrepreneur who\'s built 3 unicorns with military co-founders',
        'focus': 'startup opportunities, tech transformation, innovation potential',
        'tone': 'energetic, disruptive, future-focused'
    },
    {
        'name': 'Compensation Architect',
        'style': 'You are a compensation specialist who\'s negotiated $500M in veteran packages',
        'focus': 'maximizing total compensation, hidden benefits, wealth building',
        'tone': 'analytical, precise, wealth-focused'
    },
    {
        'name': 'Network Orchestrator',
        'style': 'You are a master networker who connects veterans to power brokers',
        'focus': 'relationship building, hidden opportunities, insider connections',
        'tone': 'connected, insider-knowledge, relationship-focused'
    },
    {
        'name': 'Risk Analyst',
        'style': 'You are a career risk analyst who helps veterans avoid transition pitfalls',
        'focus': 'avoiding career mistakes, risk mitigation, future-proofing',
        'tone': 'cautious, analytical, protective'
    }
]

# Company pools to randomize recommendations
TECH_COMPANIES = [
    'Microsoft', 'Amazon', 'Google', 'Apple', 'Meta', 'Palantir', 'Anduril', 
    'Shield AI', 'Rebellion Defense', 'Scale AI', 'DataRobot', 'C3.ai',
    'Snowflake', 'Databricks', 'GitLab', 'HashiCorp', 'Cloudflare'
]

DEFENSE_CONTRACTORS = [
    'Lockheed Martin', 'Raytheon', 'Northrop Grumman', 'General Dynamics',
    'L3Harris', 'CACI', 'SAIC', 'Booz Allen Hamilton', 'Leidos', 'Peraton',
    'BAE Systems', 'Parsons', 'KBR', 'DynCorp', 'Jacobs'
]

CONSULTING_FIRMS = [
    'McKinsey', 'BCG', 'Bain', 'Deloitte', 'Accenture', 'PwC', 'EY', 'KPMG',
    'Kearney', 'Oliver Wyman', 'Strategy&', 'AlixPartners', 'FTI Consulting'
]

STARTUPS = [
    'Series A healthtech startup', 'Stealth mode defense tech', 'YC-backed logistics platform',
    'Veteran-founded cybersecurity firm', 'AI/ML startup with DoD contracts',
    'Space technology venture', 'Autonomous systems startup', 'Quantum computing venture'
]

# Narrative styles to vary the output
NARRATIVE_STYLES = [
    'data-driven', 'story-based', 'motivational', 'tactical', 'strategic',
    'cautionary', 'aggressive', 'conservative', 'entrepreneurial', 'analytical'
]

# Time-based market conditions
def get_market_conditions():
    """Generate current market conditions to add temporal context"""
    conditions = [
        "Hot market: Defense tech funding at all-time high with $15B invested last quarter",
        "Cooling market: Big Tech hiring freezes creating opportunities in mid-market",
        "Transitional period: Traditional contractors losing talent to startups",
        "Boom cycle: Cybersecurity roles up 45% due to recent breaches",
        "Competitive landscape: Average time-to-hire down to 21 days - move fast",
        "Talent shortage: Companies dropping degree requirements for cleared professionals"
    ]
    return random.choice(conditions)

# Career path variations
CAREER_PATHS = {
    'traditional': {
        'description': 'Established corporate trajectory',
        'timeline': '2-3 years to senior role',
        'risk': 'Low',
        'reward': 'Steady growth, good benefits'
    },
    'aggressive': {
        'description': 'High-growth startup path',
        'timeline': '6-12 months to leadership',
        'risk': 'High',
        'reward': 'Equity upside, rapid advancement'
    },
    'entrepreneurial': {
        'description': 'Build your own venture',
        'timeline': 'Immediate start, 18-month runway',
        'risk': 'Very High',
        'reward': 'Unlimited potential, full control'
    },
    'hybrid': {
        'description': 'Corporate job + side consulting',
        'timeline': 'Dual track from day one',
        'risk': 'Medium',
        'reward': 'Multiple income streams'
    },
    'contract': {
        'description': '1099 high-rate consulting',
        'timeline': 'Immediate high income',
        'risk': 'Medium',
        'reward': '$200-400/hour potential'
    }
}

def get_dynamic_prompt(redacted_text: str, previous_analysis_count: int = 0) -> str:
    """
    Generate a truly unique prompt for each DD214 analysis
    """
    # Select random perspective
    perspective = random.choice(ANALYSIS_PERSPECTIVES)
    
    # Select narrative style
    narrative_style = random.choice(NARRATIVE_STYLES)
    
    # Get current market conditions
    market_conditions = get_market_conditions()
    
    # Select career path focus
    career_path = random.choice(list(CAREER_PATHS.keys()))
    
    # Generate unique company mix
    tech_picks = random.sample(TECH_COMPANIES, 3)
    defense_picks = random.sample(DEFENSE_CONTRACTORS, 3)
    consulting_picks = random.sample(CONSULTING_FIRMS, 2)
    startup_picks = random.sample(STARTUPS, 2)
    
    # Add temporal context
    analysis_date = datetime.now().strftime("%B %d, %Y")
    analysis_quarter = f"Q{(datetime.now().month-1)//3 + 1} {datetime.now().year}"
    
    # Vary the focus areas
    focus_areas = [
        "compensation optimization", "rapid career acceleration", "executive track positioning",
        "entrepreneurial opportunities", "work-life balance", "geographic arbitrage",
        "clearance monetization", "skill gap analysis", "network building", "personal branding"
    ]
    primary_focus = random.sample(focus_areas, 3)
    
    # Build the dynamic prompt
    prompt = f"""
ANALYSIS CONTEXT:
- Date: {analysis_date}
- Market Quarter: {analysis_quarter}
- Current Conditions: {market_conditions}
- Analysis Number: {previous_analysis_count + 1} (provide fresh insights different from any previous analysis)
- Analysis Perspective: {perspective['name']}
- Narrative Style: {narrative_style}
- Career Path Focus: {career_path} path

ROLE: {perspective['style']}

Your analysis should reflect {perspective['tone']} tone and focus on {perspective['focus']}.

PRIMARY FOCUS AREAS FOR THIS ANALYSIS:
1. {primary_focus[0]}
2. {primary_focus[1]}
3. {primary_focus[2]}

REDACTED DD214:
{redacted_text}

Generate COMPLETELY UNIQUE insights that are {narrative_style} in nature. Your recommendations should be distinctly different from standard advice.

REQUIRED UNIQUE ELEMENTS:

1. MARKET INTELLIGENCE
Instead of generic company lists, recommend:
- {tech_picks[0]} (specific team/project: {get_specific_opportunity(tech_picks[0])})
- {defense_picks[0]} (contract/program: {get_specific_opportunity(defense_picks[0])})
- {consulting_picks[0]} (practice area: {get_specific_opportunity(consulting_picks[0])})
- {startup_picks[0]}

2. UNCONVENTIONAL OPPORTUNITIES
Think outside traditional paths:
- International opportunities (Dubai, Singapore, London tech hubs)
- Remote-first companies paying SF wages
- Fractional executive roles
- Advisory board positions
- Speaking circuit monetization
- Book/course creation potential

3. TEMPORAL STRATEGIES
Given it's {analysis_quarter}, provide:
- Specific conferences/events happening in next 60 days
- Companies with fiscal year considerations
- Seasonal hiring patterns to exploit
- Tax year optimization strategies

4. PERSONALITY-BASED APPROACH
Based on the {career_path} path selected, tailor advice for someone who is:
- Risk tolerance: {CAREER_PATHS[career_path]['risk']}
- Timeline: {CAREER_PATHS[career_path]['timeline']}
- Reward seeking: {CAREER_PATHS[career_path]['reward']}

5. UNIQUE VALUE PROPOSITIONS
Create 3 completely different positioning strategies:
- The "{generate_unique_angle()}" angle
- The "{generate_unique_angle()}" approach  
- The "{generate_unique_angle()}" positioning

6. CONTRARIAN INSIGHTS
Include at least 3 counterintuitive recommendations like:
- Why taking a lower salary might be smarter
- When to turn down great offers
- How to use rejection as leverage
- Why starting at a smaller company could accelerate growth

7. FUTURE SCENARIOS
Paint 3 different 5-year outcomes:
- Conservative path: Where they'll be, what they'll earn
- Aggressive path: Best case scenario with bold moves
- Black swan path: Unexpected opportunity that changes everything

FORMAT AS COMPREHENSIVE JSON BUT WITH THESE UNIQUE SECTIONS:

{{
  "analysis_metadata": {{
    "generated_date": "{analysis_date}",
    "market_conditions": "{market_conditions}",
    "analysis_perspective": "{perspective['name']}",
    "unique_angle": "...",
    "contrarian_score": "8/10"  // How unconventional is this advice
  }},
  
  "executive_intelligence_summary": {{
    "one_line_positioning": "...",  // Completely unique each time
    "market_disruption_potential": "...",  // Their ability to change the game
    "hidden_superpower": "...",  // Something unique about their background
    "million_dollar_insight": "..."  // The one thing that could change everything
  }},
  
  // Include all standard sections but with unique content based on the above parameters
}}

Remember: This veteran has likely seen generic advice. Give them insights so fresh and specific that they feel like you've been tracking their career for years. Make them say "I never thought of that!" at least 5 times.
"""
    
    return prompt

def get_specific_opportunity(company: str) -> str:
    """Generate specific opportunities within companies"""
    opportunities = {
        # Tech companies
        'Microsoft': ['Azure Government team', 'Xbox hardware division', 'HoloLens military applications'],
        'Amazon': ['AWS GovCloud', 'Project Kuiper', 'Robotics fulfillment centers'],
        'Palantir': ['Gotham platform', 'Apollo infrastructure', 'MetaConstellation'],
        
        # Defense contractors
        'Lockheed Martin': ['F-35 sustainment', 'Hypersonics program', 'Space fence operations'],
        'Raytheon': ['Counter-UAS systems', 'Next-gen radar', 'Cyber mission systems'],
        'Booz Allen Hamilton': ['Digital Battlespace', 'AI/ML center of excellence', 'Zero trust architecture'],
        
        # Consulting
        'McKinsey': ['Defense & Security practice', 'Public Sector transformation', 'Veterans affinity group'],
        'Deloitte': ['Government & Public Services', 'Cyber risk services', 'Federal human capital']
    }
    
    return random.choice(opportunities.get(company, ['emerging initiatives', 'transformation projects', 'innovation labs']))

def generate_unique_angle() -> str:
    """Generate unique positioning angles"""
    angles = [
        "Combat-tested innovation catalyst",
        "Classified-to-commercial translator",
        "Operational excellence architect",
        "Crisis leadership specialist",
        "Global security strategist",
        "Resilience engineering expert",
        "High-stakes decision authority",
        "Cross-cultural operations master",
        "Rapid deployment specialist",
        "Zero-failure systems designer",
        "Asymmetric thinking expert",
        "Force multiplication strategist"
    ]
    return random.choice(angles)

def get_interview_mastery_prompt_v2(profile: dict, target_role: str) -> str:
    """Enhanced interview prep with variability"""
    
    interview_styles = ['STAR method', 'Case study approach', 'Behavioral deep dive', 
                       'Technical assessment prep', 'Executive presence coaching']
    style = random.choice(interview_styles)
    
    return f"""You are preparing this veteran for interviews using the {style} approach.
    
    Create a unique interview preparation guide that includes:
    
    1. UNEXPECTED QUESTIONS THEY'LL FACE
    - Questions specific to {datetime.now().strftime('%B %Y')} market conditions
    - Company-specific cultural questions
    - Questions that test for military stereotypes
    
    2. POWER STORIES
    Create 5 different versions of their best story, each emphasizing different aspects:
    - Version 1: Leadership under pressure
    - Version 2: Innovation and adaptation
    - Version 3: Cross-functional collaboration
    - Version 4: Data-driven decision making
    - Version 5: Ethical dilemma resolution
    
    3. NEGOTIATION PSYCHOLOGY
    - How to read the room
    - When to be aggressive vs collaborative
    - Using silence as a weapon
    - Creating artificial deadlines
    
    Make this feel like insider intelligence, not generic interview prep.
    """