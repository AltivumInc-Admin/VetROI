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
              <li>Your file will be securely stored using <strong>AES-256 encryption</strong> (at rest) and <strong>TLS 1.2+ encryption</strong> (in transit) via AWS infrastructure.</li>
              <li>Any <strong>Personally Identifiable Information (PII)</strong>, including your Social Security Number, will be <strong>automatically redacted</strong> before further processing.</li>
              <li>Your military service data will be used solely to generate <strong>personalized career recommendations</strong> through the VetROI™ platform.</li>
              <li>Your document will be retained <strong>only while your account remains active</strong>, or until you request permanent deletion.</li>
            </ul>
          </div>

          <div className="agreement-section">
            <h3>🔒 Data Security & Privacy</h3>
            <ul>
              <li><strong>Encryption:</strong> All documents are encrypted in transit and at rest.</li>
              <li><strong>Access Control:</strong> Only you can access your uploaded documents unless explicitly authorized.</li>
              <li><strong>Zero Sharing Policy:</strong> We never sell, share, or monetize your personal data.</li>
              <li><strong>Compliance:</strong> We follow NIST 800-53 aligned best practices for data protection.</li>
            </ul>
          </div>

          <div className="agreement-section">
            <h3>🗑️ Your Rights</h3>
            <ul>
              <li><strong>Access:</strong> Request a copy of all your stored data at any time.</li>
              <li><strong>Deletion:</strong> Request full deletion of your DD214 and associated records at any time.</li>
              <li><strong>Portability:</strong> Download your career analysis results at your discretion.</li>
              <li><strong>Consent Choice:</strong> You can choose not to upload your DD214 and still access basic platform features.</li>
            </ul>
          </div>

          <div className="agreement-section">
            <h3>📊 How We Use Your Data</h3>
            <ul>
              <li>Match your service background to civilian careers using semantic and statistical inference.</li>
              <li>Provide job market insights including salary projections and growth forecasts.</li>
              <li>Improve VetROI™ algorithms using <strong>anonymized and aggregated</strong> career data.</li>
              <li>Never use your data for marketing, retargeting, or advertising.</li>
            </ul>
          </div>

          <div className="agreement-notice">
            <p>
              <strong>📅 Data Retention Policy:</strong> Your DD214 is retained <strong>only while your account is active.</strong> 
              If your account is inactive for 12 months, we'll notify you before any data is deleted. 
              You may request immediate deletion at any time by contacting us at <strong>support@altivum.io</strong>.
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