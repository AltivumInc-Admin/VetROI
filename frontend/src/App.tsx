import { useState, useEffect, useRef } from 'react'
import VeteranForm from './components/VeteranForm'
import { ChatInterface } from './components/ChatInterface'
import { ConfirmationStep } from './components/ConfirmationStep'
import { CareerMatchDisplay } from './components/CareerMatchDisplay'
import { DetailedAnalysisView } from './components/DetailedAnalysisView'
import { DataPanel } from './components/DataPanel'
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
  const [showCareerMatches, setShowCareerMatches] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [profileData, setProfileData] = useState<VeteranRequest | null>(null)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false)
  const [selectedSOCs, setSelectedSOCs] = useState<string[]>([])
  const [dataPanelMode, setDataPanelMode] = useState<'api' | 's3'>('api')
  console.log('Selected SOCs:', selectedSOCs) // Will be used in Phase 4
  const confirmationRef = useRef<HTMLDivElement>(null)
  const careerMatchesRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (formData: VeteranRequest) => {
    setLoading(true)
    setError(null)
    setProfileData(formData)
    
    try {
      // Make API call immediately to get MOS translation
      const response = await getRecommendations(formData)
      setApiResponse(response)
      setNeedsConfirmation(true)
      setIsDataPanelOpen(false) // Start with panel closed
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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
    if (!profileData || !apiResponse) return
    
    // Show career matches instead of going directly to chat
    setNeedsConfirmation(false)
    setShowCareerMatches(true)
    
    // Scroll to career matches
    setTimeout(() => {
      careerMatchesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleAdjust = () => {
    setNeedsConfirmation(false)
    setShowCareerMatches(false)
    setApiResponse(null)
    setIsDataPanelOpen(false)
    setSelectedSOCs([])
    // Profile data remains in form
  }

  const handleNewConversation = () => {
    setChatSession(null)
    setError(null)
    setNeedsConfirmation(false)
    setShowCareerMatches(false)
    setShowDetailedAnalysis(false)
    setProfileData(null)
    setApiResponse(null)
    setIsDataPanelOpen(false)
    setSelectedSOCs([])
    setDataPanelMode('api')
  }

  const handleSOCClick = (code: string) => {
    console.log('SOC clicked:', code)
    setSelectedSOCs(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code)
      }
      return [...prev, code]
    })
  }

  // Listen for detailed analysis event
  useEffect(() => {
    const handleDetailedAnalysis = (event: CustomEvent) => {
      console.log('Detailed Analysis requested:', event.detail)
      setShowCareerMatches(false)
      setShowDetailedAnalysis(true)
      setDataPanelMode('s3')
      setIsDataPanelOpen(true)
      
      // Fetch S3 data for selected SOCs
      import('./api').then(({ fetchMultipleSOCData }) => {
        fetchMultipleSOCData(selectedSOCs).then(data => {
          console.log('Fetched S3 data:', data)
          // Update DataPanel with fetched data
          window.dispatchEvent(new CustomEvent('s3DataFetched', { detail: data }))
        })
      })
    }

    window.addEventListener('detailedAnalysis', handleDetailedAnalysis as EventListener)
    return () => {
      window.removeEventListener('detailedAnalysis', handleDetailedAnalysis as EventListener)
    }
  }, [selectedSOCs])
  
  const handleBackToCareerSelection = () => {
    setShowDetailedAnalysis(false)
    setShowCareerMatches(true)
    setDataPanelMode('api')
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>VetROI™</h1>
        <p className="tagline">Career Intelligence Platform</p>
      </header>
      
      <main className="app-main">
        <div className="container">
          {!chatSession && !needsConfirmation && !showCareerMatches && !showDetailedAnalysis && (
            <VeteranForm 
              onSubmit={handleSubmit} 
              loading={loading}
              initialData={profileData}
            />
          )}
          
          {needsConfirmation && profileData && apiResponse && (
            <div ref={confirmationRef}>
              <ConfirmationStep
                profile={profileData}
                apiResponse={apiResponse}
                onConfirm={handleConfirm}
                onAdjust={handleAdjust}
              />
            </div>
          )}
          
          {showCareerMatches && profileData && apiResponse && (
            <div ref={careerMatchesRef}>
              <CareerMatchDisplay
                mosTitle={apiResponse.raw_onet_data?.data?.match?.[0]?.title || profileData.code}
                mosCode={profileData.code}
                matches={apiResponse.raw_onet_data?.data?.match?.[0]?.occupations?.occupation || []}
                onSOCClick={handleSOCClick}
              />
            </div>
          )}
          
          {showDetailedAnalysis && (
            <DetailedAnalysisView
              selectedSOCs={selectedSOCs}
              onBack={handleBackToCareerSelection}
            />
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
      
      {apiResponse && (
        <DataPanel 
          data={apiResponse}
          isOpen={isDataPanelOpen}
          onToggle={() => setIsDataPanelOpen(!isDataPanelOpen)}
          mode={dataPanelMode}
          selectedSOCs={selectedSOCs}
        />
      )}
    </div>
  )
}

export default App