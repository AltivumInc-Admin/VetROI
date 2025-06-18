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
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  if (!isOpen) return null

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
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
    setSuccessMessage('')
    
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
      } else if (nextStep.signUpStep === 'DONE') {
        // Sign up is complete, no confirmation needed
        setMode('signIn')
        setSuccessMessage('Account created successfully! Please sign in.')
        setPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      if (err.message?.includes('already exists') || 
          err.name === 'UsernameExistsException') {
        setMode('signIn')
        setError('An account with this email already exists. Please sign in.')
      } else {
        setError(err.message || 'Failed to sign up')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode
      })

      if (isSignUpComplete) {
        // Don't auto sign in - show success message and switch to sign in mode
        setMode('signIn')
        setError('') // Clear any errors
        setSuccessMessage('Account created successfully! Please sign in.')
        setConfirmationCode('') // Clear the code
        setPassword('') // Clear password for security
        setConfirmPassword('')
      }
    } catch (err: any) {
      // Handle case where user is already confirmed
      if (err.message?.includes('Current status is CONFIRMED') || 
          err.name === 'NotAuthorizedException' ||
          err.message?.includes('User cannot be confirmed')) {
        // User is already confirmed, switch to sign in
        setMode('signIn')
        setError('Your account is already confirmed. Please sign in.')
      } else {
        setError(err.message || 'Failed to confirm account')
      }
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
          <div className={`auth-error ${error.includes('Please sign in') || error.includes('already confirmed') ? 'auth-info' : ''}`}>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="auth-success">
            {successMessage}
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
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="auth-switch">
              Don't have an account?{' '}
              <button type="button" onClick={() => {
                setMode('signUp')
                setError('')
                setSuccessMessage('')
              }}>
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
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Min 12 chars, upper, lower, number, special"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="auth-field">
              <label>Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            <div className="auth-switch">
              Already have an account?{' '}
              <button type="button" onClick={() => {
                setMode('signIn')
                setError('')
                setSuccessMessage('')
              }}>
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

            <div className="auth-switch">
              Already confirmed?{' '}
              <button type="button" onClick={() => {
                setMode('signIn')
                setError('')
                setSuccessMessage('')
              }}>
                Sign In
              </button>
            </div>
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