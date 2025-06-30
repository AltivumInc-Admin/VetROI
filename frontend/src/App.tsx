import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import VeteranForm from './components/VeteranForm'
import { ChatInterface } from './components/ChatInterface'
import { ConfirmationStep } from './components/ConfirmationStep'
import { CareerMatchDisplay } from './components/CareerMatchDisplay'
import { DetailedAnalysisView } from './components/DetailedAnalysisView'
import { DataPanel } from './components/DataPanel'
import { DD214Upload } from './components/DD214Upload'
import { SentraChat } from './components/SentraChat'
import { SessionWarningModal } from './components/SessionWarningModal'
import { useAuth } from './contexts/AuthContext'
import { VeteranRequest } from './types'
import { getRecommendations } from './api'
import './styles/theme.css'
import './styles/App.structure.css'
import './styles/App.theme.css'
import './styles/MultiStageLayout.css'
import './styles/DarkTheme.css'

interface ChatSession {
  sessionId: string
  veteranProfile: VeteranRequest
  initialMessage: string
}

function App() {
  const navigate = useNavigate()
  const { sessionWarning, sessionExpired, isAuthenticated, signOutUser } = useAuth()
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
  const [showDD214Upload, setShowDD214Upload] = useState(false)
  const [dd214Processed, setDD214Processed] = useState(false)
  const [dd214DocumentId, setDD214DocumentId] = useState<string>()
  const [showSentraChat, setShowSentraChat] = useState(false)
  const [careerDataCache, setCareerDataCache] = useState<any>({})
  const [showSessionWarning, setShowSessionWarning] = useState(false)
  console.log('Selected SOCs:', selectedSOCs) // Will be used in Phase 4
  const confirmationRef = useRef<HTMLDivElement>(null)
  const careerMatchesRef = useRef<HTMLDivElement>(null)

  // Restore from sessionStorage on mount
  useEffect(() => {
    const savedProfile = sessionStorage.getItem('veteranProfile')
    const savedMatches = sessionStorage.getItem('careerMatches')
    const savedDD214Processed = sessionStorage.getItem('dd214Processed')
    const savedDD214DocumentId = sessionStorage.getItem('dd214DocumentId')
    const savedSelectedSOCs = sessionStorage.getItem('selectedSOCs')
    const savedCareerDataCache = sessionStorage.getItem('careerDataCache')
    
    if (savedProfile && savedMatches) {
      setProfileData(JSON.parse(savedProfile))
      setApiResponse(JSON.parse(savedMatches))
      setShowCareerMatches(true)
      
      if (savedDD214Processed === 'true' && savedDD214DocumentId) {
        setDD214Processed(true)
        setDD214DocumentId(savedDD214DocumentId)
      }
      
      if (savedSelectedSOCs) {
        setSelectedSOCs(JSON.parse(savedSelectedSOCs))
      }
      
      if (savedCareerDataCache) {
        setCareerDataCache(JSON.parse(savedCareerDataCache))
      }
    }
  }, [])

  const handleSubmit = async (formData: VeteranRequest) => {
    setLoading(true)
    setError(null)
    setProfileData(formData)
    
    try {
      // Make API call immediately to get MOS translation
      const response = await getRecommendations(formData)
      setApiResponse(response)
      
      // Save to sessionStorage
      sessionStorage.setItem('veteranProfile', JSON.stringify(formData))
      sessionStorage.setItem('careerMatches', JSON.stringify(response))
      
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
    
    // Show DD214 upload option
    setNeedsConfirmation(false)
    setShowDD214Upload(true)
    
    // Scroll to DD214 upload
    setTimeout(() => {
      careerMatchesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleAdjust = () => {
    setNeedsConfirmation(false)
    setShowCareerMatches(false)
    setShowDD214Upload(false)
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
    setShowDD214Upload(false)
    setDD214Processed(false)
    setProfileData(null)
    setApiResponse(null)
    setIsDataPanelOpen(false)
    setSelectedSOCs([])
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

  // Save selectedSOCs to sessionStorage whenever they change
  useEffect(() => {
    if (selectedSOCs.length > 0) {
      sessionStorage.setItem('selectedSOCs', JSON.stringify(selectedSOCs));
      console.log('Saved selectedSOCs to sessionStorage:', selectedSOCs);
    } else {
      sessionStorage.removeItem('selectedSOCs');
    }
  }, [selectedSOCs]);

  // Listen for detailed analysis event
  useEffect(() => {
    const handleDetailedAnalysis = (event: CustomEvent) => {
      console.log('Detailed Analysis requested:', event.detail)
      setShowCareerMatches(false)
      setShowDetailedAnalysis(true)
      // Don't auto-open the panel - let user toggle it manually
    }

    window.addEventListener('detailedAnalysis', handleDetailedAnalysis as EventListener)
    return () => {
      window.removeEventListener('detailedAnalysis', handleDetailedAnalysis as EventListener)
    }
  }, [])
  
  // Listen for S3 data fetched event to cache career data
  useEffect(() => {
    const handleS3DataFetched = (event: CustomEvent) => {
      console.log('Caching S3 data:', event.detail)
      setCareerDataCache(event.detail)
      // Save to sessionStorage
      sessionStorage.setItem('careerDataCache', JSON.stringify(event.detail))
    }

    window.addEventListener('s3DataFetched', handleS3DataFetched as EventListener)
    return () => {
      window.removeEventListener('s3DataFetched', handleS3DataFetched as EventListener)
    }
  }, [])

  // Handle session warning
  useEffect(() => {
    if (sessionWarning && !showSessionWarning) {
      setShowSessionWarning(true)
    }
  }, [sessionWarning, showSessionWarning])

  // Handle session expiration - redirect to welcome page
  useEffect(() => {
    if (sessionExpired) {
      window.location.href = '/'
    }
  }, [sessionExpired])

  // Redirect to welcome if not authenticated
  // Commented out to allow guest access without authentication
  // useEffect(() => {
  //   if (!isAuthenticated && !authLoading) {
  //     navigate('/')
  //   }
  // }, [isAuthenticated, authLoading, navigate])
  
  const handleBackToCareerSelection = () => {
    setShowDetailedAnalysis(false)
    setShowCareerMatches(true)
  }
  
  const handleMeetSentra = () => {
    setShowDetailedAnalysis(false)
    setShowSentraChat(true)
    setIsDataPanelOpen(false)
  }
  
  const handleBackFromSentra = () => {
    setShowSentraChat(false)
    setShowDetailedAnalysis(true)
  }
  
  // Prepare context for Sentra
  const getSentraContext = () => {
    if (!profileData || !apiResponse) return null
    
    // Get all career matches from the API response
    const allMatches = apiResponse.onet_careers?.match?.[0]?.occupations?.occupation || []
    
    // Map selected SOCs to their full career info
    const careersViewed = selectedSOCs.map(soc => {
      // First try to find in the original matches
      const matchedCareer = allMatches.find((m: any) => m.code === soc)
      // Then fallback to cache if available
      const cachedCareer = careerDataCache[soc]
      
      return {
        soc,
        title: matchedCareer?.title || cachedCareer?.title || 'Unknown',
        detailsViewed: true
      }
    })
    
    return {
      veteranProfile: {
        branch: profileData.branch,
        mos: profileData.code,
        mosTitle: apiResponse.onet_careers?.match?.[0]?.title || profileData.code,
        education: profileData.education,
        homeState: profileData.homeState,
        relocate: profileData.relocate,
        relocateState: profileData.relocateState
      },
      careerJourney: {
        careersViewed,
        selectedCareers: selectedSOCs,
        lastViewedCareer: careerDataCache[selectedSOCs[selectedSOCs.length - 1]]
      },
      dd214Profile: dd214Processed ? {
        documentId: dd214DocumentId || '',
        hasDD214: true
      } : undefined
    }
  }

  const handleRestart = () => {
    // Reset all state to initial values
    setChatSession(null)
    setLoading(false)
    setError(null)
    setNeedsConfirmation(false)
    setShowCareerMatches(false)
    setShowDetailedAnalysis(false)
    setShowDD214Upload(false)
    setDD214Processed(false)
    setShowSentraChat(false)
    setProfileData(null)
    setApiResponse(null)
    setIsDataPanelOpen(false)
    setSelectedSOCs([])
    setCareerDataCache({})
  }
  
  const handleSignOut = async () => {
    try {
      await signOutUser()
      // Clear all session storage
      sessionStorage.clear()
      // Reset all state
      handleRestart()
      // Navigate to home page
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  
  const handleDD214UploadComplete = (documentId: string) => {
    console.log('DD214 processed:', documentId)
    setDD214Processed(true)
    setDD214DocumentId(documentId)
    
    // Save DD214 state to sessionStorage
    sessionStorage.setItem('dd214Processed', 'true')
    sessionStorage.setItem('dd214DocumentId', documentId)
    
    setShowDD214Upload(false)
    setShowCareerMatches(true)
    
    // Scroll to career matches
    setTimeout(() => {
      careerMatchesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }
  
  const skipDD214Upload = () => {
    setShowDD214Upload(false)
    setShowCareerMatches(true)
    
    // Scroll to career matches
    setTimeout(() => {
      careerMatchesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>VetROI™</h1>
        <p className="tagline">Career Intelligence Platform</p>
      </header>
      
      <main className="app-main">
        <div className="container">
          {!chatSession && !needsConfirmation && !showCareerMatches && !showDetailedAnalysis && !showDD214Upload && !showSentraChat && (
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
          
          {showDD214Upload && profileData && (
            <div ref={careerMatchesRef}>
              <DD214Upload
                veteranId={profileData.code} // Using MOS as temporary ID
                onUploadComplete={handleDD214UploadComplete}
              />
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button 
                  onClick={skipDD214Upload}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    color: '#00d4ff',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Skip for now →
                </button>
              </div>
            </div>
          )}
          
          {showCareerMatches && profileData && apiResponse && (
            <div ref={careerMatchesRef}>
              {dd214Processed && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#22c55e', margin: 0 }}>
                    ✓ DD214 processed successfully - You'll receive exclusive career insights tailored specifically to your experience after speaking with Sentra, our AI-enhanced career counselor.
                  </p>
                </div>
              )}
              <CareerMatchDisplay
                mosTitle={apiResponse.onet_careers?.match?.[0]?.title || profileData.code}
                mosCode={profileData.code}
                matches={apiResponse.onet_careers?.match?.[0]?.occupations?.occupation || []}
                onSOCClick={handleSOCClick}
              />
            </div>
          )}
          
          {showDetailedAnalysis && (
            <DetailedAnalysisView
              selectedSOCs={selectedSOCs}
              onBack={handleBackToCareerSelection}
              onMeetSentra={handleMeetSentra}
              userState={profileData?.homeState || 'CA'}
              relocationState={profileData?.relocate ? profileData?.relocateState : undefined}
            />
          )}
          
          {showSentraChat && profileData && (
            <SentraChat
              veteranContext={getSentraContext()!}
              sessionId={`session-${Date.now()}`}
              onBack={handleBackFromSentra}
              dd214DocumentId={dd214DocumentId}
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
          <p>
            This site incorporates information from{' '}
            <a href="https://services.onetcenter.org/" 
               target="_blank" 
               rel="noopener noreferrer">
              O*NET Web Services
            </a>{' '}
            by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA).
          </p>
        </div>
      </footer>
      
      {apiResponse && (
        <DataPanel 
          data={apiResponse}
          isOpen={isDataPanelOpen}
          onToggle={() => setIsDataPanelOpen(!isDataPanelOpen)}
          selectedSOCs={selectedSOCs}
        />
      )}
      
      {/* Navigation Buttons - Show after initial form submission */}
      {(chatSession || needsConfirmation || showCareerMatches || showDetailedAnalysis || showDD214Upload || showSentraChat) && (
        <div className="navigation-buttons">
          <button 
            className="restart-button"
            onClick={handleRestart}
            title="Start over with a new profile"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6"></path>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Start Over
          </button>
          
          <button 
            className="welcome-button"
            onClick={() => navigate('/')}
            title="Back to Welcome Page"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Welcome Page
          </button>
          
          {isAuthenticated && (
            <button 
              className="signout-button"
              onClick={handleSignOut}
              title="Sign out of your account"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign Out
            </button>
          )}
        </div>
      )}

      {/* Session Warning Modal */}
      <SessionWarningModal 
        isOpen={showSessionWarning}
        onClose={() => setShowSessionWarning(false)}
      />
      
    </div>
  )
}

export default App