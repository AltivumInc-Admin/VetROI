import React, { useState } from 'react'
import '../../styles/insights/PsychologicalPreparation.css'

interface PsychologicalPreparationProps {
  data: any
}

export const PsychologicalPreparation: React.FC<PsychologicalPreparationProps> = ({ data }) => {
  const [expandedStory, setExpandedStory] = useState<number | null>(null)
  const psych = data.insights?.psychological_preparation || {}
  const imposterCrushers = psych.imposter_syndrome_crusher || []
  const interviewStories = psych.interview_power_stories || []
  const negotiation = psych.negotiation_ammunition || {}
  
  return (
    <div className="psychological-preparation">
      <div className="section-header">
        <h1>Psychological Preparation</h1>
        <p>Mental frameworks and strategies for confident career transition</p>
      </div>
      
      {/* Imposter Syndrome Crusher */}
      <section className="imposter-syndrome-section">
        <h2>Imposter Syndrome Crusher</h2>
        <p className="section-description">
          Reframe your military experience to recognize your true market value
        </p>
        
        <div className="comparison-cards">
          {imposterCrushers.map((comparison: string, index: number) => {
            const parts = comparison.split(' = ')
            const military = parts[0] || comparison
            const civilian = parts[1] || ''
            
            return (
              <div key={index} className="comparison-card">
                <div className="comparison-content">
                  <div className="military-side">
                    <h3>Your Experience</h3>
                    <p>{military}</p>
                  </div>
                  {civilian && (
                    <>
                      <div className="equals-sign">=</div>
                      <div className="civilian-side">
                        <h3>Civilian Equivalent</h3>
                        <p>{civilian}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
      
      {/* Interview Power Stories */}
      <section className="interview-stories-section">
        <h2>Interview Power Stories</h2>
        <p className="section-description">
          STAR format stories that demonstrate your exceptional capabilities
        </p>
        
        <div className="stories-container">
          {interviewStories.map((story: any, index: number) => (
            <div key={index} className="story-card">
              <div className="story-header" onClick={() => setExpandedStory(expandedStory === index ? null : index)}>
                <h3>{story.setup}</h3>
                <span className="expand-icon">{expandedStory === index ? '−' : '+'}</span>
              </div>
              
              <div className={`story-content ${expandedStory === index ? 'expanded' : ''}`}>
                <div className="star-section">
                  <h4>Your Story</h4>
                  <p>{story.your_story}</p>
                </div>
                
                <div className="star-section impact">
                  <h4>Quantified Impact</h4>
                  <p className="impact-statement">{story.impact}</p>
                </div>
                
                <div className="practice-tips">
                  <h4>Practice Tips</h4>
                  <ul>
                    <li>Keep it under 2 minutes when speaking</li>
                    <li>Emphasize the numbers and results</li>
                    <li>Connect it to the role you're applying for</li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Negotiation Arsenal */}
      <section className="negotiation-section">
        <h2>Negotiation Arsenal</h2>
        <p className="section-description">
          Your ammunition for salary negotiations
        </p>
        
        <div className="negotiation-framework">
          <div className="salary-targets">
            <h3>Know Your Worth</h3>
            <div className="salary-levels">
              <div className="salary-level floor">
                <span className="level-label">Your Floor</span>
                <span className="level-amount">{negotiation.your_floor || '$100,000'}</span>
                <span className="level-note">Never accept less</span>
              </div>
              
              <div className="salary-level market">
                <span className="level-label">Market Rate</span>
                <span className="level-amount">{negotiation.market_rate || '$120,000'}</span>
                <span className="level-note">What peers earn</span>
              </div>
              
              <div className="salary-level stretch">
                <span className="level-label">Stretch Target</span>
                <span className="level-amount">{negotiation.stretch_target || '$150,000'}</span>
                <span className="level-note">What you're worth</span>
              </div>
            </div>
          </div>
          
          <div className="leverage-points">
            <h3>Your Leverage Points</h3>
            <div className="leverage-list">
              {(negotiation.leverage_points || []).map((point: string, index: number) => (
                <div key={index} className="leverage-item">
                  <span className="leverage-icon">💪</span>
                  <p>{point}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="negotiation-script">
            <h3>Negotiation Script Template</h3>
            <div className="script-box">
              <p className="script-intro">When they make an offer below your target:</p>
              <blockquote>
                "I appreciate the offer and I'm very excited about the opportunity to contribute to [Company]. 
                Based on my research and the unique value I bring - including my {negotiation.leverage_points?.[0] || 'military leadership experience'} - 
                I was expecting a range closer to {negotiation.market_rate || '$120,000'} to {negotiation.stretch_target || '$150,000'}. 
                Can we explore bringing the compensation more in line with the market rate for someone with my background?"
              </blockquote>
            </div>
          </div>
        </div>
      </section>
      
      {/* Confidence Builders */}
      <section className="confidence-builders">
        <h2>Daily Confidence Builders</h2>
        <div className="builder-cards">
          <div className="builder-card">
            <h3>Morning Affirmation</h3>
            <p>
              "I am a proven leader who has operated successfully in life-or-death situations. 
              Corporate challenges are well within my capability."
            </p>
          </div>
          
          <div className="builder-card">
            <h3>Pre-Interview Power Pose</h3>
            <p>
              Stand in a power pose for 2 minutes before any interview. 
              Remember: You've briefed generals and led missions. This is just another briefing.
            </p>
          </div>
          
          <div className="builder-card">
            <h3>Rejection Reframe</h3>
            <p>
              "Every 'no' is intel gathering for the next mission. 
              I'm not being rejected; I'm gathering data to refine my approach."
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}