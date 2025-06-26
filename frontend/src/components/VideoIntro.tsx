import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './VideoIntro.css';

interface VideoIntroProps {
  onComplete: () => void;
}

export const VideoIntro: React.FC<VideoIntroProps> = ({ onComplete }) => {
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    // Fallback timer in case video doesn't fire ended event
    const timer = setTimeout(() => {
      setVideoEnded(true);
    }, 8500); // 8.5 seconds to be safe

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (videoEnded) {
      // Wait a moment for fade out to start, then trigger onComplete
      const timer = setTimeout(() => {
        onComplete();
      }, 1000); // 1 second fade transition
      
      return () => clearTimeout(timer);
    }
  }, [videoEnded, onComplete]);

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  return (
    <AnimatePresence>
      {!videoEnded && (
        <motion.div 
          className="video-intro-container"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <video
            className="intro-video"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
          >
            <source src="https://altivum-media-assets.s3.amazonaws.com/vetroi/DeepDive.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          <motion.div 
            className="video-logo"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <img src="/WP2.png" alt="Logo" className="wl-logo" />
          </motion.div>
          
          <motion.div 
            className="video-overlay"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <h1 className="video-title">
              <span className="title-main">VetROI</span>
              <span className="title-tm">™</span>
            </h1>
            <p className="video-tagline">
              AI-Powered | Data-Driven | Veteran-Focused
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};