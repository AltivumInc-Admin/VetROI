import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export const generatePDF = async (insights: any) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  
  let yPosition = margin
  
  // Color scheme
  const primaryColor = [0, 212, 255] // #00d4ff
  const textColor = [40, 40, 40]
  const grayColor = [100, 100, 100]
  
  // Helper functions
  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
      return true
    }
    return false
  }
  
  const drawSectionHeader = (title: string, icon?: string) => {
    addNewPageIfNeeded(30)
    
    // Draw section background
    pdf.setFillColor(...primaryColor, 0.1)
    pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 20, 'F')
    
    // Draw section title
    pdf.setTextColor(...primaryColor)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, margin, yPosition + 10)
    
    yPosition += 25
  }
  
  // Title Page
  pdf.setFillColor(...primaryColor, 0.05)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  
  // Logo/Brand
  pdf.setTextColor(...primaryColor)
  pdf.setFontSize(36)
  pdf.setFont('helvetica', 'bold')
  pdf.text('VetROI™', pageWidth / 2, 50, { align: 'center' })
  
  // Report Title
  pdf.setTextColor(...textColor)
  pdf.setFontSize(28)
  pdf.text('Career Intelligence Report', pageWidth / 2, 80, { align: 'center' })
  
  // Veteran Name
  const veteranName = insights.veteranProfile?.name || 
    `${insights.insights.extracted_profile?.rank || ''} ${insights.insights.extracted_profile?.branch || 'Veteran'}`.trim()
  
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'normal')
  pdf.text(veteranName, pageWidth / 2, 100, { align: 'center' })
  
  // Generated Date
  pdf.setTextColor(...grayColor)
  pdf.setFontSize(12)
  pdf.text(`Generated: ${new Date(insights.generatedAt).toLocaleDateString()}`, pageWidth / 2, 115, { align: 'center' })
  
  // Executive Summary Box
  const summaryBox = insights.insights.executive_intelligence_summary
  if (summaryBox) {
    pdf.setFillColor(255, 255, 255)
    pdf.setDrawColor(...primaryColor)
    pdf.setLineWidth(2)
    pdf.rect(margin, 140, contentWidth, 80, 'FD')
    
    pdf.setTextColor(...textColor)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Your Unique Value:', margin + 10, 155)
    
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    const uniqueValue = summaryBox.your_unique_value || 'Military-trained professional ready for civilian success'
    const lines = pdf.splitTextToSize(uniqueValue, contentWidth - 20)
    pdf.text(lines, margin + 10, 165)
    
    if (summaryBox.market_position) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Market Position:', margin + 10, 190)
      pdf.setFont('helvetica', 'normal')
      pdf.text(summaryBox.market_position, margin + 10, 200)
    }
  }
  
  // Start new page for content
  pdf.addPage()
  yPosition = margin
  
  // Table of Contents
  drawSectionHeader('Table of Contents')
  pdf.setTextColor(...textColor)
  pdf.setFontSize(12)
  
  const tocItems = [
    'Executive Summary',
    'Career Opportunities',
    'Compensation Intelligence',
    'Leadership Profile',
    'Action-Oriented Deliverables',
    'Psychological Preparation',
    '30-60-90 Day Roadmap',
    'Legacy Intelligence Report',
    'AI Prompt Library'
  ]
  
  tocItems.forEach((item, index) => {
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${index + 1}. ${item}`, margin + 10, yPosition)
    yPosition += 8
  })
  
  // Executive Summary Section
  pdf.addPage()
  yPosition = margin
  drawSectionHeader('Executive Summary')
  
  // Immediate Leverage Points
  if (summaryBox?.immediate_leverage_points) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.text('Immediate Leverage Points:', margin, yPosition)
    yPosition += 10
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    summaryBox.immediate_leverage_points.forEach((point: string) => {
      addNewPageIfNeeded(15)
      pdf.text(`• ${point}`, margin + 5, yPosition)
      yPosition += 8
    })
  }
  
  // Career Recommendations Section
  pdf.addPage()
  yPosition = margin
  drawSectionHeader('Career Opportunities')
  
  const recommendations = insights.insights.career_recommendations || []
  recommendations.slice(0, 5).forEach((rec: any, index: number) => {
    addNewPageIfNeeded(60)
    
    // Career box
    pdf.setFillColor(248, 249, 250)
    pdf.rect(margin, yPosition, contentWidth, 50, 'F')
    
    pdf.setTextColor(...primaryColor)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.text(rec.title, margin + 5, yPosition + 10)
    
    pdf.setTextColor(...textColor)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.text(`Salary Range: ${rec.salary_range}`, margin + 5, yPosition + 20)
    
    if (rec.reasoning) {
      const reasoning = pdf.splitTextToSize(rec.reasoning, contentWidth - 10)
      pdf.text(reasoning, margin + 5, yPosition + 30)
    }
    
    yPosition += 60
  })
  
  // Resume Bullets Section
  if (insights.insights.action_oriented_deliverables?.resume_nuclear_bullets) {
    pdf.addPage()
    yPosition = margin
    drawSectionHeader('Resume Nuclear Bullets')
    
    pdf.setTextColor(...textColor)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    
    insights.insights.action_oriented_deliverables.resume_nuclear_bullets.forEach((bullet: string) => {
      addNewPageIfNeeded(20)
      const bulletLines = pdf.splitTextToSize(`• ${bullet}`, contentWidth - 10)
      pdf.text(bulletLines, margin + 5, yPosition)
      yPosition += bulletLines.length * 5 + 5
    })
  }
  
  // 30-60-90 Day Plan
  if (insights.insights.actionable_30_60_90_day_roadmap) {
    pdf.addPage()
    yPosition = margin
    drawSectionHeader('30-60-90 Day Action Plan')
    
    const roadmap = insights.insights.actionable_30_60_90_day_roadmap
    
    // 7-Day Priorities
    if (roadmap.immediate_7_day_priorities) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(13)
      pdf.text('Immediate 7-Day Priorities:', margin, yPosition)
      yPosition += 8
      
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      roadmap.immediate_7_day_priorities.forEach((priority: any) => {
        addNewPageIfNeeded(15)
        const text = typeof priority === 'string' ? priority : priority.action
        pdf.text(`□ ${text}`, margin + 5, yPosition)
        yPosition += 8
      })
    }
    
    yPosition += 10
    
    // 30-Day Targets
    if (roadmap.day_30_targets) {
      addNewPageIfNeeded(40)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(13)
      pdf.text('30-Day Targets:', margin, yPosition)
      yPosition += 8
      
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      roadmap.day_30_targets.slice(0, 5).forEach((target: any) => {
        addNewPageIfNeeded(15)
        const text = typeof target === 'string' ? target : target.action
        pdf.text(`□ ${text}`, margin + 5, yPosition)
        yPosition += 8
      })
    }
  }
  
  // Legacy Intelligence Report (Summary)
  if (insights.insights.legacy_intelligence_report) {
    pdf.addPage()
    yPosition = margin
    drawSectionHeader('Legacy Intelligence Report Summary')
    
    pdf.setTextColor(...textColor)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(11)
    
    const reportText = typeof insights.insights.legacy_intelligence_report === 'string' 
      ? insights.insights.legacy_intelligence_report 
      : 'Your comprehensive Legacy Intelligence Report provides a detailed analysis of your career transition strategy...'
    
    const summary = reportText.substring(0, 500) + '...'
    const lines = pdf.splitTextToSize(summary, contentWidth)
    pdf.text(lines, margin, yPosition)
    
    yPosition += lines.length * 5 + 10
    
    pdf.setFont('helvetica', 'normal')
    pdf.text('(Full 1,500-word report available in the online platform)', margin, yPosition)
  }
  
  // Final Page - Contact & Next Steps
  pdf.addPage()
  yPosition = margin
  drawSectionHeader('Next Steps')
  
  pdf.setTextColor(...textColor)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(12)
  
  const nextSteps = [
    '1. Update your resume with the provided nuclear bullets',
    '2. Optimize your LinkedIn profile using the suggested headline',
    '3. Begin outreach to target companies using email templates',
    '4. Practice your elevator pitch and interview stories',
    '5. Follow the 30-60-90 day roadmap for systematic progress'
  ]
  
  nextSteps.forEach(step => {
    pdf.text(step, margin, yPosition)
    yPosition += 10
  })
  
  // Footer
  yPosition = pageHeight - 30
  pdf.setTextColor(...grayColor)
  pdf.setFontSize(10)
  pdf.text('© 2025 VetROI™ by Altivum Inc. All rights reserved.', pageWidth / 2, yPosition, { align: 'center' })
  pdf.text('This report contains confidential career intelligence. Handle accordingly.', pageWidth / 2, yPosition + 5, { align: 'center' })
  
  // Save the PDF
  const filename = `VetROI_Career_Intelligence_${veteranName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(filename)
}