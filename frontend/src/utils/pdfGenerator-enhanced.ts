import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: {
      finalY: number
    }
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
  
  // Enhanced color scheme
  const colors = {
    primary: [0, 212, 255] as [number, number, number], // #00d4ff
    primaryDark: [0, 150, 200] as [number, number, number],
    text: [33, 37, 41] as [number, number, number], // #212529
    textLight: [108, 117, 125] as [number, number, number], // #6c757d
    accent: [255, 215, 0] as [number, number, number], // Gold
    success: [82, 196, 26] as [number, number, number], // Green
    background: [248, 249, 250] as [number, number, number], // Light gray
    white: [255, 255, 255] as [number, number, number]
  }
  
  // Helper functions
  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
      addPageHeader()
      return true
    }
    return false
  }
  
  const addPageHeader = () => {
    // Subtle header line
    pdf.setDrawColor(...colors.primary)
    pdf.setLineWidth(0.5)
    pdf.line(margin, 10, pageWidth - margin, 10)
    
    // Page number
    const pageNumber = pdf.internal.pages.length - 1
    pdf.setTextColor(...colors.textLight)
    pdf.setFontSize(9)
    pdf.text(`Page ${pageNumber}`, pageWidth - margin, 10, { align: 'right' })
    
    yPosition = Math.max(yPosition, 20)
  }
  
  const drawSectionHeader = (title: string, subtitle?: string) => {
    addNewPageIfNeeded(35)
    
    // Modern gradient-like background
    pdf.setFillColor(...colors.primary, 0.08)
    pdf.roundedRect(margin - 5, yPosition - 5, contentWidth + 10, subtitle ? 28 : 22, 3, 3, 'F')
    
    // Section accent line
    pdf.setFillColor(...colors.primary)
    pdf.rect(margin - 5, yPosition - 5, 4, subtitle ? 28 : 22, 'F')
    
    // Section title
    pdf.setTextColor(...colors.primary)
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, margin + 5, yPosition + 8)
    
    if (subtitle) {
      pdf.setTextColor(...colors.textLight)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(subtitle, margin + 5, yPosition + 16)
    }
    
    yPosition += subtitle ? 35 : 28
  }
  
  const drawHighlightBox = (content: string, color: 'primary' | 'success' | 'accent' = 'primary') => {
    const colorMap = {
      primary: colors.primary,
      success: colors.success,
      accent: colors.accent
    }
    const boxColor = colorMap[color]
    
    pdf.setFillColor(...boxColor, 0.05)
    pdf.setDrawColor(...boxColor)
    pdf.setLineWidth(1)
    
    const lines = pdf.splitTextToSize(content, contentWidth - 20)
    const boxHeight = lines.length * 5 + 15
    
    addNewPageIfNeeded(boxHeight + 10)
    
    pdf.roundedRect(margin, yPosition, contentWidth, boxHeight, 3, 3, 'FD')
    
    pdf.setTextColor(...colors.text)
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.text(lines, margin + 10, yPosition + 10)
    
    yPosition += boxHeight + 10
  }
  
  // Enhanced Title Page
  pdf.setFillColor(...colors.background)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  
  // Decorative elements
  pdf.setFillColor(...colors.primary, 0.1)
  pdf.circle(pageWidth - 30, 30, 40, 'F')
  pdf.circle(30, pageHeight - 30, 60, 'F')
  
  // Logo/Brand with shadow effect
  pdf.setTextColor(...colors.primary)
  pdf.setFontSize(42)
  pdf.setFont('helvetica', 'bold')
  
  // Shadow
  pdf.setTextColor(0, 0, 0, 0.1)
  pdf.text('VetROI™', pageWidth / 2 + 1, 51, { align: 'center' })
  
  // Main text
  pdf.setTextColor(...colors.primary)
  pdf.text('VetROI™', pageWidth / 2, 50, { align: 'center' })
  
  // Tagline
  pdf.setTextColor(...colors.textLight)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'italic')
  pdf.text('Veteran Return on Investment', pageWidth / 2, 65, { align: 'center' })
  
  // Report Title with underline
  pdf.setTextColor(...colors.text)
  pdf.setFontSize(32)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Career Intelligence Report', pageWidth / 2, 100, { align: 'center' })
  
  // Decorative line under title
  pdf.setDrawColor(...colors.primary)
  pdf.setLineWidth(2)
  pdf.line(pageWidth / 2 - 60, 108, pageWidth / 2 + 60, 108)
  
  // Veteran Name in a box
  const veteranName = insights.veteranProfile?.name || 
    `${insights.insights.extracted_profile?.rank || ''} ${insights.insights.extracted_profile?.branch || 'Veteran'}`.trim()
  
  pdf.setFillColor(...colors.white)
  pdf.setDrawColor(...colors.primary)
  pdf.setLineWidth(2)
  pdf.roundedRect(margin + 20, 125, contentWidth - 40, 30, 5, 5, 'FD')
  
  pdf.setTextColor(...colors.text)
  pdf.setFontSize(22)
  pdf.setFont('helvetica', 'bold')
  pdf.text(veteranName, pageWidth / 2, 143, { align: 'center' })
  
  // Profile highlights
  const profile = insights.insights.extracted_profile || {}
  if (profile.branch || profile.years_service) {
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...colors.textLight)
    
    const highlights = []
    if (profile.branch) highlights.push(profile.branch)
    if (profile.years_service) highlights.push(`${profile.years_service} Years of Service`)
    if (profile.security_clearance) highlights.push(profile.security_clearance)
    
    pdf.text(highlights.join(' • '), pageWidth / 2, 165, { align: 'center' })
  }
  
  // Executive Summary Preview Box
  const summaryBox = insights.insights.executive_intelligence_summary
  if (summaryBox) {
    pdf.setFillColor(...colors.primary, 0.05)
    pdf.setDrawColor(...colors.primary)
    pdf.setLineWidth(1.5)
    pdf.roundedRect(margin, 180, contentWidth, 65, 5, 5, 'FD')
    
    // Quote marks
    pdf.setTextColor(...colors.primary, 0.2)
    pdf.setFontSize(48)
    pdf.text('"', margin + 5, 195)
    
    pdf.setTextColor(...colors.text)
    pdf.setFontSize(13)
    pdf.setFont('helvetica', 'italic')
    const uniqueValue = summaryBox.your_unique_value || 'Military-trained professional ready for civilian success'
    const lines = pdf.splitTextToSize(uniqueValue, contentWidth - 30)
    pdf.text(lines.slice(0, 3), margin + 20, 195)
    
    if (summaryBox.market_position) {
      pdf.setFillColor(...colors.accent)
      pdf.setTextColor(...colors.white)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      
      const positionText = summaryBox.market_position
      const textWidth = pdf.getTextWidth(positionText) + 20
      pdf.roundedRect(pageWidth / 2 - textWidth / 2, 225, textWidth, 10, 5, 5, 'F')
      pdf.text(positionText, pageWidth / 2, 232, { align: 'center' })
    }
  }
  
  // Generated Date & Confidential Notice
  pdf.setTextColor(...colors.textLight)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Generated: ${new Date(insights.generatedAt).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, pageWidth / 2, pageHeight - 40, { align: 'center' })
  
  pdf.setFont('helvetica', 'italic')
  pdf.text('CONFIDENTIAL - Contains proprietary career intelligence', pageWidth / 2, pageHeight - 30, { align: 'center' })
  
  // Footer decoration
  pdf.setFillColor(...colors.primary)
  pdf.rect(margin, pageHeight - 15, contentWidth, 0.5, 'F')
  
  // Table of Contents Page
  pdf.addPage()
  yPosition = margin
  drawSectionHeader('Table of Contents', 'Your Complete Career Intelligence Package')
  
  const tocItems = [
    { title: 'Executive Intelligence Summary', page: 3, icon: '🎯' },
    { title: 'Career Opportunities Analysis', page: 4, icon: '💼' },
    { title: 'Compensation Intelligence', page: 6, icon: '💰' },
    { title: 'Leadership Profile & Hidden Strengths', page: 8, icon: '⭐' },
    { title: 'Action-Oriented Deliverables', page: 10, icon: '🚀' },
    { title: 'Psychological Preparation Guide', page: 12, icon: '🧠' },
    { title: '30-60-90 Day Strategic Roadmap', page: 14, icon: '📅' },
    { title: 'Legacy Intelligence Report', page: 16, icon: '📜' },
    { title: 'AI Prompt Library', page: 18, icon: '🤖' }
  ]
  
  tocItems.forEach((item, index) => {
    addNewPageIfNeeded(15)
    
    // TOC item with modern styling
    pdf.setFillColor(...colors.background)
    pdf.roundedRect(margin, yPosition - 3, contentWidth, 12, 2, 2, 'F')
    
    pdf.setTextColor(...colors.text)
    pdf.setFontSize(13)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${item.icon}  ${index + 1}. ${item.title}`, margin + 5, yPosition + 4)
    
    // Dotted line (draw multiple small lines for dotted effect)
    pdf.setDrawColor(...colors.textLight)
    const startX = margin + 120
    const endX = pageWidth - margin - 20
    for (let x = startX; x < endX; x += 3) {
      pdf.line(x, yPosition + 3, Math.min(x + 1, endX), yPosition + 3)
    }
    
    // Page number
    pdf.text(`${item.page}`, pageWidth - margin - 15, yPosition + 4, { align: 'right' })
    
    yPosition += 16
  })
  
  // Executive Intelligence Summary
  pdf.addPage()
  yPosition = margin
  drawSectionHeader('Executive Intelligence Summary', 'Your Strategic Career Position')
  
  // Key Value Proposition
  if (summaryBox?.your_unique_value) {
    drawHighlightBox(summaryBox.your_unique_value, 'primary')
  }
  
  // Immediate Leverage Points
  if (summaryBox?.immediate_leverage_points && summaryBox.immediate_leverage_points.length > 0) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(...colors.text)
    pdf.text('Immediate Leverage Points', margin, yPosition)
    yPosition += 10
    
    summaryBox.immediate_leverage_points.forEach((point: string, index: number) => {
      addNewPageIfNeeded(25)
      
      // Numbered circle
      pdf.setFillColor(...colors.primary)
      pdf.circle(margin + 5, yPosition + 3, 8, 'F')
      pdf.setTextColor(...colors.white)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${index + 1}`, margin + 5, yPosition + 6, { align: 'center' })
      
      // Point text
      pdf.setTextColor(...colors.text)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      const lines = pdf.splitTextToSize(point, contentWidth - 25)
      pdf.text(lines, margin + 20, yPosition + 3)
      yPosition += lines.length * 5 + 8
    })
  }
  
  // Hidden Multipliers
  if (summaryBox?.hidden_multipliers && summaryBox.hidden_multipliers.length > 0) {
    yPosition += 10
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(...colors.text)
    pdf.text('Hidden Value Multipliers', margin, yPosition)
    yPosition += 10
    
    summaryBox.hidden_multipliers.forEach((multiplier: string) => {
      addNewPageIfNeeded(20)
      
      pdf.setFillColor(...colors.accent, 0.1)
      pdf.setDrawColor(...colors.accent)
      pdf.setLineWidth(0.5)
      
      const lines = pdf.splitTextToSize(multiplier, contentWidth - 20)
      const boxHeight = lines.length * 5 + 10
      pdf.roundedRect(margin, yPosition, contentWidth, boxHeight, 3, 3, 'FD')
      
      // Star icon
      pdf.setTextColor(...colors.accent)
      pdf.setFontSize(14)
      pdf.text('★', margin + 5, yPosition + 8)
      
      pdf.setTextColor(...colors.text)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(lines, margin + 15, yPosition + 8)
      
      yPosition += boxHeight + 5
    })
  }
  
  // Career Opportunities Section with Enhanced Table
  pdf.addPage()
  yPosition = margin
  drawSectionHeader('Career Intelligence', 'Top Opportunities Aligned with Your Profile')
  
  const recommendations = insights.insights.career_recommendations || []
  
  if (recommendations.length > 0) {
    // Create opportunities table
    const tableData = recommendations.slice(0, 7).map((rec: any) => [
      rec.title,
      rec.salary_range,
      `${rec.match_percentage || '95'}%`,
      rec.reasoning ? rec.reasoning.substring(0, 60) + '...' : ''
    ])
    
    pdf.autoTable({
      head: [['Role', 'Salary Range', 'Match', 'Why You\'re Perfect']],
      body: tableData,
      startY: yPosition,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary,
        textColor: colors.white,
        fontSize: 12,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: colors.background
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 65 }
      }
    })
    
    yPosition = pdf.lastAutoTable.finalY + 15
  }
  
  // Top Companies Actively Hiring
  if (insights.insights.market_intelligence?.opportunities) {
    const topOpp = insights.insights.market_intelligence.opportunities[0]
    if (topOpp?.companies_hiring) {
      addNewPageIfNeeded(40)
      
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      pdf.setTextColor(...colors.text)
      pdf.text('Companies Actively Hiring Your Skillset', margin, yPosition)
      yPosition += 10
      
      const companies = topOpp.companies_hiring.slice(0, 6)
      const companyGrid = Math.ceil(companies.length / 2)
      
      companies.forEach((company: string, index: number) => {
        const x = index % 2 === 0 ? margin : pageWidth / 2
        const y = yPosition + Math.floor(index / 2) * 15
        
        pdf.setFillColor(...colors.primary, 0.1)
        pdf.roundedRect(x, y, contentWidth / 2 - 5, 12, 2, 2, 'F')
        
        pdf.setTextColor(...colors.text)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(11)
        pdf.text(`✓ ${company}`, x + 5, y + 8)
      })
      
      yPosition += companyGrid * 15 + 10
    }
  }
  
  // Resume Nuclear Bullets
  if (insights.insights.action_oriented_deliverables?.resume_nuclear_bullets) {
    pdf.addPage()
    yPosition = margin
    drawSectionHeader('Resume Nuclear Bullets', 'Copy-Paste Ready Achievement Statements')
    
    pdf.setTextColor(...colors.textLight)
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'italic')
    pdf.text('Pro Tip: Customize these bullets with specific metrics from your experience', margin, yPosition)
    yPosition += 10
    
    insights.insights.action_oriented_deliverables.resume_nuclear_bullets.forEach((bullet: string) => {
      addNewPageIfNeeded(30)
      
      // Bullet container
      pdf.setFillColor(...colors.background)
      pdf.setDrawColor(...colors.primary, 0.3)
      pdf.setLineWidth(1)
      
      const lines = pdf.splitTextToSize(bullet, contentWidth - 20)
      const boxHeight = lines.length * 5 + 10
      pdf.roundedRect(margin, yPosition, contentWidth, boxHeight, 3, 3, 'FD')
      
      // Bullet point
      pdf.setFillColor(...colors.primary)
      pdf.circle(margin + 8, yPosition + 8, 2, 'F')
      
      pdf.setTextColor(...colors.text)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(11)
      pdf.text(lines, margin + 15, yPosition + 8)
      
      yPosition += boxHeight + 8
    })
  }
  
  // 30-60-90 Day Roadmap with Visual Timeline
  if (insights.insights.actionable_30_60_90_day_roadmap) {
    pdf.addPage()
    yPosition = margin
    drawSectionHeader('Strategic 30-60-90 Day Roadmap', 'Your Transition Battle Rhythm')
    
    const roadmap = insights.insights.actionable_30_60_90_day_roadmap
    
    // Timeline visualization
    pdf.setDrawColor(...colors.primary)
    pdf.setLineWidth(3)
    pdf.line(margin + 30, yPosition + 10, pageWidth - margin - 30, yPosition + 10)
    
    // Timeline markers
    const markers = [
      { label: 'START', pos: margin + 30 },
      { label: '7 DAYS', pos: margin + 60 },
      { label: '30 DAYS', pos: pageWidth / 2 },
      { label: '60 DAYS', pos: pageWidth - margin - 60 },
      { label: '90 DAYS', pos: pageWidth - margin - 30 }
    ]
    
    markers.forEach(marker => {
      pdf.setFillColor(...colors.primary)
      pdf.circle(marker.pos, yPosition + 10, 5, 'F')
      pdf.setTextColor(...colors.primary)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.text(marker.label, marker.pos, yPosition + 25, { align: 'center' })
    })
    
    yPosition += 40
    
    // Phase boxes
    const phases = [
      {
        title: 'Immediate 7-Day Sprint',
        items: roadmap.immediate_7_day_priorities?.slice(0, 5) || [],
        color: colors.success
      },
      {
        title: '30-Day Objectives',
        items: roadmap.day_30_targets?.slice(0, 5) || [],
        color: colors.primary
      },
      {
        title: '60-Day Milestones',
        items: roadmap.day_60_milestones?.slice(0, 5) || [],
        color: colors.primaryDark
      },
      {
        title: '90-Day Victory Conditions',
        items: roadmap.day_90_victory_conditions?.slice(0, 5) || [],
        color: colors.accent
      }
    ]
    
    phases.forEach(phase => {
      if (phase.items.length > 0) {
        addNewPageIfNeeded(60)
        
        // Phase header
        pdf.setFillColor(...phase.color, 0.1)
        pdf.setDrawColor(...phase.color)
        pdf.setLineWidth(2)
        pdf.roundedRect(margin, yPosition, contentWidth, 8 + phase.items.length * 7, 3, 3, 'FD')
        
        pdf.setTextColor(...phase.color)
        pdf.setFontSize(13)
        pdf.setFont('helvetica', 'bold')
        pdf.text(phase.title, margin + 5, yPosition + 6)
        
        yPosition += 12
        
        // Phase items
        pdf.setTextColor(...colors.text)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        
        phase.items.forEach((item: any) => {
          const text = typeof item === 'string' ? item : item.action || item
          pdf.text(`□ ${text}`, margin + 10, yPosition)
          yPosition += 7
        })
        
        yPosition += 10
      }
    })
  }
  
  // Legacy Intelligence Report Summary
  if (insights.insights.legacy_intelligence_report) {
    pdf.addPage()
    yPosition = margin
    drawSectionHeader('Legacy Intelligence Report', 'Your Career Transition Manifesto')
    
    pdf.setFillColor(...colors.primary, 0.02)
    pdf.roundedRect(margin - 5, yPosition - 5, contentWidth + 10, pageHeight - yPosition - margin + 5, 5, 5, 'F')
    
    pdf.setTextColor(...colors.text)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(12)
    pdf.text('Executive Summary:', margin, yPosition + 5)
    yPosition += 15
    
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(11)
    
    const reportText = typeof insights.insights.legacy_intelligence_report === 'string' 
      ? insights.insights.legacy_intelligence_report 
      : 'Your comprehensive Legacy Intelligence Report provides...'
    
    const excerpt = reportText.substring(0, 800)
    const lines = pdf.splitTextToSize(excerpt + '...', contentWidth - 10)
    pdf.text(lines, margin + 5, yPosition)
    
    yPosition += lines.length * 5 + 15
    
    // Call to action box
    pdf.setFillColor(...colors.primary)
    pdf.setTextColor(...colors.white)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    const ctaText = 'Access your full 1,500-word Legacy Intelligence Report in the VetROI platform'
    const ctaWidth = pdf.getTextWidth(ctaText) + 20
    pdf.roundedRect(pageWidth / 2 - ctaWidth / 2, yPosition, ctaWidth, 10, 5, 5, 'F')
    pdf.text(ctaText, pageWidth / 2, yPosition + 7, { align: 'center' })
  }
  
  // AI Prompts Summary
  if (insights.insights.meta_ai_prompts) {
    pdf.addPage()
    yPosition = margin
    drawSectionHeader('AI Prompt Library', 'Personalized Prompts for Career Acceleration')
    
    pdf.setTextColor(...colors.textLight)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(11)
    pdf.text('Use these with ChatGPT, Claude, or any AI assistant for personalized career guidance', margin, yPosition)
    yPosition += 10
    
    // Sample prompts
    const samplePrompts = [
      {
        category: 'Resume Optimization',
        prompt: insights.insights.meta_ai_prompts.resume_optimizer || 
          'Help me translate my military experience into civilian terms...'
      },
      {
        category: 'Interview Preparation',
        prompt: insights.insights.meta_ai_prompts.interview_coach || 
          'Practice behavioral interview questions for a veteran transitioning...'
      },
      {
        category: 'Salary Negotiation',
        prompt: insights.insights.meta_ai_prompts.compensation_negotiator || 
          'Guide me through salary negotiation as a veteran with clearance...'
      }
    ]
    
    samplePrompts.forEach(item => {
      addNewPageIfNeeded(40)
      
      pdf.setFillColor(...colors.background)
      pdf.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, 'F')
      
      pdf.setTextColor(...colors.primary)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.text(item.category, margin + 5, yPosition + 8)
      
      pdf.setTextColor(...colors.text)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      const promptLines = pdf.splitTextToSize(
        item.prompt.substring(0, 150) + '...', 
        contentWidth - 10
      )
      pdf.text(promptLines, margin + 5, yPosition + 16)
      
      yPosition += 40
    })
  }
  
  // Final Page - Next Steps & Resources
  pdf.addPage()
  yPosition = margin
  drawSectionHeader('Your Next Mission', 'Immediate Action Items')
  
  const actionItems = [
    { icon: '📝', action: 'Update your resume with the provided nuclear bullets', deadline: 'Today' },
    { icon: '💼', action: 'Optimize your LinkedIn profile using the suggested headline', deadline: 'Tomorrow' },
    { icon: '📧', action: 'Send 5 networking emails using the provided templates', deadline: 'This Week' },
    { icon: '🎯', action: 'Apply to 3 target companies from your opportunity list', deadline: 'This Week' },
    { icon: '💪', action: 'Practice your elevator pitch 10 times', deadline: '3 Days' },
    { icon: '📚', action: 'Complete one industry certification or course', deadline: '30 Days' }
  ]
  
  actionItems.forEach(item => {
    addNewPageIfNeeded(20)
    
    pdf.setFillColor(...colors.background)
    pdf.roundedRect(margin, yPosition, contentWidth, 15, 3, 3, 'F')
    
    pdf.setTextColor(...colors.text)
    pdf.setFontSize(16)
    pdf.text(item.icon, margin + 5, yPosition + 10)
    
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.text(item.action, margin + 20, yPosition + 10)
    
    pdf.setTextColor(...colors.primary)
    pdf.setFont('helvetica', 'bold')
    pdf.text(item.deadline, pageWidth - margin - 5, yPosition + 10, { align: 'right' })
    
    yPosition += 18
  })
  
  // Success metrics
  yPosition += 10
  drawHighlightBox(
    'Track your progress: Aim for 10 applications per week, 5 networking conversations, and 3 interviews within 30 days.',
    'success'
  )
  
  // Resources section
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(...colors.text)
  pdf.text('Additional Resources', margin, yPosition)
  yPosition += 10
  
  const resources = [
    '• VetROI Platform: Access your full reports and AI tools',
    '• Weekly Office Hours: Join live Q&A sessions with career coaches',
    '• Veteran Network: Connect with successfully transitioned veterans',
    '• Industry Guides: Deep-dive resources for your target sectors'
  ]
  
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  resources.forEach(resource => {
    pdf.text(resource, margin + 5, yPosition)
    yPosition += 7
  })
  
  // Footer with professional touch
  const footerY = pageHeight - 25
  pdf.setFillColor(...colors.primary)
  pdf.rect(0, footerY - 5, pageWidth, 30, 'F')
  
  pdf.setTextColor(...colors.white)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('VetROI™ Career Intelligence', pageWidth / 2, footerY, { align: 'center' })
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('© 2025 Altivum Inc. All rights reserved.', pageWidth / 2, footerY + 6, { align: 'center' })
  
  pdf.setFont('helvetica', 'italic')
  pdf.setFontSize(9)
  pdf.text('This report contains confidential career intelligence. Distribution is limited to the named recipient.', 
    pageWidth / 2, footerY + 12, { align: 'center' })
  
  // Save the PDF with professional filename
  const sanitizedName = veteranName.replace(/[^a-zA-Z0-9]/g, '_')
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `VetROI_Career_Intelligence_${sanitizedName}_${dateStr}.pdf`
  
  pdf.save(filename)
}