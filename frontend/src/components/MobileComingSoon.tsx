import { useState, useEffect } from 'react'
import '../styles/MobileComingSoon.css'

export const MobileComingSoon = () => {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)

  // Delay showing content for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 2000) // 2 seconds delay

    return () => clearTimeout(timer)
  }, [])

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

  if (!showContent) {
    return (
      <div className="mobile-coming-soon loading">
        <div className="loading-container">
          <div className="loading-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-coming-soon">
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>
      <div className="gradient-orb orb-3"></div>
      
      <div className="coming-soon-content">
        <div className="glass-card main-card">
          <div className="card-glow"></div>
          
          <div className="brand-header">
            <div className="brand-mark">
              <span className="brand-icon">V</span>
            </div>
            <h1 className="brand-title">VetROI™</h1>
            <div className="brand-line"></div>
            <p className="brand-subtitle">Career Intelligence Platform</p>
          </div>

          <div className="status-badge">
            <span className="status-dot"></span>
            <span className="status-text">Desktop Experience Required</span>
          </div>
          
          <div className="message-content">
            <p className="primary-message">
              Our comprehensive career intelligence platform is engineered for desktop browsers, 
              delivering advanced analytics and real-time insights that demand a full-screen experience.
            </p>
          </div>

          <div className="divider-section">
            <div className="divider-line"></div>
            <span className="divider-text">iOS App Coming Q2 2025</span>
            <div className="divider-line"></div>
          </div>

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span>Advanced Analytics</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <span>Secure Processing</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span>Real-time Matching</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
              </div>
              <span>AI Integration</span>
            </div>
          </div>

          {!isSubscribed ? (
            <div className="notification-section">
              <form className="email-form" onSubmit={handleSubscribe}>
                <div className="input-group">
                  <input
                    type="email"
                    className="email-input"
                    placeholder="Enter email for launch notification"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button type="submit" className="submit-btn" disabled={isLoading}>
                    <span>{isLoading ? 'Processing' : 'Notify Me'}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="success-notification">
              <div className="success-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p>Launch notification confirmed</p>
            </div>
          )}
        </div>

        <div className="footer-mark">
          <p>© 2025 Altivum Inc.</p>
        </div>
      </div>
    </div>
  )
}