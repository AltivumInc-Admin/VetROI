import React, { useEffect, useState } from 'react'
import { fetchMultipleSOCData } from '../api'
import { CareerDetailCard } from './CareerDetailCard'
import '../styles/DetailedAnalysisView.css'

interface DetailedAnalysisViewProps {
  selectedSOCs: string[]
  onBack: () => void
  userState?: string
}

export const DetailedAnalysisView: React.FC<DetailedAnalysisViewProps> = ({
  selectedSOCs,
  onBack,
  userState = 'CA'
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [careerData, setCareerData] = useState<Record<string, any>>({})  
  
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
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-message">
              Loading detailed analysis for {selectedSOCs.length} career{selectedSOCs.length > 1 ? 's' : ''}...
            </p>
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
        {!loading && !error && (
          <div className="career-cards">
            {Object.values(careerData).map((socData: any) => (
              <CareerDetailCard 
                key={socData.soc} 
                socData={socData} 
                userState={userState}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}