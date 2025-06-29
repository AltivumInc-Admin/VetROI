import React, { useState } from 'react'
import '../../styles/insights/dd214-unified-design.css'
import '../../styles/insights/AIPromptGenerator-refined.css'

interface AIPromptGeneratorProps {
  data: any
}

export const AIPromptGenerator: React.FC<AIPromptGeneratorProps> = ({ data }) => {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const aiPrompts = data.insights?.meta_ai_prompts || {}
  const profile = data.insights?.extracted_profile || {}
  
  const promptCategories = [
    { id: 'all', label: 'All Prompts', icon: '🎯' },
    { id: 'career', label: 'Career Strategy', icon: '💼' },
    { id: 'resume', label: 'Resume & LinkedIn', icon: '📄' },
    { id: 'interview', label: 'Interview Prep', icon: '🎤' },
    { id: 'negotiation', label: 'Negotiation', icon: '💰' },
    { id: 'networking', label: 'Networking', icon: '🤝' },
    { id: 'personal', label: 'Personal Brand', icon: '⭐' }
  ]
  
  // Organize prompts from the AI response
  const getAllPrompts = () => {
    const prompts: Array<{
      id: string
      category: string
      platform: string
      title: string
      prompt: string
      icon: string
    }> = []
    
    // ChatGPT Career Coach Prompts
    if (aiPrompts.chatgpt_career_coach_prompts) {
      aiPrompts.chatgpt_career_coach_prompts.forEach((prompt: string, index: number) => {
        prompts.push({
          id: `chatgpt-${index}`,
          category: 'career',
          platform: 'ChatGPT',
          title: extractPromptTitle(prompt),
          prompt: prompt,
          icon: '🤖'
        })
      })
    }
    
    // Claude Project Manager Prompts
    if (aiPrompts.claude_project_manager_prompts) {
      aiPrompts.claude_project_manager_prompts.forEach((prompt: string, index: number) => {
        prompts.push({
          id: `claude-${index}`,
          category: 'career',
          platform: 'Claude',
          title: extractPromptTitle(prompt),
          prompt: prompt,
          icon: '🎓'
        })
      })
    }
    
    // LinkedIn Content Prompts
    if (aiPrompts.linkedin_content_prompts) {
      aiPrompts.linkedin_content_prompts.forEach((prompt: string, index: number) => {
        prompts.push({
          id: `linkedin-${index}`,
          category: 'personal',
          platform: 'LinkedIn',
          title: extractPromptTitle(prompt),
          prompt: prompt,
          icon: '💼'
        })
      })
    }
    
    // Resume Optimization Prompts
    if (aiPrompts.resume_optimization_prompts) {
      aiPrompts.resume_optimization_prompts.forEach((prompt: string, index: number) => {
        prompts.push({
          id: `resume-${index}`,
          category: 'resume',
          platform: 'Any AI',
          title: extractPromptTitle(prompt),
          prompt: prompt,
          icon: '📝'
        })
      })
    }
    
    // Interview Simulation Prompts
    if (aiPrompts.interview_simulation_prompts) {
      aiPrompts.interview_simulation_prompts.forEach((prompt: string, index: number) => {
        prompts.push({
          id: `interview-${index}`,
          category: 'interview',
          platform: 'Any AI',
          title: extractPromptTitle(prompt),
          prompt: prompt,
          icon: '🎯'
        })
      })
    }
    
    return prompts
  }
  
  const extractPromptTitle = (prompt: string) => {
    // Extract a meaningful title from the prompt
    const firstSentence = prompt.split('.')[0]
    // Clean up the title
    const cleanTitle = firstSentence
      .replace(/^(I'm a|I am a|As a|You are a|Act as a)/i, '')
      .replace(/^(Help me|Please help me|Can you help me)/i, '')
      .trim()
    
    if (cleanTitle.length > 60) {
      return cleanTitle.substring(0, 60) + '...'
    }
    return cleanTitle || 'AI Prompt'
  }
  
  const copyPrompt = (prompt: string, promptId: string) => {
    navigator.clipboard.writeText(prompt)
    setCopiedPrompt(promptId)
    setTimeout(() => setCopiedPrompt(null), 2000)
  }
  
  const filteredPrompts = selectedCategory === 'all' 
    ? getAllPrompts() 
    : getAllPrompts().filter(p => p.category === selectedCategory)
  
  // Custom prompt generator based on profile
  const generateCustomPrompt = (purpose: string) => {
    const rank = profile.rank || 'Military Professional'
    const branch = profile.branch || 'Military'
    const mos = profile.mos || 'Military Specialist'
    
    switch(purpose) {
      case 'elevator-pitch':
        return `I'm a ${rank} from the ${branch} with experience as a ${mos}. Help me create a compelling 30-second elevator pitch for civilian employers that translates my military experience into business value. Focus on leadership, operational excellence, and results.`
      
      case 'salary-negotiation':
        return `I'm transitioning from the military as a ${rank} with ${profile.years_service || 'several'} years of service. My MOS is ${mos}. Help me develop a salary negotiation strategy for civilian roles, considering my security clearance, leadership experience, and specialized training. What's my market value?`
      
      case 'interview-story':
        return `I need to prepare STAR format stories for interviews. As a ${rank} in the ${branch}, I led teams and managed complex operations. Help me translate a military leadership story into a compelling interview answer that resonates with civilian hiring managers.`
      
      default:
        return `I'm a ${rank} transitioning from the ${branch}. Help me with ${purpose}.`
    }
  }
  
  return (
    <div className="ai-prompt-generator">
      <div className="section-header">
        <h1>AI Prompt Generator</h1>
        <p>Custom AI prompts tailored to your military background for career success</p>
        <div className="usage-instructions">
          <span className="instruction-icon">💡</span>
          <span>Click any prompt to copy it to your clipboard, then paste into your favorite AI tool</span>
        </div>
      </div>
      
      {/* Quick Generate Section */}
      <section className="quick-generate">
        <h2>Quick Prompt Generator</h2>
        <p>Generate instant prompts based on your profile - Click to copy!</p>
        
        <div className="quick-prompt-buttons">
          <button 
            className="generate-button"
            onClick={() => {
              const prompt = generateCustomPrompt('elevator-pitch')
              copyPrompt(prompt, 'quick-elevator')
            }}
          >
            <span className="button-icon">🎤</span>
            <span className="button-text">Elevator Pitch</span>
            {copiedPrompt === 'quick-elevator' && <span className="copied-badge">Copied!</span>}
          </button>
          
          <button 
            className="generate-button"
            onClick={() => {
              const prompt = generateCustomPrompt('salary-negotiation')
              copyPrompt(prompt, 'quick-salary')
            }}
          >
            <span className="button-icon">💰</span>
            <span className="button-text">Salary Negotiation</span>
            {copiedPrompt === 'quick-salary' && <span className="copied-badge">Copied!</span>}
          </button>
          
          <button 
            className="generate-button"
            onClick={() => {
              const prompt = generateCustomPrompt('interview-story')
              copyPrompt(prompt, 'quick-interview')
            }}
          >
            <span className="button-icon">📖</span>
            <span className="button-text">Interview Story</span>
            {copiedPrompt === 'quick-interview' && <span className="copied-badge">Copied!</span>}
          </button>
        </div>
      </section>
      
      {/* Category Filter */}
      <div className="category-filter">
        <h3>Browse AI Prompts by Category</h3>
        <div className="category-buttons">
          {promptCategories.map((category) => (
            <button
              key={category.id}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Prompt Cards */}
      <div className="prompts-grid">
        {filteredPrompts.map((promptItem) => (
          <div key={promptItem.id} className="prompt-card">
            <div className="prompt-header">
              <div className="prompt-meta">
                <span className="platform-badge">{promptItem.platform}</span>
                <span className="prompt-icon">{promptItem.icon}</span>
              </div>
              <h3 title={promptItem.prompt}>{promptItem.title}</h3>
            </div>
            
            <div className="prompt-content">
              <p>{promptItem.prompt}</p>
            </div>
            
            <div className="prompt-actions">
              <button
                className={`copy-button ${copiedPrompt === promptItem.id ? 'copied' : ''}`}
                onClick={() => copyPrompt(promptItem.prompt, promptItem.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                {copiedPrompt === promptItem.id ? '✓ Copied!' : 'Copy Prompt'}
              </button>
              
              <button
                className="try-button"
                onClick={() => {
                  copyPrompt(promptItem.prompt, promptItem.id)
                  if (promptItem.platform === 'ChatGPT') {
                    window.open('https://chat.openai.com', '_blank')
                  } else if (promptItem.platform === 'Claude') {
                    window.open('https://claude.ai', '_blank')
                  }
                }}
              >
                Try in {promptItem.platform} →
              </button>
            </div>
          </div>
        ))}
        
        {filteredPrompts.length === 0 && (
          <div className="no-prompts">
            <p>No prompts available for this category yet. Try selecting "All Prompts" or generating a custom prompt above.</p>
          </div>
        )}
      </div>
      
      {/* Pro Tips Section */}
      <section className="pro-tips">
        <h2>💡 Pro Tips for Using AI</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <h3>Be Specific</h3>
            <p>Include your rank, MOS, years of service, and specific achievements for more tailored responses.</p>
          </div>
          
          <div className="tip-card">
            <h3>Iterate & Refine</h3>
            <p>Use follow-up prompts like "Make it more concise" or "Add specific metrics" to perfect the output.</p>
          </div>
          
          <div className="tip-card">
            <h3>Save Your Favorites</h3>
            <p>Keep a document with AI responses that work well for you. Build your personal prompt library.</p>
          </div>
          
          <div className="tip-card">
            <h3>Fact-Check</h3>
            <p>Always verify salary data, company information, and industry trends from AI with current sources.</p>
          </div>
        </div>
      </section>
    </div>
  )
}