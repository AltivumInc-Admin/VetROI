import React from 'react'
import '../../styles/insights/ExtendedSummary.css'
import '../../styles/insights/dd214-unified-design.css'

interface ExtendedSummaryProps {
  data: any
}

export const ExtendedSummary: React.FC<ExtendedSummaryProps> = ({ data }) => {
  const extendedSummary = data.insights?.extended_summary || {}
  const veteranPortrait = extendedSummary.veteran_portrait || ''
  
  // Split the portrait into paragraphs
  const paragraphs = veteranPortrait.split('\n\n').filter((p: string) => p.trim())
  
  return (
    <div className="extended-summary dd214-insights">
      <div className="section-header dd214-card">
        <h1 className="dd214-heading-xl">Extended Summary</h1>
        <p className="dd214-text-muted">A comprehensive portrait of your military service and future potential</p>
      </div>
      
      <div className="summary-content dd214-card">
        {paragraphs.length > 0 ? (
          <div className="portrait-text">
            {paragraphs.map((paragraph: string, index: number) => (
              <p key={index} className="dd214-text dd214-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="dd214-text-muted">Your extended summary is being generated...</p>
          </div>
        )}
      </div>
    </div>
  )
}