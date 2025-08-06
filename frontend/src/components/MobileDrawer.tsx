import { useState, useEffect, useRef } from 'react'
import '../styles/MobileDrawer.css'

interface Section {
  id: string
  label: string
  completed: boolean
  active: boolean
  accessible: boolean
}

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  sections: Section[]
  currentSection?: string
  onSectionClick: (sectionId: string) => void
  onetData: any
  selectedSOCs: string[]
  socData: any
}

export const MobileDrawer = ({
  isOpen,
  onClose,
  sections,
  currentSection: _currentSection, // Intentionally unused
  onSectionClick,
  onetData,
  selectedSOCs,
  socData
}: MobileDrawerProps) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'onet'>('progress')
  const [expandedSOCs, setExpandedSOCs] = useState<string[]>([])
  const [onetView, setOnetView] = useState<'mos' | 'soc'>('mos')
  const drawerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('drawer-open')
    } else {
      document.body.style.overflow = ''
      document.body.classList.remove('drawer-open')
    }
    
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('drawer-open')
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSectionClick = (sectionId: string) => {
    if (sections.find(s => s.id === sectionId)?.accessible) {
      onSectionClick(sectionId)
      onClose()
    }
  }

  const toggleSOC = (soc: string) => {
    setExpandedSOCs(prev => 
      prev.includes(soc) 
        ? prev.filter(s => s !== soc)
        : [...prev, soc]
    )
  }

  const completedCount = sections.filter(s => s.completed).length
  const progressPercentage = (completedCount / sections.length) * 100

  const renderProgressTab = () => (
    <div className="drawer-progress-content">
      <div className="progress-overview">
        <div className="progress-stats">
          <span className="stats-label">Journey Progress</span>
          <span className="stats-value">{completedCount} of {sections.length} steps completed</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="progress-steps">
        {sections.map((section, index) => (
          <button
            key={section.id}
            className={`step-item ${section.completed ? 'completed' : ''} ${section.active ? 'active' : ''} ${section.accessible ? 'accessible' : 'locked'}`}
            onClick={() => handleSectionClick(section.id)}
            disabled={!section.accessible}
          >
            <div className="step-indicator">
              {section.completed ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
              ) : (
                <span className="step-number">{index + 1}</span>
              )}
            </div>
            <div className="step-content">
              <h3 className="step-title">{section.label}</h3>
              <span className="step-status">
                {section.completed ? 'Complete' : section.active ? 'Current' : section.accessible ? 'Ready' : 'Locked'}
              </span>
            </div>
            {section.accessible && !section.completed && (
              <svg className="step-arrow" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  const renderOnetTab = () => (
    <div className="drawer-onet-content">
      <div className="onet-view-toggle">
        <button 
          className={`view-btn ${onetView === 'mos' ? 'active' : ''}`}
          onClick={() => setOnetView('mos')}
        >
          MOS Data
        </button>
        <button 
          className={`view-btn ${onetView === 'soc' ? 'active' : ''}`}
          onClick={() => setOnetView('soc')}
          disabled={selectedSOCs.length === 0}
        >
          SOC Data {selectedSOCs.length > 0 && `(${selectedSOCs.length})`}
        </button>
      </div>

      <div className="onet-data-container">
        {onetView === 'mos' ? (
          <div className="mos-data">
            {onetData ? (
              <pre className="json-display">
                {JSON.stringify(onetData, null, 2)}
              </pre>
            ) : (
              <div className="no-data">
                <p>No MOS data available yet.</p>
                <p>Complete your profile to see O*NET career matches.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="soc-data">
            {selectedSOCs.length > 0 ? (
              <div className="soc-list">
                {selectedSOCs.map(soc => (
                  <div key={soc} className="soc-item">
                    <button
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
                    </button>
                    {expandedSOCs.includes(soc) && (
                      <div className="soc-details">
                        <pre className="json-display">
                          {socData[soc] 
                            ? JSON.stringify(socData[soc], null, 2)
                            : 'Loading career data...'}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>No careers selected yet.</p>
                <p>Select career matches to view detailed SOC data.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className={`mobile-drawer-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className={`mobile-drawer ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="drawer-header">
          <button 
            className="drawer-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="drawer-title">
            <h2>VetROI</h2>
            <span>Career Intelligence</span>
          </div>
        </div>
        
        <div className="drawer-tabs">
          <button 
            className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
              <path d="M12 2.252A8 8 0 0117.748 8H12V2.252z"/>
            </svg>
            Progress
          </button>
          <button 
            className={`tab-btn ${activeTab === 'onet' ? 'active' : ''}`}
            onClick={() => setActiveTab('onet')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100 4h2a1 1 0 100 2 2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/>
            </svg>
            O*NET Data
          </button>
        </div>
        
        <div className="drawer-content">
          {activeTab === 'progress' ? renderProgressTab() : renderOnetTab()}
        </div>
        
        <div className="drawer-footer">
          <span className="footer-text">© 2025 Altivum Inc.</span>
        </div>
      </div>
    </>
  )
}