import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { getDD214PresignedUrl, uploadDD214ToS3, getDD214Status } from '../api'
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import { AuthModal } from './AuthModal'
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  // Check authentication status on mount
  React.useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const user = await getCurrentUser()
      setIsAuthenticated(true)
      // Try to get email from signInDetails or username
      const email = user.signInDetails?.loginId || user.username
      setCurrentUser(email)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsAuthenticated(false)
      setCurrentUser(null)
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

    // Check if authenticated first
    if (!isAuthenticated) {
      console.log('Not authenticated, showing auth modal')
      setShowAuthModal(true)
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

      // Start polling for status
      pollProcessingStatus(documentId)

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      }))
    }
  }, [veteranId, isAuthenticated])

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
          onUploadComplete(documentId)
        } else if (status.status === 'error') {
          clearInterval(pollInterval)
          setUploadState(prev => ({
            ...prev,
            status: 'error',
            error: status.error || 'Processing failed'
          }))
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
    noClick: false,
    noKeyboard: false
  })

  const handleAuthSuccess = async (userEmail: string) => {
    setIsAuthenticated(true)
    setCurrentUser(userEmail)
    setShowAuthModal(false)
    
    // Update user attributes to mark DD214 upload intent
    // This will be handled in Phase 2
  }

  return (
    <div className="dd214-upload-container">
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      
      <h3>Upload Your DD214</h3>
      <p className="upload-description">
        Upload your DD214 to unlock AI-powered career insights and personalized recommendations
      </p>
      
      {isAuthenticated && currentUser && (
        <div className="auth-status">
          <div className="auth-status-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Signed in as {currentUser}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="sign-out-button"
          >
            Sign Out
          </button>
        </div>
      )}

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
            className={`dropzone ${isDragActive ? 'active' : ''}`}
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
                <p>Drag & drop your DD214 here</p>
                <p className="upload-hint">or click to browse files on your device</p>
                <p className="upload-formats">Supports PDF, JPG, PNG (max 10MB)</p>
              </>
            )}
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