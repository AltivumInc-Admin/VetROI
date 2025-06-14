import React from 'react'
import '../styles/CareerMatchCard.css'

interface CareerMatchCardProps {
  code: string
  title: string
  brightOutlook: boolean
  green: boolean
  onSOCClick: (code: string) => void
}

export const CareerMatchCard: React.FC<CareerMatchCardProps> = ({
  code,
  title,
  brightOutlook,
  green,
  onSOCClick
}) => {
  const handleClick = () => {
    onSOCClick(code)
  }

  return (
    <div className="career-match-card">
      <div className="card-header">
        <button 
          className="soc-code-button"
          onClick={handleClick}
          type="button"
        >
          {code}
        </button>
        {brightOutlook && (
          <span className="star-indicator" title="Bright Outlook">
            ⭐
          </span>
        )}
      </div>
      
      <div className="card-content">
        <h3 className="career-title">{title}</h3>
      </div>
      
      {green && (
        <div className="green-indicator">
          <span className="tag green">
            <span className="tag-icon">🌱</span>
            Green Career
          </span>
        </div>
      )}
    </div>
  )
}