import React, { useState } from 'react'
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
  
  const CARDS_PER_PAGE = 9
  
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
  
  // Pagination calculations
  const totalPages = Math.ceil(availableCareers.length / CARDS_PER_PAGE)
  const startIndex = currentPage * CARDS_PER_PAGE
  const endIndex = startIndex + CARDS_PER_PAGE
  const currentPageCareers = availableCareers.slice(startIndex, endIndex)
  
  // Reset page when careers change
  React.useEffect(() => {
    setCurrentPage(0)
  }, [availableCareers.length])
  
  return (
    <div className="career-match-container">
      <div className="career-match-header">
        <h2>Your Career Opportunities</h2>
        <p className="thank-you-message">
          First I'd be remiss if I didn't thank you for your service as a{' '}
          <span className="highlight">{mosTitle}</span>.
          <br /><br />
          Your military experience provides you with several options in the civilian sector. 
          Scroll through these options below and click on the SOC codes that spark your interest. 
          We'll explore these in greater detail soon.
          <br /><br />
          Add careers to your "Careers of Interest" column by clicking on the SOC code at the top of each card. 
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
          <h3>Available Careers</h3>
          <div className="career-cards-grid">
            {currentPageCareers.map((match) => (
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
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                className="pagination-button prev"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                ← Previous
              </button>
              <div className="page-indicators">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`page-dot ${currentPage === i ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i)}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
              <button 
                className="pagination-button next"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Next →
              </button>
            </div>
          )}
        </div>
        
        <div className={`career-column careers-of-interest ${activeTab === 'interest' ? 'active' : ''}`}>
          <h3>Careers of Interest</h3>
          {selectedCareers.length === 0 ? (
            <div className="empty-state">
              <p className="quote">{getRandomQuote()}</p>
              <p className="instruction">Click SOC codes to add careers here</p>
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
  '"Control the controllable and influence the variables." — Christian Perez'
]

function getRandomQuote(): string {
  return quotes[Math.floor(Math.random() * quotes.length)]
}