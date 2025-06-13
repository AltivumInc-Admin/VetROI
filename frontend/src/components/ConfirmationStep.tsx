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
    // Look for MOS title in the API response
    // This could be in recommendations or in a crosswalk field
    if (apiResponse.mosTitle) {
      return apiResponse.mosTitle
    }
    // Check if it's in the message
    const messageMatch = apiResponse.message?.match(/as a ([^.]+)\./)
    if (messageMatch) {
      return messageMatch[1]
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
                ? `and prefer to seek employment in ${getStateName(profile.relocateState) || 'another state'}`
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
        
        <div className="data-hint">
          <span className="hint-icon">→</span>
          <span className="hint-text">View live O*NET data</span>
        </div>
      </div>
    </div>
  )
}