import React, { useEffect, useState } from 'react'
import { fetchMultipleSOCData } from '../api'
import '../styles/DetailedAnalysisView.css'

interface DetailedAnalysisViewProps {
  selectedSOCs: string[]
  onBack: () => void
}

export const DetailedAnalysisView: React.FC<DetailedAnalysisViewProps> = ({
  selectedSOCs,
  onBack
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Trigger S3 data fetch when component mounts
    console.log('DetailedAnalysisView: Fetching S3 data for SOCs:', selectedSOCs)
    
    fetchMultipleSOCData(selectedSOCs)
      .then(data => {
        console.log('DetailedAnalysisView: Fetched S3 data:', data)
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
        <button className="back-button" onClick={onBack}>
          ← Back to Career Selection
        </button>
        <h2>Detailed Career Analysis</h2>
      </header>
      
      <main className="analysis-content">
        {loading && (
          <p className="loading-message">
            Loading detailed analysis for {selectedSOCs.length} career{selectedSOCs.length > 1 ? 's' : ''}...
          </p>
        )}
        {error && (
          <p className="error-message">{error}</p>
        )}
        {!loading && !error && (
          <p className="info-message">
            Career data loaded. Check the panel on the right for detailed information.
          </p>
        )}
      </main>
    </div>
  )
}