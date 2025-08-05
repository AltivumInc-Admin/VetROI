import React, { useEffect, useState } from 'react'
import { fetchMultipleSOCData } from '../api'
import { CareerDetailCard } from './CareerDetailCard'
import { ComparisonView } from './ComparisonView'
import { CareerCardSkeleton } from './SkeletonLoader'
import { generateCareerAnalysisPDF } from '../utils/pdfGenerator'
import '../styles/DetailedAnalysisView.css'

interface DetailedAnalysisViewProps {
  selectedSOCs: string[]
  onBack: () => void
  onMeetSentra: () => void
  userState?: string
  relocationState?: string
  veteranProfile?: {
    branch?: string
    code?: string
    education?: string
    mosTitle?: string
  }
}

export const DetailedAnalysisView: React.FC<DetailedAnalysisViewProps> = ({
  selectedSOCs,
  onBack,
  onMeetSentra,
  userState = 'CA',
  relocationState,
  veteranProfile
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [careerData, setCareerData] = useState<Record<string, any>>({})
  const [showComparison, setShowComparison] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)  
  
  useEffect(() => {
    // Trigger S3 data fetch when component mounts
    console.log('DetailedAnalysisView: Fetching S3 data for SOCs:', selectedSOCs)
    
    fetchMultipleSOCData(selectedSOCs)
      .then(data => {
        console.log('DetailedAnalysisView: Fetched S3 data:', data)
        setCareerData(data)
        setLoading(false)
        // Dispatch event for DataPanel
        window.dispatchEvent(new CustomEvent('s3DataFetched', { detail: data }))
      })
      .catch(err => {
        console.error('DetailedAnalysisView: Error fetching S3 data:', err)
        setError('Failed to load career data')
        setLoading(false)
      })
  }, [selectedSOCs])

  const handleDownloadPDF = async () => {
    if (!veteranProfile || Object.keys(careerData).length === 0) {
      console.error('Missing data for PDF generation')
      return
    }

    setDownloadingPDF(true)
    
    try {
      // Transform the career data to match the PDF generator format using the same data as cards
      const selectedCareersData = Object.values(careerData).map((socData: any) => ({
        code: socData.code || socData.soc,
        title: socData.career?.title || socData.title || 'Unknown Career',
        description: socData.career?.what_they_do || '',
        also_called: socData.career?.also_called?.title || [],
        salary: {
          annual_median: socData.job_outlook?.salary?.annual_median_over || socData.job_outlook?.salary?.annual_median,
          annual_10th_percentile: socData.job_outlook?.salary?.annual_10th_percentile,
          annual_90th_percentile: socData.job_outlook?.salary?.annual_90th_percentile_over || socData.job_outlook?.salary?.annual_90th_percentile,
          hourly_median: socData.job_outlook?.salary?.hourly_median_over || socData.job_outlook?.salary?.hourly_median,
          hourly_10th_percentile: socData.job_outlook?.salary?.hourly_10th_percentile,
          hourly_90th_percentile: socData.job_outlook?.salary?.hourly_90th_percentile_over || socData.job_outlook?.salary?.hourly_90th_percentile
        },
        outlook: socData.job_outlook?.outlook ? {
          category: socData.job_outlook.outlook.category,
          description: socData.job_outlook.outlook.description,
          bright_outlook_categories: socData.job_outlook.bright_outlook?.category || []
        } : undefined,
        education: socData.education?.job_zone ? [{
          level: `Job Zone ${socData.education.job_zone}`,
          category: socData.education.education_title || '',
          description: socData.education.education_description || ''
        }] : [],
        tasks: socData.career?.on_the_job?.task || [],
        knowledge: socData.knowledge?.group || [],
        skills: socData.skills?.group || [],
        abilities: socData.abilities?.group || [],
        personality: socData.personality || {},
        technology: socData.technology?.category || [],
        industries: socData.where_do_they_work?.industry || [],
        work_context: socData.work_context || {},
        related_occupations: socData.explore_more?.careers?.career || [],
        green_occupation: socData.career?.tags?.green || false,
        bright_outlook: socData.career?.tags?.bright_outlook || false,
        location_data: {
          userState: userState,
          userStateData: (() => {
            const allStates = [
              ...(socData.check_out_my_state?.above_average?.state || []),
              ...(socData.check_out_my_state?.average?.state || []),
              ...(socData.check_out_my_state?.below_average?.state || [])
            ]
            return allStates.find(state => state.postal_code === userState)
          })(),
          relocationState: relocationState,
          relocationStateData: relocationState ? (() => {
            const allStates = [
              ...(socData.check_out_my_state?.above_average?.state || []),
              ...(socData.check_out_my_state?.average?.state || []),
              ...(socData.check_out_my_state?.below_average?.state || [])
            ]
            return allStates.find(state => state.postal_code === relocationState)
          })() : undefined
        }
      }))

      const veteranProfileData = {
        branch: veteranProfile.branch || 'Unknown',
        mos: veteranProfile.code || 'Unknown',
        mosTitle: veteranProfile.mosTitle || veteranProfile.code || 'Unknown',
        education: veteranProfile.education || 'Unknown',
        homeState: userState,
        relocate: !!relocationState,
        relocateState: relocationState
      }

      await generateCareerAnalysisPDF(selectedCareersData, veteranProfileData)
    } catch (error) {
      console.error('Error generating PDF:', error)
      // You could show an error message to the user here
    } finally {
      setDownloadingPDF(false)
    }
  }

  return (
    <div className="detailed-analysis-container">
      <header className="analysis-header">
        <h2>Detailed Career Analysis</h2>
        <button className="back-button" onClick={onBack}>
          ← Back to Career Selection
        </button>
      </header>
      
      <main className="analysis-content">
        {loading && (
          <div className="career-cards">
            {selectedSOCs.map((_, index) => (
              <CareerCardSkeleton key={index} />
            ))}
          </div>
        )}
        {error && (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}
        {!loading && !error && !showComparison && (
          <div className="career-cards">
            {Object.values(careerData).map((socData: any) => (
              <CareerDetailCard 
                key={socData.soc} 
                socData={socData} 
                userState={userState}
                relocationState={relocationState}
              />
            ))}
          </div>
        )}
        {!loading && !error && showComparison && (
          <ComparisonView
            careerData={careerData}
            selectedSOCs={selectedSOCs}
            userState={userState}
            relocationState={relocationState}
            veteranProfile={veteranProfile}
          />
        )}
      </main>
      
      {!loading && !error && (
        <div className="action-buttons-section">
          {selectedSOCs.length >= 2 && (
            <button 
              className="compare-careers-button" 
              onClick={() => setShowComparison(!showComparison)}
            >
              <div className="compare-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 3h18M3 12h18M3 21h18M9 3v18M15 3v18" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>{showComparison ? 'Individual View' : 'Compare Careers'}</span>
            </button>
          )}
          
          <button 
            className="download-pdf-button compare-careers-button" 
            onClick={handleDownloadPDF}
            disabled={downloadingPDF || !veteranProfile}
          >
            <div className="compare-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>{downloadingPDF ? 'Generating PDF...' : 'Download Career Analysis'}</span>
          </button>
          
          <button className="meet-sentra-button" onClick={onMeetSentra}>
            <div className="sentra-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span>Meet with Sentra, our state-of-the-art career counselor</span>
          </button>
        </div>
      )}
    </div>
  )
}