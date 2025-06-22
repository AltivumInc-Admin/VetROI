import React, { useState, useEffect } from 'react'
import '../styles/ProcessingEngagementModal.css'

interface ProcessingEngagementModalProps {
  isOpen: boolean
  onClose: () => void
  processingTime?: number // in seconds
}

export const ProcessingEngagementModal: React.FC<ProcessingEngagementModalProps> = ({
  isOpen,
  onClose,
  processingTime = 150 // 2.5 minutes default
}) => {
  const [currentView, setCurrentView] = useState<'welcome' | 'poll' | 'content' | 'podcast'>('welcome')
  const [pollAnswers, setPollAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(processingTime)
  const [showThankYou, setShowThankYou] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePollSubmit = () => {
    console.log('Poll answers:', pollAnswers)
    setShowThankYou(true)
    setTimeout(() => {
      setShowThankYou(false)
      setCurrentView('content')
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="engagement-modal-overlay">
      <div className="engagement-modal">
        <div className="modal-header">
          <div className="processing-indicator">
            <div className="processing-spinner"></div>
            <span>Processing your DD214...</span>
          </div>
          <div className="time-remaining">
            <span className="time-label">Estimated time:</span>
            <span className="time-value">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        <div className="modal-content">
          {currentView === 'welcome' && (
            <div className="welcome-view">
              <h2>While We Process Your Document...</h2>
              <p>
                We're carefully redacting your personal information and analyzing your military experience. 
                This typically takes 2-3 minutes.
              </p>
              
              <div className="engagement-options">
                <button 
                  className="engagement-option poll-option"
                  onClick={() => setCurrentView('poll')}
                >
                  <div className="option-icon">📊</div>
                  <div className="option-content">
                    <h3>Help Us Improve</h3>
                    <p>Answer 2 quick questions about your transition</p>
                  </div>
                </button>

                <button 
                  className="engagement-option content-option"
                  onClick={() => setCurrentView('content')}
                >
                  <div className="option-icon">📚</div>
                  <div className="option-content">
                    <h3>Discover Resources</h3>
                    <p>Learn about veteran career success strategies</p>
                    <span className="option-tag">Featured Book</span>
                  </div>
                </button>

                <button 
                  className="engagement-option podcast-option"
                  onClick={() => setCurrentView('podcast')}
                >
                  <div className="option-icon">🎧</div>
                  <div className="option-content">
                    <h3>Vector by Altivum Press™</h3>
                    <p>Strategic AI insights for military leaders</p>
                    <span className="option-duration">Weekly episodes</span>
                  </div>
                </button>
              </div>

              <button className="skip-button" onClick={onClose}>
                Continue waiting quietly
              </button>
            </div>
          )}

          {currentView === 'poll' && !showThankYou && (
            <div className="poll-view">
              <h2>Quick Survey</h2>
              <p>Your insights help us serve veterans better</p>

              <div className="poll-questions">
                <div className="poll-question">
                  <label>What's your biggest challenge in transitioning to civilian work?</label>
                  <div className="poll-options">
                    <button 
                      className={`poll-option ${pollAnswers.challenge === 'translation' ? 'selected' : ''}`}
                      onClick={() => setPollAnswers({...pollAnswers, challenge: 'translation'})}
                    >
                      Translating military experience
                    </button>
                    <button 
                      className={`poll-option ${pollAnswers.challenge === 'networking' ? 'selected' : ''}`}
                      onClick={() => setPollAnswers({...pollAnswers, challenge: 'networking'})}
                    >
                      Building civilian networks
                    </button>
                    <button 
                      className={`poll-option ${pollAnswers.challenge === 'culture' ? 'selected' : ''}`}
                      onClick={() => setPollAnswers({...pollAnswers, challenge: 'culture'})}
                    >
                      Adapting to corporate culture
                    </button>
                    <button 
                      className={`poll-option ${pollAnswers.challenge === 'skills' ? 'selected' : ''}`}
                      onClick={() => setPollAnswers({...pollAnswers, challenge: 'skills'})}
                    >
                      Identifying transferable skills
                    </button>
                  </div>
                </div>

                <div className="poll-question">
                  <label>Which career support would be most valuable to you?</label>
                  <div className="poll-options">
                    <button 
                      className={`poll-option ${pollAnswers.support === 'mentorship' ? 'selected' : ''}`}
                      onClick={() => setPollAnswers({...pollAnswers, support: 'mentorship'})}
                    >
                      1-on-1 Mentorship
                    </button>
                    <button 
                      className={`poll-option ${pollAnswers.support === 'resume' ? 'selected' : ''}`}
                      onClick={() => setPollAnswers({...pollAnswers, support: 'resume'})}
                    >
                      Resume Translation Service
                    </button>
                    <button 
                      className={`poll-option ${pollAnswers.support === 'interview' ? 'selected' : ''}`}
                      onClick={() => setPollAnswers({...pollAnswers, support: 'interview'})}
                    >
                      Interview Preparation
                    </button>
                    <button 
                      className={`poll-option ${pollAnswers.support === 'connections' ? 'selected' : ''}`}
                      onClick={() => setPollAnswers({...pollAnswers, support: 'connections'})}
                    >
                      Veteran Alumni Connections
                    </button>
                  </div>
                </div>
              </div>

              <div className="poll-actions">
                <button 
                  className="submit-poll-button"
                  onClick={handlePollSubmit}
                  disabled={!pollAnswers.challenge || !pollAnswers.support}
                >
                  Submit Responses
                </button>
                <button className="back-button" onClick={() => setCurrentView('welcome')}>
                  Back
                </button>
              </div>
            </div>
          )}

          {showThankYou && (
            <div className="thank-you-view">
              <div className="thank-you-icon">✅</div>
              <h2>Thank You!</h2>
              <p>Your feedback helps us serve veterans better</p>
            </div>
          )}

          {currentView === 'content' && (
            <div className="content-view">
              <div className="book-showcase">
                <div className="book-showcase-layout">
                  <div className="book-cover">
                    <img 
                      src="/beyond-the-assessment-cover.png" 
                      alt="Beyond the Assessment book cover"
                    />
                  </div>
                  <div className="book-details">
                  <h2>Beyond the Assessment</h2>
                  <h3>Forging Strength, Overcoming Adversity, and Embracing the Warrior Mindset</h3>
                  <p className="author">By Christian Perez<br />Former Green Beret and Founder of Altivum<sup>™</sup> Inc.</p>
                  
                  <div className="book-highlights">
                    <div className="highlight">
                      <span className="highlight-icon">🎯</span>
                      <span>100+ copies sold to veterans transitioning</span>
                    </div>
                    <div className="highlight">
                      <span className="highlight-icon">❤️</span>
                      <span>$100 donated to Stop Soldier Suicide for every 100 copies</span>
                    </div>
                    <div className="highlight">
                      <span className="highlight-icon">🎧</span>
                      <span>Available as audiobook on Spotify</span>
                    </div>
                    <div className="highlight">
                      <span className="highlight-icon">📚</span>
                      <span>Premium & Standard editions available</span>
                    </div>
                  </div>

                  <div className="book-cta">
                    <button 
                      className="preview-button"
                      onClick={() => window.open('https://www.beyondtheassessment.com/', '_blank')}
                    >
                      Get Premium Edition
                    </button>
                    <button 
                      className="spotify-button"
                      onClick={() => window.open('https://open.spotify.com/show/6d5fm6qimH1ARze2WS7Drk?si=e28284c4bbe8438e', '_blank')}
                    >
                      Listen on Spotify
                    </button>
                  </div>

                  <div className="special-offer">
                    <p className="offer-title">🎁 Exclusive VetROI Discount</p>
                    <p className="offer-details">
                      Get <strong>15% off</strong> the Premium Edition at{' '}
                      <a href="https://www.beyondtheassessment.com/" target="_blank" rel="noopener noreferrer">
                        beyondtheassessment.com
                      </a>
                    </p>
                    <p className="offer-code">Use code: <span className="code">VETROI15</span></p>
                  </div>

                  </div>
                </div>
                
                <div className="audiobook-preview">
                  <p className="preview-label">📻 5-Minute Audio Preview:</p>
                  <iframe 
                    style={{ borderRadius: '12px' }}
                    src="https://open.spotify.com/embed/show/6d5fm6qimH1ARze2WS7Drk?utm_source=generator" 
                    width="100%" 
                    height="152" 
                    frameBorder="0" 
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                  />
                </div>
              </div>

              <button className="back-button" onClick={() => setCurrentView('welcome')}>
                Back to options
              </button>
            </div>
          )}

          {currentView === 'podcast' && (
            <div className="podcast-view">
              <div className="vector-content">
                <div className="vector-header">
                  <h2>Vector by Altivum Press™</h2>
                  <h3>Strategic AI Intelligence for Military Leaders</h3>
                  <p className="vector-tagline">
                    A concise and strategic roundup of developments in artificial intelligence—examined 
                    through the dual lenses of military insight and business leadership.
                  </p>
                </div>

                <div className="vector-sections">
                  <div className="vector-section newsletter-section">
                    <div className="section-icon">📧</div>
                    <h4>Weekly Newsletter</h4>
                    <p>
                      Get strategic AI insights delivered to your inbox every week. 
                      Join military leaders and veterans staying ahead of the AI revolution.
                    </p>
                    <button 
                      className="vector-button newsletter-button"
                      onClick={() => window.open('https://vector.altivum.ai/', '_blank')}
                    >
                      Subscribe to Newsletter
                    </button>
                  </div>

                  <div className="vector-section podcast-section">
                    <div className="section-icon">🎙️</div>
                    <h4>Vector Podcast</h4>
                    <p>
                      Deep dives into AI's impact on defense, business, and society. 
                      Featuring interviews with military leaders, tech executives, and AI pioneers.
                    </p>
                    
                    <div className="podcast-platforms">
                      <button 
                        className="platform-button spotify-platform"
                        onClick={() => window.open('https://open.spotify.com/show/4JtDt7M9b6J2HRvQxzX1CX?si=dd247384425e4dc3', '_blank')}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        Listen on Spotify
                      </button>
                      
                      <button 
                        className="platform-button apple-platform"
                        onClick={() => window.open('https://podcasts.apple.com/us/podcast/vector-ai/id1820813071', '_blank')}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        Apple Podcasts
                      </button>
                    </div>

                    <div className="latest-episode">
                      <p className="episode-label">Latest Episode Preview:</p>
                      <iframe 
                        style={{ borderRadius: '12px' }}
                        src="https://open.spotify.com/embed/show/4JtDt7M9b6J2HRvQxzX1CX?utm_source=generator&theme=0" 
                        width="100%" 
                        height="152" 
                        frameBorder="0" 
                        allowFullScreen={false}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy"
                        onError={(e) => console.error('Spotify iframe failed to load:', e)}
                      />
                    </div>
                  </div>
                </div>

                <div className="vector-footer">
                  <p className="vector-credit">
                    Published by <strong>Altivum Press™</strong> - A division of Altivum™ Inc.
                  </p>
                </div>
              </div>

              <button className="back-button" onClick={() => setCurrentView('welcome')}>
                Back to options
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="processing-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((processingTime - timeRemaining) / processingTime) * 100}%` }}
              ></div>
            </div>
          </div>
          <p className="processing-message">
            Your DD214 is being securely processed. You'll be notified when complete.
          </p>
        </div>
      </div>
    </div>
  )
}