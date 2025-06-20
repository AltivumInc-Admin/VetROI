export class DocumentGenerator {
  static generateHTML(insights: any, veteranProfile: any): string {
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DD214 Career Intelligence Report - ${veteranProfile?.rank || 'Veteran'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #1a1a2e;
      font-size: 2.5rem;
      margin-bottom: 10px;
      border-bottom: 3px solid #FFD700;
      padding-bottom: 10px;
    }
    
    h2 {
      color: #0066cc;
      font-size: 1.8rem;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    
    h3 {
      color: #333;
      font-size: 1.3rem;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .subtitle {
      color: #666;
      font-size: 1.1rem;
      margin-bottom: 20px;
    }
    
    .service-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #FFD700;
    }
    
    .service-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-weight: bold;
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
    }
    
    .info-value {
      color: #333;
      font-size: 1.1rem;
      margin-top: 2px;
    }
    
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .career-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid #e0e0e0;
      page-break-inside: avoid;
    }
    
    .career-title {
      font-size: 1.4rem;
      color: #0066cc;
      margin-bottom: 10px;
    }
    
    .salary-range {
      font-size: 1.2rem;
      color: #00a86b;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .company-list {
      margin: 10px 0;
    }
    
    .company-list strong {
      color: #666;
    }
    
    .strategy-list {
      list-style-type: none;
      padding-left: 0;
      margin-top: 10px;
    }
    
    .strategy-list li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
      border-bottom: 1px solid #eee;
    }
    
    .strategy-list li:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #0066cc;
      font-weight: bold;
    }
    
    .tip-box {
      background: #fff3cd;
      border: 1px solid #ffecc0;
      padding: 15px;
      border-radius: 6px;
      margin: 10px 0;
    }
    
    .tip-box:before {
      content: "💡 ";
      font-size: 1.2rem;
    }
    
    .strength-box {
      background: #e8f4f8;
      border: 1px solid #b8e0e8;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .timeline-phase {
      margin-bottom: 25px;
      padding-left: 30px;
      position: relative;
    }
    
    .timeline-phase:before {
      content: "";
      position: absolute;
      left: 10px;
      top: 25px;
      bottom: -10px;
      width: 2px;
      background: #ddd;
    }
    
    .timeline-phase:last-child:before {
      display: none;
    }
    
    .phase-header {
      font-weight: bold;
      color: #0066cc;
      font-size: 1.2rem;
      margin-bottom: 10px;
      position: relative;
    }
    
    .phase-header:before {
      content: "●";
      position: absolute;
      left: -25px;
      color: #0066cc;
      font-size: 1.5rem;
    }
    
    .action-item {
      background: #f0f8ff;
      border: 1px solid #d0e8ff;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
    }
    
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      color: #666;
      font-size: 0.9rem;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
        padding: 20px;
      }
      
      .section {
        page-break-after: auto;
      }
      
      h1, h2 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DD214 Career Intelligence Report</h1>
      <p class="subtitle">AI-Powered Analysis of Your Military Service</p>
      <p>Generated on ${generatedDate}</p>
    </div>
    
    ${this.generateServiceInfoSection(veteranProfile)}
    ${this.generateExecutiveSummarySection(insights)}
    ${this.generateCareerPathsSection(insights)}
    ${this.generateCompensationSection(insights)}
    ${this.generateStrengthsSection(insights)}
    ${this.generateTimelineSection(insights)}
    ${this.generateActionItemsSection(insights)}
    
    <div class="footer">
      <p>This report was generated by VetROI™ - Your Career Intelligence Platform</p>
      <p>© ${new Date().getFullYear()} Altivum Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
    
    return html
  }

  private static generateServiceInfoSection(profile: any): string {
    if (!profile) return ''
    
    return `
    <div class="section">
      <h2>Service Profile</h2>
      <div class="service-info">
        <div class="service-info-grid">
          <div class="info-item">
            <span class="info-label">Rank</span>
            <span class="info-value">${profile.rank || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Branch</span>
            <span class="info-value">${profile.branch || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">MOS/Rate</span>
            <span class="info-value">${profile.mos || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Years of Service</span>
            <span class="info-value">${profile.years_of_service || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Security Clearance</span>
            <span class="info-value">${profile.clearance_level || 'N/A'}</span>
          </div>
          ${profile.decorations && profile.decorations.length > 0 ? `
          <div class="info-item">
            <span class="info-label">Decorations</span>
            <span class="info-value">${profile.decorations.length} Awards</span>
          </div>
          ` : ''}
        </div>
        ${profile.decorations && profile.decorations.length > 0 ? `
        <div style="margin-top: 15px;">
          <strong>Military Decorations:</strong>
          <ul style="margin-top: 5px; padding-left: 20px;">
            ${profile.decorations.map((d: string) => `<li>${d}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    </div>
    `
  }

  private static generateExecutiveSummarySection(insights: any): string {
    const summary = insights.executive_intelligence_summary || insights.veteran_intelligence?.executive_summary
    if (!summary) return ''
    
    return `
    <div class="section">
      <h2>Executive Summary</h2>
      <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 20px;">
        ${summary.unique_value_proposition || summary.civilian_translation || ''}
      </p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
        <h3>Your Market Position</h3>
        <p style="font-size: 1.1rem; color: #0066cc; font-weight: bold; margin-bottom: 15px;">
          ${summary.market_position || 'Top-tier military talent'}
        </p>
        ${summary.immediate_leverage_points ? `
        <ul style="list-style: none; padding: 0;">
          ${summary.immediate_leverage_points.map((point: string) => 
            `<li style="padding: 8px 0; border-bottom: 1px solid #eee;">💎 ${point}</li>`
          ).join('')}
        </ul>
        ` : ''}
      </div>
    </div>
    `
  }

  private static generateCareerPathsSection(insights: any): string {
    const careers = insights.career_recommendations || []
    if (careers.length === 0) return ''
    
    return `
    <div class="section">
      <h2>Recommended Career Paths</h2>
      ${careers.map((career: any, idx: number) => `
        <div class="career-card">
          <h3 class="career-title">${idx + 1}. ${career.title}</h3>
          <p class="salary-range">Total Compensation: ${career.salary_intelligence?.total_package || 'Competitive'}</p>
          <p style="margin: 10px 0;">${career.why_perfect_fit}</p>
          
          ${career.company_targets && career.company_targets.length > 0 ? `
          <div class="company-list">
            <strong>Target Companies:</strong> ${career.company_targets.join(', ')}
          </div>
          ` : ''}
          
          ${career['90_day_strategy'] && career['90_day_strategy'].length > 0 ? `
          <div style="margin-top: 15px;">
            <strong>90-Day Strategy:</strong>
            <ul class="strategy-list">
              ${career['90_day_strategy'].map((step: string) => `<li>${step}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${career.insider_tips && career.insider_tips.length > 0 ? `
          <div style="margin-top: 15px;">
            ${career.insider_tips.map((tip: string) => 
              `<div class="tip-box">${tip}</div>`
            ).join('')}
          </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    `
  }

  private static generateCompensationSection(insights: any): string {
    const comp = insights.compensation_intelligence
    const market = insights.market_intelligence?.your_market_value
    
    if (!comp && !market) return ''
    
    return `
    <div class="section">
      <h2>Compensation Intelligence</h2>
      
      ${market ? `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3>Your Market Value</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;">Base Salary Range</td>
            <td style="text-align: right; font-weight: bold;">${market.base_range || 'N/A'}</td>
          </tr>
          <tr style="color: #0066cc;">
            <td style="padding: 8px 0;">+ Clearance Premium</td>
            <td style="text-align: right; font-weight: bold;">${market.clearance_premium || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">+ Combat Premium</td>
            <td style="text-align: right; font-weight: bold;">${market.combat_premium || 'N/A'}</td>
          </tr>
          <tr style="border-top: 2px solid #ddd; font-size: 1.2rem; color: #FFD700;">
            <td style="padding: 12px 0;"><strong>Total Market Value</strong></td>
            <td style="text-align: right;"><strong>${market.total_range || 'N/A'}</strong></td>
          </tr>
        </table>
      </div>
      ` : ''}
      
      ${comp?.negotiation_leverage ? `
      <div>
        <h3>Negotiation Leverage Points</h3>
        <ul style="list-style: none; padding: 0;">
          ${comp.negotiation_leverage.map((point: string) => 
            `<li style="padding: 10px; margin-bottom: 8px; background: #e8f4f8; border-radius: 6px;">✓ ${point}</li>`
          ).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
    `
  }

  private static generateStrengthsSection(insights: any): string {
    const strengths = insights.hidden_strengths_analysis || []
    const psychological = insights.psychological_preparation
    
    if (strengths.length === 0 && !psychological) return ''
    
    return `
    <div class="section">
      <h2>Your Hidden Strengths</h2>
      
      ${strengths.map((strength: any) => `
        <div class="strength-box">
          <h3>${strength.strength}</h3>
          <p style="margin: 10px 0; color: #666;">${strength.evidence}</p>
          <p><strong>Civilian Value:</strong> ${strength.civilian_application}</p>
          ${strength.salary_impact ? `
          <p style="margin-top: 10px; color: #00a86b; font-weight: bold;">
            💰 ${strength.salary_impact}
          </p>
          ` : ''}
        </div>
      `).join('')}
      
      ${psychological ? `
        <div style="margin-top: 30px;">
          <h3>Confidence Builders</h3>
          <ul style="list-style: none; padding: 0;">
            ${(psychological.confidence_builders || []).map((builder: string) => 
              `<li style="padding: 10px; margin-bottom: 8px; background: #fff3cd; border-radius: 6px;">
                🛡️ ${builder}
              </li>`
            ).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    `
  }

  private static generateTimelineSection(insights: any): string {
    const timeline = insights.transition_timeline
    if (!timeline) return ''
    
    return `
    <div class="section">
      <h2>Your Transition Roadmap</h2>
      
      ${timeline.next_7_days ? `
      <div class="timeline-phase">
        <h3 class="phase-header">Next 7 Days</h3>
        <ul style="list-style: none; padding: 0;">
          ${timeline.next_7_days.map((item: string) => 
            `<li style="padding: 8px 0; border-bottom: 1px solid #eee;">${item}</li>`
          ).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${timeline.next_30_days ? `
      <div class="timeline-phase">
        <h3 class="phase-header">Next 30 Days</h3>
        <ul style="list-style: none; padding: 0;">
          ${timeline.next_30_days.map((item: string) => 
            `<li style="padding: 8px 0; border-bottom: 1px solid #eee;">${item}</li>`
          ).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${timeline['60_90_days'] ? `
      <div class="timeline-phase">
        <h3 class="phase-header">60-90 Days</h3>
        <ul style="list-style: none; padding: 0;">
          ${timeline['60_90_days'].map((item: string) => 
            `<li style="padding: 8px 0; border-bottom: 1px solid #eee;">${item}</li>`
          ).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
    `
  }

  private static generateActionItemsSection(insights: any): string {
    const items = insights.action_oriented_deliverables
    if (!items) return ''
    
    return `
    <div class="section">
      <h2>Ready-to-Use Materials</h2>
      
      ${items.elevator_pitch ? `
      <div style="margin-bottom: 30px;">
        <h3>Your Elevator Pitch</h3>
        <div class="action-item">${items.elevator_pitch}</div>
      </div>
      ` : ''}
      
      ${items.linkedin_headline ? `
      <div style="margin-bottom: 30px;">
        <h3>LinkedIn Headline</h3>
        <div class="action-item">${items.linkedin_headline}</div>
      </div>
      ` : ''}
      
      ${items.resume_bullets && items.resume_bullets.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h3>Resume Power Bullets</h3>
        ${items.resume_bullets.map((bullet: string) => 
          `<div class="action-item" style="margin-bottom: 10px;">• ${bullet}</div>`
        ).join('')}
      </div>
      ` : ''}
      
      ${items.interview_stories && items.interview_stories.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h3>Interview Stories</h3>
        ${items.interview_stories.map((story: any) => `
          <div style="margin-bottom: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h4 style="color: #0066cc; margin-bottom: 10px;">${story.question}</h4>
            <div style="white-space: pre-wrap; line-height: 1.6;">${story.star_response}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
    `
  }

  static downloadHTML(insights: any, veteranProfile: any) {
    const html = this.generateHTML(insights, veteranProfile)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DD214_Career_Intelligence_Report_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  static openPrintPreview(insights: any, veteranProfile: any) {
    const html = this.generateHTML(insights, veteranProfile)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    }
  }
}