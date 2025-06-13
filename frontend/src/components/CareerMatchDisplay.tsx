import React, { useState } from 'react'
import { CareerMatchCard } from './CareerMatchCard'
import { Tooltip } from './Tooltip'
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

  const socTooltipContent = "A Standard Occupational Classification (SOC) code is a numerical code that categorizes workers into occupational groups based on their job duties, not job titles. It's a federal standard used by various agencies to collect, analyze, and disseminate data about the workforce."
  
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

      <div className="career-cards-container">
        <div className={`career-column available-careers ${activeTab === 'available' ? 'active' : ''}`}>
          <h3>
            Available Careers{' '}
            <Tooltip content={socTooltipContent}>
              <span className="info-icon">ⓘ</span>
            </Tooltip>
          </h3>
          <div className="career-cards-grid">
            {availableCareers.map((match) => (
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