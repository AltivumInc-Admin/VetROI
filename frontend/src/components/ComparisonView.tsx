import React, { useState } from 'react'
import { ComparisonSalaryChart } from './ComparisonSalaryChart'
import { ComparisonGrowthChart } from './ComparisonGrowthChart'
import { ComparisonEducationROI } from './ComparisonEducationROI'
import { ComparisonLocationMatrix } from './ComparisonLocationMatrix'
import { DecisionMatrix } from './DecisionMatrix'
import { SkillsAnalysis } from './SkillsAnalysis'
import '../styles/ComparisonView.css'

interface ComparisonViewProps {
  careerData: Record<string, any>
  selectedSOCs: string[]
  userState?: string
  relocationState?: string
  veteranProfile?: {
    branch?: string
    code?: string
    education?: string
  }
}

type ComparisonTab = 'salary' | 'growth' | 'education' | 'location' | 'skills' | 'overview'

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  careerData,
  selectedSOCs,
  userState = 'CA',
  relocationState,
  veteranProfile
}) => {
  // State data will be used in Phase 2 for location comparison
  console.log('State data ready for Phase 2:', { userState, relocationState })
  const [activeTab, setActiveTab] = useState<ComparisonTab>('salary')
  const [selectedCareers, setSelectedCareers] = useState<string[]>(selectedSOCs.slice(0, 4))
  
  // Filter career data to only selected careers
  const comparisonData = Object.values(careerData).filter(
    career => selectedCareers.includes(career.soc || career.code)
  )
  
  const handleCareerToggle = (soc: string) => {
    if (selectedCareers.includes(soc)) {
      if (selectedCareers.length > 2) {
        setSelectedCareers(selectedCareers.filter(s => s !== soc))
      }
    } else {
      if (selectedCareers.length < 4) {
        setSelectedCareers([...selectedCareers, soc])
      }
    }
  }
  
  return (
    <div className="comparison-view">
      <div className="comparison-header">
        <h2>Career Comparison Analysis</h2>
        <p className="comparison-subtitle">
          Compare key metrics across your selected careers to make an informed decision
        </p>
      </div>
      
      {/* Career Selector */}
      <div className="career-selector">
        <h3>Select Careers to Compare (2-4)</h3>
        <div className="career-checkboxes">
          {Object.values(careerData).map((career: any) => {
            const soc = career.soc || career.code
            const title = career.career?.title || career.title || 'Unknown Career'
            const isSelected = selectedCareers.includes(soc)
            const isDisabled = !isSelected && selectedCareers.length >= 4
            
            return (
              <label 
                key={soc} 
                className={`career-checkbox ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleCareerToggle(soc)}
                  disabled={isDisabled}
                />
                <span className="career-title">{title}</span>
                <span className="career-code">{soc}</span>
              </label>
            )
          })}
        </div>
      </div>
      
      {/* Comparison Tabs */}
      <div className="comparison-tabs">
        <button 
          className={`tab-button ${activeTab === 'salary' ? 'active' : ''}`}
          onClick={() => setActiveTab('salary')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.93.66 1.64 2.08 1.64 1.51 0 2.1-.6 2.1-1.51 0-.96-.69-1.33-2.14-1.71-1.94-.51-3.36-1.21-3.36-3.21 0-1.51 1.22-2.48 2.94-2.81V5.2h2.67v1.92c1.44.32 2.51 1.27 2.66 2.99h-1.98c-.11-.72-.58-1.3-1.81-1.3-1.22 0-1.83.51-1.83 1.34 0 .81.65 1.09 2.01 1.46 2.11.59 3.48 1.26 3.48 3.41 0 1.83-1.41 2.71-3.19 3.07z"/>
          </svg>
          Salary
        </button>
        <button 
          className={`tab-button ${activeTab === 'growth' ? 'active' : ''}`}
          onClick={() => setActiveTab('growth')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z"/>
          </svg>
          Growth
        </button>
        <button 
          className={`tab-button ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
          </svg>
          Education
        </button>
        <button 
          className={`tab-button ${activeTab === 'location' ? 'active' : ''}`}
          onClick={() => setActiveTab('location')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5C10.62,11.5 9.5,10.38 9.5,9C9.5,7.62 10.62,6.5 12,6.5C13.38,6.5 14.5,7.62 14.5,9C14.5,10.38 13.38,11.5 12,11.5Z"/>
          </svg>
          Location
        </button>
        <button 
          className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13,2.05V5.08C16.39,5.57 19,8.47 19,12C19,12.9 18.82,13.75 18.52,14.54L21.12,16.07C21.68,14.83 22,13.45 22,12C22,6.82 18.05,2.55 13,2.05M12,19A7,7 0 0,1 5,12C5,8.47 7.61,5.57 11,5.08V2.05C5.94,2.55 2,6.81 2,12A10,10 0 0,0 12,22C15.3,22 18.23,20.39 20.05,17.91L17.45,16.38C16.17,18 14.21,19 12,19Z"/>
          </svg>
          Skills
        </button>
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M9 17H7V10H9V17M13 17H11V7H13V17M17 17H15V13H17V17Z"/>
          </svg>
          Overview
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="comparison-content">
        {activeTab === 'salary' && comparisonData.length >= 2 && (
          <ComparisonSalaryChart careers={comparisonData} />
        )}
        
        {activeTab === 'growth' && comparisonData.length >= 2 && (
          <ComparisonGrowthChart careers={comparisonData} />
        )}
        
        {activeTab === 'education' && comparisonData.length >= 2 && (
          <ComparisonEducationROI careers={comparisonData} />
        )}
        
        {activeTab === 'location' && comparisonData.length >= 2 && (
          <ComparisonLocationMatrix 
            careers={comparisonData} 
            userState={userState}
            relocationState={relocationState}
          />
        )}
        
        {activeTab === 'skills' && comparisonData.length >= 2 && (
          <SkillsAnalysis 
            careers={comparisonData}
            veteranProfile={veteranProfile}
          />
        )}
        
        {activeTab === 'overview' && comparisonData.length >= 2 && (
          <DecisionMatrix 
            careers={comparisonData}
            userState={userState}
            relocationState={relocationState}
            veteranProfile={veteranProfile}
          />
        )}
        
        {comparisonData.length < 2 && (
          <div className="insufficient-careers">
            <p>Please select at least 2 careers to compare</p>
          </div>
        )}
      </div>
    </div>
  )
}