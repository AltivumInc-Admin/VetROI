import React from 'react'
import '../../styles/insights/dd214-unified-design.css'
import '../../styles/insights/LeadershipProfile-refined.css'

interface LeadershipProfileProps {
  data: any
}

export const LeadershipProfile: React.FC<LeadershipProfileProps> = ({ data }) => {
  const hiddenStrengths = data.insights?.hidden_strengths_analysis || {}
  const combatSkills = hiddenStrengths.combat_multiplier_skills || []
  const leadershipPremium = hiddenStrengths.leadership_premium || {}
  const stressValue = hiddenStrengths.stress_inoculation_value || {}
  const profile = data.insights?.extracted_profile || {}
  
  return (
    <div className="leadership-profile">
      <div className="section-header">
        <h1>Leadership Profile</h1>
        <p>Your hidden strengths and combat-tested capabilities</p>
      </div>
      
      {/* Combat Multiplier Skills */}
      <section className="combat-multiplier-section">
        <h2>Combat Multiplier Skills Translation</h2>
        <p className="section-description">
          How your military expertise translates to high-value civilian roles
        </p>
        
        <div className="skills-matrix">
          <table className="skills-table">
            <thead>
              <tr>
                <th>Military Term</th>
                <th>Civilian Gold</th>
                <th>Market Demand</th>
                <th>Your Proof</th>
              </tr>
            </thead>
            <tbody>
              {combatSkills.map((skill: any, index: number) => (
                <tr key={index}>
                  <td className="military-term">
                    <span className="term-badge">{skill.military_term}</span>
                  </td>
                  <td className="civilian-value">
                    <span className="value-amount">{skill.civilian_gold}</span>
                  </td>
                  <td className="market-demand">{skill.market_demand}</td>
                  <td className="proof-points">{skill.proof_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {combatSkills.length === 0 && (
          <div className="empty-state">
            <p>Combat multiplier skills analysis is being generated...</p>
          </div>
        )}
      </section>
      
      {/* Leadership Style Analysis */}
      <section className="leadership-style-section">
        <h2>Leadership Style Profile</h2>
        
        <div className="leadership-visualization">
          <div className="leadership-core">
            <h3>Your Leadership Style</h3>
            <p className="style-description">{leadershipPremium.your_style || 'Military-trained leader'}</p>
            
            <div className="civilian-equivalent">
              <h4>Civilian Equivalent</h4>
              <p className="equivalent-role">{leadershipPremium.civilian_equivalent || 'Executive Leader'}</p>
            </div>
          </div>
          
          <div className="industry-fits">
            <h3>Best Industry Fits</h3>
            <div className="industry-tags">
              {(leadershipPremium.industry_fit || []).map((industry: string, index: number) => (
                <span key={index} className="industry-tag">
                  {industry}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Stress Inoculation Value */}
      <section className="stress-value-section">
        <h2>Stress Inoculation Value</h2>
        <p className="section-description">
          Your ability to perform under pressure is a premium asset
        </p>
        
        <div className="stress-cards">
          <div className="stress-card">
            <h3>Your Threshold</h3>
            <p>{stressValue.your_threshold || 'Combat-tested resilience'}</p>
          </div>
          
          <div className="stress-card">
            <h3>Corporate Application</h3>
            <p>{stressValue.corporate_application || 'Crisis management and high-stakes decision making'}</p>
          </div>
          
          <div className="stress-card premium-roles">
            <h3>Premium Roles</h3>
            <div className="role-list">
              {(stressValue.premium_roles || []).map((role: string, index: number) => (
                <div key={index} className="premium-role">
                  <span className="role-icon">💎</span>
                  <span>{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Leadership Metrics */}
      <section className="leadership-metrics">
        <h2>Leadership by the Numbers</h2>
        
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <h3>Team Leadership</h3>
              <p className="metric-value">{profile.leadership_scope || 'Team Leader'}</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">🎖️</div>
            <div className="metric-content">
              <h3>Final Rank</h3>
              <p className="metric-value">{profile.rank || 'Military Professional'}</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">🌍</div>
            <div className="metric-content">
              <h3>Deployment Experience</h3>
              <p className="metric-value">{profile.deployment_experience || 'Combat Veteran'}</p>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">📚</div>
            <div className="metric-content">
              <h3>Specialized Training</h3>
              <p className="metric-value">{profile.specialized_training?.length || 0} Certifications</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Specialized Training Details */}
      {profile.specialized_training && profile.specialized_training.length > 0 && (
        <section className="training-section">
          <h2>Elite Training & Certifications</h2>
          <div className="training-list">
            {profile.specialized_training.map((training: string, index: number) => (
              <div key={index} className="training-item">
                <span className="training-icon">🎯</span>
                <span className="training-name">{training}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}