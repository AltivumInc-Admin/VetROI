import { useState, useEffect, useRef } from 'react'
import '../styles/MobileProgressIndicator.css'

interface Section {
  id: string
  label: string
  completed: boolean
  active: boolean
  accessible: boolean
}

interface MobileProgressIndicatorProps {
  sections: Section[]
  currentSection: string
  onSectionClick: (sectionId: string) => void
}

export const MobileProgressIndicator = ({ 
  sections, 
  currentSection: _currentSection, // Prefix with underscore to indicate intentionally unused
  onSectionClick
}: MobileProgressIndicatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const expandedRef = useRef<HTMLDivElement>(null)
  
  // Find current step info
  const currentStepIndex = sections.findIndex(section => section.active)
  const currentStep = sections[currentStepIndex]
  const completedCount = sections.filter(s => s.completed).length
  const progressPercentage = (completedCount / sections.length) * 100
  
  // Handle clicking outside to close expanded view
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && expandedRef.current && !expandedRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }
    
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isExpanded])
  
  // Prevent body scroll when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isExpanded])
  
  const handleSectionClick = (section: Section) => {
    if (section.accessible) {
      onSectionClick(section.id)
      setIsExpanded(false)
    }
  }
  
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    
    const touch = e.changedTouches[0]
    const deltaX = Math.abs(touch.clientX - touchStart.x)
    const deltaY = Math.abs(touch.clientY - touchStart.y)
    
    // If it's a tap (small movement), toggle expanded state
    if (deltaX < 10 && deltaY < 10) {
      setIsExpanded(!isExpanded)
    }
    
    setTouchStart(null)
  }
  
  const renderCollapsedView = () => (
    <div 
      className="mobile-progress-collapsed"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="progress-info">
        <div className="step-info">
          <span className="step-number">Step {currentStepIndex + 1} of {sections.length}</span>
          <span className="step-name">{currentStep?.label || 'Loading...'}</span>
        </div>
        <button 
          className="expand-indicator"
          aria-label="Tap to expand progress details"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path 
              d="M6 3L9 6L6 9M6 3L3 6L6 9" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  )
  
  const renderExpandedView = () => (
    <>
      <div className="mobile-progress-backdrop" />
      <div className="mobile-progress-expanded" ref={expandedRef}>
        <div className="expanded-header">
          <div className="header-info">
            <h3>Your Career Deep-Dive</h3>
            <span className="progress-stats">{completedCount} of {sections.length} completed</span>
          </div>
          <button 
            className="collapse-button"
            onClick={() => setIsExpanded(false)}
            aria-label="Close progress details"
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
        </div>
        
        <div className="expanded-progress-bar">
          <div 
            className="expanded-progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="expanded-sections">
          {sections.map((section, index) => (
            <button
              key={section.id}
              className={`expanded-section ${section.completed ? 'completed' : ''} ${section.active ? 'active' : ''} ${section.accessible ? 'accessible' : ''}`}
              onClick={() => handleSectionClick(section)}
              disabled={!section.accessible}
              aria-label={`${section.label} - ${section.completed ? 'Completed' : section.active ? 'Current' : 'Not started'}`}
            >
              <div className="section-indicator">
                <span className="section-number">{index + 1}</span>
                {section.completed && (
                  <div className="completion-indicator">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path 
                        d="M4 8L7 11L12 5" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="section-content">
                <span className="section-label">{section.label}</span>
                <span className="section-status">
                  {section.completed ? 'Completed' : section.active ? 'In Progress' : 'Pending'}
                </span>
              </div>
              {section.accessible && !section.completed && (
                <div className="nav-arrow">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path 
                      d="M6 4L10 8L6 12" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div className="expanded-footer">
          <div className="footer-branding">
            <span className="brand-name">VetROI™</span>
            <span className="brand-tagline">Career Intelligence Platform</span>
          </div>
        </div>
      </div>
    </>
  )
  
  return (
    <div className={`mobile-progress-indicator ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {isExpanded ? renderExpandedView() : renderCollapsedView()}
    </div>
  )
}