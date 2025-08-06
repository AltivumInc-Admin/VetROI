import React, { useState, useEffect, useRef } from 'react'
import './DataPanel.css'

interface DataPanelProps {
  data: any
  isOpen: boolean
  onToggle: () => void
  selectedSOCs?: string[]
}

interface SOCData {
  [key: string]: any
}

export const DataPanel: React.FC<DataPanelProps> = ({ 
  data, 
  isOpen, 
  onToggle, 
  selectedSOCs = []
}) => {
  const [expandedSOCs, setExpandedSOCs] = useState<string[]>([])
  const [socData, setSocData] = useState<SOCData>({})
  const [onetView, setOnetView] = useState<'mos' | 'soc'>('mos')
  const [isMobile, setIsMobile] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Listen for S3 data updates
  React.useEffect(() => {
    const handleS3Data = (event: CustomEvent) => {
      setSocData(event.detail)
    }
    
    window.addEventListener('s3DataFetched', handleS3Data as EventListener)
    return () => {
      window.removeEventListener('s3DataFetched', handleS3Data as EventListener)
    }
  }, [])

  // Click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && 
          panelRef.current && 
          !panelRef.current.contains(event.target as Node) &&
          tabsRef.current &&
          !tabsRef.current.contains(event.target as Node)) {
        onToggle()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onToggle])

  const toggleSOC = (soc: string) => {
    setExpandedSOCs(prev => 
      prev.includes(soc) 
        ? prev.filter(s => s !== soc)
        : [...prev, soc]
    )
  }

  const getTabText = () => {
    return 'O*NET DATA'
  }

  const getHeaderText = () => {
    return onetView === 'mos' ? 'MOS Data - O*NET API Response' : 'SOC Data - Career Details'
  }

  // Add/remove body class for mobile panel open state
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.classList.add('data-panel-open')
    } else {
      document.body.classList.remove('data-panel-open')
    }
    return () => {
      document.body.classList.remove('data-panel-open')
    }
  }, [isMobile, isOpen])

  return (
    <>
      {/* Mobile trigger button */}
      {isMobile && (
        <button 
          className="data-panel-mobile-trigger" 
          onClick={onToggle}
          aria-label="Open O*NET Data Panel"
        />
      )}
      
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="data-panel-overlay visible" 
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      
      {/* Desktop side tab */}
      {!isMobile && (
        <div ref={tabsRef} className={`data-panel-tabs-container ${isOpen ? 'open' : ''}`}>
          <div className="data-panel-tab" onClick={onToggle}>
            <span className="tab-text">{getTabText()}</span>
            <span className="tab-icon">{isOpen ? '›' : '‹'}</span>
          </div>
        </div>
      )}
      
      <div ref={panelRef} className={`data-panel ${isOpen ? 'open' : ''}`}>
        <div className="data-panel-header">
          <h3>{getHeaderText()}</h3>
          <button className="close-btn" onClick={onToggle}>×</button>
        </div>
        
        <div className="data-panel-content">
          {
            <>
              <div className="onet-view-toggle">
                <button 
                  className={`view-toggle-btn ${onetView === 'mos' ? 'active' : ''}`}
                  onClick={() => setOnetView('mos')}
                >
                  MOS Data
                </button>
                <button 
                  className={`view-toggle-btn ${onetView === 'soc' ? 'active' : ''}`}
                  onClick={() => setOnetView('soc')}
                  disabled={selectedSOCs.length === 0}
                >
                  SOC Data {selectedSOCs.length > 0 && `(${selectedSOCs.length})`}
                </button>
              </div>
              {onetView === 'mos' ? (
                <pre className="json-display">
                  {JSON.stringify(data, null, 2)}
                </pre>
              ) : (
                <div className="soc-list">
                  {selectedSOCs.length > 0 ? (
                    selectedSOCs.map(soc => (
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
                                : 'Waiting for API response...'
                              }
                            </pre>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="empty-soc-message">
                      <p>No careers selected yet.</p>
                      <p>Click on career matches to view detailed SOC data.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          }
        </div>
      </div>
    </>
  )
}