import React, { useEffect, useRef, useState } from 'react'
import '../styles/ComparisonSalaryChart.css'

interface Career {
  soc?: string
  code?: string
  title?: string
  career?: {
    title?: string
  }
  job_outlook?: {
    salary?: {
      annual_10th_percentile?: number
      annual_median?: number
      annual_median_over?: number
      annual_90th_percentile?: number
      annual_90th_percentile_over?: number
      hourly_10th_percentile?: number
      hourly_median?: number
      hourly_median_over?: number
      hourly_90th_percentile?: number
      hourly_90th_percentile_over?: number
    }
  }
}

interface ComparisonSalaryChartProps {
  careers: Career[]
}

const COLORS = ['#00d4ff', '#ff6b6b', '#4ecdc4', '#ffe66d']

export const ComparisonSalaryChart: React.FC<ComparisonSalaryChartProps> = ({ careers }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showHourly, setShowHourly] = useState(false)
  
  const formatCurrency = (amount: number, isHourly = false) => {
    if (isHourly) {
      return `$${amount.toFixed(0)}/hr`
    }
    return `$${(amount / 1000).toFixed(0)}K`
  }
  
  const getCareerTitle = (career: Career) => {
    return career.career?.title || career.title || 'Unknown Career'
  }
  
  const getSalaryData = (career: Career) => {
    const salary = career.job_outlook?.salary
    if (!salary) return null
    
    if (showHourly) {
      return {
        low: salary.hourly_10th_percentile || 0,
        median: salary.hourly_median_over || salary.hourly_median || 0,
        high: salary.hourly_90th_percentile_over || salary.hourly_90th_percentile || 0
      }
    }
    
    return {
      low: salary.annual_10th_percentile || 0,
      median: salary.annual_median_over || salary.annual_median || 0,
      high: salary.annual_90th_percentile_over || salary.annual_90th_percentile || 0
    }
  }
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const padding = 60
    const graphWidth = width - 2 * padding
    const graphHeight = height - 2 * padding
    
    // Get all salary data
    const allSalaries = careers.map(getSalaryData).filter(Boolean) as { low: number, median: number, high: number }[]
    if (allSalaries.length === 0) return
    
    // Find min and max values for scaling
    const allValues = allSalaries.flatMap(s => [s.low, s.median, s.high])
    const minValue = Math.min(...allValues) * 0.9
    const maxValue = Math.max(...allValues) * 1.1
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * graphHeight / 5)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
      
      // Y-axis labels
      const value = maxValue - (i * (maxValue - minValue) / 5)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.font = '10px SF Mono'
      ctx.textAlign = 'right'
      ctx.fillText(formatCurrency(value, showHourly), padding - 10, y + 4)
    }
    
    // Draw salary curves for each career
    careers.forEach((career, careerIndex) => {
      const salaryData = getSalaryData(career)
      if (!salaryData) return
      
      const color = COLORS[careerIndex % COLORS.length]
      
      // Calculate x positions for the three points
      const points = [
        { x: padding + graphWidth * 0.2, y: height - padding - ((salaryData.low - minValue) / (maxValue - minValue)) * graphHeight, value: salaryData.low },
        { x: padding + graphWidth * 0.5, y: height - padding - ((salaryData.median - minValue) / (maxValue - minValue)) * graphHeight, value: salaryData.median },
        { x: padding + graphWidth * 0.8, y: height - padding - ((salaryData.high - minValue) / (maxValue - minValue)) * graphHeight, value: salaryData.high }
      ]
      
      // Draw curve
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      
      // Bezier curve through points
      const cp1x = points[0].x + (points[1].x - points[0].x) * 0.5
      const cp1y = points[0].y
      const cp2x = points[1].x - (points[1].x - points[0].x) * 0.5
      const cp2y = points[1].y
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[1].x, points[1].y)
      
      const cp3x = points[1].x + (points[2].x - points[1].x) * 0.5
      const cp3y = points[1].y
      const cp4x = points[2].x - (points[2].x - points[1].x) * 0.5
      const cp4y = points[2].y
      
      ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, points[2].x, points[2].y)
      
      // Draw the curve line
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.stroke()
      
      // Draw points
      points.forEach((point, index) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = '#0a0e1a'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Only show value labels for median
        if (index === 1) {
          ctx.fillStyle = color
          ctx.font = 'bold 11px SF Mono'
          ctx.textAlign = 'center'
          ctx.fillText(formatCurrency(point.value, showHourly), point.x, point.y - 10)
        }
      })
    })
    
    // Draw x-axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '10px SF Mono'
    ctx.textAlign = 'center'
    ctx.fillText('10th', padding + graphWidth * 0.2, height - padding + 20)
    ctx.fillText('Median', padding + graphWidth * 0.5, height - padding + 20)
    ctx.fillText('90th', padding + graphWidth * 0.8, height - padding + 20)
    
  }, [careers, showHourly])
  
  return (
    <div className="comparison-salary-chart">
      <div className="chart-header">
        <h3>Salary Comparison</h3>
        <div className="chart-controls">
          <button 
            className={`toggle-button ${!showHourly ? 'active' : ''}`}
            onClick={() => setShowHourly(false)}
          >
            Annual
          </button>
          <button 
            className={`toggle-button ${showHourly ? 'active' : ''}`}
            onClick={() => setShowHourly(true)}
          >
            Hourly
          </button>
        </div>
      </div>
      
      <canvas 
        ref={canvasRef}
        className="comparison-canvas"
        width={800}
        height={400}
      />
      
      <div className="chart-legend">
        {careers.map((career, index) => (
          <div key={career.soc || career.code} className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="legend-label">{getCareerTitle(career)}</span>
            {getSalaryData(career) && (
              <span className="legend-value">
                (Median: {formatCurrency(getSalaryData(career)!.median, showHourly)})
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="salary-insights">
        <h4>Key Insights</h4>
        <ul>
          {(() => {
            const salaries = careers.map((c, i) => ({
              title: getCareerTitle(c),
              data: getSalaryData(c),
              index: i
            })).filter(s => s.data)
            
            if (salaries.length < 2) return null
            
            const highestMedian = salaries.reduce((max, s) => 
              s.data!.median > max.data!.median ? s : max
            )
            const lowestMedian = salaries.reduce((min, s) => 
              s.data!.median < min.data!.median ? s : min
            )
            
            const difference = ((highestMedian.data!.median - lowestMedian.data!.median) / lowestMedian.data!.median * 100).toFixed(0)
            
            return (
              <>
                <li>
                  <strong>{highestMedian.title}</strong> offers the highest median salary at{' '}
                  <span style={{ color: COLORS[highestMedian.index] }}>
                    {formatCurrency(highestMedian.data!.median, showHourly)}
                  </span>
                </li>
                <li>
                  That's <strong>{difference}%</strong> more than <strong>{lowestMedian.title}</strong>
                </li>
                <li>
                  All careers show strong earning potential with clear growth from entry to senior levels
                </li>
              </>
            )
          })()}
        </ul>
      </div>
    </div>
  )
}