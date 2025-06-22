import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { AIPromptGenerator } from './insights/AIPromptGenerator'
import { generatePDF } from '../utils/pdfGenerator-enhanced'
import '../styles/DD214InsightsView-refined.css'

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
  { id: 'executive-summary', label: 'Executive Summary', icon: '🎯' },
  { id: 'career-intelligence', label: 'Career Intelligence', icon: '💼' },
  { id: 'leadership-profile', label: 'Leadership Profile', icon: '⭐' },
  { id: 'action-center', label: 'Action Center', icon: '🚀' },
  { id: 'psychological-prep', label: 'Psychological Preparation', icon: '🧠' },
  { id: 'timeline', label: 'Timeline & Roadmap', icon: '📅' },
  { id: 'geo-intelligence', label: '3D Geo-Intelligence', icon: '🌐' },
  { id: 'legacy-report', label: 'Legacy Intelligence', icon: '📜' },
  { id: 'ai-prompts', label: 'AI Prompt Generator', icon: '🤖' }
]

export const DD214InsightsView: React.FC<DD214InsightsViewProps> = () => {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string>('executive-summary')
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)

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

  return (
    <div className="insights-view">
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              Download Full Report
            </button>
            <button 
              className="share-button"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              Share Report
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
                onClick={() => setSelectedSection(item.id)}
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
              <li>✓ Executive Summary & Market Position</li>
              <li>✓ Detailed Career Opportunities</li>
              <li>✓ Compensation Intelligence</li>
              <li>✓ Leadership Profile & Hidden Strengths</li>
              <li>✓ Resume Bullets & LinkedIn Optimization</li>
              <li>✓ Interview Preparation Guide</li>
              <li>✓ 30-60-90 Day Action Plan</li>
              <li>✓ Legacy Intelligence Report (1500 words)</li>
              <li>✓ AI Prompt Library</li>
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