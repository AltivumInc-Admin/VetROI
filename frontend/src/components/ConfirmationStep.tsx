import React from 'react'
import { VeteranRequest, US_STATES } from '../types'
import './ConfirmationStep.css'

interface ConfirmationStepProps {
  profile: VeteranRequest
  apiResponse: any
  onConfirm: () => void
  onAdjust: () => void
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  profile,
  apiResponse,
  onConfirm,
  onAdjust
}) => {
  // Helper functions
  const formatEducation = (education: string): string => {
    const educationMap: Record<string, string> = {
      'high_school': 'High School Diploma',
      'associate': 'Associate Degree',
      'bachelor': "Bachelor's Degree",
      'master': "Master's Degree",
      'doctorate': 'Doctorate'
    }
    return educationMap[education] || education
  }

  const getStateName = (stateCode?: string): string | null => {
    if (!stateCode) return null
    return US_STATES.find(s => s.code === stateCode)?.name || stateCode
  }

  // Extract MOS title from API response
  const extractMOSTitle = () => {
    // Only check the correct crosswalk structure
    if (apiResponse.onet_careers?.match?.[0]?.title) {
      const fullTitle = apiResponse.onet_careers.match[0].title
      const titleMatch = fullTitle.match(/^([^(]+)(?:\s*\(|$)/)
      if (titleMatch) {
        return titleMatch[1].trim()
      }
      return fullTitle
    }
    
    return null
  }

  const mosTitle = extractMOSTitle()
  const mosDisplay = mosTitle ? `${mosTitle} (${profile.code})` : profile.code
  
  // Get full state name from code
  const state = US_STATES.find(s => s.code === profile.homeState)?.name || profile.homeState
  
  // Format branch name properly
  const branchDisplay = profile.branch.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-header">
          <h2>Let me make sure I have this right:</h2>
        </div>
        
        <div className="confirmation-content">
          <div className="profile-summary">
            <p>
              You served in the <span className="highlight">{branchDisplay}</span> as a{' '}
              <span className="highlight">{mosDisplay}</span>
            </p>
            <p>
              You have a <span className="highlight">{formatEducation(profile.education)}</span>
            </p>
            <p>
              You're seeking employment in <span className="highlight">{state}</span>{' '}
              {profile.relocate 
                ? <>but are open to employment in <span className="highlight">{getStateName(profile.relocateState) || 'another state'}</span></>
                : `and prefer to stay in ${state}`}
            </p>
          </div>
        </div>
        
        <div className="confirmation-actions">
          <button 
            className="confirm-button"
            onClick={onConfirm}
          >
            <span className="check-icon">✓</span>
            Looks right
          </button>
          
          <button 
            className="adjust-button"
            onClick={onAdjust}
          >
            <span className="rotate-icon">↻</span>
            Let me adjust
          </button>
        </div>
      </div>
    </div>
  )
}