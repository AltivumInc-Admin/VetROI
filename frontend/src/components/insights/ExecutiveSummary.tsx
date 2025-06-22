import React from 'react'
import '../../styles/insights/ExecutiveSummary-refined.css'

interface ExecutiveSummaryProps {
  data: any
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ data }) => {
  const summary = data.insights?.executive_intelligence_summary || {}
  const profile = data.insights?.extracted_profile || {}
  const compensation = data.insights?.compensation_intelligence || {}
  
  return (
    <div className="executive-summary">
      {/* Hero Section */}
      <section className="hero-section">
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
      <section className="market-position">
        <div className="position-badge">
          <h2>Your Market Position</h2>
          <div className="position-indicator">
            <span className="position-rank">{summary.market_position || 'Top Tier Candidate'}</span>
          </div>
        </div>
      </section>

      {/* Immediate Leverage Points */}
      <section className="leverage-points">
        <h2>Immediate Leverage Points</h2>
        <div className="leverage-grid">
          {(summary.immediate_leverage_points || []).map((point: string, index: number) => (
            <div key={index} className="leverage-card">
              <div className="leverage-icon">
                {index === 0 && '🎖️'}
                {index === 1 && '🎯'}
                {index === 2 && '💪'}
                {index === 3 && '🚀'}
              </div>
              <p>{point}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hidden Multipliers */}
      <section className="hidden-multipliers">
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
      <section className="quick-stats">
        <h2>Your Career Intelligence Snapshot</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Years of Service</div>
            <div className="stat-value">{profile.years_service || 'N/A'}</div>
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
            <div className="stat-value">{profile.leadership_scope || 'Team Leader'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Security Clearance</div>
            <div className="stat-value">{profile.security_clearance || 'Eligible'}</div>
          </div>
        </div>
      </section>

      {/* Key Decorations */}
      {profile.decorations && profile.decorations.length > 0 && (
        <section className="decorations">
          <h2>Distinguished Service</h2>
          <div className="decorations-list">
            {profile.decorations.map((decoration: string, index: number) => (
              <div key={index} className="decoration-badge">
                <span className="medal-icon">🎖️</span>
                <span className="decoration-name">{decoration}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Explore Your Opportunities?</h2>
          <p>Navigate through each section to discover your full career potential</p>
          <div className="cta-buttons">
            <button className="explore-button" onClick={() => {
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