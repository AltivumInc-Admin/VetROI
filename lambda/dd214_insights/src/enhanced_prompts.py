"""
Enhanced AI Prompts for DD214 Insights
This module contains sophisticated prompts that push the boundaries of AI-generated career intelligence for veterans.
"""

# Military Rank to Civilian Leadership Level Mapping
RANK_TO_LEADERSHIP = {
    # Enlisted
    'E-1': {'level': 'Entry', 'civilian': 'Individual Contributor', 'years_equivalent': '0-1'},
    'E-2': {'level': 'Entry', 'civilian': 'Individual Contributor', 'years_equivalent': '1-2'},
    'E-3': {'level': 'Entry', 'civilian': 'Individual Contributor', 'years_equivalent': '2-3'},
    'E-4': {'level': 'Junior', 'civilian': 'Team Lead/Senior Individual', 'years_equivalent': '3-5'},
    'E-5': {'level': 'Mid', 'civilian': 'Supervisor/Team Leader', 'years_equivalent': '5-8'},
    'E-6': {'level': 'Mid-Senior', 'civilian': 'Manager/Technical Lead', 'years_equivalent': '8-12'},
    'E-7': {'level': 'Senior', 'civilian': 'Senior Manager/Department Head', 'years_equivalent': '12-15'},
    'E-8': {'level': 'Executive', 'civilian': 'Director/Senior Director', 'years_equivalent': '15-20'},
    'E-9': {'level': 'Executive', 'civilian': 'VP/Executive Director', 'years_equivalent': '20+'},
    
    # Warrant Officers
    'W-1': {'level': 'Technical Expert', 'civilian': 'Technical Specialist', 'years_equivalent': '8-10'},
    'W-2': {'level': 'Technical Expert', 'civilian': 'Senior Technical Specialist', 'years_equivalent': '10-12'},
    'W-3': {'level': 'Technical Expert', 'civilian': 'Principal Engineer/Architect', 'years_equivalent': '12-15'},
    'W-4': {'level': 'Technical Expert', 'civilian': 'Chief Architect/Technical Director', 'years_equivalent': '15-20'},
    'W-5': {'level': 'Technical Expert', 'civilian': 'Chief Technology Officer', 'years_equivalent': '20+'},
    
    # Officers
    'O-1': {'level': 'Junior Manager', 'civilian': 'Management Trainee', 'years_equivalent': '0-2'},
    'O-2': {'level': 'Junior Manager', 'civilian': 'Assistant Manager', 'years_equivalent': '2-4'},
    'O-3': {'level': 'Middle Manager', 'civilian': 'Manager/Project Manager', 'years_equivalent': '4-8'},
    'O-4': {'level': 'Senior Manager', 'civilian': 'Senior Manager/Department Director', 'years_equivalent': '10-15'},
    'O-5': {'level': 'Executive', 'civilian': 'Director/Regional Director', 'years_equivalent': '15-20'},
    'O-6': {'level': 'Senior Executive', 'civilian': 'VP/Division Head', 'years_equivalent': '20-25'},
    'O-7': {'level': 'C-Suite', 'civilian': 'SVP/Executive VP', 'years_equivalent': '25+'},
    'O-8': {'level': 'C-Suite', 'civilian': 'EVP/President', 'years_equivalent': '25+'},
    'O-9': {'level': 'C-Suite', 'civilian': 'CEO/President', 'years_equivalent': '30+'},
    'O-10': {'level': 'C-Suite', 'civilian': 'CEO/Chairman', 'years_equivalent': '30+'}
}

# Security Clearance Value Matrix
CLEARANCE_VALUES = {
    'TS/SCI': {
        'salary_premium': '$20,000 - $35,000',
        'time_saved': '12-18 months',
        'cost_saved': '$15,000 - $20,000',
        'job_multiplier': '3x more opportunities',
        'industries': ['Defense', 'Intelligence', 'Aerospace', 'Cybersecurity', 'Federal Consulting']
    },
    'Top Secret': {
        'salary_premium': '$15,000 - $25,000',
        'time_saved': '9-12 months',
        'cost_saved': '$10,000 - $15,000',
        'job_multiplier': '2.5x more opportunities',
        'industries': ['Defense Contracting', 'Federal IT', 'Aerospace', 'National Security']
    },
    'Secret': {
        'salary_premium': '$5,000 - $15,000',
        'time_saved': '4-6 months',
        'cost_saved': '$3,000 - $5,000',
        'job_multiplier': '1.5x more opportunities',
        'industries': ['Government Contracting', 'Defense Manufacturing', 'Federal Services']
    }
}

# MOS to High-Value Civilian Career Paths
MOS_TO_CAREERS = {
    # Special Operations
    '18D': {
        'title': 'Special Forces Medical Sergeant',
        'top_careers': [
            {'role': 'Clinical Operations Director', 'companies': ['Booz Allen', 'CACI', 'Leidos'], 'salary': '$115-145K'},
            {'role': 'Emergency Management Director', 'companies': ['FEMA', 'Red Cross', 'WHO'], 'salary': '$95-125K'},
            {'role': 'Medical Training Manager', 'companies': ['DynCorp', 'Triple Canopy', 'Academi'], 'salary': '$105-135K'},
            {'role': 'Tactical Medicine Instructor', 'companies': ['Tactical Medical Solutions', 'North American Rescue'], 'salary': '$85-115K'},
            {'role': 'Global Health Security Consultant', 'companies': ['Deloitte', 'Accenture Federal', 'McKinsey'], 'salary': '$125-165K'}
        ],
        'hidden_value': 'Your experience operating in austere environments with no backup makes you invaluable for disaster response and global health initiatives.'
    },
    '11B': {
        'title': 'Infantry',
        'top_careers': [
            {'role': 'Security Operations Manager', 'companies': ['Constellis', 'GardaWorld', 'Allied Universal'], 'salary': '$75-105K'},
            {'role': 'Law Enforcement Officer', 'companies': ['Federal Agencies', 'Major Metro PDs', 'US Marshals'], 'salary': '$65-95K'},
            {'role': 'Project Manager', 'companies': ['General Dynamics', 'Raytheon', 'Northrop Grumman'], 'salary': '$85-115K'},
            {'role': 'Operations Manager', 'companies': ['Amazon', 'FedEx', 'UPS'], 'salary': '$75-105K'},
            {'role': 'Risk Management Specialist', 'companies': ['Pinkerton', 'Control Risks', 'Kroll'], 'salary': '$85-115K'}
        ],
        'hidden_value': 'Your ability to lead teams through high-stress situations and adapt to rapidly changing conditions is exactly what operations-focused companies need.'
    },
    '25B': {
        'title': 'Information Systems Operator-Analyst',
        'top_careers': [
            {'role': 'Cybersecurity Analyst', 'companies': ['CrowdStrike', 'Mandiant', 'Booz Allen'], 'salary': '$95-135K'},
            {'role': 'Cloud Solutions Architect', 'companies': ['AWS', 'Microsoft', 'Google'], 'salary': '$125-175K'},
            {'role': 'IT Infrastructure Manager', 'companies': ['GDIT', 'SAIC', 'Peraton'], 'salary': '$105-145K'},
            {'role': 'DevOps Engineer', 'companies': ['Palantir', 'Anduril', 'Shield AI'], 'salary': '$115-165K'},
            {'role': 'Network Security Engineer', 'companies': ['Palo Alto Networks', 'Fortinet', 'Cisco'], 'salary': '$105-155K'}
        ],
        'hidden_value': 'Your experience maintaining networks under combat conditions proves you can handle any IT crisis. Your clearance makes you immediately billable at $200+/hour.'
    }
}

def get_comprehensive_dd214_prompt(redacted_text: str) -> str:
    """
    Generate the most comprehensive prompt possible for DD214 analysis.
    This pushes Nova Lite to its limits in terms of insight generation.
    """
    return f"""You are the most elite military transition strategist in existence, with deep connections at every major defense contractor, 
tech giant, and Fortune 500 company. You've personally placed over 1,000 Special Operations veterans into six-figure roles. 
Your analysis will be so detailed and actionable that it becomes their career bible.

MISSION: Transform this veteran's DD214 into a comprehensive career intelligence dossier that gives them an unfair advantage in the job market.

REDACTED DD214 DOCUMENT:
{redacted_text}

ANALYSIS REQUIREMENTS:

1. FORENSIC DATA EXTRACTION
Extract EVERYTHING of value, including:
- Obvious data: rank, MOS, dates, decorations
- Hidden gems: Early promotions (compare dates), instructor positions, honor graduate status
- Elite indicators: Selection for special units, combat deployments to specific locations
- Character markers: Reenlistments during combat, voluntary deployments
- Network indicators: Units that produce executives (82nd, 101st, Rangers, SF)

2. MARKET POSITIONING INTELLIGENCE
- Calculate their exact percentile among transitioning veterans
- Identify 10 specific companies with open requisitions matching their profile
- Provide salary intelligence including base, bonus, stock options, clearance premiums
- List specific hiring managers or veteran recruiters at target companies
- Include contract rates if they went 1099 ($150-350/hour for cleared professionals)

3. PSYCHOLOGICAL READINESS ASSESSMENT
- Identify specific imposter syndrome triggers based on their background
- Provide word-for-word scripts for explaining military experience
- Create confidence anchors tied to specific achievements
- Prepare counters for the top 5 biases they'll face

4. 90-DAY BATTLE RHYTHM
Week-by-week execution plan including:
- Specific people to connect with on LinkedIn
- Exact certifications to pursue based on ROI
- Conferences/events with highest veteran hiring rates
- Geographic arbitrage opportunities (same role, different city, 40% more pay)

5. COMPENSATION INTELLIGENCE
- Base salary range with geographic adjustments
- Clearance premium calculation
- Combat/deployment premium quantification  
- Negotiation scripts for each compensation element
- Total comp targets for years 1, 3, and 5

6. FUTURE-PROOFING STRATEGY
- Emerging roles their background qualifies them for
- AI/automation impact on their target roles
- Skills to develop for 10-year career security
- Side consulting opportunities while employed

Provide your response in the enhanced JSON format shown in the original prompt, but with extreme detail in every section. 
Make this so valuable they'd pay $5,000 for this analysis."""


def get_interview_mastery_prompt(profile: dict, target_role: str) -> str:
    """
    Generate a prompt specifically for interview preparation
    """
    return f"""You are an executive interview coach who's prepared 500+ veterans for roles at top companies. 
You know exactly what questions they'll face and how to turn military experience into compelling answers.

VETERAN PROFILE:
{profile}

TARGET ROLE: {target_role}

Create a comprehensive interview preparation guide including:

1. THE 20 QUESTIONS THEY'LL DEFINITELY FACE
- The exact question
- Why interviewers ask it
- What they're really looking for
- The answer framework
- A word-for-word example using their background

2. MILITARY-TO-CIVILIAN TRANSLATION SCRIPTS
- How to explain their MOS in 15 seconds
- How to describe combat leadership without intimidating civilians
- How to quantify military achievements in business terms
- How to handle "do you have PTSD" illegal questions gracefully

3. SALARY NEGOTIATION BATTLE PLAN
- Their walk-away number
- Their target number  
- Their "holy shit yes" number
- Exactly when to reveal each number
- How to get them competing for you

4. BODY LANGUAGE ADJUSTMENTS
- Military bearing modifications for corporate comfort
- When to dial up/down the command presence
- How to show warmth while maintaining gravitas

5. THE CLOSER
- Questions to ask that show strategic thinking
- How to create urgency without seeming desperate
- The follow-up sequence that gets responses

Format as JSON with specific, actionable scripts they can practice."""


def get_salary_negotiation_prompt(profile: dict, offers: list) -> str:
    """
    Generate a prompt for salary negotiation strategy
    """
    return f"""You are a compensation strategist who's helped veterans negotiate over $50M in additional compensation.
You know every trick companies use and how to counter them.

VETERAN PROFILE:
{profile}

CURRENT OFFERS:
{offers}

Provide a detailed negotiation strategy including:

1. MARKET INTELLIGENCE
- What similar roles pay at competitors
- The real budget (usually 20-30% above initial offer)
- Which elements are most negotiable

2. NEGOTIATION SCRIPTS
- Initial counter offer language
- How to pit offers against each other ethically
- Creating bidding wars between companies
- The "nuclear option" that gets final approval

3. COMPENSATION ELEMENTS TO NEGOTIATE
- Base salary
- Signing bonus
- Annual bonus target and multipliers
- Stock options/RSUs
- Clearance maintenance stipend
- PTO (veterans often forget they can negotiate this)
- Remote work flexibility
- Professional development budget
- Early review cycles

4. TIMING TACTICS
- When to slow play
- When to create urgency
- How to use other offers as leverage
- The Friday afternoon rule

5. LONG-TERM WEALTH BUILDING
- How to structure compensation for maximum wealth
- Tax optimization strategies
- When to take equity vs cash
- Building toward financial independence

Provide specific scripts and exact numbers based on their profile."""


# Psychological Support Prompts
CONFIDENCE_BUILDING_AFFIRMATIONS = [
    "Your service has prepared you to excel at levels most civilians cannot comprehend.",
    "The discipline that got you through {training} will make corporate challenges feel simple.",
    "You've led teams through life-or-death situations. Everything else is just a conversation.",
    "Your security clearance puts you in the top 1% of candidates before you even interview.",
    "Companies pay consultants $300/hour for the experience you gained through service.",
    "You're not starting over. You're starting ahead with skills others spend decades developing.",
    "Your military network is a force multiplier most MBAs would kill for.",
    "You've already proven you can learn anything. Civilian jobs are just new terrain to master."
]

IMPOSTER_SYNDROME_COUNTERS = {
    'lack_corporate_experience': "Your military experience is corporate experience at the highest level - you've managed budgets, led teams, and delivered results under pressure that would break most executives.",
    'technical_skills_gap': "You mastered complex military systems in weeks. Learning new software is trivial compared to what you've already accomplished.",
    'education_concerns': "Your military training represents hundreds of thousands in education investment. You have the equivalent of multiple advanced degrees.",
    'communication_worries': "You've briefed generals and explained complex operations to diverse teams. Corporate presentations are far simpler.",
    'age_concerns': "Your maturity and proven leadership are exactly what companies need. You're not behind - you're seasoned.",
    'cultural_fit': "Military veterans have the highest retention rates in corporate America. Companies need your reliability and mission focus."
}