import React, { useState } from 'react'
import { signIn, signUp, confirmSignUp, SignInInput, SignUpInput } from 'aws-amplify/auth'
import '../styles/AuthModal.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (userId: string) => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'confirm'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const signInInput: SignInInput = {
        username: email,
        password
      }
      const { isSignedIn } = await signIn(signInInput)
      
      if (isSignedIn) {
        onSuccess(email)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const signUpInput: SignUpInput = {
        username: email,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      }
      
      const { nextStep } = await signUp(signUpInput)
      
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setMode('confirm')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode
      })

      if (isSignUpComplete) {
        // Auto sign in after confirmation
        const { isSignedIn } = await signIn({
          username: email,
          password
        })
        
        if (isSignedIn) {
          onSuccess(email)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>×</button>
        
        <div className="auth-header">
          <h2>Secure DD214 Upload</h2>
          <p>Create an account to securely upload and analyze your DD214</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {mode === 'signIn' && (
          <form onSubmit={handleSignIn}>
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
              />
            </div>
            
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="auth-switch">
              Don't have an account?{' '}
              <button type="button" onClick={() => setMode('signUp')}>
                Sign Up
              </button>
            </div>
          </form>
        )}

        {mode === 'signUp' && (
          <form onSubmit={handleSignUp}>
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
              />
            </div>
            
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Min 12 chars, upper, lower, number, special"
              />
            </div>
            
            <div className="auth-field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter your password"
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            <div className="auth-switch">
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('signIn')}>
                Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'confirm' && (
          <form onSubmit={handleConfirm}>
            <p className="auth-info">
              We've sent a verification code to {email}
            </p>

            <div className="auth-field">
              <label>Verification Code</label>
              <input
                type="text"
                value={confirmationCode}
                onChange={e => setConfirmationCode(e.target.value)}
                required
                placeholder="Enter 6-digit code"
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>
        )}

        <div className="auth-security">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
          <span>Your data is encrypted and secure</span>
        </div>
      </div>
    </div>
  )
}