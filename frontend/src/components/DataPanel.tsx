import React, { useState } from 'react'
import './DataPanel.css'

interface DataPanelProps {
  data: any
  isOpen: boolean
  onToggle: () => void
  mode?: 'api' | 's3'
  selectedSOCs?: string[]
}

interface SOCData {
  [key: string]: any
}

export const DataPanel: React.FC<DataPanelProps> = ({ 
  data, 
  isOpen, 
  onToggle, 
  mode = 'api',
  selectedSOCs = []
}) => {
  const [expandedSOCs, setExpandedSOCs] = useState<string[]>([])
  const [socData] = useState<SOCData>({}) // Will be populated in Phase 4

  const toggleSOC = (soc: string) => {
    setExpandedSOCs(prev => 
      prev.includes(soc) 
        ? prev.filter(s => s !== soc)
        : [...prev, soc]
    )
  }

  const tabText = mode === 's3' ? 'CAREER DATA' : 'O*NET DATA'
  const headerText = mode === 's3' ? 'Detailed Career Analysis' : 'Live O*NET API Response'

  return (
    <>
      <div className={`data-panel-tab ${isOpen ? 'open' : ''}`} onClick={onToggle}>
        <span className="tab-text">{tabText}</span>
        <span className="tab-icon">{isOpen ? '›' : '‹'}</span>
      </div>
      
      <div className={`data-panel ${isOpen ? 'open' : ''}`}>
        <div className="data-panel-header">
          <h3>{headerText}</h3>
          <button className="close-btn" onClick={onToggle}>×</button>
        </div>
        
        <div className="data-panel-content">
          {mode === 's3' && selectedSOCs.length > 0 ? (
            <div className="soc-list">
              {selectedSOCs.map(soc => (
                <div key={soc} className="soc-item">
                  <div 
                    className="soc-header"
                    onClick={() => toggleSOC(soc)}
                  >
                    <span className="soc-toggle">
                      {expandedSOCs.includes(soc) ? '▼' : '▶'}
                    </span>
                    <span className="soc-code">{soc}</span>
                    {socData[soc]?.title && (
                      <span className="soc-title">{socData[soc].title}</span>
                    )}
                  </div>
                  {expandedSOCs.includes(soc) && (
                    <div className="soc-data">
                      <pre className="json-display">
                        {socData[soc] 
                          ? JSON.stringify(socData[soc], null, 2)
                          : 'Loading S3 data...'
                        }
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <pre className="json-display">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </>
  )
}