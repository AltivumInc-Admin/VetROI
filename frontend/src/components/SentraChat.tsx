import React, { useState, useEffect, useRef } from 'react'
import { sentraConversation } from '../api'
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
  veteranContext, 
  sessionId,
  onBack 
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversationId, setConversationId] = useState<string>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Send initial context-aware greeting
    sendInitialGreeting()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendInitialGreeting = async () => {
    setIsTyping(true)
    
    try {
      const response = await sentraConversation({
        sessionId,
        message: "INITIAL_GREETING",
        veteranContext,
        conversationId: undefined
      })

      setConversationId(response.conversationId)
      setMessages([{
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp)
      }])
    } catch (error) {
      console.error('Failed to get initial greeting:', error)
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm Sentra, your AI career counselor. I'm here to help you navigate your transition to civilian careers. What would you like to discuss today?",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }])

    setIsTyping(true)

    try {
      const response = await sentraConversation({
        sessionId,
        message: userMessage,
        veteranContext,
        conversationId
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp)
      }])
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const askAbout = (topic: string) => {
    setInput(topic)
    textareaRef.current?.focus()
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
                <MessageContent content={msg.content} />
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
        <div className="chat-suggestions">
          <p>Suggested topics:</p>
          <div className="suggestion-chips">
            <button 
              onClick={() => askAbout("What salary can I expect in my field?")}
              className="suggestion-chip"
            >
              💰 Salary expectations
            </button>
            <button 
              onClick={() => askAbout("What certifications should I pursue?")}
              className="suggestion-chip"
            >
              📜 Required certifications
            </button>
            <button 
              onClick={() => askAbout("How do I prepare for interviews?")}
              className="suggestion-chip"
            >
              🎯 Interview preparation
            </button>
            <button 
              onClick={() => askAbout("How do I translate my military experience?")}
              className="suggestion-chip"
            >
              🔄 Translate experience
            </button>
          </div>
        </div>
        
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Sentra anything about your career transition..."
            rows={3}
            className="chat-input"
          />
          <button 
            onClick={sendMessage} 
            disabled={!input.trim() || isTyping}
            className="send-button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}