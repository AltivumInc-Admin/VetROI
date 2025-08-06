import { ReactNode, useEffect, useRef, Children, cloneElement, isValidElement } from 'react'
import '../styles/VerticalFlowContainer.css'

interface VerticalFlowContainerProps {
  children: ReactNode
  currentSection: string
  onSectionChange?: (section: string) => void
}

export const VerticalFlowContainer = ({ 
  children, 
  currentSection,
  onSectionChange 
}: VerticalFlowContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = window.innerWidth <= 768
  
  // Smooth scroll to section when current section changes
  useEffect(() => {
    if (currentSection && containerRef.current) {
      const sectionElement = containerRef.current.querySelector(`[data-section="${currentSection}"]`)
      if (sectionElement) {
        setTimeout(() => {
          sectionElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest' 
          })
        }, 100)
      }
    }
  }, [currentSection])
  
  // Observe sections for analytics/progress tracking
  useEffect(() => {
    if (!containerRef.current || !onSectionChange) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const section = entry.target.getAttribute('data-section')
            if (section) {
              onSectionChange(section)
            }
          }
        })
      },
      { 
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0.5 
      }
    )
    
    const sections = containerRef.current.querySelectorAll('[data-section]')
    sections.forEach(section => observer.observe(section))
    
    return () => observer.disconnect()
  }, [onSectionChange])
  
  // Add section numbers to children on mobile
  const enhancedChildren = isMobile ? Children.map(children, (child, index) => {
    if (isValidElement(child) && child.props['data-section']) {
      return cloneElement(child as any, {
        'data-section-number': index + 1,
        'data-show-scroll-hint': index < Children.count(children) - 1
      })
    }
    return child
  }) : children

  return (
    <div className="vertical-flow-container" ref={containerRef}>
      <div className="flow-content">
        {enhancedChildren}
      </div>
    </div>
  )
}