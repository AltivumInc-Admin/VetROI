import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/CursorCoordinates.css';

interface Coordinates {
  x: number;
  y: number;
  pageX: number;
  pageY: number;
}

export const CursorCoordinates: React.FC = () => {
  const [coords, setCoords] = useState<Coordinates>({ x: 0, y: 0, pageX: 0, pageY: 0 });
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [showCoords, setShowCoords] = useState(true);
  const [copiedText, setCopiedText] = useState('');
  const [scrollY, setScrollY] = useState(0);
  
  // Track mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCoords({
      x: e.clientX,
      y: e.clientY,
      pageX: e.pageX,
      pageY: e.pageY
    });
  }, []);
  
  // Track Alt/Option key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.altKey) {
      setIsAltPressed(true);
    }
    // Toggle visibility with Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      setShowCoords(prev => !prev);
      localStorage.setItem('showCursorCoords', (!showCoords).toString());
    }
  }, [showCoords]);
  
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!e.altKey) {
      setIsAltPressed(false);
    }
  }, []);
  
  // Track scroll position
  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);
  
  // Click to copy coordinates
  const handleClick = useCallback((e: MouseEvent) => {
    if (isAltPressed) {
      const coordText = `X: ${e.pageX}, Y: ${e.pageY}`;
      navigator.clipboard.writeText(coordText);
      setCopiedText(coordText);
      setTimeout(() => setCopiedText(''), 2000);
    }
  }, [isAltPressed]);
  
  useEffect(() => {
    // Check localStorage for saved preference
    const savedPref = localStorage.getItem('showCursorCoords');
    if (savedPref !== null) {
      setShowCoords(savedPref === 'true');
    }
    
    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
    };
  }, [handleMouseMove, handleKeyDown, handleKeyUp, handleScroll, handleClick]);
  
  if (!showCoords) return null;
  
  return (
    <>
      {/* Corner HUD - Always visible but subtle */}
      <motion.div 
        className="cursor-coords-hud"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="coords-viewport">
          <span className="coord-label">View</span>
          <span className="coord-value">{coords.x}, {coords.y}</span>
        </div>
        <div className="coords-page">
          <span className="coord-label">Page</span>
          <span className="coord-value">{coords.pageX}, {coords.pageY}</span>
        </div>
        <div className="coords-scroll">
          <span className="coord-label">Scroll</span>
          <span className="coord-value">{scrollY}px</span>
        </div>
        <div className="coords-hint">
          Hold <kbd>Alt</kbd> for cursor tracking
        </div>
      </motion.div>
      
      {/* Cursor-following display when Alt is pressed */}
      <AnimatePresence>
        {isAltPressed && (
          <motion.div 
            className="cursor-coords-follow"
            style={{
              left: coords.x + 15,
              top: coords.y - 35
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="coords-follow-content">
              <div className="coords-follow-main">
                [{coords.pageX}, {coords.pageY}]
              </div>
              <div className="coords-follow-hint">
                Click to copy
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Copy confirmation */}
      <AnimatePresence>
        {copiedText && (
          <motion.div 
            className="cursor-coords-copied"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            Copied: {copiedText}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};