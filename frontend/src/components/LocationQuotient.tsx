import React from 'react'
import '../styles/LocationQuotient.css'

interface LocationQuotientProps {
  state: string
  stateCode: string
  quotient: number
}

export const LocationQuotient: React.FC<LocationQuotientProps> = ({ 
  state, 
  stateCode, 
  quotient 
}) => {
  // Determine demand level and color
  const getDemandLevel = () => {
    if (quotient >= 1.5) return { level: 'High Demand', color: 'high', description: `${Math.round((quotient - 1) * 100)}% more jobs than national average` }
    if (quotient >= 1.0) return { level: 'Average Demand', color: 'average', description: 'Similar to national average' }
    return { level: 'Below Average', color: 'low', description: `${Math.round((1 - quotient) * 100)}% fewer jobs than national average` }
  }

  const demand = getDemandLevel()
  const barWidth = Math.min(quotient * 50, 100) // Cap at 100% width for quotients above 2.0

  return (
    <div className="location-quotient">
      <div className="location-header">
        <div className="state-info">
          <span className="state-code">{stateCode}</span>
          <span className="state-name">{state}</span>
        </div>
        <div className="quotient-value">
          <span className="lq-label">LQ:</span>
          <span className={`lq-number ${demand.color}`}>{quotient.toFixed(2)}</span>
        </div>
      </div>

      <div className="demand-indicator">
        <div className={`demand-level ${demand.color}`}>
          <span className="level-icon">
            {demand.color === 'high' ? '🔥' : demand.color === 'average' ? '📊' : '📉'}
          </span>
          <span className="level-text">{demand.level}</span>
        </div>
        <p className="demand-description">{demand.description}</p>
      </div>

      <div className="quotient-bar">
        <div className="bar-container">
          <div 
            className={`bar-fill ${demand.color}`}
            style={{ width: `${barWidth}%` }}
          />
          <div className="bar-markers">
            <span className="marker" style={{ left: '50%' }}>1.0</span>
          </div>
        </div>
      </div>

      <div className="lq-explanation">
        <h4>What is Location Quotient?</h4>
        <p>
          Location Quotient (LQ) measures job concentration in your state compared to the national average. 
          An LQ of 1.0 means average demand, while higher values indicate more opportunities.
        </p>
      </div>
    </div>
  )
}