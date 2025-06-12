import React from 'react'

interface Career {
  code: string
  title: string
  tags?: {
    bright_outlook?: boolean
    green?: boolean
  }
}

interface CareerCardProps {
  career: Career
  index: number
  onSelect: (socCode: string) => void
}

export const CareerCard: React.FC<CareerCardProps> = ({ career, index, onSelect }) => {
  const handleClick = () => {
    onSelect(career.code)
  }

  return (
    <div className="career-option-card" onClick={handleClick}>
      <div className="career-option-header">
        <span className="career-number">{index}.</span>
        <h4>{career.title}</h4>
      </div>
      <div className="career-option-meta">
        <span className="soc-code">SOC: {career.code}</span>
        {career.tags?.bright_outlook && (
          <span className="career-tag bright-outlook">High Growth</span>
        )}
        {career.tags?.green && (
          <span className="career-tag green">Green Job</span>
        )}
      </div>
    </div>
  )
}