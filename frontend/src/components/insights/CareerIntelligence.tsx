import React, { useState } from 'react'
import '../../styles/insights/CareerIntelligence.css'

interface CareerIntelligenceProps {
  data: any
}

export const CareerIntelligence: React.FC<CareerIntelligenceProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'opportunities' | 'compensation' | 'geographic'>('opportunities')
  
  const recommendations = data.insights?.career_recommendations || []
  const marketIntel = data.insights?.market_intelligence || {}
  const compensation = data.insights?.compensation_intelligence || {}
  
  const renderOpportunities = () => {
    const immediateOps = marketIntel.immediate_opportunities || []
    const allOpportunities = [...recommendations, ...immediateOps]
    
    return (
      <div className="opportunities-section">
        <div className="opportunities-grid">
          {allOpportunities.map((opp: any, index: number) => (
            <div key={index} className="opportunity-card">
              <div className="opportunity-header">
                <h3>{opp.title}</h3>
                {opp.match_percentage && (
                  <div className="match-badge">{opp.match_percentage}% Match</div>
                )}
              </div>
              
              <div className="salary-range">
                <span className="salary-icon">💰</span>
                <span>{opp.salary_range}</span>
              </div>
              
              {opp.reasoning && (
                <p className="opportunity-reasoning">{opp.reasoning}</p>
              )}
              
              {opp.your_advantage && (
                <div className="your-advantage">
                  <h4>Your Advantage</h4>
                  <p>{opp.your_advantage}</p>
                </div>
              )}
              
              {opp.application_hack && (
                <div className="application-hack">
                  <h4>🎯 Insider Tip</h4>
                  <p>{opp.application_hack}</p>
                </div>
              )}
              
              {opp.companies_hiring_now && opp.companies_hiring_now.length > 0 && (
                <div className="companies-section">
                  <h4>Companies Actively Hiring</h4>
                  <div className="company-tags">
                    {opp.companies_hiring_now.map((company: string, idx: number) => (
                      <span key={idx} className="company-tag">{company}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {opp.company_targets && opp.company_targets.length > 0 && (
                <div className="companies-section">
                  <h4>Target Companies</h4>
                  <div className="company-tags">
                    {opp.company_targets.map((company: string, idx: number) => (
                      <span key={idx} className="company-tag">{company}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {opp.application_keywords && opp.application_keywords.length > 0 && (
                <div className="keywords-section">
                  <h4>Key Application Keywords</h4>
                  <div className="keyword-tags">
                    {opp.application_keywords.map((keyword: string, idx: number) => (
                      <span key={idx} className="keyword-tag">{keyword}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {opp.fast_track && (
                <div className="fast-track">
                  <span className="fast-track-icon">⚡</span>
                  <p>{opp.fast_track}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  const renderCompensation = () => {
    const baseSalary = compensation.base_salary_targets || {}
    const totalComp = compensation.total_comp_breakdown || {}
    const negotiation = compensation.negotiation_timeline || {}
    
    return (
      <div className="compensation-section">
        {/* Salary Range Visualization */}
        <div className="salary-visualization">
          <h3>Your Target Salary Range</h3>
          <div className="salary-scale">
            <div className="salary-marker conservative">
              <span className="marker-label">Conservative</span>
              <span className="marker-value">{baseSalary.conservative || '$80K'}</span>
            </div>
            <div className="salary-marker market">
              <span className="marker-label">Market Rate</span>
              <span className="marker-value">{baseSalary.market || '$120K'}</span>
            </div>
            <div className="salary-marker aggressive">
              <span className="marker-label">Aggressive</span>
              <span className="marker-value">{baseSalary.aggressive || '$150K'}</span>
            </div>
            <div className="salary-bar">
              <div className="salary-range-fill"></div>
            </div>
          </div>
        </div>
        
        {/* Total Compensation Breakdown */}
        <div className="comp-breakdown">
          <h3>Total Compensation Breakdown</h3>
          <div className="comp-items">
            <div className="comp-item">
              <span className="comp-label">Base Salary</span>
              <span className="comp-value">{totalComp.base || '$120,000'}</span>
            </div>
            <div className="comp-item">
              <span className="comp-label">Bonus Potential</span>
              <span className="comp-value">{totalComp.bonus_potential || '15-25%'}</span>
            </div>
            {totalComp.clearance_premium && (
              <div className="comp-item premium">
                <span className="comp-label">Clearance Premium</span>
                <span className="comp-value">+{totalComp.clearance_premium}</span>
              </div>
            )}
            <div className="comp-item">
              <span className="comp-label">Equity Eligibility</span>
              <span className="comp-value">{totalComp.equity_eligibility || 'Yes'}</span>
            </div>
          </div>
        </div>
        
        {/* Negotiation Strategy */}
        <div className="negotiation-strategy">
          <h3>Negotiation Timeline</h3>
          <div className="timeline-steps">
            <div className="timeline-step">
              <div className="step-number">1</div>
              <h4>Initial Offer</h4>
              <p>{negotiation.initial_offer || 'Expect 15-20% below ask'}</p>
            </div>
            <div className="timeline-step">
              <div className="step-number">2</div>
              <h4>Counter Strategy</h4>
              <p>{negotiation.counter_strategy || 'Ask for 30% above initial'}</p>
            </div>
            <div className="timeline-step">
              <div className="step-number">3</div>
              <h4>Walk Away Point</h4>
              <p>{negotiation.walk_away_point || 'Know your worth'}</p>
            </div>
          </div>
        </div>
        
        {/* Clearance Value */}
        {marketIntel.clearance_arbitrage && (
          <div className="clearance-value">
            <h3>Security Clearance Value</h3>
            <div className="clearance-content">
              <div className="clearance-stat">
                <span className="stat-label">Current Value</span>
                <span className="stat-value">{marketIntel.clearance_arbitrage.current_value}</span>
              </div>
              <div className="clearance-sectors">
                <h4>High-Demand Sectors</h4>
                <div className="sector-tags">
                  {(marketIntel.clearance_arbitrage.high_demand_sectors || []).map((sector: string, idx: number) => (
                    <span key={idx} className="sector-tag">{sector}</span>
                  ))}
                </div>
              </div>
              <div className="maintenance-strategy">
                <h4>Maintenance Strategy</h4>
                <p>{marketIntel.clearance_arbitrage.maintenance_strategy}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  const renderGeographic = () => {
    const locations = marketIntel.geographic_goldmines || []
    
    return (
      <div className="geographic-section">
        <div className="locations-grid">
          {locations.map((location: any, index: number) => (
            <div key={index} className="location-card">
              <div className="location-header">
                <h3>{location.location}</h3>
                <span className="location-icon">📍</span>
              </div>
              
              <div className="location-reason">
                <h4>Why This Location?</h4>
                <p>{location.why_here}</p>
              </div>
              
              <div className="cost-benefit">
                <h4>Cost/Benefit Analysis</h4>
                <p>{location.cost_benefit}</p>
              </div>
              
              <div className="key-employers">
                <h4>Key Employers</h4>
                <div className="employer-list">
                  {(location.key_employers || []).map((employer: string, idx: number) => (
                    <div key={idx} className="employer-item">
                      <span className="employer-icon">🏢</span>
                      <span>{employer}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {locations.length === 0 && (
          <div className="no-locations">
            <p>Geographic analysis is being generated based on your profile...</p>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="career-intelligence">
      <div className="section-header">
        <h1>Career Intelligence</h1>
        <p>Comprehensive analysis of your civilian career opportunities</p>
      </div>
      
      <div className="intelligence-tabs">
        <button 
          className={`tab-button ${activeTab === 'opportunities' ? 'active' : ''}`}
          onClick={() => setActiveTab('opportunities')}
        >
          <span className="tab-icon">💼</span>
          Immediate Opportunities
        </button>
        <button 
          className={`tab-button ${activeTab === 'compensation' ? 'active' : ''}`}
          onClick={() => setActiveTab('compensation')}
        >
          <span className="tab-icon">💰</span>
          Compensation Strategy
        </button>
        <button 
          className={`tab-button ${activeTab === 'geographic' ? 'active' : ''}`}
          onClick={() => setActiveTab('geographic')}
        >
          <span className="tab-icon">🗺️</span>
          Geographic Analysis
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'opportunities' && renderOpportunities()}
        {activeTab === 'compensation' && renderCompensation()}
        {activeTab === 'geographic' && renderGeographic()}
      </div>
    </div>
  )
}