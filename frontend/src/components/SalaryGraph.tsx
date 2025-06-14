import React, { useEffect, useRef } from 'react'
import '../styles/SalaryGraph.css'

interface SalaryData {
  annual_10th_percentile: number
  annual_median: number
  annual_90th_percentile: number
  hourly_10th_percentile: number
  hourly_median: number
  hourly_90th_percentile: number
}

interface SalaryGraphProps {
  salaryData: SalaryData
}

export const SalaryGraph: React.FC<SalaryGraphProps> = ({ salaryData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showHourly, setShowHourly] = React.useState(false)

  const formatCurrency = (amount: number, isHourly = false) => {
    if (isHourly) {
      return `$${amount.toFixed(2)}/hr`
    }
    return `$${(amount / 1000).toFixed(0)}K`
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
    const padding = 40

    // Get salary values
    const values = showHourly ? [
      salaryData.hourly_10th_percentile,
      salaryData.hourly_median,
      salaryData.hourly_90th_percentile
    ] : [
      salaryData.annual_10th_percentile,
      salaryData.annual_median,
      salaryData.annual_90th_percentile
    ]

    const minValue = values[0] * 0.9
    const maxValue = values[2] * 1.1

    // Calculate positions
    const points = values.map((value, index) => {
      const x = padding + (index * (width - 2 * padding) / 2)
      const y = height - padding - ((value - minValue) / (maxValue - minValue)) * (height - 2 * padding)
      return { x, y, value }
    })

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padding + i * (height - 2 * padding) / 4
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

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

    // Create gradient
    const gradient = ctx.createLinearGradient(0, height, 0, padding)
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.1)')
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0.3)')

    // Fill area under curve
    ctx.lineTo(points[2].x, height - padding)
    ctx.lineTo(points[0].x, height - padding)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw the curve line
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[1].x, points[1].y)
    ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, points[2].x, points[2].y)
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw points and labels
    points.forEach((point, index) => {
      // Draw point
      ctx.beginPath()
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#00d4ff'
      ctx.fill()
      ctx.strokeStyle = '#001a33'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw label
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px SF Mono'
      ctx.textAlign = 'center'
      
      const label = formatCurrency(point.value, showHourly)
      ctx.fillText(label, point.x, point.y - 15)
      
      // Draw percentile label
      ctx.font = '10px SF Mono'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      const percentiles = ['10th', '50th', '90th']
      ctx.fillText(percentiles[index], point.x, height - 20)
    })

  }, [salaryData, showHourly])

  return (
    <div className="salary-graph">
      <div className="graph-controls">
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
      <canvas 
        ref={canvasRef}
        className="salary-canvas"
        width={400}
        height={250}
      />
      <div className="salary-highlight">
        <span className="label">Median Salary:</span>
        <span className="value">
          {formatCurrency(
            showHourly ? salaryData.hourly_median : salaryData.annual_median,
            showHourly
          )}
        </span>
      </div>
    </div>
  )
}