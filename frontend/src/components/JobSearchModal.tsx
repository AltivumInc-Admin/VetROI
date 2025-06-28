import React, { useState } from 'react'
import '../styles/JobSearchModal.css'

interface JobSearchModalProps {
  isOpen: boolean
  onClose: () => void
  mosCode: string
  jobTitles: string[]
  state: string
}

interface JobResult {
  MatchedObjectId: string
  MatchedObjectDescriptor: {
    PositionTitle: string
    PositionURI: string
    PositionLocationDisplay: string
    OrganizationName: string
    DepartmentName: string
  }
}

export const JobSearchModal: React.FC<JobSearchModalProps> = ({
  isOpen,
  onClose,
  mosCode,
  jobTitles,
  state
}) => {
  const [loading, setLoading] = useState(false)
  const [jobResults, setJobResults] = useState<JobResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const searchJobs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/usajobs-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobTitle: jobTitles[0], // Use first selected job title
          state: state
        })
      })

      if (!response.ok) {
        throw new Error('Failed to search jobs')
      }

      const data = await response.json()
      setJobResults(data.SearchResult?.SearchResultItems || [])
    } catch (err) {
      setError('Unable to search jobs. Please try again.')
      console.error('Job search error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="job-search-modal-overlay" onClick={onClose}>
      <div className="job-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Apply for Jobs</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div className="modal-content">
          <div className="personalized-message">
            <p>
              Based on your input, Sentra has determined that you are <strong>{mosCode}</strong>, 
              interested in <strong>{jobTitles.join(', ')}</strong>, 
              and you live in <strong>{state}</strong>
            </p>
          </div>

          <div className="search-section">
            <button 
              className="search-jobs-button" 
              onClick={searchJobs}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search Jobs'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {jobResults.length > 0 && (
            <div className="job-results">
              <h3>Available Positions ({jobResults.length})</h3>
              <div className="jobs-list">
                {jobResults.map((job) => (
                  <div key={job.MatchedObjectId} className="job-card">
                    <h4>{job.MatchedObjectDescriptor.PositionTitle}</h4>
                    <p className="job-location">{job.MatchedObjectDescriptor.PositionLocationDisplay}</p>
                    <p className="job-org">{job.MatchedObjectDescriptor.OrganizationName}</p>
                    <p className="job-dept">{job.MatchedObjectDescriptor.DepartmentName}</p>
                    <a 
                      href={job.MatchedObjectDescriptor.PositionURI} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="apply-link"
                    >
                      View & Apply →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}