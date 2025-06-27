import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';
import CareerPlanner from '../components/career-planner/CareerPlanner';
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
  const { isAuthenticated, signOutUser, user } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [collapsedPanels, setCollapsedPanels] = useState<{ [key: string]: boolean }>({
    dd214: false,
    careers: false,
    stats: false
  });

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

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const togglePanel = (panelId: string) => {
    setCollapsedPanels(prev => ({
      ...prev,
      [panelId]: !prev[panelId]
    }));
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
              {isAuthenticated && user && (
                <span className="profile-auth">• {user.username || user.email}</span>
              )}
            </div>
          )}
        </div>
        <div className="header-right">
          <button className="nav-button" onClick={handleBackToApp}>
            ← Back to Analysis
          </button>
          {isAuthenticated && (
            <button className="nav-button logout-button" onClick={handleLogout}>
              Logout
            </button>
          )}
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
            <CareerPlanner />
          </div>
        </div>

        {/* Side Panels */}
        <div className="side-panels">
          {/* DD214 Analysis Panel */}
          <div className={`panel dd214-panel ${collapsedPanels.dd214 ? 'collapsed' : ''}`}>
            <div className="panel-header" onClick={() => togglePanel('dd214')}>
              <h3>DD214 Analysis</h3>
              <button className="panel-toggle">
                {collapsedPanels.dd214 ? '+' : '−'}
              </button>
            </div>
            {!collapsedPanels.dd214 && (
              <div className="panel-content">
              {sessionData.dd214Processed && isAuthenticated ? (
                <div className="dd214-data">
                  <div className="dd214-status">
                    <div className="status-indicator success"></div>
                    <span>DD214 Verified</span>
                  </div>
                  <div className="dd214-info">
                    <div className="info-item">
                      <span className="info-label">Document ID:</span>
                      <span className="info-value">{sessionData.dd214DocumentId?.slice(0, 8)}...</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Analysis Status:</span>
                      <span className="info-value">Complete</span>
                    </div>
                  </div>
                  <button className="view-full-analysis-btn">
                    View Full Analysis →
                  </button>
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
            )}
          </div>

          {/* Selected Careers Panel */}
          <div className={`panel careers-panel ${collapsedPanels.careers ? 'collapsed' : ''}`}>
            <div className="panel-header" onClick={() => togglePanel('careers')}>
              <h3>Selected Careers ({sessionData.selectedSOCs?.length || 0})</h3>
              <button className="panel-toggle">
                {collapsedPanels.careers ? '+' : '−'}
              </button>
            </div>
            {!collapsedPanels.careers && (
              <div className="panel-content">
              {sessionData.selectedSOCs && sessionData.selectedSOCs.length > 0 ? (
                <div className="careers-list">
                  {sessionData.selectedSOCs.map((soc) => (
                    <div key={soc} className="career-item">
                      <div className="career-item-header">
                        <span className="career-code">{soc}</span>
                        <button className="career-action-btn">View Details</button>
                      </div>
                      <div className="career-item-details">
                        {/* Career details will be populated from cache */}
                        <p className="career-placeholder">Loading career data...</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-careers">No careers selected yet</p>
              )}
            </div>
            )}
          </div>

          {/* Quick Stats Panel */}
          <div className={`panel stats-panel ${collapsedPanels.stats ? 'collapsed' : ''}`}>
            <div className="panel-header" onClick={() => togglePanel('stats')}>
              <h3>Quick Stats</h3>
              <button className="panel-toggle">
                {collapsedPanels.stats ? '+' : '−'}
              </button>
            </div>
            {!collapsedPanels.stats && (
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
            )}
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