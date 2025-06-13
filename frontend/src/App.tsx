import { useState } from 'react'
import VeteranForm from './components/VeteranForm'
import { ChatInterface } from './components/ChatInterface'
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

  const handleSubmit = async (formData: VeteranRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await getRecommendations(formData)
      
      // Set up chat session with the initial AI response
      setChatSession({
        sessionId: response.sessionId,
        veteranProfile: formData,
        initialMessage: response.message || "Thank you for your service! I'm here to help you transition to a rewarding civilian career. What type of work interests you most?"
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleNewConversation = () => {
    setChatSession(null)
    setError(null)
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>VetROI™</h1>
        <p className="tagline">Career Intelligence Platform</p>
      </header>
      
      <main className="app-main">
        <div className="container">
          {!chatSession ? (
            <VeteranForm onSubmit={handleSubmit} loading={loading} />
          ) : (
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
        <p>© 2025 Altivum Inc. • Built for AWS Lambda Hackathon 2025</p>
        <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>VetROI™ is a trademark of Altivum Inc.</p>
        
        <div className="onet-attribution">
          <a href="https://services.onetcenter.org/" 
             title="This site incorporates information from O*NET Web Services. Click to learn more."
             target="_blank"
             rel="noopener noreferrer">
            <img src="/onet-in-it.svg" 
                 style={{ width: '130px', height: '60px', border: 'none' }} 
                 alt="O*NET in-it" />
          </a>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
            This site incorporates information from{' '}
            <a href="https://services.onetcenter.org/" 
               target="_blank" 
               rel="noopener noreferrer"
               style={{ color: '#6c757d', textDecoration: 'underline' }}>
              O*NET Web Services
            </a>{' '}
            by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). 
            O*NET® is a trademark of USDOL/ETA.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App