import React from 'react'
import '../styles/ComparisonEducationROI.css'

interface Career {
  soc?: string
  code?: string
  title?: string
  career?: {
    title?: string
  }
  education?: {
    job_zone?: number
    education_usually_needed?: {
      category?: string[]
    }
    apprenticeships?: {
      title?: Array<{
        rapids?: string
        name?: string
      }>
    }
  }
  job_outlook?: {
    salary?: {
      annual_median?: number
      annual_median_over?: number
    }
  }
}

interface ComparisonEducationROIProps {
  careers: Career[]
}

const EDUCATION_LEVELS = {
  'no formal educational credential': { years: 0, cost: 0, icon: '🎯' },
  'high school diploma or equivalent': { years: 0, cost: 0, icon: '🎓' },
  'postsecondary nondegree award': { years: 1, cost: 5000, icon: '📜' },
  'some college, no degree': { years: 2, cost: 15000, icon: '📚' },
  'associate\'s degree': { years: 2, cost: 20000, icon: '🎖️' },
  'bachelor\'s degree': { years: 4, cost: 40000, icon: '🎓' },
  'master\'s degree': { years: 6, cost: 70000, icon: '🎓' },
  'doctoral degree': { years: 8, cost: 100000, icon: '🎓' },
  'professional degree': { years: 8, cost: 120000, icon: '🎓' }
}

const JOB_ZONES = {
  1: 'Little or no preparation needed',
  2: 'Some preparation needed',
  3: 'Medium preparation needed',
  4: 'Considerable preparation needed',
  5: 'Extensive preparation needed'
}

export const ComparisonEducationROI: React.FC<ComparisonEducationROIProps> = ({ careers }) => {
  const getCareerTitle = (career: Career) => {
    return career.career?.title || career.title || 'Unknown Career'
  }
  
  const getEducationData = (career: Career) => {
    const education = career.education
    const salary = career.job_outlook?.salary
    
    const educationNeeded = education?.education_usually_needed?.category?.[0] || 'no formal educational credential'
    const educationInfo = EDUCATION_LEVELS[educationNeeded as keyof typeof EDUCATION_LEVELS] || 
                         EDUCATION_LEVELS['high school diploma or equivalent']
    
    const medianSalary = salary?.annual_median_over || salary?.annual_median || 40000
    const jobZone = education?.job_zone || 1
    
    // Calculate ROI metrics
    const yearsToBreakEven = educationInfo.cost > 0 ? 
      Math.ceil(educationInfo.cost / (medianSalary - 30000)) : 0 // Assuming $30k baseline
    
    const tenYearEarnings = medianSalary * 10
    const tenYearROI = educationInfo.cost > 0 ?
      ((tenYearEarnings - educationInfo.cost - (30000 * 10)) / educationInfo.cost * 100) : 0
    
    return {
      education: educationNeeded,
      years: educationInfo.years,
      cost: educationInfo.cost,
      icon: educationInfo.icon,
      jobZone,
      jobZoneDesc: JOB_ZONES[jobZone as keyof typeof JOB_ZONES],
      medianSalary,
      yearsToBreakEven,
      tenYearROI: Math.round(tenYearROI),
      hasApprenticeships: (education?.apprenticeships?.title?.length || 0) > 0,
      apprenticeshipNames: education?.apprenticeships?.title?.map(t => t.name).filter(Boolean) || []
    }
  }
  
  // Sort by ROI
  const sortedCareers = [...careers].sort((a, b) => {
    const aROI = getEducationData(a).tenYearROI
    const bROI = getEducationData(b).tenYearROI
    return bROI - aROI
  })
  
  return (
    <div className="comparison-education-roi">
      <div className="education-header">
        <h3>Education Investment Analysis</h3>
        <p className="education-subtitle">Compare education requirements and financial returns</p>
      </div>
      
      <div className="education-table">
        <div className="table-header">
          <div className="header-cell career">Career</div>
          <div className="header-cell education">Education Required</div>
          <div className="header-cell investment">Investment</div>
          <div className="header-cell salary">Median Salary</div>
          <div className="header-cell roi">10-Year ROI</div>
          <div className="header-cell break-even">Break Even</div>
        </div>
        
        {sortedCareers.map((career, index) => {
          const data = getEducationData(career)
          
          return (
            <div key={career.soc || career.code || index} className="table-row">
              <div className="cell career">
                <span className="career-title">{getCareerTitle(career)}</span>
                <span className="job-zone">Zone {data.jobZone}: {data.jobZoneDesc}</span>
              </div>
              
              <div className="cell education">
                <span className="education-icon">{data.icon}</span>
                <div className="education-details">
                  <span className="education-level">{data.education}</span>
                  <span className="education-time">{data.years} years</span>
                </div>
              </div>
              
              <div className="cell investment">
                <span className="cost">${data.cost.toLocaleString()}</span>
                {data.hasApprenticeships && (
                  <span className="apprenticeship-badge">Apprenticeships Available</span>
                )}
              </div>
              
              <div className="cell salary">
                <span className="salary-amount">${(data.medianSalary / 1000).toFixed(0)}K</span>
                <span className="salary-label">per year</span>
              </div>
              
              <div className="cell roi">
                <div 
                  className={`roi-bar ${data.tenYearROI > 500 ? 'excellent' : data.tenYearROI > 200 ? 'good' : 'moderate'}`}
                  style={{ width: `${Math.min(data.tenYearROI / 10, 100)}%` }}
                />
                <span className="roi-value">{data.tenYearROI}%</span>
              </div>
              
              <div className="cell break-even">
                <span className="break-even-time">
                  {data.yearsToBreakEven === 0 ? 'Immediate' : `${data.yearsToBreakEven} years`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="education-insights">
        <h4>ROI Analysis with GI Bill Benefits</h4>
        <ul>
          {(() => {
            const lowestEducation = sortedCareers.reduce((min, career) => {
              const data = getEducationData(career)
              return data.years < getEducationData(min).years ? career : min
            }, sortedCareers[0])
            
            const lowestEducationData = getEducationData(lowestEducation)
            const highestROI = sortedCareers[0]
            const highestROIData = getEducationData(highestROI)
            
            return (
              <>
                <li>
                  <strong>{getCareerTitle(highestROI)}</strong> offers the highest ROI at{' '}
                  <strong>{highestROIData.tenYearROI}%</strong> with {highestROIData.education}
                </li>
                <li>
                  <strong>{getCareerTitle(lowestEducation)}</strong> requires the least education 
                  ({lowestEducationData.years} years) while still offering ${(lowestEducationData.medianSalary / 1000).toFixed(0)}K median salary
                </li>
                <li>
                  With <strong>Post-9/11 GI Bill</strong>, most education costs are covered, dramatically improving ROI
                </li>
                <li>
                  Consider <strong>Yellow Ribbon schools</strong> for degrees exceeding standard GI Bill coverage
                </li>
              </>
            )
          })()}
        </ul>
      </div>
      
      {careers.some(c => getEducationData(c).hasApprenticeships) && (
        <div className="apprenticeship-section">
          <h4>Available Apprenticeships</h4>
          <div className="apprenticeship-grid">
            {careers.map((career, index) => {
              const data = getEducationData(career)
              if (!data.hasApprenticeships) return null
              
              return (
                <div key={career.soc || career.code || index} className="apprenticeship-card">
                  <h5>{getCareerTitle(career)}</h5>
                  <ul className="apprenticeship-list">
                    {data.apprenticeshipNames.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}