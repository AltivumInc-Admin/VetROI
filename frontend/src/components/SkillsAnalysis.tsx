import React, { useMemo } from 'react'
import '../styles/SkillsAnalysis.css'

interface Career {
  soc?: string
  code?: string
  title?: string
  career?: {
    title?: string
  }
  knowledge?: {
    group?: Array<{
      title?: {
        id?: string
        name?: string
      }
      element?: Array<{
        id?: string
        name?: string
      }>
    }>
  }
  skills?: {
    group?: Array<{
      title?: {
        id?: string
        name?: string
      }
      element?: Array<{
        id?: string
        name?: string
      }>
    }>
  }
  abilities?: {
    group?: Array<{
      title?: {
        id?: string
        name?: string
      }
      element?: Array<{
        id?: string
        name?: string
      }>
    }>
  }
}

interface SkillsAnalysisProps {
  careers: Career[]
  veteranProfile?: {
    branch?: string
    code?: string
  }
}

// Military skills mapping (simplified - in production this would be a comprehensive database)
const MILITARY_SKILLS_MAP: Record<string, string[]> = {
  // Special Forces
  '18D': ['medical treatment', 'emergency response', 'leadership', 'problem solving', 'critical thinking', 'teaching', 'cross-cultural communication'],
  '18B': ['weapons systems', 'demolitions', 'tactics', 'leadership', 'training', 'problem solving'],
  
  // Medical
  '68W': ['emergency medical care', 'patient assessment', 'medical documentation', 'teamwork', 'stress management'],
  
  // Intelligence
  '35S': ['data analysis', 'report writing', 'critical thinking', 'attention to detail', 'communication'],
  
  // Logistics
  '92A': ['inventory management', 'supply chain', 'data entry', 'customer service', 'organization'],
  
  // Communications
  '25B': ['network administration', 'troubleshooting', 'technical support', 'documentation', 'problem solving'],
  
  // Default military skills
  'default': ['leadership', 'teamwork', 'discipline', 'time management', 'attention to detail', 'working under pressure']
}

export const SkillsAnalysis: React.FC<SkillsAnalysisProps> = ({ careers, veteranProfile }) => {
  const getCareerTitle = (career: Career) => {
    return career.career?.title || career.title || 'Unknown Career'
  }

  const extractCareerSkills = (career: Career): string[] => {
    const skills: string[] = []
    
    // Extract from skills
    career.skills?.group?.forEach(group => {
      group.element?.forEach(element => {
        if (element.name) skills.push(element.name.toLowerCase())
      })
    })
    
    // Extract from knowledge
    career.knowledge?.group?.forEach(group => {
      group.element?.forEach(element => {
        if (element.name) skills.push(element.name.toLowerCase())
      })
    })
    
    // Extract from abilities
    career.abilities?.group?.forEach(group => {
      group.element?.forEach(element => {
        if (element.name) skills.push(element.name.toLowerCase())
      })
    })
    
    return [...new Set(skills)] // Remove duplicates
  }

  const getMilitarySkills = (): string[] => {
    const code = veteranProfile?.code || 'default'
    return MILITARY_SKILLS_MAP[code] || MILITARY_SKILLS_MAP['default']
  }

  const analyzeSkillsMatch = (career: Career) => {
    const careerSkills = extractCareerSkills(career)
    const militarySkills = getMilitarySkills()
    
    // Find matching skills (simple string matching - in production would use NLP)
    const matchedSkills = militarySkills.filter(milSkill => 
      careerSkills.some(careerSkill => 
        careerSkill.includes(milSkill) || milSkill.includes(careerSkill)
      )
    )
    
    // Find gap skills (top career skills not in military experience)
    const gapSkills = careerSkills
      .filter(careerSkill => 
        !militarySkills.some(milSkill => 
          careerSkill.includes(milSkill) || milSkill.includes(careerSkill)
        )
      )
      .slice(0, 5) // Top 5 gaps
    
    const transferabilityScore = Math.round((matchedSkills.length / Math.max(militarySkills.length, 1)) * 100)
    
    return {
      matched: matchedSkills,
      gaps: gapSkills,
      score: transferabilityScore,
      totalCareerSkills: careerSkills.length,
      totalMilitarySkills: militarySkills.length
    }
  }

  const skillsAnalyses = useMemo(() => {
    return careers.map(career => ({
      career,
      analysis: analyzeSkillsMatch(career)
    })).sort((a, b) => b.analysis.score - a.analysis.score)
  }, [careers])

  const getScoreColor = (score: number): string => {
    if (score >= 70) return '#4ecdc4'
    if (score >= 50) return '#ffe66d'
    if (score >= 30) return '#ff9f40'
    return '#ff6b6b'
  }

  const getTrainingRecommendations = (gaps: string[]): string[] => {
    const recommendations: string[] = []
    
    // Map gap skills to training recommendations
    gaps.forEach(gap => {
      if (gap.includes('computer') || gap.includes('software')) {
        recommendations.push('Complete online IT certifications (CompTIA, Microsoft)')
      } else if (gap.includes('management') || gap.includes('business')) {
        recommendations.push('Pursue business management courses or MBA')
      } else if (gap.includes('medical') || gap.includes('health')) {
        recommendations.push('Obtain healthcare certifications (CPR, EMT, etc.)')
      } else if (gap.includes('analysis') || gap.includes('data')) {
        recommendations.push('Learn data analysis tools (Excel, SQL, Python)')
      }
    })
    
    return [...new Set(recommendations)].slice(0, 3)
  }

  return (
    <div className="skills-analysis">
      <div className="skills-header">
        <h3>Military Skills Translation Analysis</h3>
        <p className="skills-subtitle">
          How your {veteranProfile?.code || 'military'} experience translates to civilian careers
        </p>
      </div>

      {/* Military Skills Profile */}
      <div className="military-skills-profile">
        <h4>Your Military Skills Profile</h4>
        <div className="skills-tags">
          {getMilitarySkills().map((skill, index) => (
            <span key={index} className="skill-tag military">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Career Skills Match */}
      <div className="career-skills-matches">
        {skillsAnalyses.map(({ career, analysis }, index) => (
          <div key={career.soc || career.code || index} className="career-skills-card">
            <div className="skills-card-header">
              <h5>{getCareerTitle(career)}</h5>
              <div className="transferability-score">
                <span 
                  className="score-value"
                  style={{ color: getScoreColor(analysis.score) }}
                >
                  {analysis.score}%
                </span>
                <span className="score-label">Skills Match</span>
              </div>
            </div>

            {/* Visual Skills Bar */}
            <div className="skills-match-bar">
              <div 
                className="match-fill"
                style={{ 
                  width: `${analysis.score}%`,
                  backgroundColor: getScoreColor(analysis.score)
                }}
              />
              <div className="match-labels">
                <span>{analysis.matched.length} matched</span>
                <span>{analysis.gaps.length} gaps</span>
              </div>
            </div>

            {/* Matched Skills */}
            <div className="matched-skills-section">
              <h6>Transferable Skills</h6>
              <div className="skills-tags">
                {analysis.matched.map((skill, i) => (
                  <span key={i} className="skill-tag matched">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Gap Skills */}
            {analysis.gaps.length > 0 && (
              <div className="gap-skills-section">
                <h6>Skills to Develop</h6>
                <div className="skills-tags">
                  {analysis.gaps.map((skill, i) => (
                    <span key={i} className="skill-tag gap">
                      + {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Training Recommendations */}
            <div className="training-recommendations">
              <h6>Recommended Training</h6>
              <ul>
                {getTrainingRecommendations(analysis.gaps).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Skills Development Plan */}
      <div className="skills-development-plan">
        <h4>Your Skills Development Strategy</h4>
        
        <div className="strategy-grid">
          <div className="strategy-card leverage">
            <div className="strategy-icon">💪</div>
            <h5>Leverage Your Strengths</h5>
            <p>
              Your military experience has given you strong {getMilitarySkills().slice(0, 3).join(', ')} skills.
              Highlight these in your resume and interviews.
            </p>
          </div>

          <div className="strategy-card bridge">
            <div className="strategy-icon">🌉</div>
            <h5>Bridge the Gaps</h5>
            <p>
              Focus on developing the top missing skills through online courses, certifications, or 
              apprenticeships while using your GI Bill benefits.
            </p>
          </div>

          <div className="strategy-card network">
            <div className="strategy-icon">🤝</div>
            <h5>Network Strategically</h5>
            <p>
              Connect with veterans who've made similar transitions. They can provide insights on 
              which skills matter most in practice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}