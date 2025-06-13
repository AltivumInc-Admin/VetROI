import React, { useState, useEffect, useRef } from 'react'
import '../styles/Tooltip.css'

interface TooltipProps {
  content: string
  children: React.ReactNode
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false)
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsVisible(!isVisible)
  }

  return (
    <div className="tooltip-container" ref={tooltipRef}>
      <div 
        className="tooltip-trigger"
        onClick={handleClick}
      >
        {children}
      </div>
      {isVisible && (
        <>
          <div className="tooltip-backdrop" onClick={() => setIsVisible(false)} />
          <div className="tooltip-content">
            <div className="tooltip-arrow" />
            <p>{content}</p>
          </div>
        </>
      )}
    </div>
  )
}