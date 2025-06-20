import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDD214InsightsData } from '../api'
import { SkeletonLoader } from './SkeletonLoader'
import { DocumentGenerator } from '../utils/documentGenerator'
import '../styles/DD214InsightsView.css'

interface DD214InsightsViewProps {}

interface InsightsData {
  documentId: string
  status: string
  veteranProfile: any
  insights: {
    veteran_intelligence?: any
    executive_intelligence_summary?: any
    extracted_profile?: any
    career_recommendations?: any[]
    hidden_strengths_analysis?: any[]
    market_intelligence?: any
    compensation_intelligence?: any
    transition_timeline?: any
    action_oriented_deliverables?: any
    psychological_preparation?: any
  }
  generatedAt: string
}

export const DD214InsightsView: React.FC<DD214InsightsViewProps> = () => {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string>('overview')
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  useEffect(() => {
    fetchInsights()
  }, [documentId])

  const fetchInsights = async () => {
    if (!documentId) {
      setError('No document ID provided')
      setLoading(false)
      return
    }

    try {
      const data = await getDD214InsightsData(documentId)
      console.log('Fetched insights:', data)
      setInsights(data)
    } catch (err) {
      console.error('Error fetching insights:', err)
      setError('Failed to load your DD214 insights')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const handleDownload = () => {
    setShowDownloadModal(true)
  }

  const handleDownloadHTML = () => {
    if (insights) {
      DocumentGenerator.downloadHTML(insights.insights, insights.veteranProfile || insights.insights.extracted_profile)
      setShowDownloadModal(false)
    }
  }

  const handleDownloadPDF = () => {
    if (insights) {
      DocumentGenerator.openPrintPreview(insights.insights, insights.veteranProfile || insights.insights.extracted_profile)
      setShowDownloadModal(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return (
      <div className="insights-container loading">
        <SkeletonLoader type="insights" />
      </div>
    )
  }

  if (error || !insights) {
    return (
      <div className="insights-container error">
        <div className="error-content">
          <h2>Unable to Load Insights</h2>
          <p>{error || 'Something went wrong'}</p>
          <button onClick={handleBack} className="back-button">Go Back</button>
        </div>
      </div>
    )
  }

  const { veteran_intelligence, executive_intelligence_summary, extracted_profile } = insights.insights

  return (
    <div className="insights-container">
      {/* Header */}
      <header className="insights-header">
        <button className="nav-back" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        
        <div className="header-content">
          <h1>DD214 Career Intelligence Report</h1>
          <p className="subtitle">AI-Powered Analysis of Your Military Service</p>
        </div>

        <button className="download-button" onClick={handleDownload}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download Report
        </button>
      </header>

      {/* Navigation Tabs */}
      <nav className="insights-nav">
        <button 
          className={`nav-tab ${selectedSection === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedSection('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-tab ${selectedSection === 'careers' ? 'active' : ''}`}
          onClick={() => setSelectedSection('careers')}
        >
          Career Paths
        </button>
        <button 
          className={`nav-tab ${selectedSection === 'compensation' ? 'active' : ''}`}
          onClick={() => setSelectedSection('compensation')}
        >
          Compensation
        </button>
        <button 
          className={`nav-tab ${selectedSection === 'strengths' ? 'active' : ''}`}
          onClick={() => setSelectedSection('strengths')}
        >
          Hidden Strengths
        </button>
        <button 
          className={`nav-tab ${selectedSection === 'timeline' ? 'active' : ''}`}
          onClick={() => setSelectedSection('timeline')}
        >
          Action Plan
        </button>
      </nav>

      {/* Main Content */}
      <main className="insights-content">
        {selectedSection === 'overview' && (
          <OverviewSection 
            veteranIntelligence={veteran_intelligence}
            executiveSummary={executive_intelligence_summary}
            profile={extracted_profile}
          />
        )}
        
        {selectedSection === 'careers' && (
          <CareerSection 
            careers={insights.insights.career_recommendations || []}
            marketIntel={insights.insights.market_intelligence}
          />
        )}
        
        {selectedSection === 'compensation' && (
          <CompensationSection 
            compensation={insights.insights.compensation_intelligence}
            marketValue={insights.insights.market_intelligence?.your_market_value}
          />
        )}
        
        {selectedSection === 'strengths' && (
          <StrengthsSection 
            strengths={insights.insights.hidden_strengths_analysis || []}
            psychological={insights.insights.psychological_preparation}
          />
        )}
        
        {selectedSection === 'timeline' && (
          <TimelineSection 
            timeline={insights.insights.transition_timeline}
            actionItems={insights.insights.action_oriented_deliverables}
            onCopy={copyToClipboard}
          />
        )}
      </main>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="download-modal" onClick={() => setShowDownloadModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Download Your Report</h3>
            <p>Your comprehensive DD214 Career Intelligence Report is ready.</p>
            <div className="download-options">
              <button className="download-pdf" onClick={handleDownloadPDF}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
                  <polyline points="14 2 14 8 20 8" strokeWidth="2"/>
                  <path d="M10 12h4" strokeWidth="2"/>
                  <path d="M10 16h4" strokeWidth="2"/>
                </svg>
                Print to PDF
              </button>
              <button className="download-html" onClick={handleDownloadHTML}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" strokeWidth="2"/>
                  <polyline points="13 2 13 9 20 9" strokeWidth="2"/>
                  <line x1="10" y1="13" x2="14" y2="13" strokeWidth="2"/>
                  <line x1="10" y1="17" x2="14" y2="17" strokeWidth="2"/>
                </svg>
                Download HTML
              </button>
            </div>
            <button className="close-modal" onClick={() => setShowDownloadModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Section Components
const OverviewSection: React.FC<{
  veteranIntelligence: any
  executiveSummary: any
  profile: any
}> = ({ veteranIntelligence, executiveSummary, profile }) => {
  return (
    <div className="overview-section">
      {/* Hero Card */}
      <div className="hero-card">
        <div className="rank-badge">
          <span className="rank">{profile?.rank || 'Veteran'}</span>
          <span className="branch">{profile?.branch || 'US Military'}</span>
        </div>
        
        <h2 className="hero-title">
          {executiveSummary?.unique_value_proposition || veteranIntelligence?.executive_summary || 'Elite Military Professional'}
        </h2>
        
        <div className="service-stats">
          <div className="stat">
            <span className="stat-value">{profile?.years_of_service || 'Multiple Years'}</span>
            <span className="stat-label">Service</span>
          </div>
          <div className="stat">
            <span className="stat-value">{profile?.clearance_level || 'Active'}</span>
            <span className="stat-label">Clearance</span>
          </div>
          <div className="stat">
            <span className="stat-value">{profile?.decorations?.length || 0}</span>
            <span className="stat-label">Decorations</span>
          </div>
        </div>

        {/* Market Position */}
        <div className="market-position">
          <h3>Your Market Position</h3>
          <p className="position-text">
            {executiveSummary?.market_position || 'Top-tier military talent ready for civilian leadership'}
          </p>
          <div className="leverage-points">
            {executiveSummary?.immediate_leverage_points?.map((point: string, idx: number) => (
              <div key={idx} className="leverage-item">
                <span className="leverage-icon">💎</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorations and Qualifications */}
      {profile?.decorations && profile.decorations.length > 0 && (
        <div className="decorations-card">
          <h3>Military Achievements</h3>
          <div className="decorations-grid">
            {profile.decorations.map((decoration: string, idx: number) => (
              <div key={idx} className="decoration-badge">
                <span className="decoration-icon">🎖️</span>
                <span className="decoration-name">{decoration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Qualifications */}
      {profile?.special_qualifications && profile.special_qualifications.length > 0 && (
        <div className="qualifications-card">
          <h3>Elite Qualifications</h3>
          <div className="qualifications-grid">
            {profile.special_qualifications.map((qual: string, idx: number) => (
              <div key={idx} className="qualification-badge">
                <span className="qual-icon">⚡</span>
                <span>{qual}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const CareerSection: React.FC<{
  careers: any[]
  marketIntel: any
}> = ({ careers }) => {
  const [selectedCareer, setSelectedCareer] = useState(0)

  return (
    <div className="career-section">
      <div className="career-cards">
        {careers.map((career, idx) => (
          <div 
            key={idx} 
            className={`career-card ${selectedCareer === idx ? 'selected' : ''}`}
            onClick={() => setSelectedCareer(idx)}
          >
            <div className="career-header">
              <h3>{career.title}</h3>
              <span className="fit-score">{career.fit_score || 95}% Match</span>
            </div>
            
            <p className="career-reason">{career.why_perfect_fit}</p>
            
            <div className="salary-range">
              <span className="salary-label">Total Compensation</span>
              <span className="salary-value">{career.salary_intelligence?.total_package || '$100K+'}</span>
            </div>

            <div className="company-logos">
              {career.company_targets?.slice(0, 3).map((company: string, i: number) => (
                <div key={i} className="company-chip">{company}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed View */}
      {careers[selectedCareer] && (
        <div className="career-detail">
          <h3>90-Day Strategy</h3>
          <div className="strategy-timeline">
            {careers[selectedCareer]['90_day_strategy']?.map((step: string, idx: number) => (
              <div key={idx} className="strategy-step">
                <div className="step-number">{idx + 1}</div>
                <p>{step}</p>
              </div>
            ))}
          </div>

          <h3>Insider Tips</h3>
          <div className="insider-tips">
            {careers[selectedCareer].insider_tips?.map((tip: string, idx: number) => (
              <div key={idx} className="tip-card">
                <span className="tip-icon">💡</span>
                <p>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const CompensationSection: React.FC<{
  compensation: any
  marketValue: any
}> = ({ compensation, marketValue }) => {
  return (
    <div className="compensation-section">
      <div className="market-value-card">
        <h3>Your Market Value</h3>
        <div className="value-breakdown">
          <div className="value-item">
            <span className="value-label">Base Salary Range</span>
            <span className="value-amount">{marketValue?.base_range || '$85K - $110K'}</span>
          </div>
          <div className="value-item highlight">
            <span className="value-label">+ Security Clearance Premium</span>
            <span className="value-amount">{marketValue?.clearance_premium || '$15K - $25K'}</span>
          </div>
          <div className="divider"></div>
          <div className="value-item total">
            <span className="value-label">Total Market Value</span>
            <span className="value-amount">{marketValue?.total_range || '$105K - $145K'}</span>
          </div>
        </div>
      </div>

      <div className="negotiation-card">
        <h3>Negotiation Leverage</h3>
        <div className="leverage-list">
          {compensation?.negotiation_leverage?.map((leverage: string, idx: number) => (
            <div key={idx} className="leverage-point">
              <span className="check-icon">✓</span>
              <p>{leverage}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="compensation-targets">
        <h3>Total Compensation Targets</h3>
        {Object.entries(compensation?.total_compensation_targets || {}).map(([key, value]) => (
          <div key={key} className="target-item">
            <span className="target-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            <span className="target-value">{value as string}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const StrengthsSection: React.FC<{
  strengths: any[]
  psychological: any
}> = ({ strengths, psychological }) => {
  return (
    <div className="strengths-section">
      <div className="strengths-grid">
        {strengths.map((strength, idx) => (
          <div key={idx} className="strength-card">
            <h3>{strength.strength}</h3>
            <p className="strength-evidence">{strength.evidence}</p>
            <div className="strength-impact">
              <span className="impact-label">Civilian Value:</span>
              <p>{strength.civilian_application}</p>
            </div>
            <div className="salary-impact">
              <span className="impact-icon">💰</span>
              <span>{strength.salary_impact}</span>
            </div>
          </div>
        ))}
      </div>

      {psychological && (
        <div className="psychological-card">
          <h3>Confidence Builders</h3>
          <div className="confidence-list">
            {psychological.confidence_builders?.map((builder: string, idx: number) => (
              <div key={idx} className="confidence-item">
                <span className="confidence-icon">🛡️</span>
                <p>{builder}</p>
              </div>
            ))}
          </div>

          <h3>Imposter Syndrome Counters</h3>
          <div className="counter-list">
            {psychological.imposter_syndrome_counters?.map((counter: string, idx: number) => (
              <div key={idx} className="counter-item">
                <span className="counter-icon">⚔️</span>
                <p>{counter}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const TimelineSection: React.FC<{
  timeline: any
  actionItems: any
  onCopy: (text: string) => void
}> = ({ timeline, actionItems, onCopy }) => {
  return (
    <div className="timeline-section">
      <div className="timeline-container">
        <h3>Your Transition Roadmap</h3>
        
        {/* Next 7 Days */}
        <div className="timeline-phase">
          <div className="phase-header">
            <span className="phase-icon">🚀</span>
            <h4>Next 7 Days</h4>
          </div>
          <div className="phase-items">
            {timeline?.next_7_days?.map((item: string, idx: number) => (
              <div key={idx} className="timeline-item">
                <div className="item-marker"></div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Next 30 Days */}
        <div className="timeline-phase">
          <div className="phase-header">
            <span className="phase-icon">📈</span>
            <h4>Next 30 Days</h4>
          </div>
          <div className="phase-items">
            {timeline?.next_30_days?.map((item: string, idx: number) => (
              <div key={idx} className="timeline-item">
                <div className="item-marker"></div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 60-90 Days */}
        <div className="timeline-phase">
          <div className="phase-header">
            <span className="phase-icon">🎯</span>
            <h4>60-90 Days</h4>
          </div>
          <div className="phase-items">
            {timeline?.['60_90_days']?.map((item: string, idx: number) => (
              <div key={idx} className="timeline-item">
                <div className="item-marker"></div>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Deliverables */}
      {actionItems && (
        <div className="action-deliverables">
          <h3>Ready-to-Use Materials</h3>
          
          {actionItems.elevator_pitch && (
            <div className="deliverable-card">
              <h4>Your Elevator Pitch</h4>
              <p className="pitch-text">{actionItems.elevator_pitch}</p>
              <button className="copy-button" onClick={() => onCopy(actionItems.elevator_pitch)}>Copy to Clipboard</button>
            </div>
          )}

          {actionItems.linkedin_headline && (
            <div className="deliverable-card">
              <h4>LinkedIn Headline</h4>
              <p className="headline-text">{actionItems.linkedin_headline}</p>
              <button className="copy-button" onClick={() => onCopy(actionItems.linkedin_headline)}>Copy to Clipboard</button>
            </div>
          )}

          {actionItems.resume_bullets && (
            <div className="deliverable-card">
              <h4>Resume Power Bullets</h4>
              <ul className="resume-bullets">
                {actionItems.resume_bullets.map((bullet: string, idx: number) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
              <button className="copy-button" onClick={() => onCopy(actionItems.resume_bullets.join('\n\n'))}>Copy All</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DD214InsightsView