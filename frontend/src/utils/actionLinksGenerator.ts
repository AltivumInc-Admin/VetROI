/**
 * Generates contextual action links based on career data and veteran profile
 * Provides direct pathways to education, certification, and employment
 */

interface ActionLink {
  title: string
  description: string
  url: string
  icon: string
  category: 'education' | 'certification' | 'job' | 'resource'
  priority: number
}

interface CareerContext {
  soc: string
  title: string
  educationRequired: string[]
  certifications?: string[]
  salary: {
    median: number
    entry: number
  }
}

interface VeteranContext {
  state: string
  education: string
  branch: string
  clearance?: boolean
}

export function generateActionLinks(
  career: CareerContext,
  veteran: VeteranContext
): ActionLink[] {
  const links: ActionLink[] = []

  // Education Links
  if (needsEducation(career.educationRequired, veteran.education)) {
    links.push(...generateEducationLinks(career, veteran))
  }

  // Certification Links
  if (career.certifications?.length) {
    links.push(...generateCertificationLinks(career, veteran))
  }

  // Job Search Links
  links.push(...generateJobLinks(career, veteran))

  // Resource Links
  links.push(...generateResourceLinks(career, veteran))

  // Sort by priority and return top 6
  return links.sort((a, b) => b.priority - a.priority).slice(0, 6)
}

function needsEducation(required: string[], current: string): boolean {
  const eduLevels = {
    'high_school': 1,
    'certificate': 2,
    'associate': 3,
    'bachelor': 4,
    'master': 5,
    'doctorate': 6
  }
  
  const currentLevel = eduLevels[current as keyof typeof eduLevels] || 1
  const requiredLevel = Math.min(...required.map(r => eduLevels[r as keyof typeof eduLevels] || 4))
  
  return currentLevel < requiredLevel
}

function generateEducationLinks(career: CareerContext, veteran: VeteranContext): ActionLink[] {
  const links: ActionLink[] = []
  
  // State-specific schools
  const stateSchools = getStateSchools(veteran.state, career.soc)
  
  // Online programs
  if (career.soc.startsWith('29-')) { // Healthcare
    links.push({
      title: 'WGU RN to BSN Online',
      description: 'Competency-based nursing program, military friendly',
      url: 'https://www.wgu.edu/online-nursing-health-degrees/rn-bsn-nursing-bachelors-program.html',
      icon: '🎓',
      category: 'education',
      priority: 90
    })
  }
  
  // Community colleges
  links.push({
    title: `${veteran.state} Community Colleges`,
    description: 'Find affordable programs near you with VA benefits',
    url: `https://www.communitycollegereview.com/state/${veteran.state.toLowerCase()}`,
    icon: '🏫',
    category: 'education',
    priority: 80
  })
  
  // Military-friendly schools
  links.push({
    title: 'Military Friendly® Schools',
    description: 'Top-rated schools for veterans with dedicated support',
    url: 'https://www.militaryfriendly.com/schools/',
    icon: '🪖',
    category: 'education',
    priority: 85
  })
  
  return links
}

function generateCertificationLinks(career: CareerContext, veteran: VeteranContext): ActionLink[] {
  const links: ActionLink[] = []
  
  // Career-specific certifications
  const certMap: { [key: string]: ActionLink[] } = {
    '11-': [ // Management
      {
        title: 'PMP Certification',
        description: 'Project Management Professional - globally recognized',
        url: 'https://www.pmi.org/certifications/project-management-pmp',
        icon: '📋',
        category: 'certification',
        priority: 95
      }
    ],
    '15-': [ // IT
      {
        title: 'CompTIA Certifications',
        description: 'IT certifications accepted by DoD 8570',
        url: 'https://www.comptia.org/certifications',
        icon: '💻',
        category: 'certification',
        priority: 95
      },
      {
        title: 'AWS Certifications',
        description: 'Cloud certifications with military discounts',
        url: 'https://aws.amazon.com/certification/',
        icon: '☁️',
        category: 'certification',
        priority: 90
      }
    ],
    '29-': [ // Healthcare
      {
        title: 'NCLEX-RN Exam Prep',
        description: 'Required nursing licensure exam',
        url: 'https://www.ncsbn.org/nclex.htm',
        icon: '🏥',
        category: 'certification',
        priority: 100
      }
    ]
  }
  
  const prefix = career.soc.substring(0, 3)
  return certMap[prefix] || []
}

function generateJobLinks(career: CareerContext, veteran: VeteranContext): ActionLink[] {
  const links: ActionLink[] = []
  
  // USAJOBS - Federal positions
  links.push({
    title: 'USAJOBS Federal Careers',
    description: 'Federal positions with veteran preference',
    url: `https://www.usajobs.gov/Search/Results?k=${encodeURIComponent(career.title)}`,
    icon: '🏛️',
    category: 'job',
    priority: 95
  })
  
  // ClearanceJobs - If has clearance
  if (veteran.clearance) {
    links.push({
      title: 'ClearanceJobs',
      description: 'Positions requiring security clearance',
      url: `https://www.clearancejobs.com/jobs?keywords=${encodeURIComponent(career.title)}`,
      icon: '🔒',
      category: 'job',
      priority: 90
    })
  }
  
  // RecruitMilitary
  links.push({
    title: 'RecruitMilitary Career Fair',
    description: 'Connect with veteran-friendly employers',
    url: 'https://recruitmilitary.com',
    icon: '🤝',
    category: 'job',
    priority: 85
  })
  
  // LinkedIn Jobs
  links.push({
    title: 'LinkedIn Veteran Jobs',
    description: 'Network and find opportunities',
    url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(career.title + ' veteran')}`,
    icon: '💼',
    category: 'job',
    priority: 80
  })
  
  // Indeed with veteran filter
  links.push({
    title: 'Indeed Military Skills',
    description: 'Jobs matched to your military experience',
    url: `https://www.indeed.com/jobs?q=${encodeURIComponent(career.title)}&l=${veteran.state}`,
    icon: '🔍',
    category: 'job',
    priority: 75
  })
  
  return links
}

function generateResourceLinks(career: CareerContext, veteran: VeteranContext): ActionLink[] {
  const links: ActionLink[] = []
  
  // VA Work-Study Program
  links.push({
    title: 'VA Work-Study Program',
    description: 'Earn while learning with VA benefits',
    url: 'https://www.va.gov/education/about-gi-bill-benefits/how-to-use-benefits/work-study/',
    icon: '💰',
    category: 'resource',
    priority: 70
  })
  
  // State Veterans Affairs
  links.push({
    title: `${veteran.state} Veterans Affairs`,
    description: 'State-specific benefits and resources',
    url: `https://www.va.gov/directory/guide/state.asp?STATE=${veteran.state}`,
    icon: '🏛️',
    category: 'resource',
    priority: 65
  })
  
  // Career-specific associations
  if (career.soc.startsWith('29-')) {
    links.push({
      title: 'Nurses for Veterans',
      description: 'Support network for veteran nurses',
      url: 'https://nursesforveterans.org',
      icon: '🩺',
      category: 'resource',
      priority: 60
    })
  }
  
  return links
}

function getStateSchools(state: string, soc: string): ActionLink[] {
  // This would be enhanced with your S3 data
  const statePrograms: { [key: string]: { [key: string]: ActionLink } } = {
    'TX': {
      '29-': {
        title: 'UT Health San Antonio',
        description: 'Accelerated BSN for veterans with medical experience',
        url: 'https://www.uthscsa.edu/academics/nursing',
        icon: '🎓',
        category: 'education',
        priority: 95
      }
    },
    'CA': {
      '29-': {
        title: 'UCLA School of Nursing',
        description: 'MECN program for career changers',
        url: 'https://www.nursing.ucla.edu',
        icon: '🎓',
        category: 'education',
        priority: 95
      }
    }
  }
  
  const prefix = soc.substring(0, 3)
  return statePrograms[state]?.[prefix] ? [statePrograms[state][prefix]] : []
}

// Additional helper functions
export function generateQuickActions(stage: string): ActionLink[] {
  const quickActions: { [key: string]: ActionLink[] } = {
    'discovery': [
      {
        title: 'Skills Translator',
        description: 'Convert military skills to civilian terms',
        url: 'https://www.military.com/veteran-jobs/skills-translator',
        icon: '🔄',
        category: 'resource',
        priority: 100
      }
    ],
    'exploration': [
      {
        title: 'Salary Calculator',
        description: 'Compare military vs civilian pay',
        url: 'https://www.va.gov/education/gi-bill-comparison-tool/',
        icon: '💵',
        category: 'resource',
        priority: 100
      }
    ],
    'action': [
      {
        title: 'Resume Builder',
        description: 'Create a veteran-optimized resume',
        url: 'https://www.resume-now.com/lp/rnvet15.aspx',
        icon: '📄',
        category: 'resource',
        priority: 100
      }
    ]
  }
  
  return quickActions[stage] || []
}