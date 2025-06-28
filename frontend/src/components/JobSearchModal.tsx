import React from 'react'
import '../styles/JobSearchModal.css'

interface JobSearchModalProps {
  isOpen: boolean
  onClose: () => void
  mosCode: string
  jobTitles: string[]
  state: string
}

export const JobSearchModal: React.FC<JobSearchModalProps> = ({
  isOpen,
  onClose,
  mosCode,
  jobTitles,
  state
}) => {
  if (!isOpen) return null

  return (
    <div className="job-search-modal-overlay" onClick={onClose}>
      <div className="job-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Apply for Jobs</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className="modal-content">
          <div className="personalized-message">
            <p>
              Based on your input, Sentra has determined that you are <strong>{mosCode}</strong>, 
              interested in <strong>{jobTitles.join(', ')}</strong>, 
              and you live in <strong>{state}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}