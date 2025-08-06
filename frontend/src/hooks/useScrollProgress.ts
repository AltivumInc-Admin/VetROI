import { useEffect, useCallback } from 'react'

interface ScrollProgressOptions {
  threshold?: number // percentage of section that needs to be visible (0-1)
  onSectionComplete?: (sectionId: string) => void
  onSectionActive?: (sectionId: string) => void
}

export const useScrollProgress = ({
  threshold = 0.6,
  onSectionComplete,
  onSectionActive
}: ScrollProgressOptions) => {
  
  const checkSectionVisibility = useCallback(() => {
    const sections = document.querySelectorAll('[data-section]')
    const windowHeight = window.innerHeight
    // const scrollY = window.scrollY  // Unused - commented out to fix build
    
    sections.forEach((section) => {
      const sectionId = section.getAttribute('data-section')
      if (!sectionId) return
      
      const rect = section.getBoundingClientRect()
      const sectionHeight = rect.height
      const sectionTop = rect.top
      const sectionBottom = rect.bottom
      
      // Calculate how much of the section is visible
      const visibleTop = Math.max(0, sectionTop)
      const visibleBottom = Math.min(windowHeight, sectionBottom)
      const visibleHeight = Math.max(0, visibleBottom - visibleTop)
      const visibilityRatio = visibleHeight / sectionHeight
      
      // Check if section is active (currently in view)
      if (visibilityRatio > 0.3 && sectionTop < windowHeight * 0.5) {
        onSectionActive?.(sectionId)
      }
      
      // Check if we've scrolled past the threshold
      if (sectionId !== 'profile') { // Don't mark profile as complete via scroll
        const scrolledPastThreshold = sectionTop < -(sectionHeight * (1 - threshold))
        if (scrolledPastThreshold) {
          onSectionComplete?.(sectionId)
        }
      }
    })
  }, [threshold, onSectionComplete, onSectionActive])
  
  useEffect(() => {
    // Initial check
    checkSectionVisibility()
    
    // Throttled scroll handler
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkSectionVisibility()
          ticking = false
        })
        ticking = true
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', checkSectionVisibility)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', checkSectionVisibility)
    }
  }, [checkSectionVisibility])
}