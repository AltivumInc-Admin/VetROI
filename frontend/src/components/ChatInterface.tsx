import React, { useState, useRef, useEffect } from 'react'
import { VeteranRequest } from '../types'
import { MessageContent } from './MessageContent'
import '../styles/ChatMarkdown.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  veteranProfile: VeteranRequest
  initialMessage: string
  sessionId: string
  onNewRequest: () => void
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
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
  const [socData, setSocData] = useState<any>(null)
  const [socLoading, setSocLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchSOCData = async (socCodes: string) => {
    setSocLoading(true)
    setSocData(null)
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod'}/recommend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            socCodes: socCodes,
            requestType: 'soc_lookup'
          })
        }
      )

      const data = await response.json()
      setSocData(data)
    } catch (error) {
      console.error('Error fetching SOC data:', error)
      setSocData({ error: 'Failed to fetch SOC data' })
    } finally {
      setSocLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    // Check if input is SOC code(s)
    const socPattern = /^\d{2}-\d{4}\.\d{2}(?:\s*,\s*\d{2}-\d{4}\.\d{2})*$/
    if (socPattern.test(inputValue.trim())) {
      // Handle SOC code lookup
      await fetchSOCData(inputValue.trim())
      setInputValue('')
      return
    }

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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            message: inputValue
          })
        }
      )

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or start a new conversation.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div>
          <h2>VetROI™ Career Advisor</h2>
          <p className="session-info">
            {veteranProfile.branch.toUpperCase()} | {veteranProfile.code} | {veteranProfile.homeState}
          </p>
        </div>
        <button onClick={onNewRequest} className="new-request-button">
          New Conversation
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}-message`}>
            <div className="message-content">
              <MessageContent content={message.content} role={message.role} />
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant-message loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="soc-input-section">
        <label className="soc-input-label">
          Given your results, enter SOC codes of interest. If more than 1 separate with a comma.
        </label>
        <div className="chat-input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder=""
            className="chat-input"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* SOC Data Display Box */}
      {(socData || socLoading) && (
        <div className="soc-data-display">
          <h3 className="soc-data-title">S3 Career Data</h3>
          {socLoading ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
              <span className="loading-text">Fetching SOC data from S3...</span>
            </div>
          ) : (
            <div className="soc-json-content">
              <pre className="message-code-block">
                <code>{JSON.stringify(socData, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="chat-footer">
        <p>© 2025 Altivum Inc. VetROI™ is a trademark of Altivum Inc.</p>
      </div>
    </div>
  )
}