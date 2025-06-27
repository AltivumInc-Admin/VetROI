import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageContent } from './MessageContent'
import '../styles/SentraChat.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SentraContext {
  veteranProfile: {
    branch: string
    mos: string
    mosTitle: string
    education: string
    homeState: string
    relocate: boolean
    relocateState?: string
  }
  careerJourney: {
    careersViewed: Array<{
      soc: string
      title: string
      timeSpent?: number
      detailsViewed?: boolean
    }>
    selectedCareers: string[]
    lastViewedCareer?: any
  }
  dd214Profile?: {
    documentId: string
    hasDD214: boolean
    serviceData?: any
    aiEnhancements?: any
  }
}

interface SentraChatProps {
  veteranContext: SentraContext
  sessionId: string
  onBack: () => void
  dd214DocumentId?: string
}

export const SentraChat: React.FC<SentraChatProps> = ({ 
  sessionId,
  onBack,
  dd214DocumentId
}) => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [missionClicked, setMissionClicked] = useState(false)
  const [showNextMission, setShowNextMission] = useState(false)
  const [showDD214InsightsButton, setShowDD214InsightsButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Don't send initial greeting - wait for mission button
  }, [])

  useEffect(() => {
    scrollToBottom()
    
    // Show buttons 3 seconds after receiving mission response
    if (messages.length === 2 && messages[1].role === 'assistant') {
      if (!showNextMission) {
        const timer = setTimeout(() => {
          setShowNextMission(true)
        }, 3000)
        
        return () => clearTimeout(timer)
      }
      
      // Show DD214 insights button 1 second after NextMission button if they have DD214
      if (showNextMission && !showDD214InsightsButton && dd214DocumentId) {
        const timer = setTimeout(() => {
          setShowDD214InsightsButton(true)
        }, 1000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [messages, showNextMission, showDD214InsightsButton, dd214DocumentId])

  const scrollToBottom = () => {
    // Scroll to the last assistant message, not the very bottom
    const assistantMessages = document.querySelectorAll('.message.assistant')
    if (assistantMessages.length > 0) {
      const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
      lastAssistantMessage.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleMissionClick = async () => {
    if (missionClicked) return
    
    setMissionClicked(true)
    
    // Add user message
    setMessages([{
      role: 'user',
      content: 'What is my next mission?',
      timestamp: new Date()
    }])
    
    setIsTyping(true)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'lexMission',
          sessionId
        })
      })

      const data = await response.json()
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || "Visit https://altivum.ai/nextmission to continue your mission.",
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Failed to get mission:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Visit https://altivum.ai/nextmission to continue your mission.",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }
  
  const handleDD214InsightsClick = () => {
    // Navigate to DD214 insights view with the document ID
    navigate(`/dd214-insights/${dd214DocumentId}`)
  }


  return (
    <>
    <div className="sentra-chat-container">
      <div className="sentra-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="sentra-info">
          <div className="sentra-avatar">
            <div className={`ai-avatar ${isTyping ? 'typing' : ''}`}>
              <div className="avatar-core"></div>
              <div className="avatar-ring ring-1"></div>
              <div className="avatar-ring ring-2"></div>
              <div className="avatar-ring ring-3"></div>
            </div>
          </div>
          <div>
            <h2>Sentra</h2>
            <p className="sentra-subtitle">Your AI Career Counselor</p>
            <p className="sentra-powered">Powered by Amazon Lex</p>
          </div>
        </div>
        <div className="security-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
          <span>Encrypted</span>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'assistant' ? (
                <div className="mini-ai-avatar">S</div>
              ) : (
                <div className="user-avatar">You</div>
              )}
            </div>
            <div className="message-content">
              {msg.role === 'assistant' ? (
                <MessageContent content={msg.content} role="assistant" />
              ) : (
                <p>{msg.content}</p>
              )}
              <span className="message-time">
                {msg.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message assistant">
            <div className="message-avatar">
              <div className="mini-ai-avatar">S</div>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-area">
        {!missionClicked ? (
          <div className="mission-prompt-container">
            <button 
              className="mission-prompt-button"
              onClick={handleMissionClick}
              disabled={isTyping}
            >
              <span className="mission-prompt-text">What is my next mission?</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="placeholder-notice">
            <p>Full conversational AI coming soon. Visit NextMission.ai for more assistance.</p>
          </div>
        )}
      </div>
    </div>
    
    {(showDD214InsightsButton || showNextMission) && (
      <div className="action-buttons-container">
        {showDD214InsightsButton && (
          <button 
            onClick={handleDD214InsightsClick}
            className="dd214-insights-button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 11H3v2h6v-2zm0-4H3v2h6V7zm0 8H3v2h6v-2zm12-4h-6v2h6v-2zm0-4h-6v2h6V7zm0 8h-6v2h6v-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Get your DD214 Insight
          </button>
        )}
        {showNextMission && (
          <>
            <button 
              onClick={() => {
                // The selected SOCs should already be in sessionStorage from the main app
                navigate('/operations-center');
              }}
              className="nextmission-button"
              style={{
                background: '#00d4ff',
                color: '#0a0e1a',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Launch Operations Center →
            </button>
            <a 
              href="https://altivum.ai/nextmission" 
              target="_blank" 
              rel="noopener noreferrer"
              className="nextmission-button"
            >
              NextMission.ai
            </a>
          </>
        )}
      </div>
    )}
  </>
  )
}