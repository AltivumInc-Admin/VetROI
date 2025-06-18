import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ParticleBackground from './ParticleBackground';
import { AuthModal } from '../AuthModal';
import { motion } from 'framer-motion';
import './WelcomePage.css';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleContinueWithoutAuth = () => {
    navigate('/app');
  };

  const handleAuthChoice = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = async () => {
    await checkAuth();
    navigate('/app');
  };

  return (
    <div className="welcome-container">
      <ParticleBackground />
      
      <motion.div 
        className="welcome-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          className="logo-section"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="vetroi-logo">
            <span className="logo-vet">VET</span>
            <span className="logo-roi">ROI</span>
            <span className="logo-tm">™</span>
          </div>
          <p className="tagline">Veteran Return on Investment</p>
        </motion.div>

        <motion.h1 
          className="welcome-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Welcome to VetROI™
        </motion.h1>
        
        <motion.p 
          className="welcome-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
        >
          Transforming military service into civilian success through AI-powered career matching, 
          seamless benefit optimization, and personalized transition roadmaps.
        </motion.p>

        <motion.div 
          className="auth-options"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="glassmorphic-card">
            <h2>Get Started</h2>
            <p className="card-description">
              Create an account to unlock premium features including DD214 analysis and personalized career insights
            </p>
            
            <div className="button-group">
              <button 
                className="primary-button"
                onClick={handleAuthChoice}
              >
                Create Account
              </button>
              
              <button 
                className="secondary-button"
                onClick={handleAuthChoice}
              >
                Sign In
              </button>
            </div>
            
            <div className="divider">
              <span>or</span>
            </div>
            
            <button 
              className="tertiary-button"
              onClick={handleContinueWithoutAuth}
            >
              Continue without account
            </button>
            
            <p className="free-features-note">
              Free access includes AI career counseling and O*NET data exploration
            </p>
          </div>
        </motion.div>

        <motion.footer 
          className="welcome-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <div className="footer-content">
            <span>© 2025 Altivum Inc.</span>
            <span>VetROI™ is a trademark of Altivum Inc.</span>
            <span>Built for AWS Lambda Hackathon 2025</span>
          </div>
          
          <div className="onet-attribution">
            <img src="/onet-in-it.svg" 
                 alt="O*NET in-it" />
            <span>
              This site incorporates information from{' '}
              <a href="https://services.onetcenter.org/" 
                 target="_blank" 
                 rel="noopener noreferrer">
                O*NET Web Services
              </a>{' '}
              by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA).
            </span>
          </div>
          
          <p className="security-note">
            🔒 Your data is protected with enterprise-grade security
          </p>
        </motion.footer>
      </motion.div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default WelcomePage;