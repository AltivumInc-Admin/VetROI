import React, { useState, useEffect, useRef } from 'react'
import { CareerMapCanvas } from './CareerMapCanvas'
import './DataPanel.css'

interface DataPanelProps {
  data: any
  isOpen: boolean
  onToggle: () => void
  mode?: 'api' | 's3' | 'careermap'
  selectedSOCs?: string[]
  onModeChange?: (mode: 'api' | 's3' | 'careermap') => void
}

interface SOCData {
  [key: string]: any
}

export const DataPanel: React.FC<DataPanelProps> = ({ 
  data, 
  isOpen, 
  onToggle, 
  mode = 'api',
  selectedSOCs = [],
  onModeChange
}) => {
  const [expandedSOCs, setExpandedSOCs] = useState<string[]>([])
  const [socData, setSocData] = useState<SOCData>({})
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
      case 's3': return 'SOC DATA'
      case 'careermap': return 'CAREER MAP'
      default: return 'MOS DATA'
    }
  }

  const getHeaderText = () => {
    switch(mode) {
      case 's3': return 'Detailed Career Analysis'
      case 'careermap': return 'Visual Career Planning'
      default: return 'Live O*NET API Response'
    }
  }

  return (
    <>
      <div ref={tabsRef} className={`data-panel-tabs-container ${isOpen ? 'open' : ''}`}>
        {onModeChange ? (
          <div className="data-panel-mode-tabs">
            <div 
              className={`data-panel-tab ${mode === 'api' ? 'active' : ''}`}
              onClick={() => {
                onModeChange('api')
                if (!isOpen) onToggle()
              }}
            >
              <span className="tab-text">MOS DATA</span>
              <span className="tab-icon">{isOpen && mode === 'api' ? '›' : '‹'}</span>
            </div>
            <div 
              className={`data-panel-tab ${mode === 's3' ? 'active' : ''}`}
              onClick={() => {
                onModeChange('s3')
                if (!isOpen) onToggle()
              }}
            >
              <span className="tab-text">SOC DATA</span>
              <span className="tab-icon">{isOpen && mode === 's3' ? '›' : '‹'}</span>
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
          <button className="close-btn" onClick={onToggle}>×</button>
        </div>
        
        <div className="data-panel-content">
          {mode === 'careermap' ? (
            <CareerMapCanvas />
          ) : mode === 's3' && selectedSOCs.length > 0 ? (
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