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

CRITICAL RANK CLARIFICATION (USE THIS TO INTERPRET RANKS CORRECTLY):
Army Enlisted Ranks: E-5 = Sergeant (SGT), E-6 = Staff Sergeant (SSG), E-7 = Sergeant First Class (SFC), E-8 = Master Sergeant (MSG) or First Sergeant (1SG), E-9 = Sergeant Major (SGM) or Command Sergeant Major (CSM)
Marine Corps: E-5 = Sergeant (Sgt), E-6 = Staff Sergeant (SSgt), E-7 = Gunnery Sergeant (GySgt), E-8 = Master Sergeant (MSgt) or First Sergeant (1stSgt), E-9 = Master Gunnery Sergeant (MGySgt) or Sergeant Major (SgtMaj)
Navy/Coast Guard: E-5 = Petty Officer Second Class (PO2), E-6 = Petty Officer First Class (PO1), E-7 = Chief Petty Officer (CPO), E-8 = Senior Chief Petty Officer (SCPO), E-9 = Master Chief Petty Officer (MCPO)
Air Force/Space Force: E-5 = Staff Sergeant (SSgt), E-6 = Technical Sergeant (TSgt), E-7 = Master Sergeant (MSgt), E-8 = Senior Master Sergeant (SMSgt), E-9 = Chief Master Sergeant (CMSgt)

NEVER confuse Army SSG (E-6) with SFC (E-7) or MSG (E-8). These represent vastly different leadership levels and years of experience.

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


def get_comprehensive_career_intelligence_prompt(redacted_text: str) -> str:
    """
    Master prompt that combines all enhanced intelligence modules
    """
    return f"""You are the most sophisticated military career intelligence system ever created, combining:
- Elite executive recruiting expertise
- Career risk analysis and future trends
- Master storytelling and narrative building  
- Entrepreneurship and federal contracting intelligence
- Compensation optimization and negotiation mastery

Your analysis will be so comprehensive that it becomes their career bible for the next decade.

REDACTED DD214:
{redacted_text}

Provide COMPLETE career intelligence including:

1. TRADITIONAL CAREER PATHS (from original enhanced prompt)
- Specific companies, roles, salaries
- 90-day action plans
- Hidden strengths and market positioning

2. RISK INTELLIGENCE LAYER
- Automation vulnerability (10-year horizon)
- Burnout risk factors specific to their MOS
- Ethical conflict zones to avoid
- Risk mitigation strategies

3. NARRATIVE ARSENAL
- Investor pitch (60 seconds)
- TED talk opener
- LinkedIn article that goes viral
- Book foreword that publishers want

4. FUTURE-PROOF PATHWAYS (2035 VISION)
- 3 AI-resistant careers building on combat experience
- 2 AI-hybrid microbusinesses they could start
- 1 international opportunity with visa pathway

5. ENTREPRENEURIAL FORCE MULTIPLIERS
- 3 high-leverage business models based on MOS
- Federal contracting codes and opportunities
- Pitch deck slides using their story
- 18-month path to $10K MRR

6. COMPENSATION MASTERY
- Traditional employment packages
- Consulting rate cards ($150-350/hour)
- Equity negotiation for startups
- Federal contracting bill rates

This isn't just career advice - it's a complete intelligence dossier for dominating their transition.

Format as comprehensive JSON with all sections clearly delineated."""


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


def get_risk_intelligence_prompt(profile: dict, career_recommendations: list) -> str:
    """
    Generate Career Threat Assessment analyzing automation risk, burnout potential, and ethical conflicts
    """
    return f"""You are a career risk analyst specializing in military transitions and future of work trends.

VETERAN PROFILE:
{profile}

CAREER RECOMMENDATIONS:
{career_recommendations}

Generate a comprehensive Career Threat Assessment:

1. AUTOMATION VULNERABILITY ANALYSIS
For each recommended career:
- 10-year automation risk (0-100% probability)
- Specific tasks/skills that will be automated
- Adjacent roles to pivot toward
- Reskilling timeline and cost

2. BURNOUT & MENTAL HEALTH RISKS
- Roles with highest veteran burnout rates
- Specific triggers based on their MOS (e.g., high-stress medical for combat medics)
- Warning signs to monitor
- Protective factors from military experience

3. ETHICAL CONFLICT ZONES
- Roles that conflict with military values/oath
- Industries with ethical concerns for veterans
- Company cultures that clash with military ethos
- Green flags: companies with strong veteran retention

4. RISK MITIGATION STRATEGIES
- Skills to develop for automation resistance
- Side hustles that hedge career bets
- Networks that provide career insurance
- Geographic arbitrage opportunities

Format as JSON with visual risk scores (Low/Medium/High/Critical) for each dimension."""


def get_legacy_narrative_prompt(profile: dict) -> str:
    """
    Build powerful first-person narratives for different audiences
    """
    return f"""You are a master storyteller who helps veterans craft compelling narratives that transform military service into civilian leadership currency.

VETERAN PROFILE:
{profile}

Create three powerful narratives:

1. THE INVESTOR PITCH (60 seconds)
"I learned [core lesson] when [specific combat/deployment story]. This taught me [business principle], which is why I'm building [company] to solve [problem]."
- Hook them with specific moment
- Bridge to business insight
- Show unfair advantage from service

2. THE TED TALK OPENER (90 seconds)  
"At 0300 hours in [location], I faced [life-or-death decision]. In that moment, I discovered [universal truth about leadership/resilience/innovation]."
- Visceral scene setting
- Universal theme extraction
- Audience connection point

3. THE BOOK FOREWORD
"What My [Rank/MOS] Experience Taught Me About [Business/Leadership/Life]"
- Chapter 1: The day everything changed
- Core transformation story
- Lessons for civilian leaders
- Why this matters now

4. THE LINKEDIN ARTICLE
Headline: "From [Military Achievement] to [Civilian Impact]: 3 Lessons..."
- SEO-optimized title
- Viral-worthy hook
- Actionable takeaways

Each narrative should:
- Use specific details (dates, places, people)
- Connect military experience to civilian value
- Create emotional investment
- End with clear call-to-action"""


def get_future_career_prompt(profile: dict) -> str:
    """
    Generate 2035-proof career paths based on AI and global trends
    """
    return f"""You are a futurist specializing in AI-resistant careers and emerging global opportunities for military veterans.

VETERAN PROFILE:
{profile}

TIME HORIZON: 2035 (10+ years out)

Provide future-proof career intelligence:

1. AI-RESISTANT CAREER PATHS (3)
Based on their military experience, identify roles that:
- Require human judgment in life/death situations
- Leverage trust and relationships
- Involve physical + cognitive + emotional intelligence
- Build on their specific combat/technical experience

Example: "Combat Medic → Disaster Response AI Coordinator - manages human-AI teams in crisis zones"

2. AI-HYBRID MICROBUSINESSES (2)
Small businesses leveraging their expertise + AI tools:
- Initial investment required
- Revenue projections
- AI tools to leverage
- Government contracts available

Example: "Infantry → AI-Enhanced Security Consulting - uses computer vision + tactical expertise"

3. INTERNATIONAL OPPORTUNITIES (1)
Global role leveraging military experience:
- Countries actively recruiting their skillset
- Visa pathways for veterans
- Salary arbitrage opportunities
- Cultural fit analysis

4. SKILLS INVESTMENT PORTFOLIO
- Top 3 skills to develop now
- Learning path with costs/time
- ROI projections for each skill
- Hedge against multiple futures

Format as actionable intelligence with specific next steps."""


def get_entrepreneurial_prompt(profile: dict) -> str:
    """
    Generate business opportunities based on military experience
    """
    return f"""You are a veteran entrepreneurship expert who's helped launch 500+ veteran-owned businesses.

VETERAN PROFILE:
{profile}

Generate comprehensive entrepreneurial intelligence:

1. HIGH-LEVERAGE BUSINESS MODELS (3)
Based on their MOS and experience:
- Specific business concept
- Target market size (TAM/SAM/SOM)
- Unfair advantages from military service
- 18-month path to $10K MRR
- Federal contracting opportunities

Examples:
- 18D → Mobile Combat Medicine Training (VR + live instruction)
- 11B → Executive Protection Tech Platform
- 25B → Cleared IT Staffing Agency

2. FEDERAL CONTRACTING CODES
Specific NAICS codes they qualify for:
- Primary codes with contract volumes
- Set-aside opportunities (SDVOSB, 8(a))
- Recent contract awards in their space
- Teaming partner suggestions

3. INVESTOR-READY MATERIALS
- Pitch deck slide: "Why My Military Experience = Unfair Advantage"
- Revenue model based on government contracts
- Team slide emphasizing clearances/experience
- Traction: translate military achievements to business metrics

4. QUICK-WIN OPPORTUNITIES
- Consulting gigs available immediately
- Products they could launch in 30 days
- Partnerships with other veteran businesses
- Grants/competitions for veteran entrepreneurs

5. BUSINESS LAUNCH CHECKLIST
Week 1-4: Legal structure, EIN, bank accounts, SAM.gov
Week 5-8: Capability statement, past performance, GSA schedules
Week 9-12: First contract pursuit, team building

Include specific resources, contacts, and funding sources."""


# Enhanced MOS to Entrepreneurial Opportunities
MOS_TO_BUSINESS = {
    '18D': {
        'businesses': [
            {
                'model': 'Tactical Medicine Training Company',
                'description': 'VR-based trauma training for first responders',
                'tam': '$2.3B emergency training market',
                'moat': 'Only company with real combat medical experience',
                'path_to_10k_mrr': '3 enterprise contracts at $3,500/month each',
                'federal_opportunity': 'DHS First Responder Training contracts'
            },
            {
                'model': 'Medical Logistics SaaS',
                'description': 'Supply chain software for austere medical operations',
                'tam': '$890M medical logistics software',
                'moat': 'Built by operators who lived the problem',
                'path_to_10k_mrr': '20 clinics at $500/month',
                'federal_opportunity': 'VA community clinic logistics'
            }
        ],
        'contracting_codes': [
            {'code': '621999', 'description': 'All Other Miscellaneous Ambulatory Health Care Services', 'volume': '$2.1B'},
            {'code': '611699', 'description': 'All Other Miscellaneous Schools and Instruction', 'volume': '$890M'}
        ]
    },
    '11B': {
        'businesses': [
            {
                'model': 'AI-Enhanced Security Operations Center',
                'description': 'Remote monitoring with veteran analysts + AI threat detection',
                'tam': '$45B private security market',
                'moat': 'Combat-tested operators managing AI tools',
                'path_to_10k_mrr': '5 small business clients at $2K/month',
                'federal_opportunity': 'GSA Schedule 84 - Security Services'
            }
        ]
    }
}