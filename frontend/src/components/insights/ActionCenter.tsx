import React, { useState } from 'react'
import '../../styles/insights/ActionCenter.css'

interface ActionCenterProps {
  data: any
}

export const ActionCenter: React.FC<ActionCenterProps> = ({ data }) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const deliverables = data.insights?.action_oriented_deliverables || {}
  
  const copyToClipboard = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(itemId)
    setTimeout(() => setCopiedItem(null), 2000)
  }
  
  return (
    <div className="action-center">
      <div className="section-header">
        <h1>Action Center</h1>
        <p>Ready-to-use materials for your job search</p>
      </div>
      
      {/* Resume Bullets Section */}
      <section className="resume-bullets-section">
        <div className="section-title">
          <h2>Resume Nuclear Bullets</h2>
          <p>Copy these achievement-focused bullets directly to your resume</p>
        </div>
        
        <div className="bullets-container">
          {(deliverables.resume_nuclear_bullets || []).map((bullet: string, index: number) => (
            <div key={index} className="bullet-item">
              <div className="bullet-content">
                <p>{bullet}</p>
              </div>
              <button 
                className={`copy-button ${copiedItem === `bullet-${index}` ? 'copied' : ''}`}
                onClick={() => copyToClipboard(bullet, `bullet-${index}`)}
              >
                {copiedItem === `bullet-${index}` ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
        
        <div className="bullets-tips">
          <h3>💡 Pro Tips</h3>
          <ul>
            <li>Use these bullets as templates and customize with your specific metrics</li>
            <li>Place your most impressive achievements at the top of each role</li>
            <li>Ensure numbers and percentages are accurate to your experience</li>
          </ul>
        </div>
      </section>
      
      {/* LinkedIn Optimization */}
      <section className="linkedin-section">
        <div className="section-title">
          <h2>LinkedIn Optimization</h2>
          <p>Professional headline and summary for maximum impact</p>
        </div>
        
        <div className="linkedin-headline">
          <h3>Optimized Headline</h3>
          <div className="headline-box">
            <p>{deliverables.linkedin_headline || 'Professional Military Leader | Clearance Holder | Operations Expert'}</p>
            <button 
              className={`copy-button ${copiedItem === 'headline' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(deliverables.linkedin_headline || '', 'headline')}
            >
              {copiedItem === 'headline' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
        
        <div className="elevator-pitch">
          <h3>Elevator Pitch / About Section</h3>
          <div className="pitch-box">
            <p>{deliverables.elevator_pitch || 'Experienced military professional with proven leadership and operational excellence...'}</p>
            <button 
              className={`copy-button ${copiedItem === 'pitch' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(deliverables.elevator_pitch || '', 'pitch')}
            >
              {copiedItem === 'pitch' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </section>
      
      {/* Email Templates */}
      <section className="email-templates-section">
        <div className="section-title">
          <h2>Email Templates</h2>
          <p>Proven subject lines and templates for outreach</p>
        </div>
        
        <div className="subject-lines">
          <h3>High-Impact Subject Lines</h3>
          <div className="subject-lines-list">
            {(deliverables.email_subject_lines || []).map((subject: string, index: number) => (
              <div key={index} className="subject-line-item">
                <div className="subject-content">
                  <span className="email-icon">📧</span>
                  <p>{subject}</p>
                </div>
                <button 
                  className={`copy-button ${copiedItem === `subject-${index}` ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(subject, `subject-${index}`)}
                >
                  {copiedItem === `subject-${index}` ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="email-template">
          <h3>Cold Outreach Template</h3>
          <div className="template-box">
            <pre>{`Subject: [Use one of the subject lines above]

Dear [Hiring Manager/Recruiter Name],

${deliverables.elevator_pitch || '[Your elevator pitch here]'}

I noticed [Company Name] is seeking someone with [specific requirement from job posting]. My experience in [relevant military experience] directly translates to this need, particularly my work in [specific example].

I would welcome the opportunity to discuss how my military background and proven track record can contribute to [Company Name]'s mission.

Best regards,
[Your Name]
[Your LinkedIn URL]
[Your Phone Number]`}</pre>
            <button 
              className={`copy-button ${copiedItem === 'email-template' ? 'copied' : ''}`}
              onClick={() => copyToClipboard(
                `Subject: ${deliverables.email_subject_lines?.[0] || '[Subject Line]'}\n\nDear [Hiring Manager/Recruiter Name],\n\n${deliverables.elevator_pitch || '[Your elevator pitch here]'}\n\nI noticed [Company Name] is seeking someone with [specific requirement from job posting]. My experience in [relevant military experience] directly translates to this need, particularly my work in [specific example].\n\nI would welcome the opportunity to discuss how my military background and proven track record can contribute to [Company Name]'s mission.\n\nBest regards,\n[Your Name]\n[Your LinkedIn URL]\n[Your Phone Number]`,
                'email-template'
              )}
            >
              {copiedItem === 'email-template' ? '✓ Copied' : 'Copy Template'}
            </button>
          </div>
        </div>
      </section>
      
      {/* Quick Actions Checklist */}
      <section className="quick-actions">
        <div className="section-title">
          <h2>Quick Actions Checklist</h2>
          <p>Complete these items to maximize your job search success</p>
        </div>
        
        <div className="checklist">
          <label className="checklist-item">
            <input type="checkbox" />
            <span>Update resume with nuclear bullets</span>
          </label>
          <label className="checklist-item">
            <input type="checkbox" />
            <span>Optimize LinkedIn headline and summary</span>
          </label>
          <label className="checklist-item">
            <input type="checkbox" />
            <span>Create email templates for target companies</span>
          </label>
          <label className="checklist-item">
            <input type="checkbox" />
            <span>Practice elevator pitch until natural</span>
          </label>
          <label className="checklist-item">
            <input type="checkbox" />
            <span>Set up job alerts for target roles</span>
          </label>
        </div>
      </section>
    </div>
  )
}