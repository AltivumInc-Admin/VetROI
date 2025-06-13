import React from 'react'
import './DataPanel.css'

interface DataPanelProps {
  data: any
  isOpen: boolean
  onToggle: () => void
}

export const DataPanel: React.FC<DataPanelProps> = ({ data, isOpen, onToggle }) => {
  return (
    <>
      <div className={`data-panel-tab ${isOpen ? 'open' : ''}`} onClick={onToggle}>
        <span className="tab-text">O*NET DATA</span>
        <span className="tab-icon">{isOpen ? '›' : '‹'}</span>
      </div>
      
      <div className={`data-panel ${isOpen ? 'open' : ''}`}>
        <div className="data-panel-header">
          <h3>Live O*NET API Response</h3>
          <button className="close-btn" onClick={onToggle}>×</button>
        </div>
        
        <div className="data-panel-content">
          <pre className="json-display">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </>
  )
}