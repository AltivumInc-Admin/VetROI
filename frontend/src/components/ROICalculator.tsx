import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface EducationPath {
  type: 'certificate' | 'associate' | 'bachelor' | 'apprenticeship'
  institution: string
  duration: number // months
  cost: number
  giCovered: number // percentage
  link: string
}

interface ROICalculation {
  totalInvestment: number
  giContribution: number
  outOfPocket: number
  timeToBreakEven: number // months
  fiveYearROI: number
  tenYearROI: number
  score: number // 0-100
}

interface ROICalculatorProps {
  careerData: any
  veteranProfile: any
  stateData: any
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({
  careerData,
  veteranProfile,
  stateData
}) => {
  const [selectedPath, setSelectedPath] = useState<EducationPath | null>(null)
  const [roiResult, setRoiResult] = useState<ROICalculation | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Extract salary data
  const salary = careerData?.data?.report_raw?.job_outlook?.salary || {}
  const medianAnnual = salary.annual_median || 0
  const entryAnnual = salary.annual_10th_percentile || 0
  
  // Current income assumption (E-5 with 6 years)
  const currentMilitaryPay = 45000 // Rough average

  // Education paths based on career requirements
  const educationPaths: EducationPath[] = generateEducationPaths(
    careerData,
    veteranProfile,
    stateData
  )

  const calculateROI = (path: EducationPath): ROICalculation => {
    // Time value calculations
    const monthlyOpportunityCost = (currentMilitaryPay / 12)
    const totalOpportunityCost = monthlyOpportunityCost * path.duration
    
    // GI Bill calculations (Post-9/11)
    const giMonthlyHousing = getBAHForState(veteranProfile.homeState)
    const giTotalHousing = giMonthlyHousing * path.duration
    const giTuitionCoverage = path.cost * (path.giCovered / 100)
    const giTotalBenefit = giTuitionCoverage + giTotalHousing
    
    // Out of pocket
    const outOfPocket = path.cost - giTuitionCoverage
    const totalInvestment = outOfPocket + totalOpportunityCost - giTotalHousing
    
    // Income projections
    const yearOneSalary = entryAnnual
    const yearFiveSalary = medianAnnual
    const salaryGrowthRate = 0.03 // 3% annual
    
    // Break-even calculation
    const monthlyGain = (yearOneSalary - currentMilitaryPay) / 12
    const timeToBreakEven = totalInvestment / monthlyGain
    
    // Long-term ROI
    let fiveYearEarnings = 0
    let tenYearEarnings = 0
    
    for (let year = 1; year <= 10; year++) {
      const adjustedSalary = year <= 5 
        ? yearOneSalary + (yearFiveSalary - yearOneSalary) * (year / 5)
        : yearFiveSalary * Math.pow(1 + salaryGrowthRate, year - 5)
      
      if (year <= 5) fiveYearEarnings += adjustedSalary
      tenYearEarnings += adjustedSalary
    }
    
    const fiveYearROI = ((fiveYearEarnings - totalInvestment) / totalInvestment) * 100
    const tenYearROI = ((tenYearEarnings - totalInvestment) / totalInvestment) * 100
    
    // Score calculation (0-100)
    const score = calculateScore(timeToBreakEven, fiveYearROI, path.duration)
    
    return {
      totalInvestment,
      giContribution: giTotalBenefit,
      outOfPocket,
      timeToBreakEven: Math.round(timeToBreakEven),
      fiveYearROI: Math.round(fiveYearROI),
      tenYearROI: Math.round(tenYearROI),
      score: Math.round(score)
    }
  }

  const calculateScore = (breakEven: number, roi: number, duration: number): number => {
    // Weighted scoring
    const breakEvenScore = Math.max(0, 100 - (breakEven * 2)) * 0.4
    const roiScore = Math.min(100, roi / 5) * 0.4
    const timeScore = Math.max(0, 100 - (duration * 2)) * 0.2
    
    return breakEvenScore + roiScore + timeScore
  }

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22c55e' // green
    if (score >= 60) return '#3b82f6' // blue
    if (score >= 40) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  return (
    <div className="roi-calculator">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="roi-header"
      >
        <h3>🎯 VetROI™ Analysis</h3>
        <p>Calculate your return on investment for different education paths</p>
      </motion.div>

      <div className="education-paths">
        {educationPaths.map((path, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`path-card ${selectedPath === path ? 'selected' : ''}`}
            onClick={() => {
              setSelectedPath(path)
              setRoiResult(calculateROI(path))
            }}
          >
            <div className="path-header">
              <span className="path-type">{path.type.toUpperCase()}</span>
              <span className="gi-coverage">{path.giCovered}% GI Bill</span>
            </div>
            <h4>{path.institution}</h4>
            <div className="path-details">
              <span>{path.duration} months</span>
              <span>{formatCurrency(path.cost)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {roiResult && selectedPath && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="roi-results"
          >
            <div className="roi-score-container">
              <div className="roi-score" style={{ borderColor: getScoreColor(roiResult.score) }}>
                <span className="score-label">VetROI Score</span>
                <span className="score-value" style={{ color: getScoreColor(roiResult.score) }}>
                  {roiResult.score}
                </span>
              </div>
              
              <div className="roi-summary">
                <div className="summary-item">
                  <span>Break Even</span>
                  <strong>{roiResult.timeToBreakEven} months</strong>
                </div>
                <div className="summary-item">
                  <span>5-Year ROI</span>
                  <strong>{roiResult.fiveYearROI}%</strong>
                </div>
                <div className="summary-item">
                  <span>Out of Pocket</span>
                  <strong>{formatCurrency(roiResult.outOfPocket)}</strong>
                </div>
              </div>
            </div>

            <button 
              className="details-toggle"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Detailed Analysis
            </button>

            {showDetails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="roi-details"
              >
                <h4>Investment Breakdown</h4>
                <div className="detail-row">
                  <span>Program Cost</span>
                  <span>{formatCurrency(selectedPath.cost)}</span>
                </div>
                <div className="detail-row highlight">
                  <span>GI Bill Coverage</span>
                  <span className="positive">{formatCurrency(roiResult.giContribution)}</span>
                </div>
                <div className="detail-row">
                  <span>Your Investment</span>
                  <span>{formatCurrency(roiResult.outOfPocket)}</span>
                </div>
                
                <h4>Projected Earnings</h4>
                <div className="detail-row">
                  <span>Current (Military)</span>
                  <span>{formatCurrency(currentMilitaryPay)}/year</span>
                </div>
                <div className="detail-row">
                  <span>Entry Level</span>
                  <span>{formatCurrency(entryAnnual)}/year</span>
                </div>
                <div className="detail-row highlight">
                  <span>After 5 Years</span>
                  <span className="positive">{formatCurrency(medianAnnual)}/year</span>
                </div>
              </motion.div>
            )}

            <div className="action-buttons">
              <a 
                href={selectedPath.link}
                target="_blank"
                rel="noopener noreferrer"
                className="action-primary"
              >
                Apply Now →
              </a>
              <button className="action-secondary">
                Save Analysis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper functions
function generateEducationPaths(career: any, profile: any, state: any): EducationPath[] {
  // This would be enhanced with real data from your S3 bucket
  const paths: EducationPath[] = []
  
  // Example logic for RN career
  if (career?.soc === '29-1141.00') {
    paths.push({
      type: 'associate',
      institution: 'Austin Community College - ADN Program',
      duration: 24,
      cost: 12000,
      giCovered: 100,
      link: 'https://www.austincc.edu/nursing'
    })
    
    paths.push({
      type: 'bachelor',
      institution: 'UT Arlington - RN to BSN Online',
      duration: 18,
      cost: 28000,
      giCovered: 100,
      link: 'https://www.uta.edu/nursing/bsn'
    })
  }
  
  return paths
}

function getBAHForState(state: string): number {
  // Simplified BAH rates - would pull from real data
  const bahRates: { [key: string]: number } = {
    'TX': 1800,
    'CA': 3200,
    'NY': 3000,
    'FL': 1900,
    // ... etc
  }
  return bahRates[state] || 1500
}