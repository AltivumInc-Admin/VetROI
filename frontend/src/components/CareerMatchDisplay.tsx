import React from 'react'
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
  // MOS code will be used for deeper analysis in Phase 4
  console.log(`Displaying career matches for MOS: ${mosCode}`)
  
  return (
    <div className="career-match-container">
      <div className="career-match-header">
        <h2>Your Career Opportunities</h2>
        <p className="thank-you-message">
          First I'd be remiss if I didn't thank you for your service as a{' '}
          <span className="highlight">{mosTitle}</span>. Your military experience 
          provides you with several options in the civilian sector. Scroll through 
          these options below and click on the SOC codes that spark your interest. 
          We'll explore these in greater detail soon.
        </p>
      </div>

      <div className="career-cards-grid">
        {matches.map((match) => (
          <CareerMatchCard
            key={match.code}
            code={match.code}
            title={match.title}
            brightOutlook={match.tags.bright_outlook}
            green={match.tags.green}
            onSOCClick={onSOCClick}
          />
        ))}
      </div>
    </div>
  )
}