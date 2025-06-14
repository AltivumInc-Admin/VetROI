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