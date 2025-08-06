import { useState } from 'react'
import '../styles/MobileComingSoon.css'

export const MobileComingSoon = () => {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    
    // Store email for launch notification
    try {
      // TODO: Connect to your email service (Mailchimp, SendGrid, etc.)
      localStorage.setItem('vetroi_mobile_waitlist', email)
      setIsSubscribed(true)
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mobile-coming-soon">
      <div className="coming-soon-background">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <div className="coming-soon-content">
        <div className="brand-section">
          <h1 className="brand-title">VetROI™</h1>
          <p className="brand-tagline">Veteran Return on Investment</p>
        </div>

        <div className="message-section">
          <div className="device-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
          </div>
          
          <h2>Mobile App Coming Soon</h2>
          
          <p className="main-message">
            VetROI is currently optimized for desktop browsers to provide you with the most comprehensive career intelligence experience.
          </p>

          <div className="feature-preview">
            <h3>iOS App in Development</h3>
            <ul>
              <li>📱 Native iOS experience</li>
              <li>🔒 Secure DD214 processing</li>
              <li>💼 Real-time career matching</li>
              <li>📊 Full analytics on the go</li>
            </ul>
          </div>

          {!isSubscribed ? (
            <form className="notify-form" onSubmit={handleSubscribe}>
              <h3>Get Notified When We Launch</h3>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Subscribing...' : 'Notify Me'}
                </button>
              </div>
              <p className="privacy-note">
                We'll only email you once when the mobile app launches.
              </p>
            </form>
          ) : (
            <div className="success-message">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3>You're on the list!</h3>
              <p>We'll notify you as soon as the mobile app is available.</p>
            </div>
          )}

          <div className="desktop-cta">
            <p>Ready to start now?</p>
            <a href="https://vetroi.altivum.ai" className="desktop-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Open VetROI on Desktop
            </a>
            <p className="instruction">
              Visit this page on your laptop or desktop computer for full access.
            </p>
          </div>
        </div>

        <footer className="coming-soon-footer">
          <p>© 2025 Altivum Inc. | VetROI™</p>
        </footer>
      </div>
    </div>
  )
}