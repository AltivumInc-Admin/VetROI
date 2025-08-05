import { ReactNode, useState, useEffect } from 'react'
import '../styles/SectionWrapper.css'

interface SectionWrapperProps {
  id: string
  title: string
  completed: boolean
  collapsed: boolean
  visible: boolean
  onToggleCollapse?: () => void
  onEdit?: () => void
  children: ReactNode
  summary?: ReactNode
  hideEditButton?: boolean
}

export const SectionWrapper = ({
  id,
  title,
  completed,
  collapsed,
  visible,
  onToggleCollapse,
  onEdit,
  children,
  summary,
  hideEditButton = false
}: SectionWrapperProps) => {
  const [isAnimating, setIsAnimating] = useState(false)
  
  useEffect(() => {
    if (visible) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [visible])
  
  const handleToggle = () => {
    if (completed && onToggleCollapse) {
      onToggleCollapse()
    }
  }
  
  if (!visible) return null
  
  return (
    <section 
      className={`section-wrapper ${completed ? 'completed' : ''} ${collapsed ? 'collapsed' : ''} ${isAnimating ? 'animating' : ''}`}
      data-section={id}
    >
      <div className="section-header" onClick={handleToggle}>
        <div className="section-title-group">
          <div className="section-status">
            {completed ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="16 8 10 14 7 11" />
              </svg>
            ) : (
              <div className="status-ring" />
            )}
          </div>
          <h2 className="section-title">{title}</h2>
        </div>
        
        <div className="section-actions">
          {completed && !hideEditButton && onEdit && (
            <button 
              className="edit-button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              aria-label="Edit section"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}
          
          {completed && onToggleCollapse && (
            <button 
              className="collapse-toggle"
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse()
              }}
              aria-label={collapsed ? 'Expand section' : 'Collapse section'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {collapsed ? (
                  <polyline points="6 9 12 15 18 9" />
                ) : (
                  <polyline points="18 15 12 9 6 15" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="section-content">
        {collapsed && summary ? (
          <div className="section-summary">
            {summary}
          </div>
        ) : (
          <div className="section-body">
            {children}
          </div>
        )}
      </div>
    </section>
  )
}