import React, { Component, ErrorInfo, ReactNode } from 'react'
import '../styles/ErrorBoundary.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>We encountered an unexpected error while loading this section.</p>
            <div className="error-details">
              <code>{this.state.error?.message || 'Unknown error'}</code>
            </div>
            <div className="error-actions">
              <button onClick={this.handleReset} className="retry-button">
                Try Again
              </button>
              <button onClick={() => window.location.reload()} className="reload-button">
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapper for async components
export const AsyncBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="async-error">
        <p>Failed to load this section. Please try refreshing the page.</p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
)