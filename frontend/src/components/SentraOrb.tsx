import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/SentraOrb.css';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SentraOrbProps {
  isVisible: boolean;
  context?: any;
}

export const SentraOrb: React.FC<SentraOrbProps> = ({ isVisible }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm Sentra, your AI career counselor. How can I help you with your transition today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // const [sessionId, setSessionId] = useState<string | null>(null); // Will be used when Watson is integrated
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Initialize Watson session when component mounts
  useEffect(() => {
    if (isVisible) {
      initializeSession();
    }
  }, [isVisible]);

  const initializeSession = async () => {
    try {
      // TODO: Replace with actual Watson API call
      const mockSessionId = `session-${Date.now()}`;
      // setSessionId(mockSessionId); // Will be used when Watson is integrated
      console.log('Watson session initialized:', mockSessionId);
    } catch (error) {
      console.error('Failed to initialize Watson session:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // TODO: Replace with actual Watson API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Mock response based on input
      let response = "I understand you're looking for guidance. ";
      
      if (inputValue.toLowerCase().includes('resume')) {
        response += "For resume optimization, I recommend highlighting your military leadership experience and translating technical skills into civilian terms. Would you like specific examples based on your MOS?";
      } else if (inputValue.toLowerCase().includes('interview')) {
        response += "Interview preparation is crucial. Let's focus on the STAR method to structure your responses. What type of role are you interviewing for?";
      } else if (inputValue.toLowerCase().includes('career')) {
        response += "Based on your profile, I see several strong career paths. Your skills align well with project management, operations, and leadership roles. Should we explore specific industries?";
      } else {
        response += "I can help with resume writing, interview preparation, career exploration, and translating your military experience. What would you like to focus on?";
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        type: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Orb */}
      <motion.div
        className={`sentra-orb ${isOpen ? 'orb-active' : ''}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.5 
        }}
        onClick={() => !isOpen && setIsOpen(true)}
        whileHover={{ scale: isOpen ? 1 : 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="orb-inner">
          <div className="orb-glow"></div>
          <div className="orb-core">
            {isOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
              </svg>
            )}
          </div>
          <div className="orb-pulse"></div>
        </div>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sentra-chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-status-indicator"></div>
                <h3>Sentra AI Assistant</h3>
              </div>
              <button 
                className="chat-minimize"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize chat"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13H5v-2h14v2z"/>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`chat-message ${message.type}`}
                  initial={{ opacity: 0, x: message.type === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </motion.div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  className="chat-message assistant typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-container">
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                placeholder="Ask me about your career transition..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                className="chat-send"
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                aria-label="Send message"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};