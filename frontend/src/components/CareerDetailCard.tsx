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
  const [isExpanded, setIsExpanded] = useState(false)
  
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
          <h2>{career?.title || socData.title}</h2>
          <span className="soc-code">{socData.code || socData.soc}</span>
        </div>
      </div>

      {/* Also Called Section */}
      {career?.also_called?.title && career.also_called.title.length > 0 && (
        <section className="also-called-section">
          <div className="inline-section">
            <h4>Also Known As:</h4>
            <span className="alternative-titles">
              {career.also_called.title.join(' • ')}
            </span>
          </div>
        </section>
      )}

      {/* Growth Outlook at Top */}
      {jobOutlook?.outlook && (
        <div className={`growth-outlook-top ${jobOutlook.outlook.category?.toLowerCase()}`}>
          <div className="outlook-header">
            <span className="outlook-icon">📈</span>
            <h3>Career Growth Outlook</h3>
          </div>
          <div className="outlook-content">
            <span className="outlook-category">{jobOutlook.outlook.category}</span>
            <p className="outlook-description">{jobOutlook.outlook.description}</p>
            {jobOutlook.bright_outlook?.category && (
              <div className="outlook-details">
                {jobOutlook.bright_outlook.category.map((cat: string, idx: number) => (
                  <span key={idx} className="outlook-tag">{cat}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Green Career Badge */}
      {career.tags?.green && (
        <div className="green-career-badge">
          <span className="badge green" title="Green Career">
            🌱 Green Career
          </span>
        </div>
      )}

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

      {/* Requirements Group */}
      <div className="onet-data-group">
        {/* Knowledge Section */}
        {socData.knowledge?.group && socData.knowledge.group.length > 0 && (
          <section className="onet-compact-section">
            <h3>Knowledge Areas</h3>
            <p className="onet-attribution">
              Source: O*NET - U.S. Department of Labor
            </p>
            <div className="compact-groups">
              {socData.knowledge.group.map((group: any, idx: number) => (
                <div key={idx} className="compact-group">
                  <span className="group-label">{group.title.name}</span>
                  <span className="group-items">
                    {group.element.map((el: any) => el.name).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills Section */}
        {socData.skills?.group && socData.skills.group.length > 0 && (
          <section className="onet-compact-section">
            <h3>Essential Skills</h3>
            <div className="compact-groups">
              {socData.skills.group.map((group: any, idx: number) => (
                <div key={idx} className="compact-group">
                  <span className="group-label">{group.title.name}</span>
                  <span className="group-items">
                    {group.element.map((el: any) => el.name).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Abilities Section */}
        {socData.abilities?.group && socData.abilities.group.length > 0 && (
          <section className="onet-compact-section">
            <h3>Core Abilities</h3>
            <div className="compact-groups">
              {socData.abilities.group.map((group: any, idx: number) => (
                <div key={idx} className="compact-group">
                  <span className="group-label">{group.title.name}</span>
                  <span className="group-items">
                    {group.element.map((el: any) => el.name).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Personal Fit Group */}
      <div className="onet-data-group">
        {/* Personality Section */}
        {socData.personality && (
          <section className="onet-compact-section">
            <h3>Personality Profile</h3>
            <div className="compact-groups">
              {socData.personality.top_interest && (
                <div className="compact-group">
                  <span className="group-label">Primary Interest</span>
                  <span className="group-items">
                    {socData.personality.top_interest.title} - {socData.personality.top_interest.description}
                  </span>
                </div>
              )}
              
              {socData.personality.work_styles?.element && (
                <div className="compact-group">
                  <span className="group-label">Work Styles</span>
                  <span className="group-items">
                    {socData.personality.work_styles.element.map((style: any) => style.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Tools & Environment Group */}
      <div className="onet-data-group">
        {/* Technology Section */}
        {socData.technology?.category && socData.technology.category.length > 0 && (
          <section className="onet-compact-section">
            <h3>Technology & Tools</h3>
            <div className="tech-legend">
              <span className="legend-item">
                <span className="legend-box hot"></span>
                <span className="legend-text">High-demand technology</span>
              </span>
              <span className="legend-item">
                <span className="legend-box regular"></span>
                <span className="legend-text">Standard technology</span>
              </span>
            </div>
            <div className="tech-table">
              {socData.technology.category.map((cat: any, idx: number) => (
                <div key={idx} className="tech-row">
                  <span className="tech-category-name">{cat.title.name}</span>
                  <div className="tech-items">
                    {cat.example.map((ex: any, exIdx: number) => (
                      <span 
                        key={exIdx} 
                        className={`tech-name ${ex.hot_technology ? 'hot-technology' : ''}`}
                      >
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
      </div>

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