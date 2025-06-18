import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import '../styles/SessionWarningModal.css'

interface SessionWarningModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({ isOpen, onClose }) => {
  const { refreshSession, signOutUser, lastActivity } = useAuth()
  const [timeRemaining, setTimeRemaining] = useState(5 * 60) // 5 minutes

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      const now = Date.now()
      const timeSinceActivity = now - lastActivity
      const remaining = Math.max(0, 30 * 60 * 1000 - timeSinceActivity) / 1000
      setTimeRemaining(Math.floor(remaining))

      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, lastActivity])

  if (!isOpen) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStaySignedIn = async () => {
    await refreshSession()
    onClose()
  }

  const handleSignOut = async () => {
    await signOutUser()
    onClose()
  }

  return (
    <div className="session-warning-overlay" onClick={onClose}>
      <div className="session-warning-modal" onClick={e => e.stopPropagation()}>
        <div className="warning-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#ff9800">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>

        <h3>Session Expiring Soon</h3>
        <p>Your session will expire in {formatTime(timeRemaining)} due to inactivity.</p>
        <p className="warning-subtitle">Would you like to stay signed in?</p>

        <div className="warning-actions">
          <button 
            className="stay-signed-in-button"
            onClick={handleStaySignedIn}
          >
            Stay Signed In
          </button>
          <button 
            className="sign-out-now-button"
            onClick={handleSignOut}
          >
            Sign Out Now
          </button>
        </div>
      </div>
    </div>
  )
}