import React, { useState } from 'react'
import '../styles/EducationBadge.css'

interface EducationBadgeProps {
  level: string
  jobZone?: number
}

export const EducationBadge: React.FC<EducationBadgeProps> = ({ level, jobZone }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const getIcon = () => {
    const lowerLevel = level.toLowerCase()
    if (lowerLevel.includes('high school')) return '🎓'
    if (lowerLevel.includes('associate')) return '📚'
    if (lowerLevel.includes('bachelor')) return '🎓'
    if (lowerLevel.includes('master')) return '🎓'
    if (lowerLevel.includes('doctoral') || lowerLevel.includes('professional')) return '🎓'
    if (lowerLevel.includes('certificate') || lowerLevel.includes('vocational')) return '📜'
    return '📖'
  }

  const getClassName = () => {
    const lowerLevel = level.toLowerCase()
    if (lowerLevel.includes('high school')) return 'high-school'
    if (lowerLevel.includes('associate')) return 'associate'
    if (lowerLevel.includes('bachelor')) return 'bachelor'
    if (lowerLevel.includes('master')) return 'master'
    if (lowerLevel.includes('doctoral') || lowerLevel.includes('professional')) return 'doctoral'
    if (lowerLevel.includes('certificate') || lowerLevel.includes('vocational')) return 'certificate'
    return 'default'
  }

  const formatLevel = () => {
    // Capitalize first letter of each word
    return level.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const getJobZoneDefinition = (zone: number) => {
    const definitions: { [key: number]: string } = {
      1: "Little or no preparation needed. May require some on-the-job training.",
      2: "Some preparation needed. Usually requires high school diploma and some training.",
      3: "Medium preparation needed. Most require training in vocational schools or apprenticeships.",
      4: "Considerable preparation needed. Most require a four-year bachelor's degree.",
      5: "Extensive preparation needed. Most require graduate school or professional degree."
    }
    return definitions[zone] || "Job preparation level information"
  }

  return (
    <div className={`education-badge ${getClassName()}`}>
      <span className="badge-icon">{getIcon()}</span>
      <div className="badge-content">
        <span className="badge-label">{formatLevel()}</span>
        {jobZone && (
          <div className="job-zone-wrapper">
            <span 
              className="job-zone"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              Job Zone {jobZone}
              <span className="info-icon">ⓘ</span>
            </span>
            {showTooltip && (
              <div className="job-zone-tooltip">
                <strong>Job Zone {jobZone}</strong>
                <p>{getJobZoneDefinition(jobZone)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}