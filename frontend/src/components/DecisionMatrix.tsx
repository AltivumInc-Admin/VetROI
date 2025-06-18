import React, { useMemo } from 'react'
import { RadarChart } from './visualizations/RadarChart'
import '../styles/DecisionMatrix.css'

interface Career {
  soc?: string
  code?: string
  title?: string
  career?: {
    title?: string
    tags?: {
      bright_outlook?: boolean
      green?: boolean
    }
  }
  job_outlook?: {
    outlook?: {
      category?: string
      description?: string
    }
    bright_outlook?: {
      category?: string[]
    }
    salary?: {
      annual_median?: number
      annual_10th_percentile?: number
      annual_90th_percentile?: number
    }
  }
  education?: {
    job_zone?: number
    education_usually_needed?: {
      category?: string[]
    }
    apprenticeships?: {
      title?: Array<{
        name?: string
      }>
    }
  }
  check_out_my_state?: any
}

interface DecisionMatrixProps {
  careers: Career[]
  userState?: string
  relocationState?: string
  veteranProfile?: {
    branch?: string
    code?: string
    education?: string
  }
}

interface VetROIScore {
  overall: number
  breakdown: {
    salary: number
    growth: number
    education: number
    location: number
    sustainability: number
  }
  confidence: 'high' | 'medium' | 'low'
  recommendations: string[]
}

export const DecisionMatrix: React.FC<DecisionMatrixProps> = ({
  careers,
  userState = 'CA',
  relocationState,
  veteranProfile
}) => {
  const getCareerTitle = (career: Career) => {
    return career.career?.title || career.title || 'Unknown Career'
  }

  const calculateVetROIScore = (career: Career): VetROIScore => {
    // Salary Score (0-100)
    const median = career.job_outlook?.salary?.annual_median || 50000
    const salaryScore = Math.min((median / 150000) * 100, 100) // Cap at $150k for scoring

    // Growth Score (0-100)
    const outlook = career.job_outlook?.outlook?.category || 'Average'
    const brightCategories = career.job_outlook?.bright_outlook?.category || []
    let growthScore = 50
    if (outlook === 'Bright') growthScore = 85
    if (outlook === 'Below Average') growthScore = 25
    if (brightCategories.includes('Grow Rapidly')) growthScore = Math.max(growthScore, 95)
    if (brightCategories.includes('Numerous Openings')) growthScore = Math.max(growthScore, 90)

    // Education ROI Score (0-100)
    const jobZone = career.education?.job_zone || 2
    const hasApprenticeships = (career.education?.apprenticeships?.title?.length || 0) > 0
    
    // Calculate education cost/benefit ratio
    let educationScore = 70
    if (jobZone <= 2 && median > 60000) educationScore = 95 // Low education, high pay
    else if (jobZone >= 4 && median < 80000) educationScore = 40 // High education, lower pay
    else if (jobZone === 3 && median > 70000) educationScore = 85 // Sweet spot
    if (hasApprenticeships) educationScore += 10 // Bonus for apprenticeships
    educationScore = Math.min(educationScore, 100)

    // Location Score (0-100)
    let locationScore = 50
    const stateData = career.check_out_my_state
    if (stateData) {
      // Check user's current state
      const currentStateQuotient = getLocationQuotient(career, userState)
      if (currentStateQuotient >= 1.2) locationScore = 90
      else if (currentStateQuotient >= 1.0) locationScore = 70
      else if (currentStateQuotient >= 0.8) locationScore = 50
      else locationScore = 30

      // If considering relocation
      if (relocationState) {
        const targetQuotient = getLocationQuotient(career, relocationState)
        if (targetQuotient > currentStateQuotient) {
          locationScore = Math.min(locationScore + 20, 100)
        }
      }
    }

    // Sustainability Score (0-100) - Future-proof careers
    let sustainabilityScore = 50
    if (career.career?.tags?.green) sustainabilityScore += 20
    if (career.career?.tags?.bright_outlook) sustainabilityScore += 15
    if (jobZone >= 3) sustainabilityScore += 15 // Higher skill = harder to automate
    sustainabilityScore = Math.min(sustainabilityScore, 100)

    // Calculate weighted overall score
    const weights = {
      salary: 0.30,
      growth: 0.25,
      education: 0.20,
      location: 0.15,
      sustainability: 0.10
    }

    const overall = Math.round(
      salaryScore * weights.salary +
      growthScore * weights.growth +
      educationScore * weights.education +
      locationScore * weights.location +
      sustainabilityScore * weights.sustainability
    )

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' = 'medium'
    const scores = [salaryScore, growthScore, educationScore, locationScore, sustainabilityScore]
    const variance = Math.max(...scores) - Math.min(...scores)
    if (variance < 20 && overall > 70) confidence = 'high'
    else if (variance > 40 || overall < 50) confidence = 'low'

    // Generate recommendations
    const recommendations = generateRecommendations(career, {
      salaryScore,
      growthScore,
      educationScore,
      locationScore,
      sustainabilityScore
    }, userState, relocationState)

    return {
      overall,
      breakdown: {
        salary: Math.round(salaryScore),
        growth: Math.round(growthScore),
        education: Math.round(educationScore),
        location: Math.round(locationScore),
        sustainability: Math.round(sustainabilityScore)
      },
      confidence,
      recommendations
    }
  }

  const getLocationQuotient = (career: Career, state: string): number => {
    const stateData = career.check_out_my_state
    if (!stateData) return 1.0

    const categories = ['above_average', 'average', 'below_average'] as const
    for (const category of categories) {
      const categoryData = stateData[category]
      if (categoryData?.state) {
        const stateObj = categoryData.state.find((s: any) => s.postal_code === state)
        if (stateObj && stateObj.location_quotient !== undefined) {
          return stateObj.location_quotient
        }
      }
    }
    return 1.0
  }

  const generateRecommendations = (
    career: Career,
    scores: Record<string, number>,
    userState: string,
    relocationState?: string
  ): string[] => {
    const recommendations: string[] = []
    const title = getCareerTitle(career)

    // Salary recommendations
    if (scores.salaryScore >= 80) {
      recommendations.push(`${title} offers excellent earning potential above industry standards`)
    } else if (scores.salaryScore < 50) {
      recommendations.push(`Consider salary growth trajectory and additional certifications to boost earnings`)
    }

    // Growth recommendations
    if (scores.growthScore >= 85) {
      recommendations.push(`Strong job growth expected - enter this field soon to maximize opportunities`)
    } else if (scores.growthScore < 40) {
      recommendations.push(`Limited growth projected - develop specialized skills to stand out`)
    }

    // Education recommendations
    if (scores.educationScore >= 85) {
      recommendations.push(`Excellent ROI on education investment with GI Bill benefits`)
    } else if (scores.educationScore < 50) {
      recommendations.push(`Consider apprenticeships or alternative pathways to reduce education costs`)
    }

    // Location recommendations
    if (scores.locationScore < 50 && !relocationState) {
      recommendations.push(`Job concentration is low in ${userState} - consider exploring opportunities in other states`)
    } else if (scores.locationScore >= 80) {
      recommendations.push(`High demand in your area - leverage local networking opportunities`)
    }

    // Sustainability recommendations
    if (career.career?.tags?.green) {
      recommendations.push(`Green career with long-term sustainability and growth potential`)
    }

    return recommendations.slice(0, 3) // Top 3 recommendations
  }

  const careerScores = useMemo(() => {
    return careers.map(career => ({
      career,
      score: calculateVetROIScore(career)
    })).sort((a, b) => b.score.overall - a.score.overall)
  }, [careers])

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4ecdc4'
    if (score >= 65) return '#ffe66d'
    if (score >= 50) return '#ff9f40'
    return '#ff6b6b'
  }

  const getConfidenceIcon = (confidence: string): string => {
    switch (confidence) {
      case 'high': return '⬆️'
      case 'medium': return '➡️'
      case 'low': return '⬇️'
      default: return '❓'
    }
  }

  return (
    <div className="decision-matrix">
      <div className="matrix-header">
        <h3>VetROI™ Decision Matrix</h3>
        <p className="matrix-subtitle">
          Comprehensive analysis combining salary, growth, education ROI, location, and sustainability factors
        </p>
      </div>

      {/* Overall Rankings */}
      <div className="career-rankings">
        <h4>Career Rankings by VetROI™ Score</h4>
        <div className="ranking-cards">
          {careerScores.map(({ career, score }, index) => (
            <div key={career.soc || career.code || index} className="ranking-card">
              <div className="rank-number">#{index + 1}</div>
              <div className="career-info">
                <h5>{getCareerTitle(career)}</h5>
                <div className="score-display">
                  <span 
                    className="overall-score" 
                    style={{ color: getScoreColor(score.overall) }}
                  >
                    {score.overall}
                  </span>
                  <span className="score-label">VetROI™ Score</span>
                  <span className="confidence-indicator">
                    {getConfidenceIcon(score.confidence)} {score.confidence} confidence
                  </span>
                </div>
              </div>
              
              {/* Score Breakdown Bar */}
              <div className="score-breakdown-bar">
                <div className="breakdown-segment salary" style={{ width: `${score.breakdown.salary * 0.3}%` }} title={`Salary: ${score.breakdown.salary}`} />
                <div className="breakdown-segment growth" style={{ width: `${score.breakdown.growth * 0.25}%` }} title={`Growth: ${score.breakdown.growth}`} />
                <div className="breakdown-segment education" style={{ width: `${score.breakdown.education * 0.2}%` }} title={`Education: ${score.breakdown.education}`} />
                <div className="breakdown-segment location" style={{ width: `${score.breakdown.location * 0.15}%` }} title={`Location: ${score.breakdown.location}`} />
                <div className="breakdown-segment sustainability" style={{ width: `${score.breakdown.sustainability * 0.1}%` }} title={`Sustainability: ${score.breakdown.sustainability}`} />
              </div>

              {/* Top Recommendations */}
              <div className="recommendations">
                {score.recommendations.map((rec, i) => (
                  <p key={i} className="recommendation">• {rec}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Radar Chart Comparison */}
      <div className="radar-comparison">
        <h4>Multi-Factor Analysis</h4>
        <RadarChart
          data={careerScores.map(({ career, score }) => ({
            name: getCareerTitle(career),
            values: [
              score.breakdown.salary,
              score.breakdown.growth,
              score.breakdown.education,
              score.breakdown.location,
              score.breakdown.sustainability
            ]
          }))}
          categories={['Salary', 'Growth', 'Education ROI', 'Location', 'Sustainability']}
        />
      </div>

      {/* Action Plan */}
      <div className="action-plan">
        <h4>Your Personalized Action Plan</h4>
        <div className="action-steps">
          {careerScores.slice(0, 1).map(({ career, score }) => (
            <div key={career.soc || career.code} className="career-action-plan">
              <h5>Recommended Path: {getCareerTitle(career)}</h5>
              
              <div className="action-timeline">
                <div className="timeline-item immediate">
                  <span className="timeline-marker">Now</span>
                  <div className="timeline-content">
                    <h6>Immediate Actions</h6>
                    <ul>
                      <li>Research {career.education?.education_usually_needed?.category?.[0] || 'education'} programs</li>
                      <li>Connect with veterans in this field on LinkedIn</li>
                      <li>Assess transferable skills from {veteranProfile?.code || 'military experience'}</li>
                    </ul>
                  </div>
                </div>

                <div className="timeline-item short-term">
                  <span className="timeline-marker">3-6 months</span>
                  <div className="timeline-content">
                    <h6>Short-term Goals</h6>
                    <ul>
                      <li>Complete foundational certifications</li>
                      <li>Apply to education programs using GI Bill</li>
                      {score.breakdown.location < 70 && <li>Research job markets in high-demand states</li>}
                    </ul>
                  </div>
                </div>

                <div className="timeline-item long-term">
                  <span className="timeline-marker">1-2 years</span>
                  <div className="timeline-content">
                    <h6>Long-term Objectives</h6>
                    <ul>
                      <li>Complete education/training requirements</li>
                      <li>Target entry-level salary of ${((career.job_outlook?.salary?.annual_median || 50000) * 0.8 / 1000).toFixed(0)}K+</li>
                      <li>Build professional network in target location</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}