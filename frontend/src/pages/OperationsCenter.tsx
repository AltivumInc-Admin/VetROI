import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';
import '../styles/OperationsCenter.css';

interface SessionData {
  veteranProfile?: any;
  careerMatches?: any;
  selectedSOCs?: string[];
  dd214Processed?: boolean;
  dd214DocumentId?: string;
  careerDataCache?: any;
}

export const OperationsCenter: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load session data on mount
  useEffect(() => {
    const loadSessionData = () => {
      try {
        const profile = sessionStorage.getItem('veteranProfile');
        const matches = sessionStorage.getItem('careerMatches');
        const dd214Processed = sessionStorage.getItem('dd214Processed');
        const dd214DocumentId = sessionStorage.getItem('dd214DocumentId');
        
        // Get selected SOCs from wherever they're stored
        const selectedSOCs = JSON.parse(sessionStorage.getItem('selectedSOCs') || '[]');
        
        setSessionData({
          veteranProfile: profile ? JSON.parse(profile) : null,
          careerMatches: matches ? JSON.parse(matches) : null,
          selectedSOCs,
          dd214Processed: dd214Processed === 'true',
          dd214DocumentId: dd214DocumentId || undefined,
          careerDataCache: {} // Will be populated later
        });
      } catch (error) {
        console.error('Error loading session data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionData();
  }, []);

  // Redirect if no session data
  useEffect(() => {
    if (!isLoading && !sessionData.veteranProfile) {
      navigate('/app');
    }
  }, [isLoading, sessionData, navigate]);

  const handleBackToApp = () => {
    navigate('/app');
  };

  if (isLoading) {
    return (
      <div className="operations-center-loading">
        <div className="loading-spinner"></div>
        <p>Loading Operations Center...</p>
      </div>
    );
  }

  return (
    <div className="operations-center">
      {/* Header */}
      <header className="operations-header">
        <div className="header-left">
          <h1>Operations Center</h1>
          <p className="header-subtitle">Career Planning Command Center</p>
        </div>
        <div className="header-center">
          {sessionData.veteranProfile && (
            <div className="profile-info">
              <span className="profile-mos">{sessionData.veteranProfile.code}</span>
              <span className="profile-branch">{sessionData.veteranProfile.branch}</span>
            </div>
          )}
        </div>
        <div className="header-right">
          <button className="nav-button" onClick={handleBackToApp}>
            ← Back to Analysis
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="operations-content">
        {/* Career Planner (Main Focus) */}
        <div className="career-planner-section">
          <div className="section-header">
            <h2>Career Map</h2>
            <div className="section-controls">
              <button className="control-btn">Save Progress</button>
              <button className="control-btn">Export</button>
            </div>
          </div>
          <div className="career-planner-container">
            {/* Career planner will be inserted here in Phase 2 */}
            <div className="placeholder">
              Career Planner Component
              <br />
              (To be migrated in Phase 2)
            </div>
          </div>
        </div>

        {/* Side Panels */}
        <div className="side-panels">
          {/* DD214 Analysis Panel */}
          <div className="panel dd214-panel">
            <div className="panel-header">
              <h3>DD214 Analysis</h3>
              <button className="panel-toggle">−</button>
            </div>
            <div className="panel-content">
              {sessionData.dd214Processed && isAuthenticated ? (
                <div className="dd214-data">
                  <p>DD214 Document ID: {sessionData.dd214DocumentId}</p>
                  {/* DD214 analysis will go here */}
                </div>
              ) : (
                <div className="auth-prompt">
                  <div className="lock-icon">🔒</div>
                  <p>Login to view your DD214 analysis</p>
                  <button className="login-btn" onClick={() => setShowAuthModal(true)}>
                    Login
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Selected Careers Panel */}
          <div className="panel careers-panel">
            <div className="panel-header">
              <h3>Selected Careers ({sessionData.selectedSOCs?.length || 0})</h3>
              <button className="panel-toggle">−</button>
            </div>
            <div className="panel-content">
              {sessionData.selectedSOCs && sessionData.selectedSOCs.length > 0 ? (
                <div className="careers-list">
                  {sessionData.selectedSOCs.map((soc) => (
                    <div key={soc} className="career-item">
                      <span className="career-code">{soc}</span>
                      {/* Career details will be populated from cache */}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-careers">No careers selected yet</p>
              )}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="panel stats-panel">
            <div className="panel-header">
              <h3>Quick Stats</h3>
            </div>
            <div className="panel-content">
              <div className="stat-item">
                <span className="stat-label">Careers Explored</span>
                <span className="stat-value">{sessionData.selectedSOCs?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Profile Status</span>
                <span className="stat-value">
                  {sessionData.dd214Processed ? 'Complete' : 'Basic'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // Reload the page to show DD214 data after auth
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};