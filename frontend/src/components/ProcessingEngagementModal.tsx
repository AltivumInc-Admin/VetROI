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
                    <span className="option-reward">Earn priority processing</span>
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
                    <h3>AI News Podcast</h3>
                    <p>Listen to the latest in AI & career tech</p>
                    <span className="option-duration">2 min episode</span>
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
                    ></iframe>
                  </div>
                </div>
              </div>

              <button className="back-button" onClick={() => setCurrentView('welcome')}>
                Back to options
              </button>
            </div>
          )}

          {currentView === 'podcast' && (
            <div className="podcast-view">
              <div className="podcast-player">
                <div className="podcast-artwork">
                  <img 
                    src="/podcast-cover-placeholder.jpg" 
                    alt="The AI Transition Podcast"
                  />
                  <div className="play-button-overlay">
                    <button className="play-button">▶</button>
                  </div>
                </div>

                <div className="podcast-info">
                  <h2>The AI Transition Podcast</h2>
                  <h3>Episode 42: How Veterans Are Leading the AI Revolution</h3>
                  <p className="podcast-meta">2 min highlight • Full episode: 28 min</p>

                  <div className="podcast-description">
                    <p>
                      In this episode, we explore how military veterans are uniquely positioned 
                      to lead in the AI age. From operational excellence to adaptive thinking, 
                      discover why tech companies are actively recruiting veterans.
                    </p>
                  </div>

                  <div className="audio-controls">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '0%' }}></div>
                    </div>
                    <div className="time-display">
                      <span>0:00</span>
                      <span>2:00</span>
                    </div>
                  </div>

                  <div className="podcast-links">
                    <a href="#" className="podcast-link">
                      <img src="/spotify-icon.svg" alt="Spotify" />
                      Full episode on Spotify
                    </a>
                    <a href="#" className="podcast-link">
                      <img src="/apple-podcasts-icon.svg" alt="Apple Podcasts" />
                      Subscribe on Apple Podcasts
                    </a>
                  </div>
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