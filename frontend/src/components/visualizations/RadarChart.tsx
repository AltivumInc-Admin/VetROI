import React, { useEffect, useRef } from 'react'
import '../../styles/RadarChart.css'

interface RadarChartProps {
  data: Array<{
    name: string
    values: number[]
  }>
  categories: string[]
}

const COLORS = ['#00d4ff', '#ff6b6b', '#4ecdc4', '#ffe66d']

export const RadarChart: React.FC<RadarChartProps> = ({ data, categories }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const size = Math.min(container.offsetWidth, 400)
    canvas.width = size * 2
    canvas.height = size * 2
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(2, 2)

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.35
    const levels = 5

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1

    // Draw concentric polygons
    for (let level = 1; level <= levels; level++) {
      ctx.beginPath()
      const levelRadius = (radius * level) / levels
      
      for (let i = 0; i < categories.length; i++) {
        const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2
        const x = centerX + Math.cos(angle) * levelRadius
        const y = centerY + Math.sin(angle) * levelRadius
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.closePath()
      ctx.stroke()
      
      // Draw level labels
      if (level === levels) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.font = '10px SF Mono'
        ctx.textAlign = 'right'
        ctx.fillText(`${level * 20}`, centerX - 5, centerY - levelRadius + 3)
      }
    }

    // Draw axes
    for (let i = 0; i < categories.length; i++) {
      const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()
      
      // Draw category labels
      const labelX = centerX + Math.cos(angle) * (radius + 20)
      const labelY = centerY + Math.sin(angle) * (radius + 20)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px SF Pro Display'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Adjust text alignment based on position
      if (Math.abs(labelX - centerX) < 10) {
        ctx.textAlign = 'center'
      } else if (labelX > centerX) {
        ctx.textAlign = 'left'
      } else {
        ctx.textAlign = 'right'
      }
      
      ctx.fillText(categories[i], labelX, labelY)
    }

    // Draw data
    data.forEach((dataset, dataIndex) => {
      const color = COLORS[dataIndex % COLORS.length]
      
      // Draw filled area
      ctx.beginPath()
      ctx.fillStyle = `${color}20`
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      
      dataset.values.forEach((value, i) => {
        const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2
        const distance = (value / 100) * radius
        const x = centerX + Math.cos(angle) * distance
        const y = centerY + Math.sin(angle) * distance
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      
      // Draw points
      dataset.values.forEach((value, i) => {
        const angle = (Math.PI * 2 * i) / categories.length - Math.PI / 2
        const distance = (value / 100) * radius
        const x = centerX + Math.cos(angle) * distance
        const y = centerY + Math.sin(angle) * distance
        
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = '#0a0e1a'
        ctx.lineWidth = 2
        ctx.stroke()
      })
    })
  }, [data, categories])

  return (
    <div className="radar-chart-container" ref={containerRef}>
      <canvas ref={canvasRef} className="radar-chart-canvas" />
      <div className="radar-chart-legend">
        {data.map((dataset, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="legend-label">{dataset.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}