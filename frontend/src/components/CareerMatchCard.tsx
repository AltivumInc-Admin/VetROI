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
      <div className="soc-code-container">
        <button 
          className="soc-code-button"
          onClick={handleClick}
          type="button"
        >
          {code}
        </button>
      </div>
      
      <h3 className="career-title">{title}</h3>
      
      <div className="career-tags">
        {brightOutlook && (
          <span className="tag bright-outlook">
            <span className="tag-icon">⭐</span>
            Bright Outlook
          </span>
        )}
        {green && (
          <span className="tag green">
            <span className="tag-icon">🌱</span>
            Green Career
          </span>
        )}
      </div>
    </div>
  )
}