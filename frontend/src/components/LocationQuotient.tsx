import React from 'react'
import '../styles/LocationQuotient.css'

interface LocationQuotientProps {
  state?: string
  stateCode: string
  quotient: number
  relocationState?: string
  relocationStateCode?: string
  relocationQuotient?: number
}

export const LocationQuotient: React.FC<LocationQuotientProps> = ({ 
  state, 
  stateCode, 
  quotient,
  relocationState,
  relocationStateCode,
  relocationQuotient 
}) => {
  // Determine demand level and color
  const getDemandLevel = (q: number) => {
    if (q >= 1.5) return { level: 'High Demand', color: 'high', description: `${Math.round((q - 1) * 100)}% more jobs than national average` }
    if (q >= 1.0) return { level: 'Average Demand', color: 'average', description: 'Similar to national average' }
    return { level: 'Below Average', color: 'low', description: `${Math.round((1 - q) * 100)}% fewer jobs than national average` }
  }

  const demand = getDemandLevel(quotient)
  const barWidth = Math.min(quotient * 50, 100) // Cap at 100% width for quotients above 2.0
  
  // Calculate relocation comparison if available
  const showComparison = relocationQuotient !== undefined
  const relocationDemand = relocationQuotient ? getDemandLevel(relocationQuotient) : null
  const relocationBarWidth = relocationQuotient ? Math.min(relocationQuotient * 50, 100) : 0
  
  const calculateDifference = () => {
    if (!relocationQuotient) return null
    const diff = ((relocationQuotient - quotient) / quotient) * 100
    return diff
  }
  
  const difference = calculateDifference()

  return (
    <div className={`location-quotient ${showComparison ? 'comparison-mode' : ''}`}>
      {!showComparison ? (
        // Single state view
        <>
          <div className="location-header">
            <div className="state-info">
              <span className="state-code">{stateCode}</span>
              <span className="state-name">{state || stateCode}</span>
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
        </>
      ) : (
        // Comparison view
        <>
          <div className="comparison-header">
            <h4>Location Comparison</h4>
            {difference !== null && (
              <div className="difference-indicator">
                {difference > 0 ? (
                  <span className="positive">+{difference.toFixed(0)}% more opportunities in {relocationStateCode}</span>
                ) : difference < 0 ? (
                  <span className="negative">{difference.toFixed(0)}% fewer opportunities in {relocationStateCode}</span>
                ) : (
                  <span className="neutral">Similar opportunities in both states</span>
                )}
              </div>
            )}
          </div>
          
          {/* Current State */}
          <div className="state-comparison">
            <div className="comparison-label">Current Location</div>
            <div className="location-header">
              <div className="state-info">
                <span className="state-code">{stateCode}</span>
                <span className="state-name">{state || stateCode}</span>
              </div>
              <div className="quotient-value">
                <span className="lq-label">LQ:</span>
                <span className={`lq-number ${demand.color}`}>{quotient.toFixed(2)}</span>
              </div>
            </div>
            <div className="quotient-bar">
              <div className="bar-container">
                <div 
                  className={`bar-fill ${demand.color}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Relocation State */}
          <div className="state-comparison">
            <div className="comparison-label">Considering Relocation</div>
            <div className="location-header">
              <div className="state-info">
                <span className="state-code">{relocationStateCode}</span>
                <span className="state-name">{relocationState || relocationStateCode}</span>
              </div>
              <div className="quotient-value">
                <span className="lq-label">LQ:</span>
                <span className={`lq-number ${relocationDemand?.color}`}>{relocationQuotient?.toFixed(2)}</span>
              </div>
            </div>
            <div className="quotient-bar">
              <div className="bar-container">
                <div 
                  className={`bar-fill ${relocationDemand?.color}`}
                  style={{ width: `${relocationBarWidth}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}

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