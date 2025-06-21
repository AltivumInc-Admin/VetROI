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

def get_legacy_intelligence_prompt(redacted_text: str, veteran_profile: dict) -> str:
    """
    Generate a comprehensive 1,500-word Legacy Intelligence Report
    """
    return f"""
You are a military career strategist and legacy architect. Create a comprehensive Legacy Intelligence Report for this veteran that will serve as:
- A white-label asset for career coaches
- A branding document for speaking engagements  
- A legacy vault for family and memoirs

VETERAN PROFILE:
{redacted_text}

Create a 1,500-word report with EXACTLY this structure and word counts:

1. TACTICAL CAREER RECOMMENDATIONS (300 words)
Write a detailed tactical playbook covering:
- Immediate 30-60-90 day action items with specific deliverables
- Named individuals to contact at target companies (use real titles, hypothetical names)
- Exact scripts for outreach messages
- Specific online courses/certifications with URLs
- Calendar of relevant conferences/events for next 6 months
- Tactical salary negotiation moves with exact numbers
End with a "Force Multiplier Move" - one unconventional action that could 10x their results.

2. STRATEGIC LEADERSHIP PROFILE (300 words)
Analyze their leadership DNA:
- Leadership archetype based on military experience (e.g., "Warrior-Diplomat", "Technical Innovator")
- Specific C-suite roles they're built for (not just qualified for)
- Board positions they could pursue in 5-10 years
- How their military leadership style translates to civilian power dynamics
- Specific examples of how they've already demonstrated executive capability
- Their unique "leadership signature" that sets them apart
Include a "Path to C-Suite" roadmap with specific milestones.

3. MORAL COMPASS AND RISK ALIGNMENT (300 words)
Deep dive into values and risk tolerance:
- Core values extracted from their service record
- Industries/companies that align with their moral framework
- Red flags - companies/roles that would create ethical conflicts
- Risk tolerance assessment based on military decisions
- How their combat/service experience shapes their decision-making
- Specific scenarios where their values become competitive advantages
Create a "Values-Based Decision Matrix" they can use for career choices.

4. SOCIETAL VALUE PROJECTIONS (300 words)
Quantify their potential impact:
- Economic value: Specific dollar amount they'll generate over career
- Social impact: Number of lives they'll influence
- Innovation potential: Problems only they can solve
- Mentorship legacy: Veterans they'll guide
- Knowledge transfer: Unique expertise they bring to civilian sector
- National security value: How their civilian role strengthens America
Project their "Total Societal ROI" with specific metrics.

5. NARRATIVE LEGACY SUMMARY (300 words)
Craft their story for maximum impact:
- Opening hook for their biography
- TED talk premise unique to their experience
- Book title and three chapter summaries
- Documentary angle if someone made a film about them
- Legacy statement for their grandchildren
- How history will remember their military-to-civilian transition
- The "Wikipedia summary" of their life in 2050
End with their "Epitaph of Excellence" - how they want to be remembered.

FORMAT YOUR RESPONSE AS JSON:
{{
  "legacy_intelligence_report": {{
    "report_title": "Legacy Intelligence Report: [Rank] [Name]'s Path to Extraordinary Impact",
    "executive_summary": "50-word executive summary of their unique value and potential",
    "tactical_career_recommendations": {{
      "content": "Full 300-word section...",
      "force_multiplier_move": "The one unconventional action...",
      "key_actions": ["Action 1", "Action 2", "Action 3"]
    }},
    "strategic_leadership_profile": {{
      "content": "Full 300-word section...",
      "leadership_archetype": "Their unique leadership style...",
      "c_suite_trajectory": "Specific path to executive roles..."
    }},
    "moral_compass_risk_alignment": {{
      "content": "Full 300-word section...",
      "core_values": ["Value 1", "Value 2", "Value 3"],
      "decision_matrix": "Framework for values-based decisions..."
    }},
    "societal_value_projections": {{
      "content": "Full 300-word section...",
      "economic_impact": "$X million over career",
      "lives_influenced": "Specific number with explanation",
      "total_roi": "Quantified societal return on investment"
    }},
    "narrative_legacy_summary": {{
      "content": "Full 300-word section...",
      "ted_talk_title": "Their unique TED talk premise",
      "book_title": "Title of their future memoir",
      "epitaph": "How they'll be remembered"
    }},
    "metadata": {{
      "total_word_count": 1500,
      "generation_date": "{datetime.now().isoformat()}",
      "report_version": "1.0"
    }}
  }}
}}

Write with gravitas and depth. This document will be printed, framed, and passed down through generations. Make every word count.
"""

def get_meta_ai_prompts(veteran_profile: dict, ai_insights: dict) -> str:
    """
    Generate personalized AI prompts for deeper veteran insights
    """
    return f"""
Based on this veteran's profile and the insights already generated, you are an AI strategist helping them unlock maximum value from AI tools.

VETERAN PROFILE SUMMARY:
- Branch: {veteran_profile.get('branch')}
- MOS: {veteran_profile.get('mos')}
- Rank: {veteran_profile.get('rank')}
- Years of Service: {veteran_profile.get('years_of_service')}
- Special Qualifications: {veteran_profile.get('special_qualifications', [])}
- Clearance: {veteran_profile.get('clearance_level')}

Analyze their unique background and generate FIVE highly specific, transformative AI prompts they should use to gain deeper insights about their transition. Each prompt should:

1. Be completely personalized to their military experience
2. Unlock insights that generic prompts would miss
3. Be immediately actionable
4. Lead to genuine "aha!" moments
5. Help them see possibilities they haven't considered

FORMAT AS JSON:
{{
  "meta_ai_recommendations": {{
    "meta_analysis": "Brief analysis of what makes this veteran unique and what AI can specifically do for them",
    "transformative_prompts": [
      {{
        "prompt_title": "Leverage Your Combat Medical Experience for Biotech",
        "the_prompt": "I'm a former 18D Special Forces Medical Sergeant with combat trauma experience in Afghanistan. Generate a detailed analysis of how my ability to perform emergency surgery under fire translates to high-pressure biotech/pharma roles, specifically focusing on crisis management in clinical trials, FDA emergency approvals, and medical device field testing. Include specific companies developing battlefield medical technology.",
        "why_powerful": "This prompt connects combat medical experience to cutting-edge civilian opportunities",
        "expected_insights": "Discover $200K+ roles you never knew existed",
        "follow_up_prompt": "Based on the previous analysis, create a 90-day action plan to position myself as a subject matter expert in trauma biotechnology"
      }},
      // Generate 4 more equally specific and powerful prompts
    ],
    "ai_mastery_tips": [
      "Use your MOS code and specific deployments in every prompt for precision",
      "Ask AI to role-play as specific industry leaders interviewing you",
      "Have AI analyze your military awards for civilian equivalents",
      "Use AI to translate military projects into civilian case studies"
    ],
    "prompt_evolution_strategy": "How to iteratively improve these prompts based on results"
  }}
}}

Make each prompt so specific and insightful that the veteran immediately wants to try it. These should feel like custom keys that unlock doors they didn't know existed.