import React, { useState } from 'react'
import { SalaryGraph } from './SalaryGraph'
import { LocationQuotient } from './LocationQuotient'
import { EducationBadge } from './EducationBadge'
import '../styles/CareerDetailCard.css'

interface CareerDetailCardProps {
  socData: any
  userState?: string
  relocationState?: string
}

export const CareerDetailCard: React.FC<CareerDetailCardProps> = ({ 
  socData, 
  userState = 'CA',
  relocationState 
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  
  if (!socData) {
    return <div className="career-detail-card loading">Loading career data...</div>
  }

  const career = socData.career
  const education = socData.education
  const jobOutlook = socData.job_outlook
  const checkOutMyState = socData.check_out_my_state

  // Extract location data for user's state
  const getLocationQuotient = (stateCode: string) => {
    const allStates = [
      ...(checkOutMyState?.above_average?.state || []),
      ...(checkOutMyState?.average?.state || []),
      ...(checkOutMyState?.below_average?.state || [])
    ]
    return allStates.find(state => state.postal_code === stateCode)
  }

  const locationData = getLocationQuotient(userState)
  const relocationLocationData = relocationState ? getLocationQuotient(relocationState) : null

  return (
    <div className="career-detail-wrapper">
      <div className={`career-detail-card ${isExpanded ? 'expanded' : ''}`}>
      {/* Header Section */}
      <div className="card-header">
        <div className="title-section">
          <h2>{socData.title}</h2>
          <span className="soc-code">{socData.soc}</span>
        </div>
        <div className="badges">
          {career.tags?.bright_outlook && (
            <span className="badge bright-outlook" title="Bright Outlook Career">
              ⭐ Bright Outlook
            </span>
          )}
          {career.tags?.green && (
            <span className="badge green" title="Green Career">
              🌱 Green Career
            </span>
          )}
        </div>
      </div>

      {/* Career Overview */}
      <section className="career-overview">
        <h3>What They Do</h3>
        <p className="description">{career?.what_they_do || 'No description available'}</p>
        
        <h4>Daily Tasks</h4>
        <ul className="tasks-list">
          {career?.on_the_job?.task?.slice(0, 5).map((task: string, index: number) => (
            <li key={index}>{task}</li>
          )) || <li>No tasks information available</li>}
        </ul>
      </section>

      {/* Education Requirements */}
      <section className="education-section">
        <h3>Education Requirements</h3>
        <div className="education-badges">
          {education?.job_zone && (
            <EducationBadge level={`Job Zone ${education.job_zone}`} jobZone={education.job_zone} />
          )}
        </div>
      </section>

      {/* Salary Visualization */}
      <section className="salary-section">
        <h3>Salary Range</h3>
        {jobOutlook?.salary && (
          <SalaryGraph salaryData={{
            annual_10th_percentile: jobOutlook.salary.annual_10th_percentile,
            annual_median: jobOutlook.salary.annual_median_over || jobOutlook.salary.annual_median || 0,
            annual_90th_percentile: jobOutlook.salary.annual_90th_percentile_over || jobOutlook.salary.annual_90th_percentile || 0,
            hourly_10th_percentile: jobOutlook.salary.hourly_10th_percentile,
            hourly_median: jobOutlook.salary.hourly_median_over || jobOutlook.salary.hourly_median || 0,
            hourly_90th_percentile: jobOutlook.salary.hourly_90th_percentile_over || jobOutlook.salary.hourly_90th_percentile || 0
          }} />
        )}
      </section>

      {/* Location Analysis */}
      <section className="location-section">
        <h3>Job Market Analysis</h3>
        {locationData || relocationLocationData ? (
          <LocationQuotient 
            state={locationData?.name}
            stateCode={locationData?.postal_code || userState}
            quotient={locationData?.location_quotient || 0}
            relocationState={relocationLocationData?.name}
            relocationStateCode={relocationLocationData?.postal_code || relocationState}
            relocationQuotient={relocationLocationData?.location_quotient}
          />
        ) : (
          <p className="no-data">No specific data available for {userState}{relocationState ? ` or ${relocationState}` : ''}</p>
        )}
      </section>

      {/* Growth Outlook */}
      <section className="growth-section">
        <h3>Career Growth Outlook</h3>
        <div className={`growth-indicator ${jobOutlook.outlook?.category?.toLowerCase()}`}>
          <span className="growth-icon">📈</span>
          <div className="growth-details">
            <h4>{jobOutlook.outlook?.category || 'Average'}</h4>
            <p>{jobOutlook.outlook?.description || 'Steady job opportunities expected.'}</p>
          </div>
        </div>
      </section>

      {/* Also Called Section */}
      {career?.also_called?.title && (
        <section className="also-called-section">
          <h3>Also Known As</h3>
          <div className="alternative-titles">
            {career.also_called.title.map((title: string, index: number) => (
              <span key={index} className="alt-title">{title}</span>
            ))}
          </div>
        </section>
      )}

      {/* Knowledge Section */}
      {socData.knowledge?.group && socData.knowledge.group.length > 0 && (
        <section className="knowledge-section">
          <h3>Key Knowledge Areas</h3>
          <p className="section-intro">
            According to <strong>O*NET</strong> (the Occupational Information Network), 
            professionals in this field demonstrate knowledge in:
          </p>
          <div className="knowledge-groups">
            {socData.knowledge.group.map((group: any, idx: number) => (
              <div key={idx} className="knowledge-group">
                <h4>{group.title.name}</h4>
                <div className="knowledge-items">
                  {group.element.map((el: any, elIdx: number) => (
                    <span key={elIdx} className="knowledge-item">{el.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills Section */}
      {socData.skills?.group && socData.skills.group.length > 0 && (
        <section className="skills-section">
          <h3>Essential Skills</h3>
          <div className="skills-groups">
            {socData.skills.group.map((group: any, idx: number) => (
              <div key={idx} className="skills-group">
                <h4>{group.title.name}</h4>
                <div className="skill-items">
                  {group.element.map((el: any, elIdx: number) => (
                    <div key={elIdx} className="skill-item">
                      <span className="skill-bullet">•</span>
                      <span className="skill-text">{el.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Abilities Section */}
      {socData.abilities?.group && socData.abilities.group.length > 0 && (
        <section className="abilities-section">
          <h3>Core Abilities</h3>
          <div className="abilities-groups">
            {socData.abilities.group.map((group: any, idx: number) => (
              <div key={idx} className="abilities-group">
                <h4>{group.title.name}</h4>
                <div className="ability-items">
                  {group.element.map((el: any, elIdx: number) => (
                    <div key={elIdx} className="ability-item">{el.name}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Personality Section */}
      {socData.personality && (
        <section className="personality-section">
          <h3>Personality Profile</h3>
          
          {socData.personality.top_interest && (
            <div className="personality-interest">
              <h4 className="interest-type">{socData.personality.top_interest.title} Interest</h4>
              <p className="interest-desc">{socData.personality.top_interest.description}</p>
            </div>
          )}
          
          {socData.personality.work_styles?.element && (
            <div className="work-styles">
              <h4>Key Work Styles</h4>
              <div className="style-items">
                {socData.personality.work_styles.element.map((style: any, idx: number) => (
                  <span key={idx} className="style-item">{style.name}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Technology Section */}
      {socData.technology?.category && socData.technology.category.length > 0 && (
        <section className="technology-section">
          <h3>Technology & Tools</h3>
          <div className="tech-categories">
            {socData.technology.category.map((cat: any, idx: number) => (
              <div key={idx} className="tech-category">
                <h4>{cat.title.name}</h4>
                <div className="tech-examples">
                  {cat.example.map((ex: any, exIdx: number) => (
                    <span 
                      key={exIdx} 
                      className={`tech-item ${ex.hot_technology ? 'hot-tech' : ''}`}
                    >
                      {ex.hot_technology && <span className="hot-icon">🔥</span>}
                      {ex.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Industries Section */}
      {socData.where_do_they_work?.industry && (
        <section className="industries-section">
          <h3>Where They Work</h3>
          <div className="industry-breakdown">
            {socData.where_do_they_work.industry.map((ind: any, idx: number) => (
              <div key={idx} className="industry-item">
                <div className="industry-bar" style={{ width: `${ind.percent_employed}%` }}>
                  <span className="industry-percent">{ind.percent_employed}%</span>
                </div>
                <span className="industry-name">{ind.title}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Careers Section */}
      {socData.explore_more?.careers?.career && (
        <section className="related-careers-section">
          <h3>Related Career Paths</h3>
          <div className="related-careers">
            {socData.explore_more.careers.career.slice(0, 3).map((career: any) => (
              <div key={career.code} className="related-career">
                <span className="career-code">{career.code}</span>
                <span className="career-title">{career.title}</span>
                {career.tags?.bright_outlook && <span className="outlook-icon">⭐</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      </div>
      
      {/* Expand/Collapse Button - Outside the card div */}
      <button 
        className="expand-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Show Less' : 'Show More'}
      </button>
    </div>
  )
}