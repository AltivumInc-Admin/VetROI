import React from 'react'
import '../../styles/insights/ExecutiveSummary-refined.css'
import '../../styles/insights/dd214-unified-design.css'

interface ExecutiveSummaryProps {
  data: any
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ data }) => {
  const summary = data.insights?.executive_intelligence_summary || {}
  const profile = data.insights?.extracted_profile || {}
  const compensation = data.insights?.compensation_intelligence || {}
  
  return (
    <div className="executive-summary dd214-insights">
      {/* Hero Section */}
      <section className="hero-section dd214-card">
        <div className="hero-content">
          <div className="rank-badge">
            <span className="rank">{profile.rank || 'Veteran'}</span>
            <span className="branch">{profile.branch || 'Military'}</span>
          </div>
          <h1 className="veteran-name">
            {data.veteranProfile?.name || `${profile.rank} ${profile.branch} Professional`}
          </h1>
          <p className="unique-value">
            {summary.your_unique_value || 'Exceptional military professional ready for civilian success'}
          </p>
        </div>
      </section>

      {/* Market Position */}
      <section className="market-position dd214-card">
        <div className="position-badge">
          <h2>Your Market Position</h2>
          <div className="position-indicator">
            <span className="position-rank">{summary.market_position || 'Top Tier Candidate'}</span>
          </div>
        </div>
      </section>

      {/* Immediate Leverage Points */}
      <section className="leverage-points dd214-card">
        <h2>Immediate Leverage Points</h2>
        <div className="leverage-grid dd214-grid-2">
          {(summary.immediate_leverage_points || []).map((point: string, index: number) => (
            <div key={index} className="leverage-card dd214-highlight">
              <div className="leverage-icon">
                {index === 0 && '★'}
                {index === 1 && '◆'}
                {index === 2 && '▲'}
                {index === 3 && '►'}
              </div>
              <p>{point}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hidden Multipliers */}
      <section className="hidden-multipliers dd214-card">
        <h2>Hidden Value Multipliers</h2>
        <div className="multipliers-container">
          {(summary.hidden_multipliers || []).map((multiplier: string, index: number) => (
            <div key={index} className="multiplier-item">
              <div className="multiplier-header">
                <span className="multiplier-number">{index + 1}</span>
                <h3>Hidden Asset</h3>
              </div>
              <p>{multiplier}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="quick-stats dd214-card">
        <h2>Your Career Intelligence Snapshot</h2>
        <div className="stats-grid dd214-stat-group">
          <div className="stat-card">
            <div className="stat-label">Years of Service</div>
            <div className="stat-value dd214-stat-value">{profile.years_service || 'N/A'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Target Salary Range</div>
            <div className="stat-value">
              {compensation.base_salary_targets?.conservative || '$80K'} - 
              {compensation.base_salary_targets?.aggressive || '$150K'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Leadership Scope</div>
            <div className="stat-value dd214-stat-value">{profile.leadership_scope || 'Team Leader'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Security Clearance</div>
            <div className="stat-value dd214-stat-value">{profile.security_clearance || 'Eligible'}</div>
          </div>
        </div>
      </section>

      {/* Key Decorations */}
      {profile.decorations && profile.decorations.length > 0 && (
        <section className="decorations dd214-card">
          <h2>Distinguished Service</h2>
          <div className="decorations-list">
            {profile.decorations.map((decoration: string, index: number) => (
              <div key={index} className="decoration-badge dd214-badge">
                <span className="medal-icon">★</span>
                <span className="decoration-name">{decoration}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="cta-section dd214-card">
        <div className="cta-content">
          <h2>Ready to Explore Your Opportunities?</h2>
          <p>Navigate through each section to discover your full career potential</p>
          <div className="cta-buttons">
            <button className="explore-button dd214-button" onClick={() => {
              const element = document.querySelector('[data-section="career-intelligence"]') as HTMLElement
              if (element) element.click()
            }}>
              Explore Career Opportunities →
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}