import React, { useState } from 'react'
import { SalaryGraph } from './SalaryGraph'
import { LocationQuotient } from './LocationQuotient'
import { EducationBadge } from './EducationBadge'
import '../styles/CareerDetailCard.css'

interface CareerDetailCardProps {
  socData: any
  userState?: string
}

export const CareerDetailCard: React.FC<CareerDetailCardProps> = ({ 
  socData, 
  userState = 'CA' 
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  
  if (!socData || !socData.career) {
    return <div className="career-detail-card loading">Loading career data...</div>
  }

  const career = socData.career
  const education = socData.education
  const jobOutlook = socData.job_outlook
  const checkOutMyState = socData.check_out_my_state

  // Extract location data for user's state
  const getLocationQuotient = () => {
    const allStates = [
      ...(checkOutMyState?.above_average?.state || []),
      ...(checkOutMyState?.average?.state || []),
      ...(checkOutMyState?.below_average?.state || [])
    ]
    return allStates.find(state => state.postal_code === userState)
  }

  const locationData = getLocationQuotient()

  return (
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
        <p className="description">{career.what_they_do}</p>
        
        <h4>Daily Tasks</h4>
        <ul className="tasks-list">
          {career.on_the_job?.task?.slice(0, 5).map((task: string, index: number) => (
            <li key={index}>{task}</li>
          ))}
        </ul>
      </section>

      {/* Education Requirements */}
      <section className="education-section">
        <h3>Education Requirements</h3>
        <div className="education-badges">
          {education.education_usually_needed?.category?.map((cat: string, index: number) => (
            <EducationBadge key={index} level={cat} jobZone={education.job_zone} />
          ))}
        </div>
      </section>

      {/* Salary Visualization */}
      <section className="salary-section">
        <h3>Salary Range</h3>
        {jobOutlook.salary && (
          <SalaryGraph salaryData={jobOutlook.salary} />
        )}
      </section>

      {/* Location Analysis */}
      <section className="location-section">
        <h3>Job Market in Your State</h3>
        {locationData ? (
          <LocationQuotient 
            state={locationData.name}
            stateCode={locationData.postal_code}
            quotient={locationData.location_quotient}
          />
        ) : (
          <p className="no-data">No specific data available for {userState}</p>
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

      {/* Expand/Collapse Button */}
      <button 
        className="expand-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Show Less' : 'Show More'}
      </button>
    </div>
  )
}