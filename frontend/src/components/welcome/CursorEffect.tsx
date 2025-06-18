import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CursorEffect: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorVariant, setCursorVariant] = useState('default');
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const mouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
      setIsVisible(true);
    };
    
    const mouseLeave = () => setIsVisible(false);
    const mouseEnter = () => setIsVisible(true);
    
    const mouseDown = () => setCursorVariant('click');
    const mouseUp = () => setCursorVariant('default');
    
    const handleLinkHover = () => setCursorVariant('hover');
    const handleLinkLeave = () => setCursorVariant('default');
    
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseleave', mouseLeave);
    window.addEventListener('mouseenter', mouseEnter);
    window.addEventListener('mousedown', mouseDown);
    window.addEventListener('mouseup', mouseUp);
    
    const links = document.querySelectorAll('a, button, input, textarea, [role="button"]');
    links.forEach(link => {
      link.addEventListener('mouseenter', handleLinkHover);
      link.addEventListener('mouseleave', handleLinkLeave);
    });
    
    // Hide default cursor
    document.body.style.cursor = 'none';
    
    return () => {
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseleave', mouseLeave);
      window.removeEventListener('mouseenter', mouseEnter);
      window.removeEventListener('mousedown', mouseDown);
      window.removeEventListener('mouseup', mouseUp);
      
      links.forEach(link => {
        link.removeEventListener('mouseenter', handleLinkHover);
        link.removeEventListener('mouseleave', handleLinkLeave);
      });
      
      // Restore default cursor
      document.body.style.cursor = 'auto';
    };
  }, []);
  
  const variants = {
    default: {
      x: mousePosition.x - 12,
      y: mousePosition.y - 12,
      height: 24,
      width: 24,
      rotate: -26,
      transition: { 
        type: 'spring' as const, 
        stiffness: 750, 
        damping: 35
      }
    },
    hover: {
      x: mousePosition.x - 18,
      y: mousePosition.y - 18,
      height: 36,
      width: 36,
      rotate: -26,
      transition: { 
        type: 'spring' as const, 
        stiffness: 750, 
        damping: 35
      }
    },
    click: {
      x: mousePosition.x - 9,
      y: mousePosition.y - 9,
      height: 18,
      width: 18,
      rotate: -26,
      transition: { 
        type: 'spring' as const, 
        stiffness: 750, 
        damping: 35
      }
    }
  };
  
  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-50 hidden md:block"
      variants={variants}
      animate={cursorVariant}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out'
      }}
    >
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.8) 0%, rgba(0, 212, 255, 0.4) 50%, transparent 70%)',
          filter: 'blur(1px)',
        }}
      >
        <span 
          className="text-xs font-bold"
          style={{ 
            color: '#0a0e1a',
            fontSize: '8px',
            letterSpacing: '0.5px'
          }}
        >
          VR
        </span>
      </div>
    </motion.div>
  );
};

export default CursorEffect;