import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import autoTable from 'jspdf-autotable'

// Extend jsPDF types for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: any
  }
}

interface CareerData {
  code: string
  title: string
  description?: string
  also_called?: string[]
  salary?: {
    annual_median?: string | number
    annual_10th_percentile?: string | number
    annual_90th_percentile?: string | number
    hourly_median?: string | number
    hourly_10th_percentile?: string | number
    hourly_90th_percentile?: string | number
  }
  outlook?: {
    category?: string
    description?: string
    bright_outlook_categories?: string[]
  }
  education?: Array<{ level: string; category: string; description?: string }>
  tasks?: string[]
  skills?: any[]
  knowledge?: any[]
  abilities?: any[]
  personality?: any
  technology?: any[]
  industries?: any[]
  work_context?: any
  related_occupations?: Array<{ code: string; title: string; tags?: any }>
  green_occupation?: boolean
  bright_outlook?: boolean
  location_data?: {
    userState?: string
    userStateData?: any
    relocationState?: string
    relocationStateData?: any
  }
}

interface VeteranProfile {
  branch: string
  mos: string
  mosTitle: string
  education: string
  homeState: string
  relocate: boolean
  relocateState?: string
}

export const generateCareerAnalysisPDF = async (
  selectedCareers: CareerData[],
  veteranProfile: VeteranProfile
): Promise<void> => {
  // Create new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Define colors and styles
  const textColor = '#333333'
  const primaryAccent: [number, number, number] = [0, 168, 209]  // Toned down from (0, 212, 255)
  const secondaryAccent: [number, number, number] = [0, 98, 131]  // Further desaturated 20% from (0, 122, 163)
  const row = 5  // 12-pt vertical rhythm baseline

  // Helper function for consistent section formatting
  const wrapAndBox = (
    pdf: jsPDF,
    y: number,
    title: string,
    body: string[],
    accent: [number, number, number] = secondaryAccent,
    options: { indent?: number; showBackground?: boolean } = {}
  ) => {
    const { indent = 20, showBackground = true } = options
    const headerHeight = 8
    const bodyHeight = body.length * row
    const totalHeight = headerHeight + bodyHeight + row
    
    // Check for page break
    if (y + totalHeight > 270) {
      pdf.addPage()
      y = 20
    }
    
    // Background (optional)
    if (showBackground) {
      pdf.setFillColor(248, 249, 250)
      pdf.rect(15, y, 180, totalHeight, 'F')
    }
    
    // Accent bar only
    pdf.setFillColor(...accent)
    pdf.rect(15, y, 3, headerHeight, 'F')
    
    // Title
    pdf.setTextColor(...accent)
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title.toUpperCase(), 20, y + 6)
    
    // Body
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(51, 51, 51)
    body.forEach((line, i) => {
      pdf.text(line, indent, y + headerHeight + row + i * row)
    })
    
    return y + totalHeight + row
  }

  // Add VetROI header - simple dark background
  pdf.setFillColor(13, 17, 33)
  pdf.rect(0, 0, 210, 45, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.text('VetROI™', 105, 20, { align: 'center' })
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Career Brief', 105, 32, { align: 'center' })
  
  // Add O*NET attribution
  pdf.setFontSize(10)
  pdf.setTextColor(150, 150, 150)
  pdf.text('Powered by O*NET® Data', 105, 40, { align: 'center' })

  // Add generation date
  pdf.setTextColor(200, 200, 200)
  pdf.setFontSize(9)
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  pdf.text(`Generated: ${date}`, 105, 48, { align: 'center' })

  // Veteran Profile Section with background
  let yPosition = 60
  
  // Light section background
  pdf.setFillColor(252, 252, 252)
  pdf.rect(15, yPosition - row, 180, 50, 'F')
  
  // Section header with icon
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Veteran Profile', 20, yPosition)
  
  // Divider line
  pdf.setDrawColor(...primaryAccent)
  pdf.setLineWidth(0.5)
  pdf.line(20, yPosition + 3, 60, yPosition + 3)
  
  yPosition += 12
  pdf.setFontSize(11)
  pdf.setTextColor(textColor)
  pdf.setFont('helvetica', 'normal')
  
  const profileData = [
    ['Branch', veteranProfile.branch],
    ['MOS/AFSC', `${veteranProfile.mos} - ${veteranProfile.mosTitle}`],
    ['Education', veteranProfile.education],
    ['Current Location', veteranProfile.homeState],
    ['Open to Relocation', veteranProfile.relocate ? `Yes - ${veteranProfile.relocateState || 'Any State'}` : 'No']
  ]

  profileData.forEach(([label, value], index) => {
    // Alternating row backgrounds with rounded effect
    if (index % 2 === 1) {
      pdf.setFillColor(255, 255, 255)
      pdf.rect(20, yPosition - 4, 170, 6, 'F')
      // Subtle divider
      pdf.setDrawColor(245, 245, 245)
      pdf.setLineWidth(0.1)
      pdf.line(20, yPosition + 2, 190, yPosition + 2)
    }
    
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 100)
    pdf.text(`${label}:`, 25, yPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(textColor)
    pdf.text(value, 70, yPosition)
    yPosition += 7
  })

  // Summary Page
  yPosition += 20
  
  // Summary background
  pdf.setFillColor(248, 249, 250)
  pdf.rect(15, yPosition - 8, 180, 80, 'F')
  
  pdf.setTextColor(0, 0, 0)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Career Analysis Summary', 20, yPosition)
  
  // Divider line
  pdf.setDrawColor(...primaryAccent)
  pdf.setLineWidth(0.5)
  pdf.line(20, yPosition + 3, 80, yPosition + 3)
  
  yPosition += 12
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  pdf.text(`This report analyzes ${selectedCareers.length} career path${selectedCareers.length > 1 ? 's' : ''} based on your military experience.`, 20, yPosition)
  
  yPosition += 15
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Careers Analyzed:', 20, yPosition)
  yPosition += 7
  
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  selectedCareers.forEach((career, idx) => {
    // Career item - calculate dynamic height
    const titleLines = pdf.splitTextToSize(career.title, 155)
    const badgeHeight = career.bright_outlook || career.green_occupation ? row * 2 : 0
    const itemHeight = titleLines.length * row + badgeHeight + row
    
    // Light background only
    pdf.setFillColor(250, 250, 250)
    pdf.rect(25, yPosition - row, 165, itemHeight, 'F')
    
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    const bullet = `${idx + 1}. ${career.title}`
    pdf.text(bullet, 30, yPosition)
    
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.setFontSize(9)
    pdf.text(`SOC: ${career.code}`, 180, yPosition, { align: 'right' })
    
    // Handle multi-line titles
    if (titleLines.length > 1) {
      titleLines.slice(1).forEach((line: string) => {
        yPosition += row
        pdf.text(line, 30, yPosition)
      })
    }
    yPosition += row
    
    // Add badges inline
    if (career.bright_outlook || career.green_occupation) {
      let badgeText = ''
      if (career.bright_outlook) badgeText += 'Bright Outlook  '
      if (career.green_occupation) badgeText += 'Green Career'
      
      pdf.setFontSize(8)
      pdf.setTextColor(...secondaryAccent)
      pdf.text(badgeText, 35, yPosition)
      pdf.setTextColor(textColor)
      pdf.setFontSize(10)
      yPosition += row
    }
    yPosition += row
  })

  // Add page break before key/legend
  pdf.addPage()
  
  // Add Key/Legend page
  yPosition = 20
  
  // Key page header
  pdf.setFillColor(primaryAccent[0], primaryAccent[1], primaryAccent[2])
  pdf.rect(0, 0, 210, 40, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Understanding Your Career Brief', 105, 25, { align: 'center' })
  
  yPosition = 50
  
  // O*NET Attribution Box
  pdf.setFillColor(248, 249, 250)
  pdf.rect(15, yPosition - 5, 180, 25, 'F')
  pdf.setTextColor(80, 80, 80)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('All occupational data in this report is provided by O*NET®, the primary source of occupational', 20, yPosition)
  pdf.text('information sponsored by the U.S. Department of Labor, Employment and Training Administration.', 20, yPosition + 5)
  pdf.text('O*NET® is a trademark of the U.S. Department of Labor, Employment and Training Administration.', 20, yPosition + 10)
  
  yPosition += 30
  
  // Bright Outlook Section
  pdf.setFillColor(...secondaryAccent)
  pdf.rect(15, yPosition - 4, 3, 8, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...secondaryAccent)
  pdf.setFontSize(12)
  pdf.text('BRIGHT OUTLOOK OCCUPATIONS', 20, yPosition)
  yPosition += 8
  
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(textColor)
  pdf.setFontSize(10)
  const brightText = pdf.splitTextToSize('Bright Outlook occupations are expected to grow rapidly in the next several years, will have large numbers of job openings, or are new and emerging occupations. These occupations meet at least one of the following criteria:', 170)
  brightText.forEach((line: string) => {
    pdf.text(line, 20, yPosition)
    yPosition += 5
  })
  
  yPosition += 3
  pdf.setFont('helvetica', 'normal')
  pdf.text('• Projected to grow much faster than average (employment increase of 10% or more) over 2022-2032', 25, yPosition)
  yPosition += 5
  pdf.text('• Projected to have 100,000 or more job openings over 2022-2032', 25, yPosition)
  yPosition += 5
  pdf.text('• New & Emerging occupation in a high-growth industry', 25, yPosition)
  
  yPosition += 10
  
  // Job Zone Section
  pdf.setFillColor(...secondaryAccent)
  pdf.rect(15, yPosition - 4, 3, 8, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...secondaryAccent)
  pdf.setFontSize(12)
  pdf.text('JOB ZONES', 20, yPosition)
  yPosition += 8
  
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(textColor)
  pdf.setFontSize(10)
  pdf.text('Job Zones group occupations into five categories based on levels of education, experience, and training:', 20, yPosition)
  yPosition += 8
  
  const jobZones = [
    { zone: 1, desc: 'Little or no preparation needed. May require some on-the-job training.' },
    { zone: 2, desc: 'Some preparation needed. Usually requires high school diploma and some training.' },
    { zone: 3, desc: 'Medium preparation needed. Most require training in vocational schools or apprenticeships.' },
    { zone: 4, desc: 'Considerable preparation needed. Most require a four-year bachelor\'s degree.' },
    { zone: 5, desc: 'Extensive preparation needed. Most require graduate school or professional degree.' }
  ]
  
  jobZones.forEach(jz => {
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Job Zone ${jz.zone}: `, 25, yPosition)
    pdf.setFont('helvetica', 'normal')
    const desc = pdf.splitTextToSize(jz.desc, 145)
    pdf.text(desc[0], 50, yPosition)
    if (desc.length > 1) {
      yPosition += 5
      pdf.text(desc[1], 50, yPosition)
    }
    yPosition += 6
  })
  
  yPosition += 5
  
  // Green Careers Section
  pdf.setFillColor(...secondaryAccent)
  pdf.rect(15, yPosition - 4, 3, 8, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...secondaryAccent)
  pdf.setFontSize(12)
  pdf.text('GREEN CAREERS', 20, yPosition)
  yPosition += 8
  
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(textColor)
  pdf.setFontSize(10)
  const greenText = pdf.splitTextToSize('Green occupations will likely see new employment opportunities as the economy becomes more sustainable and environmentally friendly. These careers involve technologies and activities that help conserve natural resources, reduce pollution, or develop alternative energy.', 170)
  greenText.forEach((line: string) => {
    pdf.text(line, 20, yPosition)
    yPosition += 5
  })
  
  yPosition += 8
  
  // Location Quotient Section
  pdf.setFillColor(...secondaryAccent)
  pdf.rect(15, yPosition - 4, 3, 8, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...secondaryAccent)
  pdf.setFontSize(12)
  pdf.text('LOCATION QUOTIENT', 20, yPosition)
  yPosition += 8
  
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(textColor)
  pdf.setFontSize(10)
  const lqText = pdf.splitTextToSize('Location Quotient (LQ) measures job concentration in your state compared to the national average. An LQ of 1.0 means average demand, while higher values indicate more opportunities:', 170)
  lqText.forEach((line: string) => {
    pdf.text(line, 20, yPosition)
    yPosition += 5
  })
  
  yPosition += 3
  pdf.text('• LQ > 1.5: Excellent (50%+ above national average)', 25, yPosition)
  yPosition += 5
  pdf.text('• LQ 1.2-1.5: Very Good (20-50% above average)', 25, yPosition)
  yPosition += 5
  pdf.text('• LQ 0.8-1.2: Average concentration', 25, yPosition)
  yPosition += 5
  pdf.text('• LQ < 0.8: Below average concentration', 25, yPosition)
  
  yPosition += 10
  
  // Salary Percentiles Section
  pdf.setFillColor(...secondaryAccent)
  pdf.rect(15, yPosition - 4, 3, 8, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...secondaryAccent)
  pdf.setFontSize(12)
  pdf.text('SALARY PERCENTILES', 20, yPosition)
  yPosition += 8
  
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(textColor)
  pdf.setFontSize(10)
  pdf.text('Salary data shows three key percentiles:', 20, yPosition)
  yPosition += 8
  
  pdf.text('• 10th Percentile: Entry level - 90% of workers earn more than this amount', 25, yPosition)
  yPosition += 5
  pdf.text('• 50th Percentile (Median): Half of workers earn more, half earn less', 25, yPosition)
  yPosition += 5
  pdf.text('• 90th Percentile: Top earners - only 10% of workers earn more', 25, yPosition)
  
  // Add page break before career details
  pdf.addPage()

  // Career Details
  selectedCareers.forEach((career, index) => {
    if (index > 0) {
      pdf.addPage()
    }

    yPosition = 20

    // Career Header - simple clean design
    pdf.setFillColor(240, 240, 240)
    pdf.rect(10, yPosition - 5, 190, 18, 'F')
    
    // Add small accent bar on left
    pdf.setFillColor(...secondaryAccent)
    pdf.rect(10, yPosition - 5, 3, 18, 'F')
    
    pdf.setTextColor(33, 33, 33)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(career.title, 20, yPosition + 5)
    
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text(`SOC: ${career.code}`, 185, yPosition + 5, { align: 'right' })
    
    yPosition += 25

    // Also Called Section
    if (career.also_called && career.also_called.length > 0) {
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.setFont('helvetica', 'italic')
      const alsoCalledText = `Also Known As: ${career.also_called.slice(0, 3).join(' • ')}`
      const alsoCalledLines = pdf.splitTextToSize(alsoCalledText, 175)
      alsoCalledLines.forEach((line: string) => {
        pdf.text(line, 15, yPosition)
        yPosition += 4
      })
      yPosition += 3
    }

    // Badges with enhanced styling
    if (career.bright_outlook || career.green_occupation) {
      let badgeX = 15
      
      if (career.bright_outlook) {
        // Bright outlook badge
        pdf.setFillColor(255, 215, 0)
        pdf.rect(badgeX, yPosition - 4, 52, 10, 'F')
        
        // Text
        pdf.setTextColor(80, 80, 80)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Bright Outlook', badgeX + 3, yPosition + 1)
        badgeX += 57
      }
      
      if (career.green_occupation) {
        // Green career badge
        pdf.setFillColor(34, 197, 94)
        pdf.rect(badgeX, yPosition - 4, 45, 10, 'F')
        
        // Text
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Green Career', badgeX + 3, yPosition + 1)
      }
      
      pdf.setFont('helvetica', 'normal')
      yPosition += 15
    }

    // Description
    if (career.description) {
      yPosition += 5
      const lines = pdf.splitTextToSize(career.description, 175)
      yPosition = wrapAndBox(pdf, yPosition, 'Overview', lines, secondaryAccent)
    }

    // Salary Information
    if (career.salary) {
      yPosition += 10
      // Section header - no background
      pdf.setFillColor(...secondaryAccent)
      pdf.rect(15, yPosition, 3, 8, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...secondaryAccent)
      pdf.text('SALARY INFORMATION', 20, yPosition + 6)
      pdf.setTextColor(textColor)
      yPosition += 2 * row
      
      pdf.setFont('helvetica', 'normal')
      const formatSalary = (val: string | number) => {
        if (typeof val === 'number') return `$${val.toLocaleString()}`
        return val
      }
      
      // Salary visualization box - calculate dynamic height
      const salaryBoxHeight = career.salary.annual_10th_percentile && career.salary.annual_90th_percentile ? 25 : 20
      
      // Simple light green background
      pdf.setFillColor(245, 255, 245)
      pdf.rect(20, yPosition - 3, 170, salaryBoxHeight, 'F')
      
      // Median salary prominent
      if (career.salary.annual_median) {
        // Simple dollar sign
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(16)
        pdf.setTextColor(100, 150, 100)
        pdf.text('$', 30, yPosition + 8)
        
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(14)
        pdf.setTextColor(0, 100, 0)
        pdf.text(formatSalary(career.salary.annual_median), 105, yPosition + 5, { align: 'center' })
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 100, 100)
        pdf.text('Median Annual Salary', 105, yPosition + 10, { align: 'center' })
        yPosition += 15
      }
      
      // Salary range
      if (career.salary.annual_10th_percentile && career.salary.annual_90th_percentile) {
        pdf.setFontSize(9)
        pdf.setTextColor(80, 80, 80)
        pdf.text(`Range: ${formatSalary(career.salary.annual_10th_percentile)} - ${formatSalary(career.salary.annual_90th_percentile)}`, 105, yPosition, { align: 'center' })
        yPosition += 5
      }
      
      yPosition += 5
    }

    // Growth Outlook
    if (career.outlook) {
      yPosition += 10
      const outlookContent: string[] = []
      
      if (career.outlook.category) {
        outlookContent.push(career.outlook.category)
      }
      if (career.outlook.description) {
        outlookContent.push(...pdf.splitTextToSize(career.outlook.description, 170))
      }
      if (career.outlook.bright_outlook_categories && career.outlook.bright_outlook_categories.length > 0) {
        outlookContent.push('')  // blank line
        outlookContent.push(`Categories: ${career.outlook.bright_outlook_categories.join(', ')}`)
      }
      
      yPosition = wrapAndBox(pdf, yPosition, 'Growth Outlook', outlookContent, secondaryAccent)
    }

    // Education Requirements
    if (career.education && career.education.length > 0) {
      yPosition += 10
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }
      
      // Section header - no background
      pdf.setFillColor(...secondaryAccent)
      pdf.rect(15, yPosition, 3, 8, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...secondaryAccent)
      pdf.text('EDUCATION REQUIREMENTS', 20, yPosition + 6)
      yPosition += 2 * row
      
      // Use autoTable for education data
      autoTable(pdf, {
        startY: yPosition,
        head: [['Level', 'Category', 'Description']],
        body: career.education.map(e => [
          e.level,
          e.category || '',
          e.description || ''
        ]),
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 2,
          overflow: 'linebreak',
          lineWidth: 0
        },
        headStyles: {
          fillColor: secondaryAccent,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 15, right: 15 }
      })
      yPosition = pdf.lastAutoTable.finalY + 10
    }

    // Key Tasks
    if (career.tasks && career.tasks.length > 0) {
      yPosition += 2 * row
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }
      
      // Section header
      pdf.setFillColor(...secondaryAccent)
      pdf.rect(15, yPosition, 3, 8, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...secondaryAccent)
      pdf.text('DAILY TASKS', 20, yPosition + 6)
      yPosition += 2 * row
      
      // Use autoTable for tasks
      autoTable(pdf, {
        startY: yPosition,
        head: [],
        body: career.tasks.slice(0, 5).map(task => [task]),
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: { top: 1, right: 2, bottom: 1, left: 10 },
          overflow: 'linebreak',
          lineWidth: 0
        },
        columnStyles: {
          0: { cellWidth: 180 }
        },
        didDrawCell: (data: any) => {
          if (data.column.index === 0 && data.cell.section === 'body') {
            pdf.text('•', 15, data.cell.y + data.cell.height / 2 + 1)
          }
        },
        margin: { left: 15, right: 15 }
      })
      yPosition = pdf.lastAutoTable.finalY + row
    }

    // Location Analysis
    if (career.location_data) {
      yPosition += 10
      const locationContent: string[] = []
      
      if (career.location_data.userStateData) {
        const lq = career.location_data.userStateData.location_quotient
        locationContent.push(`${career.location_data.userStateData.name} (${career.location_data.userState}):`)
        locationContent.push(`  Location Quotient: ${lq ? lq.toFixed(2) : 'N/A'}`)
        if (lq) {
          const interpretation = lq > 1.2 ? 'High concentration of jobs' : 
                                lq > 0.8 ? 'Average job concentration' : 
                                'Lower job concentration'
          locationContent.push(`  ${interpretation}`)
        }
      }
      
      if (career.location_data.relocationStateData) {
        if (locationContent.length > 0) locationContent.push('')  // blank line
        const lq = career.location_data.relocationStateData.location_quotient
        locationContent.push(`${career.location_data.relocationStateData.name} (${career.location_data.relocationState}):`)
        locationContent.push(`  Location Quotient: ${lq ? lq.toFixed(2) : 'N/A'}`)
      }
      
      yPosition = wrapAndBox(pdf, yPosition, 'Job Market Analysis', locationContent, secondaryAccent)
    }

    // Skills Section
    if (career.skills && career.skills.length > 0) {
      yPosition += 2 * row
      if (yPosition > 240) {
        pdf.addPage()
        yPosition = 20
      }
      
      // Section header
      pdf.setFillColor(...secondaryAccent)
      pdf.rect(15, yPosition, 3, 8, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...secondaryAccent)
      pdf.text('ESSENTIAL SKILLS', 20, yPosition + 6)
      yPosition += 2 * row
      
      // Use autoTable for skills
      const skillsData = career.skills.map((group: any) => [
        group.title?.name || 'Skills',
        group.element?.map((el: any) => el.name).join(' • ') || ''
      ])
      
      autoTable(pdf, {
        startY: yPosition,
        head: [['Category', 'Skills']],
        body: skillsData,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 2,
          overflow: 'linebreak',
          lineWidth: 0
        },
        headStyles: {
          fillColor: [248, 249, 250],
          textColor: [80, 80, 80],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 140 }
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        },
        margin: { left: 15, right: 15 }
      })
      yPosition = pdf.lastAutoTable.finalY + row
    }

    // Knowledge Areas
    if (career.knowledge && career.knowledge.length > 0) {
      yPosition += 2 * row
      if (yPosition > 240) {
        pdf.addPage()
        yPosition = 20
      }
      
      // Section header
      pdf.setFillColor(...secondaryAccent)
      pdf.rect(15, yPosition, 3, 8, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...secondaryAccent)
      pdf.text('KNOWLEDGE AREAS', 20, yPosition + 6)
      yPosition += 2 * row
      
      // Use autoTable for knowledge
      const knowledgeData = career.knowledge.map((group: any) => [
        group.title?.name || 'Knowledge',
        group.element?.map((el: any) => el.name).join(' • ') || ''
      ])
      
      autoTable(pdf, {
        startY: yPosition,
        head: [['Category', 'Knowledge Areas']],
        body: knowledgeData,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 2,
          overflow: 'linebreak',
          lineWidth: 0
        },
        headStyles: {
          fillColor: [248, 249, 250],
          textColor: [80, 80, 80],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' },
          1: { cellWidth: 140 }
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        },
        margin: { left: 15, right: 15 }
      })
      yPosition = pdf.lastAutoTable.finalY + row
    }

    // Industries
    if (career.industries && career.industries.length > 0) {
      yPosition += 2 * row
      if (yPosition > 240) {
        pdf.addPage()
        yPosition = 20
      }
      
      // Section header only
      pdf.setFillColor(...secondaryAccent)
      pdf.rect(15, yPosition, 3, 8, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...secondaryAccent)
      pdf.text('WHERE THEY WORK', 20, yPosition + 6)
      yPosition += 2 * row
      
      // Use autoTable for industries
      const industriesData = career.industries.slice(0, 5).map((industry: any) => [
        industry.title,
        industry.percent_employed + '%'
      ])
      
      autoTable(pdf, {
        startY: yPosition,
        head: [],
        body: industriesData,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: { top: 2, right: 2, bottom: 2, left: 5 },
          overflow: 'linebreak',
          lineWidth: 0
        },
        columnStyles: {
          0: { cellWidth: 140 },
          1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
        },
        didDrawCell: (data: any) => {
          if (data.column.index === 0 && data.cell.section === 'body') {
            const percent = parseFloat(data.row.raw[1])
            const barWidth = (percent / 100) * 120
            pdf.setFillColor(...primaryAccent, 0.15)
            pdf.rect(data.cell.x, data.cell.y + data.cell.height - 2, barWidth, 2, 'F')
          }
        },
        margin: { left: 15, right: 15 }
      })
      yPosition = pdf.lastAutoTable.finalY + row
    }

    // Technology & Tools
    if (career.technology && career.technology.length > 0) {
      yPosition += 10
      if (yPosition > 240) {
        pdf.addPage()
        yPosition = 20
      }
      
      // Section header
      pdf.setFillColor(248, 249, 250)
      pdf.rect(15, yPosition - 4, 180, 8, 'F')
      pdf.setFillColor(...secondaryAccent)
      pdf.rect(15, yPosition - 4, 3, 8, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...secondaryAccent)
      pdf.text('TECHNOLOGY & TOOLS', 20, yPosition)
      pdf.setTextColor(textColor)
      yPosition += 8
      
      // Convert technology to table format
      const techData: any[] = []
      career.technology.slice(0, 3).forEach((category: any) => {
        const techNames = category.example?.slice(0, 8).map((ex: any) => 
          ex.hot_technology ? `${ex.name} *` : ex.name
        ).join(', ') || ''
        techData.push([category.title?.name || 'Technology', techNames])
      })
      
      autoTable(pdf, {
        startY: yPosition,
        head: [],
        body: techData,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 2,
          overflow: 'linebreak',
          lineWidth: 0
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold', textColor: [80, 80, 80] },
          1: { cellWidth: 140 }
        },
        margin: { left: 15, right: 15 }
      })
      yPosition = pdf.lastAutoTable.finalY + row
    }

    // Related Careers
    if (career.related_occupations && career.related_occupations.length > 0) {
      yPosition += 2 * row
      if (yPosition > 240) {
        pdf.addPage()
        yPosition = 20
      }
      
      // Section header - no background
      pdf.setFillColor(...secondaryAccent)
      pdf.rect(15, yPosition, 3, 8, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...secondaryAccent)
      pdf.text('RELATED CAREER PATHS', 20, yPosition + 6)
      yPosition += 2 * row
      
      // Use autoTable for related careers
      const relatedData = career.related_occupations.slice(0, 5).map((related: any) => [
        related.title,
        related.code,
        related.tags?.bright_outlook ? 'Bright Outlook' : ''
      ])
      
      autoTable(pdf, {
        startY: yPosition,
        head: [],
        body: relatedData,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 10,
          cellPadding: 1,
          overflow: 'linebreak',
          lineWidth: 0
        },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 40, textColor: [100, 100, 100] },
          2: { cellWidth: 20, halign: 'center', textColor: [255, 193, 7] }
        },
        margin: { left: 15, right: 15 }
      })
      yPosition = pdf.lastAutoTable.finalY + row
    }
  })

  // Add O*NET attribution on last page
  pdf.addPage()
  yPosition = 40
  
  // Attribution box
  // Main box
  pdf.setFillColor(248, 249, 250)
  pdf.rect(15, yPosition - 10, 180, 40, 'F')
  
  // Top accent
  pdf.setFillColor(...primaryAccent, 0.1)
  pdf.rect(15, yPosition - 10, 180, 5, 'F')
  
  pdf.setFontSize(12)
  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Data Attribution', 20, yPosition)
  
  yPosition += 10
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  const attributionText = 'This report incorporates information from O*NET Web Services by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). O*NET® is a trademark of USDOL/ETA.'
  const attributionLines = pdf.splitTextToSize(attributionText, 170)
  attributionLines.forEach((line: string) => {
    pdf.text(line, 20, yPosition)
    yPosition += 5
  })

  // Add footer to all pages
  const pageCount = (pdf as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    
    // Footer gradient line - raised 2mm
    for (let j = 0; j < 3; j++) {
      pdf.setDrawColor(200 - j * 30, 200 - j * 30, 200 - j * 30)
      pdf.setLineWidth(0.1)
      pdf.line(20, 283 - j * 0.3, 190, 283 - j * 0.3)
    }
    
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(`Page ${i} of ${pageCount}`, 105, 288, { align: 'center' })
    pdf.text('© 2025 Altivum Inc. | VetROI™', 20, 288)
    pdf.text('Data provided by O*NET', 190, 288, { align: 'right' })
  }

  // Save the PDF
  const fileName = `VetROI_Career_Brief_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}

// Alternative method using HTML-to-PDF conversion for complex layouts
export const generateCareerAnalysisPDFFromHTML = async (
  elementId: string,
  fileName?: string
): Promise<void> => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('Element not found:', elementId)
    return
  }

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    // Create PDF with captured image
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    // Add image to PDF, handling multiple pages if needed
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Save the PDF
    const outputFileName = fileName || `VetROI_Career_Analysis_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(outputFileName)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}