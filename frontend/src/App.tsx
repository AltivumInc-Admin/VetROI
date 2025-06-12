import { useState } from 'react'
import VeteranForm from './components/VeteranForm'
import RecommendationChat from './components/RecommendationChat'
import { VeteranRequest, RecommendationResponse } from './types'
import { getRecommendations } from './api'
import './styles/App.css'

function App() {
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: VeteranRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await getRecommendations(formData)
      setRecommendations(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>VetROI™</h1>
        <p>Military to Civilian Career Transition Assistant</p>
      </header>
      
      <main className="app-main">
        <div className="container">
          {!recommendations ? (
            <VeteranForm onSubmit={handleSubmit} loading={loading} />
          ) : (
            <RecommendationChat 
              recommendations={recommendations}
              onNewRequest={() => setRecommendations(null)}
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