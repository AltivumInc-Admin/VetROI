import React, { useState } from 'react'
import '../../styles/insights/dd214-unified-design.css'
import '../../styles/insights/TimelineRoadmap-refined.css'

interface TimelineRoadmapProps {
  data: any
}

export const TimelineRoadmap: React.FC<TimelineRoadmapProps> = ({ data }) => {
  const [selectedPhase, setSelectedPhase] = useState<'immediate' | '30day' | '60day' | '90day'>('immediate')
  const roadmap = data.insights?.actionable_30_60_90_day_roadmap || {}
  
  const phases = [
    { id: 'immediate', label: '7-Day Sprint', key: 'immediate_7_day_priorities' },
    { id: '30day', label: '30-Day Plan', key: 'day_30_targets' },
    { id: '60day', label: '60-Day Goals', key: 'day_60_targets' },
    { id: '90day', label: '90-Day Vision', key: 'day_90_targets' }
  ]
  
  const getPhaseData = (phaseKey: string) => {
    return roadmap[phaseKey] || []
  }
  
  const getPhaseIcon = (phaseId: string) => {
    switch(phaseId) {
      case 'immediate': return '⚡'
      case '30day': return '🎯'
      case '60day': return '🚀'
      case '90day': return '🏆'
      default: return '📅'
    }
  }
  
  const getPhaseColor = (phaseId: string) => {
    switch(phaseId) {
      case 'immediate': return '#ff6b6b'
      case '30day': return '#4ecdc4'
      case '60day': return '#45b7d1'
      case '90day': return '#96ceb4'
      default: return '#dfe6e9'
    }
  }
  
  return (
    <div className="timeline-roadmap">
      <div className="section-header">
        <h1>Strategic Timeline & Roadmap</h1>
        <p>Your personalized 90-day career transition plan</p>
      </div>
      
      {/* Timeline Navigation */}
      <div className="timeline-navigation">
        <div className="timeline-bar">
          {phases.map((phase, index) => (
            <React.Fragment key={phase.id}>
              <div 
                className={`timeline-node ${selectedPhase === phase.id ? 'active' : ''}`}
                onClick={() => setSelectedPhase(phase.id as any)}
                style={{ 
                  '--phase-color': getPhaseColor(phase.id),
                  '--phase-index': index
                } as React.CSSProperties}
              >
                <div className="node-icon">{getPhaseIcon(phase.id)}</div>
                <div className="node-label">{phase.label}</div>
              </div>
              {index < phases.length - 1 && (
                <div className={`timeline-connector ${
                  phases.findIndex(p => p.id === selectedPhase) > index ? 'completed' : ''
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Phase Details */}
      <div className="phase-details">
        <div className="phase-header">
          <h2>
            <span className="phase-icon">{getPhaseIcon(selectedPhase)}</span>
            {phases.find(p => p.id === selectedPhase)?.label}
          </h2>
        </div>
        
        <div className="phase-content">
          {getPhaseData(phases.find(p => p.id === selectedPhase)?.key || '').map((item: any, index: number) => {
            // Handle both string and object formats
            if (typeof item === 'string') {
              return (
                <div key={index} className="roadmap-item">
                  <div className="item-checkbox">
                    <input type="checkbox" id={`${selectedPhase}-${index}`} />
                    <label htmlFor={`${selectedPhase}-${index}`}></label>
                  </div>
                  <div className="item-content">
                    <p>{item}</p>
                  </div>
                </div>
              )
            } else if (item.action) {
              return (
                <div key={index} className="roadmap-item detailed">
                  <div className="item-checkbox">
                    <input type="checkbox" id={`${selectedPhase}-${index}`} />
                    <label htmlFor={`${selectedPhase}-${index}`}></label>
                  </div>
                  <div className="item-content">
                    <h3>{item.action}</h3>
                    {item.expected_outcome && (
                      <p className="expected-outcome">
                        <span className="outcome-label">Expected Outcome:</span> {item.expected_outcome}
                      </p>
                    )}
                    {item.resources && item.resources.length > 0 && (
                      <div className="resources">
                        <span className="resources-label">Resources:</span>
                        <div className="resource-tags">
                          {item.resources.map((resource: string, idx: number) => (
                            <span key={idx} className="resource-tag">{resource}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            }
            return null
          })}
          
          {getPhaseData(phases.find(p => p.id === selectedPhase)?.key || '').length === 0 && (
            <div className="empty-phase">
              <p>Loading your personalized {phases.find(p => p.id === selectedPhase)?.label} action items...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Win Tracker */}
      <section className="quick-wins">
        <h2>🎯 Quick Win Tracker</h2>
        <p className="section-description">
          Focus on these high-impact, low-effort actions for immediate momentum
        </p>
        
        <div className="quick-win-cards">
          <div className="quick-win-card">
            <div className="win-header">
              <span className="win-icon">📧</span>
              <h3>LinkedIn Profile Update</h3>
            </div>
            <p>Update your headline and summary with military-to-civilian translations</p>
            <div className="win-impact">Impact: High | Time: 30 min</div>
          </div>
          
          <div className="quick-win-card">
            <div className="win-header">
              <span className="win-icon">🤝</span>
              <h3>Veteran Network Activation</h3>
            </div>
            <p>Reach out to 5 veterans in your target industry this week</p>
            <div className="win-impact">Impact: High | Time: 1 hour</div>
          </div>
          
          <div className="quick-win-card">
            <div className="win-header">
              <span className="win-icon">🎓</span>
              <h3>Skills Translation Doc</h3>
            </div>
            <p>Create a one-page military-to-civilian skills translation sheet</p>
            <div className="win-impact">Impact: Medium | Time: 45 min</div>
          </div>
        </div>
      </section>
      
      {/* Milestone Celebrations */}
      <section className="milestones">
        <h2>🏆 Milestone Celebrations</h2>
        <div className="milestone-timeline">
          <div className="milestone-item">
            <div className="milestone-marker week1">
              <span>Week 1</span>
            </div>
            <div className="milestone-content">
              <h4>First Application Submitted</h4>
              <p>You've officially started your civilian career journey!</p>
            </div>
          </div>
          
          <div className="milestone-item">
            <div className="milestone-marker day30">
              <span>Day 30</span>
            </div>
            <div className="milestone-content">
              <h4>First Interview Scheduled</h4>
              <p>Your military experience is opening doors!</p>
            </div>
          </div>
          
          <div className="milestone-item">
            <div className="milestone-marker day60">
              <span>Day 60</span>
            </div>
            <div className="milestone-content">
              <h4>Multiple Opportunities in Pipeline</h4>
              <p>You're building momentum with multiple active conversations!</p>
            </div>
          </div>
          
          <div className="milestone-item">
            <div className="milestone-marker day90">
              <span>Day 90</span>
            </div>
            <div className="milestone-content">
              <h4>Offer Negotiation</h4>
              <p>You're negotiating your worth like the leader you are!</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}