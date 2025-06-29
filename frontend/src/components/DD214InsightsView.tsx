import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getDD214InsightsData } from '../api'
import { SkeletonLoader } from './SkeletonLoader'
import { ExecutiveSummary } from './insights/ExecutiveSummary'
import { CareerIntelligence } from './insights/CareerIntelligence'
import { LeadershipProfile } from './insights/LeadershipProfile'
import { ActionCenter } from './insights/ActionCenter'
import { PsychologicalPreparation } from './insights/PsychologicalPreparation'
import { TimelineRoadmap } from './insights/TimelineRoadmap'
import { GeoIntelligence } from './insights/GeoIntelligence'
import { LegacyIntelligenceReport } from './insights/LegacyIntelligenceReport'
import { ExtendedSummary } from './insights/ExtendedSummary'
import { AIPromptGenerator } from './insights/AIPromptGenerator'
import { generatePDF } from '../utils/pdfGenerator-enhanced'
import '../styles/DD214InsightsView-refined.css'
import '../styles/insights/dd214-unified-design.css'

interface DD214InsightsViewProps {}

interface InsightsData {
  documentId: string
  status: string
  veteranProfile: any
  insights: {
    executive_intelligence_summary?: any
    extracted_profile?: any
    career_recommendations?: any[]
    hidden_strengths_analysis?: any
    market_intelligence?: any
    compensation_intelligence?: any
    transition_timeline?: any
    action_oriented_deliverables?: any
    psychological_preparation?: any
    legacy_report?: any
    meta_ai_prompts?: any
  }
  generatedAt: string
}

const navigationItems = [
  { id: 'back-to-careers', label: 'Career Matches', icon: '🔙', isBackButton: true },
  { id: 'executive-summary', label: 'Executive Summary', icon: '🎯' },
  { id: 'career-intelligence', label: 'Career Intelligence', icon: '💼' },
  { id: 'leadership-profile', label: 'Leadership Profile', icon: '⭐' },
  { id: 'action-center', label: 'Action Center', icon: '🚀' },
  { id: 'psychological-prep', label: 'Psychological Preparation', icon: '🧠' },
  { id: 'timeline', label: 'Timeline & Roadmap', icon: '📅' },
  { id: 'geo-intelligence', label: '3D Geo-Intelligence', icon: '🌐' },
  { id: 'legacy-report', label: 'Legacy Intelligence', icon: '📜' },
  { id: 'extended-summary', label: 'Extended Summary', icon: '📝' },
  { id: 'ai-prompts', label: 'AI Prompt Generator', icon: '🤖' }
]

export const DD214InsightsView: React.FC<DD214InsightsViewProps> = () => {
  const { documentId: paramDocumentId } = useParams<{ documentId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string>('executive-summary')
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Use demo documentId if on /demo route
  const documentId = location.pathname === '/demo' 
    ? '8a3d770f-af01-4601-bca3-f5cbe7c9ee62' 
    : paramDocumentId

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
      setLoading(true)
      setError(null)
      const data = await getDD214InsightsData(documentId)
      
      if (!data || !data.insights) {
        throw new Error('Invalid insights data received')
      }
      
      setInsights(data)
    } catch (err) {
      console.error('Error fetching insights:', err)
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!insights) return
    
    setGeneratingPDF(true)
    try {
      await generatePDF(insights)
      setShowDownloadModal(false)
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const renderContent = () => {
    if (!insights) return null

    switch (selectedSection) {
      case 'executive-summary':
        return <ExecutiveSummary data={insights} />
      case 'career-intelligence':
        return <CareerIntelligence data={insights} />
      case 'leadership-profile':
        return <LeadershipProfile data={insights} />
      case 'action-center':
        return <ActionCenter data={insights} />
      case 'psychological-prep':
        return <PsychologicalPreparation data={insights} />
      case 'timeline':
        return <TimelineRoadmap data={insights} />
      case 'geo-intelligence':
        return <GeoIntelligence />
      case 'legacy-report':
        return <LegacyIntelligenceReport data={insights} />
      case 'extended-summary':
        return <ExtendedSummary data={insights} />
      case 'ai-prompts':
        return <AIPromptGenerator data={insights} />
      default:
        return <ExecutiveSummary data={insights} />
    }
  }

  if (loading) {
    return (
      <div className="insights-view">
        <div className="insights-header">
          <h2>Loading Your Career Intelligence...</h2>
        </div>
        <SkeletonLoader type="insights" />
      </div>
    )
  }

  if (error) {
    // Check if this is a timing issue that just needs a refresh
    if (error === 'Invalid insights data received') {
      return (
        <div className="insights-view">
          <div className="error-container">
            <h2>Almost Ready!</h2>
            <p>Your career intelligence report is being finalized. This usually takes just a few more seconds.</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Please refresh the page to see your completed report.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()} 
                className="primary-button"
                style={{ 
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#0a0e1a'
                }}
              >
                Refresh Now
              </button>
              <button 
                onClick={() => navigate('/dd214-upload')} 
                className="secondary-button"
                style={{ 
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}
              >
                Upload Different DD214
              </button>
            </div>
          </div>
        </div>
      )
    }
    
    // For all other errors, show the original error message
    return (
      <div className="insights-view">
        <div className="error-container">
          <h2>Unable to Load Insights</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dd214-upload')} className="primary-button">
            Upload New DD214
          </button>
        </div>
      </div>
    )
  }

  if (!insights) {
    return null
  }

  const veteranName = insights.veteranProfile?.name || 
    `${insights.insights.extracted_profile?.rank || ''} ${insights.insights.extracted_profile?.branch || 'Veteran'}`.trim()

  const isDemo = location.pathname === '/demo'

  return (
    <div className="insights-view dd214-insights">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div style={{
          background: 'rgba(0, 212, 255, 0.1)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          padding: '0.75rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#00d4ff'
        }}>
          🎯 For Judges: Viewing Actual DD214 Analysis - Pre-Generated from Real Document
        </div>
      )}
      
      {/* Header Section */}
      <div className="insights-header-section">
        <div className="header-content">
          <div className="header-left">
            <h1>Career Intelligence Report</h1>
            <p className="veteran-name">{veteranName}</p>
            <p className="report-date">Generated {new Date(insights.generatedAt).toLocaleDateString()}</p>
          </div>
          <div className="header-actions">
            <button 
              className="download-button"
              onClick={() => setShowDownloadModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              <span>Download Full Report</span>
            </button>
            <button 
              className="share-button"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              <span>Share Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sidebar */}
      <div className="insights-container">
        <aside className="insights-navigation">
          <nav>
            {navigationItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${selectedSection === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.isBackButton) {
                    navigate(-1) // Go back to previous page with state intact
                  } else {
                    setSelectedSection(item.id)
                  }
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {selectedSection === item.id && <span className="nav-indicator" />}
              </button>
            ))}
          </nav>
          
          <div className="nav-footer">
            <p className="powered-by">Powered by VetROI™</p>
            <p className="ai-model">Amazon Nova Lite v1</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="insights-content">
          <div className="content-wrapper">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="modal-overlay" onClick={() => setShowDownloadModal(false)}>
          <div className="download-modal" onClick={e => e.stopPropagation()}>
            <h3>Download Career Intelligence Report</h3>
            <p>Your comprehensive report includes:</p>
            <ul className="report-contents">
              <li className="dd214-list-item">Executive Summary & Market Position</li>
              <li className="dd214-list-item">Detailed Career Opportunities</li>
              <li className="dd214-list-item">Compensation Intelligence</li>
              <li className="dd214-list-item">Leadership Profile & Hidden Strengths</li>
              <li className="dd214-list-item">Resume Bullets & LinkedIn Optimization</li>
              <li className="dd214-list-item">Interview Preparation Guide</li>
              <li className="dd214-list-item">30-60-90 Day Action Plan</li>
              <li className="dd214-list-item">Legacy Intelligence Report (1500 words)</li>
              <li className="dd214-list-item">AI Prompt Library</li>
            </ul>
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowDownloadModal(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-button"
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
              >
                {generatingPDF ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}