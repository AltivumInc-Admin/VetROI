import React, { useState, useRef } from 'react'
import { CareerMatchCard } from './CareerMatchCard'
import '../styles/CareerMatchDisplay.css'

interface CareerMatch {
  href: string
  code: string
  title: string
  tags: {
    bright_outlook: boolean
    green: boolean
  }
}

interface CareerMatchDisplayProps {
  mosTitle: string
  mosCode: string
  matches: CareerMatch[]
  onSOCClick: (code: string) => void
}

export const CareerMatchDisplay: React.FC<CareerMatchDisplayProps> = ({
  mosTitle,
  mosCode,
  matches,
  onSOCClick
}) => {
  const [selectedCareers, setSelectedCareers] = useState<CareerMatch[]>([])
  const [availableCareers, setAvailableCareers] = useState<CareerMatch[]>([])
  const [activeTab, setActiveTab] = useState<'available' | 'interest'>('available')
  const [showInfoBox, setShowInfoBox] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [currentQuote] = useState(() => getRandomQuote())
  
  // MOS code will be used for deeper analysis in Phase 4
  console.log(`Displaying career matches for MOS: ${mosCode}`)
  
  // Filter out military SOC codes (starting with 55) on initial load
  React.useEffect(() => {
    const civilianMatches = matches.filter(match => !match.code.startsWith('55'))
    const militaryFiltered = matches.length - civilianMatches.length
    if (militaryFiltered > 0) {
      console.log(`Filtered ${militaryFiltered} military occupation(s)`)
    }
    setAvailableCareers(civilianMatches)
  }, [matches])

  const handleSOCClick = (code: string) => {
    const career = availableCareers.find(c => c.code === code)
    if (career) {
      // Fade out from available
      setAvailableCareers(prev => prev.filter(c => c.code !== code))
      // Fade in to selected
      setTimeout(() => {
        setSelectedCareers(prev => [...prev, career])
      }, 300)
    } else {
      // Moving back from selected to available
      const selectedCareer = selectedCareers.find(c => c.code === code)
      if (selectedCareer) {
        setSelectedCareers(prev => prev.filter(c => c.code !== code))
        setTimeout(() => {
          setAvailableCareers(prev => [...prev, selectedCareer])
        }, 300)
      }
    }
    onSOCClick(code)
  }

  const socTooltipContent = "A Standard Occupational Classification (SOC) code is a numerical code used by the U.S. Department of Labor, Employment and Training Administration as well as other government agencies that categorizes workers into occupational groups based on their job duties, not job titles. It's a federal standard to collect, analyze, and disseminate data about the workforce."
  
  // Rolodex navigation
  const currentCareer = availableCareers[currentPage]
  const totalCards = availableCareers.length
  
  // Reset page when careers change
  React.useEffect(() => {
    setCurrentPage(0)
  }, [availableCareers.length])
  
  const goToPrevious = () => {
    setCurrentPage((prev) => (prev - 1 + totalCards) % totalCards)
  }
  
  const goToNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalCards)
  }
  
  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }
  
  // Mouse drag handling
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart(e.clientX)
  }
  
  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return
    
    const distance = dragStart - e.clientX
    const isLeftDrag = distance > minSwipeDistance
    const isRightDrag = distance < -minSwipeDistance
    
    if (isLeftDrag) {
      goToNext()
    } else if (isRightDrag) {
      goToPrevious()
    }
    
    setIsDragging(false)
    setDragStart(null)
  }
  
  const onMouseLeave = () => {
    setIsDragging(false)
    setDragStart(null)
  }
  
  // Throttle scroll to prevent too sensitive scrolling
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Horizontal scroll wheel handling (for Mac trackpads)
  const onWheel = (e: React.WheelEvent) => {
    // Prevent default vertical scroll
    e.preventDefault()
    
    // If already scrolling, ignore this event
    if (isScrolling) return
    
    // Check if it's a horizontal scroll (Mac trackpad)
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Only trigger if scroll delta is significant enough
      const scrollThreshold = 30 // Adjust this value to change sensitivity
      
      if (Math.abs(e.deltaX) > scrollThreshold) {
        setIsScrolling(true)
        
        if (e.deltaX > 0) {
          goToNext() // Scroll right = next card
        } else if (e.deltaX < 0) {
          goToPrevious() // Scroll left = previous card
        }
        
        // Reset scrolling flag after a delay
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false)
        }, 300) // 300ms cooldown between scrolls
      }
    }
  }
  
  return (
    <div className="career-match-container">
      <div className="career-match-header">
        <h2>Your Career Opportunities</h2>
        <div className="veteran-title">
          <span className="highlight">{mosTitle}</span>
        </div>
        <p className="thank-you-message">
          Your military experience provides you with several options in the civilian sector. 
          Scroll through these options below and click on the SOC codes that spark your interest. 
          We'll explore these in greater detail soon.
          <br /><br />
          Add careers to your "Careers of Interest" column by clicking the card. 
          When you're ready to learn more about these fields, click on the 'Detailed Analysis' button.
        </p>
      </div>

      {/* Mobile tabs */}
      <div className="mobile-tabs">
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available Careers ({availableCareers.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'interest' ? 'active' : ''}`}
            onClick={() => setActiveTab('interest')}
          >
            Careers of Interest ({selectedCareers.length})
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="info-box-container">
        <div className="info-icon-wrapper" onClick={() => setShowInfoBox(!showInfoBox)}>
          <span className="info-icon-large">ⓘ</span>
        </div>
        {showInfoBox && (
          <div className="info-box">
            <div className="info-content">
              <p><strong>SOC Code:</strong> {socTooltipContent}</p>
              <div className="info-badges">
                <span className="tag bright-outlook">
                  <span className="tag-icon">⭐</span>
                  Bright Outlook
                </span>
                <p className="badge-description">
                  Bright Outlook occupations are expected to grow rapidly in the next several years, 
                  will have large numbers of job openings, or are new and emerging occupations. 
                  We will expand on the details for each career in the Detailed Analysis page.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="career-cards-container">
        <div className={`career-column available-careers ${activeTab === 'available' ? 'active' : ''}`}>
          <h3>Available Careers ({totalCards})</h3>
          {currentCareer && (
            <div className="rolodex-container">
              <div 
                className="rolodex-viewport"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onWheel={onWheel}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                {/* Previous card edge */}
                <div className="rolodex-card-edge prev" onClick={goToPrevious} />
                
                {/* Current card */}
                <div className="rolodex-card current">
                  <CareerMatchCard
                    code={currentCareer.code}
                    title={currentCareer.title}
                    brightOutlook={currentCareer.tags.bright_outlook}
                    green={currentCareer.tags.green}
                    onSOCClick={handleSOCClick}
                  />
                </div>
                
                {/* Next card edge */}
                <div className="rolodex-card-edge next" onClick={goToNext} />
              </div>
              
              {/* Rolodex Controls */}
              <div className="rolodex-controls">
                <button 
                  className="rolodex-button prev"
                  onClick={goToPrevious}
                  aria-label="Previous career"
                >
                  ←
                </button>
                
                <div className="rolodex-counter">
                  {currentPage + 1} of {totalCards}
                </div>
                
                <button 
                  className="rolodex-button next"
                  onClick={goToNext}
                  aria-label="Next career"
                >
                  →
                </button>
              </div>
              
              {/* Page dots */}
              <div className="rolodex-dots">
                {Array.from({ length: Math.min(totalCards, 10) }, (_, i) => (
                  <button
                    key={i}
                    className={`dot ${currentPage === i ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i)}
                    aria-label={`Go to career ${i + 1}`}
                  />
                ))}
                {totalCards > 10 && <span className="dots-overflow">...</span>}
              </div>
            </div>
          )}
        </div>
        
        <div className={`career-column careers-of-interest ${activeTab === 'interest' ? 'active' : ''}`}>
          <h3>Careers of Interest</h3>
          {selectedCareers.length === 0 ? (
            <div className="empty-state">
              <p className="quote">{currentQuote}</p>
              <p className="instruction">Click cards to add careers here</p>
            </div>
          ) : (
            <div className="career-cards-grid">
              {selectedCareers.map((match) => (
                <div key={match.code} className="career-card-wrapper" style={{ opacity: 1, transition: 'opacity 0.3s ease' }}>
                  <CareerMatchCard
                    code={match.code}
                    title={match.title}
                    brightOutlook={match.tags.bright_outlook}
                    green={match.tags.green}
                    onSOCClick={handleSOCClick}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Detailed Analysis Button */}
      <div className="analysis-button-floating">
        <button 
          className="detailed-analysis-button"
          disabled={selectedCareers.length === 0}
          onClick={() => {
            if (selectedCareers.length > 0) {
              // This will be connected to App.tsx
              const event = new CustomEvent('detailedAnalysis', { 
                detail: { selectedSOCs: selectedCareers.map(c => c.code) } 
              })
              window.dispatchEvent(event)
            }
          }}
        >
          Detailed Analysis
          {selectedCareers.length > 0 && (
            <span className="selected-count">({selectedCareers.length})</span>
          )}
        </button>
      </div>
    </div>
  )
}

const quotes = [
  '"Every morning, the sun rises with endless possibilities that give you endless opportunities to begin again and to create a brand-new life." — Debasish Mridha',
  '"You are surrounded by endless possibilities. Your potential being the sum of your beliefs." — Steven Redhead',
  '"If you believe it will work, you\'ll see opportunities. If you believe it won\'t, you will see obstacles." — Wayne Dyer',
  '"Believe you can and you\'re halfway there." — Theodore Roosevelt',
  '"I didn\'t get there by wishing for it or hoping for it, but by working for it." — Estée Lauder',
  '"If you can dream it, you can do it." — Walt Disney',
  '"Success is not final, failure is not fatal: it is the courage to continue that counts." — Winston Churchill',
  '"Strength does not come from physical capacity. It comes from an indomitable will." — Mahatma Gandhi',
  '"Earn your leadership every day." — Michael Jordan',
  '"The ones who are crazy enough to think they can change the world are the ones who do." — Steve Jobs',
  '"Control the controllable and influence the variables." — Christian Perez, Founder of Altivum Inc.'
]

function getRandomQuote(): string {
  return quotes[Math.floor(Math.random() * quotes.length)]
}