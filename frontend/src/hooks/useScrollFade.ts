import { useEffect, useRef, useState } from 'react'

export const useScrollFade = (threshold = 0.8) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [opacity, setOpacity] = useState(1)
  
  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return
      
      const element = elementRef.current
      const rect = element.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Calculate how much of the element is visible
      const elementTop = rect.top
      const elementBottom = rect.bottom
      const elementHeight = rect.height
      
      // When scrolling down and element is going up
      if (elementTop < 0) {
        // Calculate fade based on how much has scrolled past
        const scrolledPast = Math.abs(elementTop)
        const fadeStart = elementHeight * (1 - threshold)
        const fadeDistance = elementHeight * threshold
        
        const newOpacity = Math.max(0, 1 - (scrolledPast - fadeStart) / fadeDistance)
        setOpacity(newOpacity)
      }
      // When scrolling up and element is coming back
      else if (elementBottom > windowHeight) {
        // Calculate fade based on how much is below viewport
        const belowViewport = elementBottom - windowHeight
        const fadeDistance = elementHeight * threshold
        
        const newOpacity = Math.max(0, 1 - belowViewport / fadeDistance)
        setOpacity(newOpacity)
      }
      // Element is fully in view
      else {
        setOpacity(1)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])
  
  return { elementRef, opacity }
}