import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/SentraGuide.css';

interface Waypoint {
  x: number;
  y: number;
  element?: string;
  message: string;
  pauseDuration: number;
  action?: () => void;
}

interface SentraGuideProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const SentraGuide: React.FC<SentraGuideProps> = ({ onComplete, onSkip }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const orbRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  
  const [orbPosition, setOrbPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [targetPosition, setTargetPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [trailParticles, setTrailParticles] = useState<Array<{ id: number; x: number; y: number; opacity: number }>>([]);
  
  const waypoints: Waypoint[] = [
    {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      message: "Hi, I'm Sentra, your state-of-the-art AI career counselor. I'm here to guide you on your career deep-dive. Let's start with the site layout.",
      pauseDuration: 6000
    },
    {
      x: window.innerWidth * 0.3,
      y: 200,
      element: '[data-section="profile"]',
      message: "This is the primary client form where you'll input information that will help me acquire relevant data and metrics as well generate your master prompt to provide you with relevant information to help steer you in the right direction",
      pauseDuration: 7000
    },
    {
      x: window.innerWidth * 0.15,
      y: 400,
      element: '.progress-indicator',
      message: "Here on the left you'll find the progress bar that details the depth of your career analysis.",
      pauseDuration: 5000
    },
    {
      x: window.innerWidth * 0.7,
      y: 350,
      element: '[data-testid="data-panel-toggle"]',
      message: "Here you'll find the ONET data tab. When the information renders you'll notice it's structured in code. This is intentional. In efforts to be fully transparent, I make sure you can see the exact data that the US Department of Labor provides. What you see on your main page is precisely this information in a much more readable format.",
      pauseDuration: 8000
    },
    {
      x: window.innerWidth * 0.5,
      y: 400,
      element: '[data-section="careers"]',
      message: "Based on your interests, I'll show you personalized career matches with detailed insights and growth projections.",
      pauseDuration: 5000
    },
    {
      x: window.innerWidth - 100,
      y: window.innerHeight - 100,
      element: '[data-section="sentra"]',
      message: "As we progress through the dive, I'll be here with you every step of the way to answer your questions, and to format your master prompt and ensuring you receive the most accurate and relevant information",
      pauseDuration: 7000
    }
  ];

  useEffect(() => {
    // Initial spawn animation
    setTimeout(() => {
      setIsVisible(true);
      setShowSkipButton(true);
      startGuide();
    }, 500);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startGuide = () => {
    moveToWaypoint(0);
  };

  const moveToWaypoint = (index: number) => {
    if (index >= waypoints.length) {
      completeGuide();
      return;
    }

    const waypoint = waypoints[index];
    setCurrentStep(index);
    
    // Update target position
    let targetX = waypoint.x;
    let targetY = waypoint.y;
    
    // If element selector is provided, find the element and use its position
    if (waypoint.element) {
      const element = document.querySelector(waypoint.element);
      if (element) {
        const rect = element.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top - 50; // Position above the element
      }
    }
    
    setTargetPosition({ x: targetX, y: targetY });
    setCurrentMessage(waypoint.message);
    
    // After first step, start fading overlay
    if (index === 1) {
      setOverlayOpacity(0.7);
    }
    
    // Move to next waypoint after pause
    setTimeout(() => {
      moveToWaypoint(index + 1);
    }, waypoint.pauseDuration);
  };

  const completeGuide = () => {
    setOverlayOpacity(0);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('sentraGuideCompleted', 'true');
      onComplete?.();
    }, 500);
  };

  const handleSkip = () => {
    setOverlayOpacity(0);
    setIsVisible(false);
    localStorage.setItem('sentraGuideCompleted', 'true');
    onSkip?.();
  };

  // Smooth orb movement animation
  useEffect(() => {
    const animate = () => {
      setOrbPosition(prev => {
        const dx = targetPosition.x - prev.x;
        const dy = targetPosition.y - prev.y;
        const easing = 0.03; // Slower movement for better visibility
        
        const newX = prev.x + dx * easing;
        const newY = prev.y + dy * easing;
        
        // Create trail particles when moving
        const speed = Math.sqrt(dx * dx + dy * dy);
        if (speed > 2) {
          setTrailParticles(particles => {
            const newParticle = {
              id: Date.now() + Math.random(),
              x: newX,
              y: newY,
              opacity: 0.6
            };
            return [...particles.slice(-15), newParticle];
          });
        }
        
        return { x: newX, y: newY };
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetPosition]);

  // Fade out trail particles
  useEffect(() => {
    const interval = setInterval(() => {
      setTrailParticles(particles => 
        particles
          .map(p => ({ ...p, opacity: p.opacity - 0.02 }))
          .filter(p => p.opacity > 0)
      );
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="sentra-guide-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        ref={containerRef}
      >
        {/* Dark overlay */}
        <motion.div 
          className="sentra-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: overlayOpacity }}
          transition={{ duration: 1 }}
        />
        
        {/* Trail particles */}
        {trailParticles.map(particle => (
          <div
            key={particle.id}
            className="sentra-trail-particle"
            style={{
              left: particle.x,
              top: particle.y,
              opacity: particle.opacity
            }}
          />
        ))}
        
        {/* Sentra Orb */}
        <motion.div
          ref={orbRef}
          className="sentra-orb"
          style={{
            left: orbPosition.x,
            top: orbPosition.y
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <div className="sentra-orb-outer-glow" />
          <div className="sentra-orb-glow" />
          <div className="sentra-orb-core" />
        </motion.div>
        
        {/* Message Window */}
        <AnimatePresence mode="wait">
          {currentMessage && (
            <motion.div
              key={currentStep}
              className="sentra-message-window"
              style={{
                left: Math.min(orbPosition.x + 40, window.innerWidth - 360),
                top: Math.min(orbPosition.y + 40, window.innerHeight - 200)
              }}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="sentra-message-header">
                <div className="sentra-avatar">
                  <div className="sentra-avatar-glow" />
                  <span className="sentra-avatar-letter">S</span>
                </div>
                <span className="sentra-name">Sentra</span>
              </div>
              <div className="sentra-message-content">
                {currentMessage}
              </div>
              <div className="sentra-message-progress">
                <div className="sentra-progress-dots">
                  {waypoints.map((_, index) => (
                    <div
                      key={index}
                      className={`sentra-progress-dot ${index <= currentStep ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Skip button */}
        {showSkipButton && (
          <motion.button
            className="sentra-skip-button"
            onClick={handleSkip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Skip Tour
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};