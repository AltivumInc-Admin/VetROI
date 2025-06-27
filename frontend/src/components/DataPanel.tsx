import React, { useState, useEffect, useRef } from 'react'
import CareerPlanner from './career-planner/CareerPlanner'
import './DataPanel.css'

interface DataPanelProps {
  data: any
  isOpen: boolean
  onToggle: () => void
  mode?: 'onet' | 'careermap'
  selectedSOCs?: string[]
  onModeChange?: (mode: 'onet' | 'careermap') => void
  viewStage?: 1 | 2 | 3
  onStageChange?: (stage: 1 | 2 | 3) => void
}

interface SOCData {
  [key: string]: any
}

export const DataPanel: React.FC<DataPanelProps> = ({ 
  data, 
  isOpen, 
  onToggle, 
  mode = 'onet',
  selectedSOCs = [],
  onModeChange,
  viewStage = 1,
  onStageChange
}) => {
  const [expandedSOCs, setExpandedSOCs] = useState<string[]>([])
  const [socData, setSocData] = useState<SOCData>({})
  const [onetView, setOnetView] = useState<'mos' | 'soc'>('mos')
  const panelRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  
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
    switch(mode) {
      case 'careermap': return 'CAREER MAP'
      default: return 'O*NET DATA'
    }
  }

  const getHeaderText = () => {
    switch(mode) {
      case 'careermap': return 'Visual Career Planning'
      default: return onetView === 'mos' ? 'MOS Data - O*NET API Response' : 'SOC Data - Career Details'
    }
  }

  return (
    <>
      <div ref={tabsRef} className={`data-panel-tabs-container ${isOpen ? 'open' : ''}`}>
        {onModeChange ? (
          <div className="data-panel-mode-tabs">
            <div 
              className={`data-panel-tab ${mode === 'onet' ? 'active' : ''}`}
              onClick={() => {
                onModeChange('onet')
                if (!isOpen) onToggle()
              }}
            >
              <span className="tab-text">O*NET DATA</span>
              <span className="tab-icon">{isOpen && mode === 'onet' ? '›' : '‹'}</span>
            </div>
            <div 
              className={`data-panel-tab ${mode === 'careermap' ? 'active' : ''}`}
              onClick={() => {
                onModeChange('careermap')
                if (!isOpen) onToggle()
              }}
            >
              <span className="tab-text">CAREER MAP</span>
              <span className="tab-icon">{isOpen && mode === 'careermap' ? '›' : '‹'}</span>
            </div>
          </div>
        ) : (
          <div className="data-panel-tab" onClick={onToggle}>
            <span className="tab-text">{getTabText()}</span>
            <span className="tab-icon">{isOpen ? '›' : '‹'}</span>
          </div>
        )}
      </div>
      
      <div ref={panelRef} className={`data-panel ${isOpen ? 'open' : ''}`}>
        <div className="data-panel-header">
          <h3>{getHeaderText()}</h3>
          {viewStage === 1 && (
            <button className="close-btn" onClick={onToggle}>×</button>
          )}
        </div>
        
        <div className="data-panel-content">
          {mode === 'careermap' ? (
            <>
              {onStageChange && (
                <div className="stage-navigation">
                  <button 
                    className={`stage-tab ${viewStage === 1 ? 'active' : ''}`}
                    onClick={() => onStageChange(1)}
                  >
                    Stage 1
                  </button>
                  <button 
                    className={`stage-tab ${viewStage === 2 ? 'active' : ''}`}
                    onClick={() => onStageChange(2)}
                  >
                    Stage 2
                  </button>
                  <button 
                    className={`stage-tab ${viewStage === 3 ? 'active' : ''}`}
                    onClick={() => onStageChange(3)}
                  >
                    Full Screen
                  </button>
                </div>
              )}
              <CareerPlanner viewStage={viewStage} onStageChange={onStageChange} />
            </>
          ) : mode === 'onet' ? (
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
                                : 'Loading S3 data...'
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