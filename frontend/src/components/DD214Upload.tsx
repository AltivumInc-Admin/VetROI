import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

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
      const presignedResponse = await fetch('/api/dd214/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          veteranId
        })
      })

      const { uploadUrl, documentId } = await presignedResponse.json()

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

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
  }, [veteranId])

  const pollProcessingStatus = async (documentId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/dd214/status/${documentId}`)
        const status = await response.json()

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
    disabled: uploadState.status !== 'idle' && uploadState.status !== 'error'
  })

  return (
    <div className="dd214-upload-container">
      <h3>Upload Your DD214</h3>
      <p className="upload-description">
        Upload your DD214 to unlock AI-powered career insights and personalized recommendations
      </p>

      {uploadState.status === 'idle' || uploadState.status === 'error' ? (
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
                <p className="upload-hint">or click to browse</p>
                <p className="upload-formats">Supports PDF, JPG, PNG (max 10MB)</p>
              </>
            )}
          </div>
        </div>
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