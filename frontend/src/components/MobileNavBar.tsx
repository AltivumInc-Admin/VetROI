import { useState, useEffect } from 'react'
import '../styles/MobileNavBar.css'

interface MobileNavBarProps {
  currentSection: string
  onMenuClick: () => void
  isDrawerOpen: boolean
}

export const MobileNavBar = ({ 
  currentSection, 
  onMenuClick,
  isDrawerOpen 
}: MobileNavBarProps) => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Format section name for display
  const getSectionTitle = () => {
    const titles: { [key: string]: string } = {
      profile: 'Your Profile',
      confirmation: 'Confirm Details',
      dd214: 'DD214 Upload',
      careers: 'Career Matches',
      analysis: 'Career Analysis',
      sentra: 'Sentra AI'
    }
    return titles[currentSection] || 'VetROI'
  }

  return (
    <nav className={`mobile-nav-bar ${scrolled ? 'scrolled' : ''} ${isDrawerOpen ? 'drawer-open' : ''}`}>
      <button 
        className={`nav-menu-button ${isDrawerOpen ? 'active' : ''}`}
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
        aria-expanded={isDrawerOpen}
      >
        <span className="hamburger-icon">
          <span className="line line-1"></span>
          <span className="line line-2"></span>
          <span className="line line-3"></span>
        </span>
      </button>
      
      <div className="nav-title">
        <h1>{getSectionTitle()}</h1>
      </div>
      
      <div className="nav-actions">
        {/* Placeholder for future context actions */}
      </div>
    </nav>
  )
}