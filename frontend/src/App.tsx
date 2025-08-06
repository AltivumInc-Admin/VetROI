import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VeteranForm from './components/VeteranForm'
// import { ChatInterface } from './components/ChatInterface'  // Unused - commented out to fix build
import { ConfirmationStep } from './components/ConfirmationStep'
import { CareerMatchDisplay } from './components/CareerMatchDisplay'
import { DetailedAnalysisView } from './components/DetailedAnalysisView'
import { DataPanel } from './components/DataPanel'
import { DD214Upload } from './components/DD214Upload'
import { SentraChat } from './components/SentraChat'
import { SessionWarningModal } from './components/SessionWarningModal'
import { VerticalFlowContainer } from './components/VerticalFlowContainer'
import { ProgressIndicator } from './components/ProgressIndicator'
import { SectionWrapper } from './components/SectionWrapper'
// import { DebugApp } from './components/DebugApp'  // Unused - commented out to fix build
import FormParticleBackground from './components/FormParticleBackground'
import { useAuth } from './contexts/AuthContext'
import { useScrollProgress } from './hooks/useScrollProgress'
import { VeteranRequest } from './types'
import { getRecommendations } from './api'
import './styles/theme.css'
import './styles/App.structure.css'
import './styles/App.theme.css'
import './styles/MultiStageLayout.css'
import './styles/DarkTheme.css'
import './styles/VerticalFlowFixes.css'
import './styles/ViewportFit.css'
import './styles/FloatingFormLayout.css'

// interface ChatSession {
//   sessionId: string
//   veteranProfile: VeteranRequest
//   initialMessage: string
// }

interface FlowSection {
  profile: { completed: boolean; collapsed: boolean; data: VeteranRequest | null }
  confirmation: { completed: boolean; collapsed: boolean; visible: boolean }
  dd214: { completed: boolean; collapsed: boolean; visible: boolean; skipped: boolean }
  careers: { completed: boolean; collapsed: boolean; visible: boolean; selections: string[] }
  analysis: { completed: boolean; collapsed: boolean; visible: boolean }
  sentra: { visible: boolean; active: boolean }
}

function App() {
  const navigate = useNavigate()
  const { sessionWarning, sessionExpired, isAuthenticated, signOutUser } = useAuth()
  // const [chatSession, setChatSession] = useState<ChatSession | null>(null)  // Unused - commented out to fix build
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<VeteranRequest | null>(null)
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false)
  const [dd214DocumentId, setDD214DocumentId] = useState<string>()
  const [careerDataCache, setCareerDataCache] = useState<any>({})
  const [showSessionWarning, setShowSessionWarning] = useState(false)
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)
  
  // New vertical flow state
  const [flowSections, setFlowSections] = useState<FlowSection>({
    profile: { completed: false, collapsed: false, data: null },
    confirmation: { completed: false, collapsed: false, visible: false },
    dd214: { completed: false, collapsed: false, visible: false, skipped: false },
    careers: { completed: false, collapsed: false, visible: false, selections: [] },
    analysis: { completed: false, collapsed: false, visible: false },
    sentra: { visible: false, active: false }
  })
  
  const [currentSection, setCurrentSection] = useState<string>('profile')
  // const confirmationRef = useRef<HTMLDivElement>(null)  // Unused - commented out to fix build
  // const careerMatchesRef = useRef<HTMLDivElement>(null)  // Unused - commented out to fix build
  
  // Scroll-based progress tracking - only track active section, not completion
  useScrollProgress({
    threshold: 0.6,
    onSectionComplete: (_sectionId) => {
      // Don't auto-complete sections based on scroll
      // Sections should only be completed through explicit user actions
    },
    onSectionActive: (sectionId) => {
      setCurrentSection(sectionId)
    }
  })

  // Restore from sessionStorage on mount
  useEffect(() => {
    const savedProfile = sessionStorage.getItem('veteranProfile')
    const savedMatches = sessionStorage.getItem('careerMatches')
    const savedDD214Processed = sessionStorage.getItem('dd214Processed')
    const savedDD214DocumentId = sessionStorage.getItem('dd214DocumentId')
    const savedSelectedSOCs = sessionStorage.getItem('selectedSOCs')
    const savedCareerDataCache = sessionStorage.getItem('careerDataCache')
    
    if (savedProfile && savedMatches) {
      const profile = JSON.parse(savedProfile)
      const matches = JSON.parse(savedMatches)
      
      setProfileData(profile)
      setApiResponse(matches)
      
      // Restore flow state and determine current section
      let restoredSection = 'confirmation'
      
      const dd214Completed = savedDD214Processed === 'true'
      const careersStarted = savedSelectedSOCs ? true : false
      
      // Determine the appropriate section to show
      if (careersStarted) {
        restoredSection = 'careers'
      } else if (dd214Completed) {
        restoredSection = 'careers'
      } else {
        restoredSection = 'confirmation'
      }
      
      setFlowSections(prev => ({
        ...prev,
        profile: { completed: true, collapsed: false, data: profile },
        confirmation: { 
          completed: restoredSection !== 'confirmation', 
          collapsed: false, 
          visible: true 
        },
        dd214: { 
          completed: dd214Completed, 
          collapsed: false, 
          visible: restoredSection !== 'confirmation',
          skipped: false 
        },
        careers: { 
          completed: careersStarted, 
          collapsed: false, 
          visible: dd214Completed || restoredSection === 'careers',
          selections: savedSelectedSOCs ? JSON.parse(savedSelectedSOCs) : []
        }
      }))
      
      if (dd214Completed && savedDD214DocumentId) {
        setDD214DocumentId(savedDD214DocumentId)
      }
      
      if (savedCareerDataCache) {
        setCareerDataCache(JSON.parse(savedCareerDataCache))
      }
      
      setCurrentSection(restoredSection)
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
      
      // Update flow state - keep profile expanded
      setFlowSections(prev => ({
        ...prev,
        profile: { completed: true, collapsed: false, data: formData },
        confirmation: { completed: false, collapsed: false, visible: true }
      }))
      
      setCurrentSection('confirmation')
      setIsDataPanelOpen(false)
      
      // Smooth scroll to confirmation section after a brief delay
      setTimeout(() => {
        const confirmationSection = document.querySelector('[data-section="confirmation"]')
        if (confirmationSection) {
          confirmationSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest' 
          })
        }
      }, 300)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!profileData || !apiResponse) return
    
    // Update flow state
    setFlowSections(prev => ({
      ...prev,
      confirmation: { completed: true, collapsed: false, visible: true },
      dd214: { completed: false, collapsed: false, visible: true, skipped: false }
    }))
    
    setCurrentSection('dd214')
    
    // Smooth scroll to DD214 section after state updates and DOM renders
    setTimeout(() => {
      const dd214Section = document.querySelector('[data-section="dd214"]')
      if (dd214Section) {
        // Use a more reliable scroll method
        const rect = dd214Section.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const targetY = rect.top + scrollTop - 100 // 100px offset from top
        
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        })
      }
    }, 300) // Increased delay to ensure DOM is ready
  }

  const handleAdjust = () => {
    // Edit profile
    setFlowSections(prev => ({
      ...prev,
      profile: { ...prev.profile, collapsed: false },
      confirmation: { completed: false, collapsed: false, visible: false },
      dd214: { completed: false, collapsed: false, visible: false, skipped: false },
      careers: { completed: false, collapsed: false, visible: false, selections: [] }
    }))
    
    setCurrentSection('profile')
    setApiResponse(null)
    setIsDataPanelOpen(false)
  }

  const handleSOCClick = (code: string) => {
    console.log('SOC clicked:', code)
    setFlowSections(prev => {
      const newSelections = prev.careers.selections.includes(code)
        ? prev.careers.selections.filter(c => c !== code)
        : [...prev.careers.selections, code]
      
      // Save to sessionStorage
      if (newSelections.length > 0) {
        sessionStorage.setItem('selectedSOCs', JSON.stringify(newSelections))
      } else {
        sessionStorage.removeItem('selectedSOCs')
      }
      
      return {
        ...prev,
        careers: { ...prev.careers, selections: newSelections }
      }
    })
  }

  // Listen for detailed analysis event
  useEffect(() => {
    const handleDetailedAnalysis = (event: CustomEvent) => {
      console.log('Detailed Analysis requested:', event.detail)
      
      setFlowSections(prev => ({
        ...prev,
        careers: { ...prev.careers, completed: true, collapsed: false },
        analysis: { completed: false, collapsed: false, visible: true }
      }))
      
      setCurrentSection('analysis')
      
      // Smooth scroll to analysis section after state updates
      setTimeout(() => {
        const analysisSection = document.querySelector('[data-section="analysis"]')
        if (analysisSection) {
          const rect = analysisSection.getBoundingClientRect()
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop
          const targetY = rect.top + scrollTop - 100 // 100px offset from top
          
          window.scrollTo({
            top: targetY,
            behavior: 'smooth'
          })
        }
      }, 300) // Delay to ensure DOM is ready
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
  
  const handleBackToCareerSelection = () => {
    setFlowSections(prev => ({
      ...prev,
      analysis: { ...prev.analysis, visible: false }
    }))
    setCurrentSection('careers')
  }
  
  const handleMeetSentra = () => {
    setFlowSections(prev => ({
      ...prev,
      analysis: { ...prev.analysis, completed: true, collapsed: true },
      sentra: { visible: true, active: true }
    }))
    setCurrentSection('sentra')
    setIsDataPanelOpen(false)
  }
  
  const handleBackFromSentra = () => {
    setFlowSections(prev => ({
      ...prev,
      sentra: { visible: false, active: false },
      analysis: { ...prev.analysis, collapsed: false }
    }))
    setCurrentSection('analysis')
  }
  
  // Prepare context for Sentra
  const getSentraContext = () => {
    if (!profileData || !apiResponse) return null
    
    // Get all career matches from the API response
    const allMatches = apiResponse.onet_careers?.match?.[0]?.occupations?.occupation || []
    
    // Map selected SOCs to their full career info
    const careersViewed = flowSections.careers.selections.map(soc => {
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
        selectedCareers: flowSections.careers.selections,
        lastViewedCareer: careerDataCache[flowSections.careers.selections[flowSections.careers.selections.length - 1]]
      },
      dd214Profile: flowSections.dd214.completed && !flowSections.dd214.skipped ? {
        documentId: dd214DocumentId || '',
        hasDD214: true
      } : undefined
    }
  }

  const handleRestart = () => {
    // Reset all state to initial values
    // setChatSession(null)  // Commented out - chatSession is unused
    setLoading(false)
    setError(null)
    setProfileData(null)
    setApiResponse(null)
    setIsDataPanelOpen(false)
    setCareerDataCache({})
    setDD214DocumentId(undefined)
    
    // Reset flow sections
    setFlowSections({
      profile: { completed: false, collapsed: false, data: null },
      confirmation: { completed: false, collapsed: false, visible: false },
      dd214: { completed: false, collapsed: false, visible: false, skipped: false },
      careers: { completed: false, collapsed: false, visible: false, selections: [] },
      analysis: { completed: false, collapsed: false, visible: false },
      sentra: { visible: false, active: false }
    })
    
    setCurrentSection('profile')
    
    // Clear sessionStorage
    sessionStorage.removeItem('veteranProfile')
    sessionStorage.removeItem('careerMatches')
    sessionStorage.removeItem('dd214Processed')
    sessionStorage.removeItem('dd214DocumentId')
    sessionStorage.removeItem('selectedSOCs')
    sessionStorage.removeItem('careerDataCache')
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
    setDD214DocumentId(documentId)
    
    // Save DD214 state to sessionStorage
    sessionStorage.setItem('dd214Processed', 'true')
    sessionStorage.setItem('dd214DocumentId', documentId)
    
    // Update flow state
    setFlowSections(prev => ({
      ...prev,
      dd214: { completed: true, collapsed: false, visible: true, skipped: false },
      careers: { ...prev.careers, visible: true }
    }))
    
    setCurrentSection('careers')
  }
  
  const skipDD214Upload = () => {
    setFlowSections(prev => ({
      ...prev,
      dd214: { completed: true, collapsed: false, visible: true, skipped: true },
      careers: { ...prev.careers, visible: true }
    }))
    
    setCurrentSection('careers')
    
    // Smooth scroll to careers section
    setTimeout(() => {
      const careersSection = document.querySelector('[data-section="careers"]')
      if (careersSection) {
        const rect = careersSection.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const targetY = rect.top + scrollTop - 100 // 100px offset from top
        
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        })
      }
    }, 300)
  }
  
  // Handle section navigation from progress indicator
  const handleSectionClick = (sectionId: string) => {
    setCurrentSection(sectionId)
    
    // Smooth scroll to the section
    setTimeout(() => {
      const targetSection = document.querySelector(`[data-section="${sectionId}"]`)
      if (targetSection) {
        targetSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest' 
        })
      }
    }, 100)
  }
  
  // Toggle section collapse
  const toggleSectionCollapse = (section: keyof FlowSection) => {
    setFlowSections(prev => ({
      ...prev,
      [section]: { ...prev[section], collapsed: !(prev[section] as any).collapsed }
    }))
  }
  
  // Prepare progress indicator sections
  const progressSections = [
    {
      id: 'profile',
      label: 'Profile',
      completed: flowSections.profile.completed,
      active: currentSection === 'profile',
      accessible: true
    },
    {
      id: 'confirmation',
      label: 'Confirm',
      completed: flowSections.confirmation.completed,
      active: currentSection === 'confirmation',
      accessible: flowSections.confirmation.visible
    },
    {
      id: 'dd214',
      label: 'DD214',
      completed: flowSections.dd214.completed,
      active: currentSection === 'dd214',
      accessible: flowSections.dd214.visible
    },
    {
      id: 'careers',
      label: 'Careers',
      completed: flowSections.careers.completed,
      active: currentSection === 'careers',
      accessible: flowSections.careers.visible
    },
    {
      id: 'analysis',
      label: 'Analysis',
      completed: flowSections.analysis.completed,
      active: currentSection === 'analysis',
      accessible: flowSections.analysis.visible
    },
    {
      id: 'sentra',
      label: 'Sentra AI',
      completed: false,
      active: currentSection === 'sentra',
      accessible: flowSections.sentra.visible
    }
  ]

  return (
    <div className={`App ${isSidebarMinimized ? 'sidebar-minimized' : ''}`}>
      <FormParticleBackground />
      <header className="app-header">
        <h1>VetROI™</h1>
        <p className="tagline">Career Intelligence Platform</p>
      </header>
      
      <ProgressIndicator
        sections={progressSections}
        currentSection={currentSection}
        onSectionClick={handleSectionClick}
        position="left"
        onMinimizedChange={setIsSidebarMinimized}
      />
      
      <main className="app-main">
        <VerticalFlowContainer 
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
        >
          <div className="container">
            {/* Profile Section */}
            <SectionWrapper
              id="profile"
              title="Your Military Profile"
              completed={flowSections.profile.completed}
              collapsed={flowSections.profile.collapsed}
              visible={true}
              onToggleCollapse={() => toggleSectionCollapse('profile')}
              hideEditButton={true}
              summary={
                flowSections.profile.data && (
                  <div>
                    <ul>
                      <li><strong>Branch:</strong> {flowSections.profile.data.branch}</li>
                      <li><strong>MOS/AFSC:</strong> {flowSections.profile.data.code}</li>
                      <li><strong>Location:</strong> {flowSections.profile.data.homeState}</li>
                      <li><strong>Education:</strong> {flowSections.profile.data.education}</li>
                    </ul>
                  </div>
                )
              }
            >
              <VeteranForm 
                onSubmit={handleSubmit} 
                loading={loading}
                initialData={profileData}
              />
            </SectionWrapper>
            
            {/* Confirmation Section */}
            <SectionWrapper
              id="confirmation"
              title="Confirm Your Information"
              completed={flowSections.confirmation.completed}
              collapsed={flowSections.confirmation.collapsed}
              visible={flowSections.confirmation.visible}
              onToggleCollapse={() => toggleSectionCollapse('confirmation')}
              onEdit={handleAdjust}
              summary={null}
            >
              {profileData && apiResponse && (
                <ConfirmationStep
                  profile={profileData}
                  apiResponse={apiResponse}
                  onConfirm={handleConfirm}
                  onAdjust={handleAdjust}
                />
              )}
            </SectionWrapper>
            
            {/* DD214 Upload Section */}
            <SectionWrapper
              id="dd214"
              title="DD214 Upload (Optional)"
              completed={flowSections.dd214.completed}
              collapsed={flowSections.dd214.collapsed}
              visible={flowSections.dd214.visible}
              onToggleCollapse={() => toggleSectionCollapse('dd214')}
              summary={
                flowSections.dd214.completed ? (
                  <div>
                    {flowSections.dd214.skipped ? (
                      <p>DD214 upload skipped. You can upload later for personalized insights.</p>
                    ) : (
                      <p>DD214 processed successfully. Career insights will be available after Sentra consultation.</p>
                    )}
                  </div>
                ) : null
              }
            >
              {profileData && (
                <>
                  <DD214Upload
                    veteranId={profileData.code}
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
                </>
              )}
            </SectionWrapper>
            
            {/* Career Matches Section */}
            <SectionWrapper
              id="careers"
              title="Career Matches"
              completed={flowSections.careers.completed}
              collapsed={flowSections.careers.collapsed}
              visible={flowSections.careers.visible}
              onToggleCollapse={() => toggleSectionCollapse('careers')}
              summary={
                <div>
                  <p>{flowSections.careers.selections.length} careers selected for detailed analysis.</p>
                  {flowSections.careers.selections.length > 0 && (
                    <ul>
                      {flowSections.careers.selections.map(soc => (
                        <li key={soc}>{soc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              }
            >
              {profileData && apiResponse && (
                <>
                  {flowSections.dd214.completed && !flowSections.dd214.skipped && (
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
                </>
              )}
            </SectionWrapper>
            
            {/* Detailed Analysis Section */}
            <SectionWrapper
              id="analysis"
              title="Career Analysis"
              completed={flowSections.analysis.completed}
              collapsed={flowSections.analysis.collapsed}
              visible={flowSections.analysis.visible}
              onToggleCollapse={() => toggleSectionCollapse('analysis')}
              summary={
                <div>
                  <p>Comprehensive career analysis completed. Ready for AI counselor consultation.</p>
                </div>
              }
            >
              <DetailedAnalysisView
                selectedSOCs={flowSections.careers.selections}
                onBack={handleBackToCareerSelection}
                onMeetSentra={handleMeetSentra}
                userState={profileData?.homeState || 'CA'}
                relocationState={profileData?.relocate ? profileData?.relocateState : undefined}
                veteranProfile={profileData && apiResponse ? {
                  branch: profileData.branch,
                  code: profileData.code,
                  education: profileData.education,
                  mosTitle: apiResponse.onet_careers?.match?.[0]?.title || profileData.code
                } : undefined}
              />
            </SectionWrapper>
            
            {/* Sentra Chat Section */}
            {flowSections.sentra.visible && profileData && (
              <div data-section="sentra" style={{ minHeight: '500px' }}>
                <SentraChat
                  veteranContext={getSentraContext()!}
                  sessionId={`session-${Date.now()}`}
                  onBack={handleBackFromSentra}
                  dd214DocumentId={dd214DocumentId}
                />
              </div>
            )}
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
        </VerticalFlowContainer>
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
          selectedSOCs={flowSections.careers.selections}
        />
      )}
      
      {/* Navigation Buttons - Show after initial form submission */}
      {flowSections.profile.completed && (
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