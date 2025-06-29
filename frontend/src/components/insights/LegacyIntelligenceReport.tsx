import React, { useState } from 'react'
import '../../styles/insights/LegacyIntelligenceReport-refined.css'
import '../../styles/insights/dd214-unified-design.css'

interface LegacyIntelligenceReportProps {
  data: any
}

export const LegacyIntelligenceReport: React.FC<LegacyIntelligenceReportProps> = ({ data }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('intro')
  const legacyReport = data.insights?.legacy_intelligence_report || {}
  
  // Parse the legacy report if it's a string
  const reportContent = typeof legacyReport === 'string' 
    ? parseLegacyReport(legacyReport)
    : legacyReport
    
  function parseLegacyReport(report: string) {
    // This function would parse the 1500-word report into sections
    // For now, we'll create a structured format
    const sections = report.split('\n\n').filter(s => s.trim())
    
    return {
      introduction: sections[0] || 'Your military service has prepared you for extraordinary civilian success...',
      your_story: sections[1] || 'Your unique journey from military service to civilian leadership...',
      market_position: sections[2] || 'Your position in the civilian marketplace is exceptional...',
      hidden_advantages: sections[3] || 'The advantages you possess that others cannot replicate...',
      strategic_approach: sections[4] || 'Your strategic approach to career transition...',
      future_vision: sections[5] || 'Your vision for the next chapter of your professional life...',
      call_to_action: sections[6] || 'The time to act is now. Your military service has prepared you...'
    }
  }
  
  const sections = [
    { 
      id: 'intro', 
      title: 'Executive Overview', 
      icon: '📋',
      content: reportContent.introduction || 'Your military service represents a unique competitive advantage in the civilian marketplace. This report synthesizes your career intelligence into actionable insights that will guide your transition strategy.'
    },
    { 
      id: 'story', 
      title: 'Your Transformation Story', 
      icon: '🎖️',
      content: reportContent.your_story || 'From the discipline of military service to the dynamism of civilian leadership, your journey represents a powerful narrative of adaptation, resilience, and strategic thinking. Your experiences in high-pressure environments have forged capabilities that civilian organizations desperately need.'
    },
    { 
      id: 'market', 
      title: 'Market Positioning Strategy', 
      icon: '🎯',
      content: reportContent.market_position || 'Your military background positions you in the top tier of candidates for leadership roles. Organizations seeking proven leaders who can navigate uncertainty, drive results under pressure, and build high-performing teams will find your profile compelling.'
    },
    { 
      id: 'advantages', 
      title: 'Unfair Competitive Advantages', 
      icon: '💎',
      content: reportContent.hidden_advantages || 'Your military service has equipped you with advantages that cannot be taught in business schools or acquired through traditional career paths. These include stress inoculation, systems thinking, rapid decision-making under uncertainty, and the ability to lead diverse teams in challenging environments.'
    },
    { 
      id: 'strategy', 
      title: 'Strategic Career Approach', 
      icon: '🚀',
      content: reportContent.strategic_approach || 'Your transition strategy should leverage your unique strengths while addressing potential gaps in civilian business acumen. Focus on roles that value leadership, operational excellence, and the ability to drive change in complex organizations.'
    },
    { 
      id: 'vision', 
      title: 'Your 10-Year Vision', 
      icon: '🔮',
      content: reportContent.future_vision || 'In ten years, you will be recognized as a transformational leader who successfully bridged military excellence with civilian innovation. Your unique perspective will drive organizational success while mentoring the next generation of veteran leaders.'
    },
    { 
      id: 'action', 
      title: 'Call to Action', 
      icon: '⚡',
      content: reportContent.call_to_action || 'The civilian sector needs leaders like you—those who understand mission accomplishment, team cohesion, and strategic execution. Your time is now. Take bold action, leverage your advantages, and claim your position in the civilian leadership landscape.'
    }
  ]
  
  return (
    <div className="legacy-intelligence-report">
      <div className="report-header">
        <h1>Legacy Intelligence Report</h1>
        <p className="report-subtitle">Your Comprehensive Career Transition Intelligence</p>
        <div className="report-meta">
          <span className="word-count">~1,500 words</span>
          <span className="read-time">6 min read</span>
          <button className="print-button" onClick={() => window.print()}>
            Print Report 🖨️
          </button>
        </div>
      </div>
      
      {/* Magazine-style layout */}
      <div className="report-content">
        {/* Featured Quote */}
        <div className="featured-quote">
          <blockquote>
            "Your military service is not just experience—it's a competitive advantage that 
            positions you for extraordinary success in the civilian sector."
          </blockquote>
        </div>
        
        {/* Report Sections */}
        <div className="report-sections">
          {sections.map((section) => (
            <div 
              key={section.id} 
              className={`report-section ${expandedSection === section.id ? 'expanded' : ''}`}
            >
              <div 
                className="section-header"
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              >
                <div className="section-title">
                  <span className="section-icon">{section.icon}</span>
                  <h2>{section.title}</h2>
                </div>
                <span className="expand-icon">{expandedSection === section.id ? '−' : '+'}</span>
              </div>
              
              <div className="section-content">
                <div className="content-wrapper">
                  <p className="section-text">{section.content}</p>
                  
                  {/* Add specific insights based on section */}
                  {section.id === 'advantages' && (
                    <div className="advantages-list">
                      <h3>Your Specific Advantages:</h3>
                      <ul>
                        <li>Security clearance valued at $15,000-$50,000 annually</li>
                        <li>Proven leadership of teams in high-stakes environments</li>
                        <li>Advanced problem-solving skills forged in combat</li>
                        <li>Unparalleled work ethic and mission focus</li>
                        <li>Global perspective and cultural adaptability</li>
                      </ul>
                    </div>
                  )}
                  
                  {section.id === 'strategy' && (
                    <div className="strategy-framework">
                      <h3>Your 4-Pillar Strategy:</h3>
                      <div className="pillars">
                        <div className="pillar">
                          <h4>1. Position</h4>
                          <p>Target roles that value military leadership</p>
                        </div>
                        <div className="pillar">
                          <h4>2. Package</h4>
                          <p>Translate military achievements to business impact</p>
                        </div>
                        <div className="pillar">
                          <h4>3. Perform</h4>
                          <p>Demonstrate value in first 90 days</p>
                        </div>
                        <div className="pillar">
                          <h4>4. Progress</h4>
                          <p>Build on early wins for rapid advancement</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Key Takeaways Sidebar */}
        <aside className="key-takeaways">
          <h3>Key Takeaways</h3>
          <div className="takeaway-list">
            <div className="takeaway-item">
              <span className="takeaway-number">1</span>
              <p>Your military experience is a premium asset, not a liability</p>
            </div>
            <div className="takeaway-item">
              <span className="takeaway-number">2</span>
              <p>Target organizations that value leadership and operational excellence</p>
            </div>
            <div className="takeaway-item">
              <span className="takeaway-number">3</span>
              <p>Lead with your unique advantages in negotiations</p>
            </div>
            <div className="takeaway-item">
              <span className="takeaway-number">4</span>
              <p>Build a network of veteran advocates in target industries</p>
            </div>
            <div className="takeaway-item">
              <span className="takeaway-number">5</span>
              <p>Your transition is not starting over—it's leveraging expertise</p>
            </div>
          </div>
        </aside>
        
        {/* Final CTA */}
        <div className="report-cta">
          <h2>Ready to Execute Your Transition Strategy?</h2>
          <p>
            This report is your roadmap. Now it's time to execute with the same precision 
            and determination that defined your military service.
          </p>
          <div className="cta-buttons">
            <button 
              className="download-button"
              onClick={() => {
                // In a real implementation, this would generate a PDF
                alert('PDF generation will be implemented with jsPDF')
              }}
            >
              Download PDF Report
            </button>
            <button 
              className="share-button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert('Link copied to clipboard!')
              }}
            >
              Share Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}