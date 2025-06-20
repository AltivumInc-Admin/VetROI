import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { getDD214PresignedUrl, uploadDD214ToS3, getDD214Status } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { AuthModal } from './AuthModal'
import { UserAgreement } from './UserAgreement'
import { ProcessingEngagementModal } from './ProcessingEngagementModal'
import '../styles/DD214Upload.css'

interface DD214UploadProps {
  onUploadComplete: (documentId: string) => void
  veteranId: string
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  progress: number
  documentId?: string
  error?: string
  processingSteps?: ProcessingStep[]
}

interface ProcessingStep {
  name: string
  status: 'pending' | 'in-progress' | 'complete' | 'error'
  timestamp?: string
}

export const DD214Upload: React.FC<DD214UploadProps> = ({ 
  onUploadComplete,
  veteranId 
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    processingSteps: [
      { name: 'Document Validation', status: 'pending' },
      { name: 'Text Extraction', status: 'pending' },
      { name: 'Security Scan', status: 'pending' },
      { name: 'AI Enhancement', status: 'pending' },
      { name: 'Profile Generation', status: 'pending' }
    ]
  })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const [hasAcceptedAgreement, setHasAcceptedAgreement] = useState(false)
  const [showEngagementModal, setShowEngagementModal] = useState(false)
  const { isAuthenticated, user, checkAuth, signOutUser, sessionExpired, clearSessionExpired, loading } = useAuth()

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
    // Check if user has previously accepted the agreement
    const acceptedAgreement = localStorage.getItem('dd214AgreementAccepted')
    if (acceptedAgreement === 'true') {
      setHasAcceptedAgreement(true)
    }
  }, [])

  // Handle session expiration
  useEffect(() => {
    if (sessionExpired && !showAuthModal) {
      setShowAuthModal(true)
    }
  }, [sessionExpired, showAuthModal])

  const handleSignOut = async () => {
    try {
      await signOutUser()
      // Reset upload state
      setUploadState({
        status: 'idle',
        progress: 0,
        processingSteps: [
          { name: 'Document Validation', status: 'pending' },
          { name: 'Text Extraction', status: 'pending' },
          { name: 'Security Scan', status: 'pending' },
          { name: 'AI Enhancement', status: 'pending' },
          { name: 'Profile Generation', status: 'pending' }
        ]
      })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('onDrop called with files:', acceptedFiles)
    if (acceptedFiles.length === 0) return

    // This should not happen as we prevent drops for unauthenticated users
    if (!isAuthenticated) {
      console.log('Not authenticated, showing auth modal')
      setShowAuthModal(true)
      return
    }
    
    // Check if user has accepted agreement
    if (!hasAcceptedAgreement) {
      // Store the file temporarily to upload after agreement
      sessionStorage.setItem('pendingFile', JSON.stringify({
        name: acceptedFiles[0].name,
        type: acceptedFiles[0].type,
        size: acceptedFiles[0].size
      }))
      setShowAgreement(true)
      return
    }

    const file = acceptedFiles[0]
    
    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: 'File size must be less than 10MB'
      }))
      return
    }

    // Start upload
    setUploadState(prev => ({
      ...prev,
      status: 'uploading',
      progress: 0
    }))

    try {
      // Get pre-signed URL
      const { uploadUrl, documentId } = await getDD214PresignedUrl(
        file.name,
        file.type,
        veteranId
      )

      // Upload to S3
      await uploadDD214ToS3(uploadUrl, file)

      // Update state
      setUploadState(prev => ({
        ...prev,
        status: 'processing',
        progress: 100,
        documentId
      }))

      // Show engagement modal during processing
      setShowEngagementModal(true)

      // Start polling for status
      pollProcessingStatus(documentId)

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      }))
    }
  }, [veteranId, isAuthenticated, hasAcceptedAgreement])

  const pollProcessingStatus = async (documentId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await getDD214Status(documentId)

        // Update processing steps
        const updatedSteps = uploadState.processingSteps?.map(step => {
          const stepStatus = status.steps?.[step.name]
          if (stepStatus) {
            return {
              ...step,
              status: stepStatus.status,
              timestamp: stepStatus.timestamp
            }
          }
          return step
        })

        setUploadState(prev => ({
          ...prev,
          processingSteps: updatedSteps
        }))

        // Check if complete
        if (status.status === 'complete') {
          clearInterval(pollInterval)
          setUploadState(prev => ({
            ...prev,
            status: 'complete'
          }))
          // Close engagement modal when processing is complete
          setShowEngagementModal(false)
          onUploadComplete(documentId)
        } else if (status.status === 'error') {
          clearInterval(pollInterval)
          setUploadState(prev => ({
            ...prev,
            status: 'error',
            error: status.error || 'Processing failed'
          }))
          // Close engagement modal on error
          setShowEngagementModal(false)
        }
      } catch (error) {
        console.error('Failed to poll status:', error)
      }
    }, 2000) // Poll every 2 seconds

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    maxFiles: 1,
    disabled: uploadState.status !== 'idle' && uploadState.status !== 'error',
    noClick: !isAuthenticated, // Prevent click if not authenticated
    noDrag: !isAuthenticated, // Prevent drag if not authenticated
    noKeyboard: !isAuthenticated // Prevent keyboard activation if not authenticated
  })

  const handleAuthSuccess = async () => {
    await checkAuth()
    setShowAuthModal(false)
    
    // Update user attributes to mark DD214 upload intent
    // This will be handled in Phase 2
  }
  
  const handleAcceptAgreement = () => {
    setHasAcceptedAgreement(true)
    localStorage.setItem('dd214AgreementAccepted', 'true')
    setShowAgreement(false)
    
    // Check if there was a pending file to upload
    const pendingFile = sessionStorage.getItem('pendingFile')
    if (pendingFile) {
      // Clear the pending file
      sessionStorage.removeItem('pendingFile')
      // Show a message to re-upload
      alert('Agreement accepted! Please upload your DD214 again.')
    }
  }
  
  const handleDeclineAgreement = () => {
    setShowAgreement(false)
    sessionStorage.removeItem('pendingFile')
  }

  return (
    <div className="dd214-upload-container">
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          clearSessionExpired()
        }}
        onSuccess={handleAuthSuccess}
      />
      
      <UserAgreement
        isOpen={showAgreement}
        onAccept={handleAcceptAgreement}
        onDecline={handleDeclineAgreement}
      />
      
      <ProcessingEngagementModal
        isOpen={showEngagementModal}
        onClose={() => setShowEngagementModal(false)}
        processingTime={180} // 3 minutes
      />
      
      <h3>Upload Your DD214</h3>
      <p className="upload-description">
        Your military service record unlocks AI-powered insights including personalized resume bullets, 
        interview strategies, and career recommendations tailored to your unique experience
      </p>
      
      <div className="trust-indicators">
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
          <span>Encrypted Upload</span>
        </div>
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>PII Automatically Redacted</span>
        </div>
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <span>Secure Processing Only</span>
        </div>
      </div>
      
      {/* Authentication Status Display */}
      {loading ? (
        <div className="auth-status">
          <div className="auth-status-info">
            <span>Checking authentication...</span>
          </div>
        </div>
      ) : isAuthenticated && user ? (
        <div className="auth-status">
          <div className="auth-status-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>
              {user.givenName ? (
                `Welcome, ${user.givenName}`
              ) : user.name ? (
                `Signed in as ${user.name}`
              ) : user.email ? (
                `Signed in as ${user.email}`
              ) : (
                `Signed in as ${user.username || user.userId}`
              )}
            </span>
          </div>
          <div className="auth-actions">
            <button
              onClick={handleSignOut}
              className="sign-out-button"
            >
              Sign Out
            </button>
            <button
              onClick={() => checkAuth()}
              className="refresh-button"
              title="Refresh session"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>
          </div>
        </div>
      ) : sessionExpired ? (
        <div className="auth-status session-expired">
          <div className="auth-status-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff9800">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <span>Your session has expired</span>
          </div>
          <button
            onClick={() => {
              handleSignOut()
              setShowAuthModal(true)
            }}
            className="sign-in-button"
          >
            Sign In Again
          </button>
        </div>
      ) : null}

      {uploadState.status === 'idle' || uploadState.status === 'error' ? (
        <>
          {!isAuthenticated && (
            <div style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#ffc107', marginBottom: '0.5rem' }}>
                Authentication required to upload DD214
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  background: '#00d4ff',
                  color: '#0a0e1a',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Sign In / Create Account
              </button>
            </div>
          )}
          <div 
            {...getRootProps()} 
            className={`dropzone ${isDragActive ? 'active' : ''} ${!isAuthenticated ? 'unauthenticated' : ''}`}
            onClick={!isAuthenticated ? () => setShowAuthModal(true) : undefined}
          >
            <input {...getInputProps()} />
            <div className="dropzone-content">
            <svg className="upload-icon" viewBox="0 0 24 24" width="48" height="48">
              <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" fill="currentColor"/>
            </svg>
            {isDragActive ? (
              <p>Drop your DD214 here...</p>
            ) : (
              <>
                <button className="upload-button-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 7v3h-2V7h-3V5h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
                  </svg>
                  Click to Select File
                </button>
                <p className="upload-or">or drag & drop your DD214 here</p>
                <p className="upload-formats">Supports PDF, JPG, PNG (max 10MB)</p>
              </>
            )}
            </div>
          </div>
          
          <div className="process-steps-preview">
            <h4>What happens next:</h4>
            <div className="steps-grid">
              <div className="step-preview">
                <div className="step-number">1</div>
                <span>Secure Upload</span>
              </div>
              <div className="step-arrow">→</div>
              <div className="step-preview">
                <div className="step-number">2</div>
                <span>PII Redaction</span>
              </div>
              <div className="step-arrow">→</div>
              <div className="step-preview">
                <div className="step-number">3</div>
                <span>AI Analysis</span>
              </div>
              <div className="step-arrow">→</div>
              <div className="step-preview">
                <div className="step-number">4</div>
                <span>Career Insights</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="processing-container">
          {uploadState.status === 'uploading' && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <p>Uploading document...</p>
            </div>
          )}

          {(uploadState.status === 'processing' || uploadState.status === 'complete') && (
            <div className="processing-steps">
              <h4>Processing Your DD214</h4>
              {uploadState.processingSteps?.map((step, index) => (
                <div key={index} className={`processing-step ${step.status}`}>
                  <div className="step-indicator">
                    {step.status === 'complete' ? '✓' : 
                     step.status === 'in-progress' ? '⋯' : 
                     step.status === 'error' ? '✗' : '○'}
                  </div>
                  <div className="step-content">
                    <span className="step-name">{step.name}</span>
                    {step.timestamp && (
                      <span className="step-time">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {uploadState.status === 'complete' && (
            <div className="upload-success">
              <svg className="success-icon" viewBox="0 0 24 24" width="64" height="64">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#22c55e"/>
              </svg>
              <h4>DD214 Processed Successfully!</h4>
              <p>Your enhanced profile is ready</p>
            </div>
          )}
        </div>
      )}

      {uploadState.error && (
        <div className="upload-error">
          <p>{uploadState.error}</p>
          <button 
            onClick={() => setUploadState({ status: 'idle', progress: 0 })}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="security-notice">
        <svg className="lock-icon" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="currentColor"/>
        </svg>
        <p>Your document is encrypted and processed securely. PII is automatically redacted.</p>
      </div>
    </div>
  )
}