import React, { useState } from 'react'
import '../styles/ComparisonLocationMatrix.css'

interface Career {
  soc?: string
  code?: string
  title?: string
  career?: {
    title?: string
  }
  check_out_my_state?: {
    above_average?: {
      state?: Array<{
        postal_code?: string
        location_quotient?: number
        name?: string
      }>
    }
    average?: {
      state?: Array<{
        postal_code?: string
        location_quotient?: number
        name?: string
      }>
    }
    below_average?: {
      state?: Array<{
        postal_code?: string
        location_quotient?: number
        name?: string
      }>
    }
  }
}

interface ComparisonLocationMatrixProps {
  careers: Career[]
  userState?: string
  relocationState?: string
}

const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
}

export const ComparisonLocationMatrix: React.FC<ComparisonLocationMatrixProps> = ({ 
  careers, 
  userState = 'CA',
  relocationState 
}) => {
  const [selectedStates, setSelectedStates] = useState<string[]>([
    userState,
    ...(relocationState && relocationState !== userState ? [relocationState] : []),
    'TX', 'FL', 'NY', 'WA'
  ].slice(0, 6))
  
  const getCareerTitle = (career: Career) => {
    return career.career?.title || career.title || 'Unknown Career'
  }
  
  const getLocationQuotient = (career: Career, state: string): number | null => {
    const stateData = career.check_out_my_state
    if (!stateData) return null
    
    // Check each category
    const categories = ['above_average', 'average', 'below_average'] as const
    
    for (const category of categories) {
      const categoryData = stateData[category]
      if (categoryData?.state) {
        const stateObj = categoryData.state.find(s => s.postal_code === state)
        if (stateObj && stateObj.location_quotient !== undefined) {
          return stateObj.location_quotient
        }
      }
    }
    
    return null
  }
  
  const getEmploymentLevel = (_career: Career, _state: string): number | null => {
    // The API doesn't provide employment numbers per state
    // We'll return null and hide employment numbers in the UI
    return null
  }
  
  const getQuotientColor = (quotient: number | null): string => {
    if (quotient === null) return 'rgba(255, 255, 255, 0.1)'
    if (quotient >= 1.5) return '#4ecdc4' // Excellent
    if (quotient >= 1.2) return '#00d4ff' // Very Good
    if (quotient >= 1.0) return '#ffe66d' // Good
    if (quotient >= 0.8) return '#ff9f40' // Fair
    return '#ff6b6b' // Poor
  }
  
  const getQuotientLabel = (quotient: number | null): string => {
    if (quotient === null) return 'No Data'
    if (quotient >= 1.5) return 'Excellent'
    if (quotient >= 1.2) return 'Very Good'
    if (quotient >= 1.0) return 'Good'
    if (quotient >= 0.8) return 'Fair'
    return 'Poor'
  }
  
  const handleStateChange = (index: number, newState: string) => {
    const newStates = [...selectedStates]
    newStates[index] = newState
    setSelectedStates(newStates)
  }
  
  // Calculate best states for each career
  const getBestStates = (career: Career): string[] => {
    const stateData = career.check_out_my_state
    if (!stateData?.above_average?.state) return []
    
    return stateData.above_average.state
      .sort((a, b) => (b.location_quotient || 0) - (a.location_quotient || 0))
      .slice(0, 5)
      .map(item => item.postal_code || '')
      .filter(Boolean)
  }
  
  return (
    <div className="comparison-location-matrix">
      <div className="location-header">
        <h3>Geographic Opportunity Analysis</h3>
        <p className="location-subtitle">
          Location quotient shows job concentration compared to national average (1.0 = average)
        </p>
      </div>
      
      <div className="state-selectors">
        <h4>Select States to Compare</h4>
        <div className="state-selector-grid">
          {selectedStates.map((state, index) => (
            <div key={index} className="state-selector">
              <select 
                value={state} 
                onChange={(e) => handleStateChange(index, e.target.value)}
                className="state-dropdown"
              >
                <option value="">Select State</option>
                {Object.entries(STATE_NAMES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} ({code})
                  </option>
                ))}
              </select>
              {(state === userState || state === relocationState) && (
                <span className="state-badge">
                  {state === userState ? 'Current' : 'Target'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="location-matrix">
        <div className="matrix-header">
          <div className="matrix-cell career-header">Career</div>
          {selectedStates.map(state => (
            <div key={state} className="matrix-cell state-header">
              {STATE_NAMES[state] || state}
            </div>
          ))}
        </div>
        
        {careers.map((career, careerIndex) => (
          <div key={career.soc || career.code || careerIndex} className="matrix-row">
            <div className="matrix-cell career-name">
              {getCareerTitle(career)}
            </div>
            {selectedStates.map(state => {
              const quotient = getLocationQuotient(career, state)
              const employment = getEmploymentLevel(career, state)
              const color = getQuotientColor(quotient)
              const label = getQuotientLabel(quotient)
              
              return (
                <div 
                  key={state} 
                  className="matrix-cell quotient-cell"
                  style={{ backgroundColor: `${color}20`, borderColor: color }}
                >
                  <div className="quotient-value" style={{ color }}>
                    {quotient !== null ? quotient.toFixed(2) : 'N/A'}
                  </div>
                  <div className="quotient-label">{label}</div>
                  {employment !== null && (
                    <div className="employment-count">
                      {(employment / 1000).toFixed(1)}K jobs
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      
      <div className="location-legend">
        <h4>Location Quotient Scale</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#4ecdc4' }}></div>
            <span>≥ 1.5 - Excellent (50%+ above average)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#00d4ff' }}></div>
            <span>≥ 1.2 - Very Good (20%+ above average)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ffe66d' }}></div>
            <span>≥ 1.0 - Good (at or above average)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff9f40' }}></div>
            <span>≥ 0.8 - Fair (slightly below average)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff6b6b' }}></div>
            <span>&lt; 0.8 - Poor (significantly below average)</span>
          </div>
        </div>
      </div>
      
      <div className="location-insights">
        <h4>Location Strategy Insights</h4>
        <ul>
          {careers.map((career, index) => {
            const bestStates = getBestStates(career)
            const currentQuotient = getLocationQuotient(career, userState)
            
            return (
              <li key={career.soc || career.code || index}>
                <strong>{getCareerTitle(career)}</strong> has highest concentration in{' '}
                {bestStates.slice(0, 3).map(s => STATE_NAMES[s] || s).join(', ')}
                {currentQuotient !== null && currentQuotient < 1.0 && (
                  <span className="insight-warning">
                    {' '}(Consider relocation from {STATE_NAMES[userState]} - quotient: {currentQuotient.toFixed(2)})
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        
        {relocationState && (
          <div className="relocation-analysis">
            <h5>Relocation Impact Analysis</h5>
            <p>
              Moving from <strong>{STATE_NAMES[userState]}</strong> to{' '}
              <strong>{STATE_NAMES[relocationState]}</strong>:
            </p>
            <ul>
              {careers.map((career, index) => {
                const currentQ = getLocationQuotient(career, userState) || 0
                const targetQ = getLocationQuotient(career, relocationState) || 0
                const improvement = ((targetQ - currentQ) / currentQ * 100).toFixed(0)
                
                return (
                  <li key={career.soc || career.code || index}>
                    {getCareerTitle(career)}:{' '}
                    <span className={targetQ > currentQ ? 'positive-change' : 'negative-change'}>
                      {targetQ > currentQ ? '+' : ''}{improvement}% job concentration
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}