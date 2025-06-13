import { useState, useEffect, useRef } from 'react'
import VeteranForm from './components/VeteranForm'
import { ChatInterface } from './components/ChatInterface'
import { ConfirmationStep } from './components/ConfirmationStep'
import { VeteranRequest } from './types'
import { getRecommendations } from './api'
import './styles/App.css'
import './styles/DarkTheme.css'

interface ChatSession {
  sessionId: string
  veteranProfile: VeteranRequest
  initialMessage: string
}

function App() {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [profileData, setProfileData] = useState<VeteranRequest | null>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (formData: VeteranRequest) => {
    setError(null)
    setProfileData(formData)
    setNeedsConfirmation(true)
  }

  // Smooth scroll to confirmation when it appears
  useEffect(() => {
    if (needsConfirmation && confirmationRef.current) {
      setTimeout(() => {
        confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [needsConfirmation])

  const handleConfirm = async () => {
    if (!profileData) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await getRecommendations(profileData)
      
      // Set up chat session with the initial AI response
      setChatSession({
        sessionId: response.sessionId,
        veteranProfile: profileData,
        initialMessage: response.message || "Thank you for your service! I'm here to help you transition to a rewarding civilian career. What type of work interests you most?"
      })
      setNeedsConfirmation(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAdjust = () => {
    setNeedsConfirmation(false)
    // Profile data remains in form
  }

  const handleNewConversation = () => {
    setChatSession(null)
    setError(null)
    setNeedsConfirmation(false)
    setProfileData(null)
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>VetROI™</h1>
        <p className="tagline">Career Intelligence Platform</p>
      </header>
      
      <main className="app-main">
        <div className="container">
          {!chatSession && !needsConfirmation && (
            <VeteranForm 
              onSubmit={handleSubmit} 
              loading={loading}
              initialData={profileData}
            />
          )}
          
          {needsConfirmation && profileData && (
            <div ref={confirmationRef}>
              <ConfirmationStep
                profile={profileData}
                onConfirm={handleConfirm}
                onAdjust={handleAdjust}
              />
            </div>
          )}
          
          {chatSession && (
            <ChatInterface 
              veteranProfile={chatSession.veteranProfile}
              initialMessage={chatSession.initialMessage}
              sessionId={chatSession.sessionId}
              onNewRequest={handleNewConversation}
            />
          )}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      </main>
      
      <footer className="app-footer">
        <div className="footer-content">
          <span>© 2025 Altivum Inc.</span>
          <span>VetROI™ is a trademark of Altivum Inc.</span>
          <span>Built for AWS Lambda Hackathon 2025</span>
        </div>
        
        <div className="onet-attribution">
          <img src="/onet-in-it.svg" 
               alt="O*NET in-it" />
          <span>
            This site incorporates information from{' '}
            <a href="https://services.onetcenter.org/" 
               target="_blank" 
               rel="noopener noreferrer">
              O*NET Web Services
            </a>{' '}
            by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA).
          </span>
        </div>
      </footer>
    </div>
  )
}

export default App