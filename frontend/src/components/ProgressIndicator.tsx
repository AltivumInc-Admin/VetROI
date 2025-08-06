import { useState, useEffect } from 'react'
import '../styles/ProgressIndicator.css'

interface Section {
  id: string
  label: string
  completed: boolean
  active: boolean
  accessible: boolean
}

interface ProgressIndicatorProps {
  sections: Section[]
  currentSection: string
  onSectionClick: (sectionId: string) => void
  position?: 'left' | 'top'
  onMinimizedChange?: (isMinimized: boolean) => void
}

export const ProgressIndicator = ({ 
  sections, 
  // currentSection,  // Unused - commented out to fix build
  onSectionClick,
  position = 'left',
  onMinimizedChange
}: ProgressIndicatorProps) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  useEffect(() => {
    onMinimizedChange?.(isMinimized)
  }, [isMinimized, onMinimizedChange])
  
  const handleSectionClick = (section: Section) => {
    if (section.accessible) {
      onSectionClick(section.id)
    }
  }
  
  const completedCount = sections.filter(s => s.completed).length
  const progressPercentage = (completedCount / sections.length) * 100
  
  const indicatorPosition = isMobile ? 'top' : position
  
  return (
    <div className={`progress-indicator progress-indicator--${indicatorPosition} ${isMinimized ? 'minimized' : ''}`}>
      {indicatorPosition === 'left' && (
        <button 
          className="minimize-toggle"
          onClick={() => setIsMinimized(!isMinimized)}
          aria-label={isMinimized ? 'Expand progress indicator' : 'Minimize progress indicator'}
        >
          <span className="minimize-icon">
            {isMinimized ? '→' : '←'}
          </span>
        </button>
      )}
      
      <div className="progress-content">
        <div className="app-branding">
          <h1>VetROI™</h1>
          <p className="tagline">Career Intelligence Platform</p>
        </div>
        <div className="progress-header">
          <h3>Your Career Deep-Dive</h3>
        </div>
        
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ height: `${progressPercentage}%`, width: indicatorPosition === 'top' ? `${progressPercentage}%` : '100%' }}
          />
        </div>
        
        <nav className="progress-sections">
          {sections.map((section, index) => (
            <button
              key={section.id}
              className={`progress-section ${section.completed ? 'completed' : ''} ${section.active ? 'active' : ''} ${section.accessible ? 'accessible' : ''}`}
              onClick={() => handleSectionClick(section)}
              disabled={!section.accessible}
              aria-label={`${section.label} - ${section.completed ? 'Completed' : section.active ? 'Current' : 'Not started'}`}
            >
              <div className="section-indicator">
                <span className="section-number">{index + 1}</span>
              </div>
              <span className="section-label">{section.label}</span>
              {section.active && <span className="current-indicator">Current</span>}
            </button>
          ))}
        </nav>
        
        {indicatorPosition === 'left' && (
          <div className="sidebar-footer">
            <div className="footer-copyright">
              © 2025 Altivum Inc.
            </div>
            <div className="footer-trademark">
              VetROI™ is a trademark of Altivum Inc.
            </div>
            <div className="footer-onet">
              This site incorporates information from{' '}
              <a href="https://services.onetcenter.org/" 
                 target="_blank" 
                 rel="noopener noreferrer">
                O*NET Web Services
              </a>{' '}
              by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA).
            </div>
          </div>
        )}
      </div>
    </div>
  )
}