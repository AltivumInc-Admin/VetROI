import React from 'react'
import '../styles/EducationBadge.css'

interface EducationBadgeProps {
  level: string
  jobZone?: number
}

export const EducationBadge: React.FC<EducationBadgeProps> = ({ level, jobZone }) => {
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

  return (
    <div className={`education-badge ${getClassName()}`}>
      <span className="badge-icon">{getIcon()}</span>
      <div className="badge-content">
        <span className="badge-label">{formatLevel()}</span>
        {jobZone && (
          <span className="job-zone">Job Zone {jobZone}</span>
        )}
      </div>
    </div>
  )
}