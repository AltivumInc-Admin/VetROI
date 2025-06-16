import React, { useState, useEffect, useRef } from 'react'
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
}

export const SentraChat: React.FC<SentraChatProps> = ({ 
  sessionId,
  onBack 
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [missionClicked, setMissionClicked] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Don't send initial greeting - wait for mission button
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleMissionClick = async () => {
    if (missionClicked) return
    
    setMissionClicked(true)
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
      
      setMessages([{
        role: 'assistant',
        content: data.message || "Visit https://altivum.ai/nextmission to continue your mission.",
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Failed to get mission:', error)
      setMessages([{
        role: 'assistant',
        content: "Visit https://altivum.ai/nextmission to continue your mission.",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }


  return (
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
        {messages.length === 0 && (
          <div className="mission-button-container">
            <button 
              className={`mission-button ${missionClicked ? 'clicked' : ''} ${isTyping ? 'loading' : ''}`}
              onClick={handleMissionClick}
              disabled={missionClicked}
            >
              {isTyping ? (
                <span className="loading-text">Processing...</span>
              ) : (
                <span className="mission-text">Tell me my next mission</span>
              )}
            </button>
          </div>
        )}
        
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
      
      <div className="chat-input-area disabled">
        <div className="placeholder-notice">
          <p>Full conversational AI coming soon. For now, click "Tell me my next mission" above.</p>
        </div>
        
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value=""
            disabled={true}
            placeholder="Conversational interface coming soon..."
            rows={3}
            className="chat-input disabled"
          />
          <button 
            disabled={true}
            className="send-button disabled"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" opacity="0.3">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}