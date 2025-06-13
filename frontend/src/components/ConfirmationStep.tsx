import React from 'react'
import { VeteranRequest } from '../types'
import { formatProfileSummary } from '../utils/mosTranslator'
import './ConfirmationStep.css'

interface ConfirmationStepProps {
  profile: VeteranRequest
  onConfirm: () => void
  onAdjust: () => void
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  profile,
  onConfirm,
  onAdjust
}) => {
  const summary = formatProfileSummary(
    profile.branch,
    profile.code,
    profile.homeState,
    profile.relocate
  )

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