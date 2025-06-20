import React from 'react'
import '../styles/SkeletonLoader.css'

interface SkeletonLoaderProps {
  type: 'card' | 'chart' | 'text' | 'button' | 'insights'
  count?: number
  width?: string
  height?: string
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type, 
  count = 1, 
  width,
  height 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="skeleton-card">
            <div className="skeleton-header">
              <div className="skeleton-title" />
              <div className="skeleton-subtitle" />
            </div>
            <div className="skeleton-content">
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
            </div>
          </div>
        )
        
      case 'chart':
        return (
          <div className="skeleton-chart" style={{ width, height }}>
            <div className="skeleton-chart-bars">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-bar" style={{ height: `${60 + Math.random() * 40}%` }} />
              ))}
            </div>
          </div>
        )
        
      case 'text':
        return (
          <div className="skeleton-text" style={{ width }}>
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        )
        
      case 'button':
        return <div className="skeleton-button" style={{ width, height }} />
        
      case 'insights':
        return (
          <div className="skeleton-insights">
            <div className="skeleton-header-section">
              <div className="skeleton-title large" />
              <div className="skeleton-subtitle" />
            </div>
            <div className="skeleton-tabs">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-tab" />
              ))}
            </div>
            <div className="skeleton-content-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-title" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              ))}
            </div>
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="skeleton-wrapper">
          {renderSkeleton()}
        </div>
      ))}
    </>
  )
}

// Specific skeleton for career cards
export const CareerCardSkeleton: React.FC = () => (
  <div className="career-card-skeleton">
    <div className="skeleton-badge-row">
      <div className="skeleton-badge" />
      <div className="skeleton-badge" />
    </div>
    <div className="skeleton-title large" />
    <div className="skeleton-subtitle" />
    <div className="skeleton-section">
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
    <div className="skeleton-chart-preview" />
    <div className="skeleton-button-group">
      <div className="skeleton-button" />
      <div className="skeleton-button" />
    </div>
  </div>
)

// Skeleton for comparison view
export const ComparisonSkeleton: React.FC = () => (
  <div className="comparison-skeleton">
    <div className="skeleton-tabs">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton-tab" />
      ))}
    </div>
    <div className="skeleton-content-area">
      <SkeletonLoader type="chart" width="100%" height="400px" />
      <div className="skeleton-legend">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton-legend-item">
            <div className="skeleton-dot" />
            <div className="skeleton-text" style={{ width: '100px' }} />
          </div>
        ))}
      </div>
    </div>
  </div>
)