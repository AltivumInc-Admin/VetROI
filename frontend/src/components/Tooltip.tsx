import React, { useState } from 'react'
import '../styles/Tooltip.css'

interface TooltipProps {
  content: string
  children: React.ReactNode
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="tooltip-container">
      <div 
        className="tooltip-trigger"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="tooltip-content">
          <div className="tooltip-arrow" />
          <p>{content}</p>
        </div>
      )}
    </div>
  )
}