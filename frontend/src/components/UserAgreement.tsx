import React from 'react'
import '../styles/UserAgreement.css'

interface UserAgreementProps {
  isOpen: boolean
  onAccept: () => void
  onDecline: () => void
}

export const UserAgreement: React.FC<UserAgreementProps> = ({ isOpen, onAccept, onDecline }) => {
  if (!isOpen) return null

  return (
    <div className="agreement-overlay">
      <div className="agreement-modal">
        <div className="agreement-header">
          <h2>VetROI™ Data Use Agreement</h2>
          <p className="agreement-subtitle">Please review and accept our data handling policies</p>
        </div>
        
        <div className="agreement-content">
          <div className="agreement-section">
            <h3>📋 Your DD214 Data</h3>
            <p>By uploading your DD214, you acknowledge and agree to the following:</p>
            <ul>
              <li>Your DD214 will be securely uploaded and stored using AWS encryption</li>
              <li>Personal Identifiable Information (PII) such as SSN will be automatically redacted</li>
              <li>Your military service data will be used to provide personalized career recommendations</li>
              <li>We maintain your document for the duration of your account unless you request deletion</li>
            </ul>
          </div>

          <div className="agreement-section">
            <h3>🔒 Data Security & Privacy</h3>
            <ul>
              <li><strong>Encryption:</strong> All documents are encrypted at rest and in transit</li>
              <li><strong>Access Control:</strong> Only you can access your uploaded documents</li>
              <li><strong>No Sharing:</strong> We will never sell or share your personal data with third parties</li>
              <li><strong>Compliance:</strong> We follow industry best practices for data protection</li>
            </ul>
          </div>

          <div className="agreement-section">
            <h3>🗑️ Your Rights</h3>
            <ul>
              <li><strong>Data Access:</strong> You can request a copy of all your stored data at any time</li>
              <li><strong>Data Deletion:</strong> You can request complete deletion of your account and all associated data</li>
              <li><strong>Data Portability:</strong> Export your career analysis results anytime</li>
              <li><strong>Opt-Out:</strong> You can choose not to upload your DD214 and still use basic features</li>
            </ul>
          </div>

          <div className="agreement-section">
            <h3>📊 How We Use Your Data</h3>
            <ul>
              <li>Generate personalized career matches based on your military experience</li>
              <li>Provide salary and job market insights specific to your skills</li>
              <li>Improve our algorithms using anonymized, aggregated data</li>
              <li>Never for marketing or advertising purposes</li>
            </ul>
          </div>

          <div className="agreement-notice">
            <p>
              <strong>Data Retention:</strong> Your DD214 data will be retained for as long as your account 
              is active. If you don't log in for 12 months, we'll send you a reminder before any action 
              is taken. You can request immediate deletion at any time by contacting support.
            </p>
          </div>
        </div>

        <div className="agreement-footer">
          <p className="agreement-legal">
            By clicking "I Accept", you agree to VetROI's data handling practices as described above. 
            This agreement is effective as of the date you upload your DD214.
          </p>
          
          <div className="agreement-actions">
            <button className="decline-button" onClick={onDecline}>
              I'll Decide Later
            </button>
            <button className="accept-button" onClick={onAccept}>
              I Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}