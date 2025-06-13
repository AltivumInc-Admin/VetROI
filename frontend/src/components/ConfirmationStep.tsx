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
  
  const relocateText = profile.relocate 
    ? 'and are open to relocating for the right opportunity' 
    : `and prefer to stay in ${state}`
  
  // Format branch name properly
  const branchDisplay = profile.branch.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
  
  const summary = `You served in the ${branchDisplay} as a ${mosDisplay}. You're currently in ${state} ${relocateText}.`

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-header">
          <h2>Let me make sure I have this right.</h2>
        </div>
        
        <div className="confirmation-content">
          <p className="profile-summary">{summary}</p>
          
          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">Education Level</span>
              <span className="detail-value">{profile.education}</span>
            </div>
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