import React, { useEffect, useState } from 'react'
import { fetchMultipleSOCData } from '../api'
import { CareerDetailCard } from './CareerDetailCard'
import { ComparisonView } from './ComparisonView'
import { CareerCardSkeleton } from './SkeletonLoader'
import '../styles/DetailedAnalysisView.css'

interface DetailedAnalysisViewProps {
  selectedSOCs: string[]
  onBack: () => void
  onMeetSentra: () => void
  userState?: string
  relocationState?: string
  veteranProfile?: {
    branch?: string
    code?: string
    education?: string
  }
}

export const DetailedAnalysisView: React.FC<DetailedAnalysisViewProps> = ({
  selectedSOCs,
  onBack,
  onMeetSentra,
  userState = 'CA',
  relocationState,
  veteranProfile
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [careerData, setCareerData] = useState<Record<string, any>>({})
  const [showComparison, setShowComparison] = useState(false)  
  
  useEffect(() => {
    // Trigger S3 data fetch when component mounts
    console.log('DetailedAnalysisView: Fetching S3 data for SOCs:', selectedSOCs)
    
    fetchMultipleSOCData(selectedSOCs)
      .then(data => {
        console.log('DetailedAnalysisView: Fetched S3 data:', data)
        setCareerData(data)
        setLoading(false)
        // Dispatch event for DataPanel
        window.dispatchEvent(new CustomEvent('s3DataFetched', { detail: data }))
      })
      .catch(err => {
        console.error('DetailedAnalysisView: Error fetching S3 data:', err)
        setError('Failed to load career data')
        setLoading(false)
      })
  }, [selectedSOCs])

  return (
    <div className="detailed-analysis-container">
      <header className="analysis-header">
        <h2>Detailed Career Analysis</h2>
        <button className="back-button" onClick={onBack}>
          ← Back to Career Selection
        </button>
      </header>
      
      <main className="analysis-content">
        {loading && (
          <div className="career-cards">
            {selectedSOCs.map((_, index) => (
              <CareerCardSkeleton key={index} />
            ))}
          </div>
        )}
        {error && (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}
        {!loading && !error && !showComparison && (
          <div className="career-cards">
            {Object.values(careerData).map((socData: any) => (
              <CareerDetailCard 
                key={socData.soc} 
                socData={socData} 
                userState={userState}
                relocationState={relocationState}
              />
            ))}
          </div>
        )}
        {!loading && !error && showComparison && (
          <ComparisonView
            careerData={careerData}
            selectedSOCs={selectedSOCs}
            userState={userState}
            relocationState={relocationState}
            veteranProfile={veteranProfile}
          />
        )}
      </main>
      
      {!loading && !error && (
        <div className="action-buttons-section">
          {selectedSOCs.length >= 2 && (
            <button 
              className="compare-careers-button" 
              onClick={() => setShowComparison(!showComparison)}
            >
              <div className="compare-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 3h18M3 12h18M3 21h18M9 3v18M15 3v18" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>{showComparison ? 'Individual View' : 'Compare Careers'}</span>
            </button>
          )}
          
          <button className="meet-sentra-button" onClick={onMeetSentra}>
            <div className="sentra-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span>Meet with Sentra, our state-of-the-art career counselor</span>
          </button>
        </div>
      )}
    </div>
  )
}