import { useState } from 'react'
import VeteranForm from './components/VeteranForm'
import { ChatInterface } from './components/ChatInterface'
import { VeteranRequest } from './types'
import { getRecommendations } from './api'
import './styles/App.css'

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
    <div className="app">
      <header className="app-header">
        <h1>VetROI™</h1>
        <p>Military to Civilian Career Transition Assistant</p>
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
      </footer>
    </div>
  )
}

export default App