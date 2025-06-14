import React, { useEffect } from 'react'
import '../styles/DetailedAnalysisView.css'

interface DetailedAnalysisViewProps {
  selectedSOCs: string[]
  onBack: () => void
}

export const DetailedAnalysisView: React.FC<DetailedAnalysisViewProps> = ({
  selectedSOCs,
  onBack
}) => {
  useEffect(() => {
    // Trigger S3 data fetch when component mounts
    console.log('Fetching S3 data for SOCs:', selectedSOCs)
    // This will be implemented in api.ts
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
        <p className="loading-message">
          Loading detailed analysis for {selectedSOCs.length} career{selectedSOCs.length > 1 ? 's' : ''}...
        </p>
      </main>
    </div>
  )
}