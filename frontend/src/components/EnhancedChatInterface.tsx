import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VeteranRequest } from '../types'
import { CareerCard } from './CareerCard'
import { ROICalculator } from './ROICalculator'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    type?: 'career_list' | 'career_detail' | 'roi_analysis' | 'action_links'
    data?: any
  }
}

interface EnhancedChatInterfaceProps {
  veteranProfile: VeteranRequest
  initialMessage: string
  sessionId: string
  onNewRequest: () => void
}

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  veteranProfile,
  initialMessage,
  sessionId,
  onNewRequest
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentStage, setCurrentStage] = useState<'discovery' | 'exploration' | 'action'>('discovery')
  const [selectedCareer, setSelectedCareer] = useState<any>(null)
  const [showComplexity, setShowComplexity] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleCareerSelect = async (socCode: string) => {
    setIsLoading(true)
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Tell me more about SOC ${socCode}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Fetch detailed career data
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod'}/recommend`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            selectedCareer: socCode,
            profile: veteranProfile
          })
        }
      )

      const data = await response.json()
      setSelectedCareer(data.careerData)
      setCurrentStage('exploration')
      
      // Add detailed response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: {
          type: 'career_detail',
          data: data.careerData
        }
      }
      setMessages(prev => [...prev, assistantMessage])

      // Add ROI analysis automatically
      setTimeout(() => {
        const roiMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'system',
          content: 'ROI Analysis',
          timestamp: new Date(),
          metadata: {
            type: 'roi_analysis',
            data: data.careerData
          }
        }
        setMessages(prev => [...prev, roiMessage])
        setCurrentStage('action')
      }, 2000)

    } catch (error) {
      console.error('Error fetching career details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod'}/recommend`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            message: inputValue,
            stage: currentStage,
            selectedCareer: selectedCareer?.soc
          })
        }
      )

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: data.metadata
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderMessage = (message: Message) => {
    // Special rendering for different message types
    if (message.metadata?.type === 'career_list' && message.metadata.data) {
      return (
        <div className="career-list-container">
          <p>{message.content}</p>
          <div className="career-options">
            {message.metadata.data.careers.map((career: any, index: number) => (
              <CareerCard
                key={career.code}
                career={career}
                index={index + 1}
                onSelect={handleCareerSelect}
              />
            ))}
          </div>
        </div>
      )
    }

    if (message.metadata?.type === 'roi_analysis' && selectedCareer) {
      return (
        <ROICalculator
          careerData={selectedCareer}
          veteranProfile={veteranProfile}
          stateData={{}} // Would include state-specific data
        />
      )
    }

    if (message.metadata?.type === 'action_links') {
      return (
        <div className="action-links-container">
          <h4>🎯 Ready to Take Action?</h4>
          <div className="action-grid">
            {message.metadata.data.links.map((link: any, index: number) => (
              <motion.a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="action-link"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="action-icon">{link.icon}</span>
                <span className="action-title">{link.title}</span>
                <span className="action-description">{link.description}</span>
              </motion.a>
            ))}
          </div>
        </div>
      )
    }

    // Default message rendering
    return <div className="message-content">{message.content}</div>
  }

  return (
    <div className="enhanced-chat-interface">
      <div className="chat-header">
        <div className="header-main">
          <h2>VetROI™ Career Intelligence</h2>
          <p className="session-info">
            {veteranProfile.branch.toUpperCase()} | {veteranProfile.code} | {veteranProfile.homeState}
          </p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setShowComplexity(!showComplexity)}
            className="complexity-toggle"
            title="Show data pipeline"
          >
            {showComplexity ? '📊' : '🔧'}
          </button>
          <button onClick={onNewRequest} className="new-request-button">
            New Analysis
          </button>
        </div>
      </div>

      {showComplexity && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="complexity-banner"
        >
          <p>
            <strong>Behind the scenes:</strong> Your recommendations are powered by{' '}
            <span className="highlight">1,139 O*NET occupations</span>,{' '}
            <span className="highlight">real-time salary data</span>,{' '}
            <span className="highlight">military crosswalk algorithms</span>, and{' '}
            <span className="highlight">Amazon Bedrock AI</span>.
          </p>
        </motion.div>
      )}

      <div className="chat-stage-indicator">
        <div className={`stage ${currentStage === 'discovery' ? 'active' : ''}`}>
          <span className="stage-icon">🔍</span>
          <span className="stage-label">Discovery</span>
        </div>
        <div className={`stage ${currentStage === 'exploration' ? 'active' : ''}`}>
          <span className="stage-icon">📊</span>
          <span className="stage-label">Analysis</span>
        </div>
        <div className={`stage ${currentStage === 'action' ? 'active' : ''}`}>
          <span className="stage-icon">🎯</span>
          <span className="stage-label">Action</span>
        </div>
      </div>

      <div className="chat-messages">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`message ${message.role}-message`}
            >
              {renderMessage(message)}
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="message assistant-message loading">
            <div className="thinking-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="text">Analyzing data pipeline...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={
            currentStage === 'discovery' 
              ? "What type of work interests you?"
              : currentStage === 'exploration'
              ? "Ask about salary, requirements, or job outlook..."
              : "Need help with applications or certifications?"
          }
          className="chat-input"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? '...' : '→'}
        </button>
      </div>

      <div className="chat-footer">
        <img src="/onet-in-it.svg" alt="O*NET" className="data-attribution" />
        <p>Powered by U.S. Department of Labor O*NET data & Amazon Bedrock AI</p>
      </div>
    </div>
  )
}