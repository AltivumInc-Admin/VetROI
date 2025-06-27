import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';
import CareerPlanner from '../components/career-planner/CareerPlanner';
import { fetchAuthSession } from 'aws-amplify/auth';
import '../styles/OperationsCenter.css';

interface SessionData {
  veteranProfile?: any;
  careerMatches?: any;
  selectedSOCs?: string[];
  dd214Processed?: boolean;
  dd214DocumentId?: string;
  careerDataCache?: any;
  dd214Insights?: any;
}

export const OperationsCenter: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, signOutUser, user, checkAuth } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [collapsedPanels, setCollapsedPanels] = useState<{ [key: string]: boolean }>({
    dd214: false,
    careers: false,
    stats: false
  });
  const [expandedCareers, setExpandedCareers] = useState<Set<string>>(new Set());
  const [dd214Loading, setDD214Loading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

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
        
        // Get career data cache
        const careerDataCache = JSON.parse(sessionStorage.getItem('careerDataCache') || '{}');
        
        setSessionData({
          veteranProfile: profile ? JSON.parse(profile) : null,
          careerMatches: matches ? JSON.parse(matches) : null,
          selectedSOCs,
          dd214Processed: dd214Processed === 'true',
          dd214DocumentId: dd214DocumentId || undefined,
          careerDataCache
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

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const saveProgress = () => {
    // Progress is automatically saved to sessionStorage
    // This provides user feedback
    showNotification('success', 'Your career planning progress has been saved!');
  };

  const exportCareerPlan = () => {
    const exportData = {
      date: new Date().toLocaleDateString(),
      veteranProfile: sessionData.veteranProfile,
      selectedCareers: sessionData.selectedSOCs?.map(soc => ({
        code: soc,
        title: sessionData.careerDataCache?.[soc]?.title || soc,
        description: sessionData.careerDataCache?.[soc]?.description || ''
      })),
      dd214Status: sessionData.dd214Processed ? 'Verified' : 'Not Processed',
      militaryExperience: sessionData.dd214Insights?.totalMonths 
        ? `${Math.floor(sessionData.dd214Insights.totalMonths / 12)} years` 
        : 'N/A'
    };

    // Create a downloadable JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `career-plan-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('success', 'Career plan exported successfully!');
  };

  const togglePanel = (panelId: string) => {
    setCollapsedPanels(prev => ({
      ...prev,
      [panelId]: !prev[panelId]
    }));
  };

  const toggleCareerDetails = (soc: string) => {
    setExpandedCareers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(soc)) {
        newSet.delete(soc);
      } else {
        newSet.add(soc);
      }
      return newSet;
    });
  };

  // Fetch DD214 insights if we have a document ID and are authenticated
  useEffect(() => {
    const fetchDD214Insights = async () => {
      if (sessionData.dd214DocumentId && isAuthenticated) {
        try {
          // Check if we already have insights in sessionStorage
          const cachedInsights = sessionStorage.getItem('dd214Insights');
          if (cachedInsights) {
            setSessionData(prev => ({
              ...prev,
              dd214Insights: JSON.parse(cachedInsights)
            }));
            return;
          }

          // Otherwise fetch from API
          setDD214Loading(true);
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/dd214/insights/${sessionData.dd214DocumentId}`,
            {
              headers: {
                Authorization: `Bearer ${(await fetchAuthSession()).tokens?.idToken}`
              }
            }
          );

          if (response.ok) {
            const insights = await response.json();
            sessionStorage.setItem('dd214Insights', JSON.stringify(insights));
            setSessionData(prev => ({
              ...prev,
              dd214Insights: insights
            }));
          } else {
            showNotification('error', 'Failed to load DD214 insights. Please try again later.');
          }
        } catch (error) {
          console.error('Error fetching DD214 insights:', error);
          showNotification('error', 'Error loading DD214 insights. Please check your connection.');
        } finally {
          setDD214Loading(false);
        }
      }
    };

    fetchDD214Insights();
  }, [sessionData.dd214DocumentId, isAuthenticated]);

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
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span>{notification.message}</span>
          <button 
            className="notification-close"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}
      
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
                <span className="profile-auth">• {user.email || user.name || user.username}</span>
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
              <button className="control-btn" onClick={() => saveProgress()}>Save Progress</button>
              <button className="control-btn" onClick={() => exportCareerPlan()}>Export</button>
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
                    {dd214Loading && (
                      <div className="loading-insights">
                        <div className="mini-spinner"></div>
                        <span>Loading insights...</span>
                      </div>
                    )}
                    {!dd214Loading && sessionData.dd214Insights && (
                      <>
                        <div className="info-item">
                          <span className="info-label">Service Years:</span>
                          <span className="info-value">{sessionData.dd214Insights.serviceYears || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Key Skills:</span>
                          <span className="info-value">{sessionData.dd214Insights.keySkills?.slice(0, 3).join(', ') || 'Processing...'}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <button 
                    className="view-full-analysis-btn"
                    onClick={() => navigate(`/dd214-insights/${sessionData.dd214DocumentId}`)}
                  >
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
                  {sessionData.selectedSOCs.map((soc) => {
                    const isExpanded = expandedCareers.has(soc);
                    const careerData = sessionData.careerDataCache?.[soc];
                    
                    return (
                      <div key={soc} className={`career-item ${isExpanded ? 'expanded' : ''}`}>
                        <div className="career-item-header">
                          <span className="career-code">{soc}</span>
                          <button 
                            className="career-action-btn"
                            onClick={() => toggleCareerDetails(soc)}
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                        <div className="career-item-details">
                          {careerData ? (
                            <>
                              <p className="career-title">{careerData.title}</p>
                              {!isExpanded && careerData.description && (
                                <p className="career-description">{careerData.description.substring(0, 100)}...</p>
                              )}
                              {isExpanded && (
                                <div className="career-expanded-details">
                                  {careerData.description && (
                                    <div className="detail-section">
                                      <h4>Description</h4>
                                      <p>{careerData.description}</p>
                                    </div>
                                  )}
                                  {careerData.typical_entry_level_education && (
                                    <div className="detail-section">
                                      <h4>Education Requirements</h4>
                                      <p>{careerData.typical_entry_level_education}</p>
                                    </div>
                                  )}
                                  {careerData.median_annual_wage && (
                                    <div className="detail-section">
                                      <h4>Median Salary</h4>
                                      <p>${careerData.median_annual_wage?.toLocaleString()}</p>
                                    </div>
                                  )}
                                  {careerData.projected_growth && (
                                    <div className="detail-section">
                                      <h4>Job Growth Outlook</h4>
                                      <p>{careerData.projected_growth.outlook} ({careerData.projected_growth.percent_change}%)</p>
                                    </div>
                                  )}
                                  <button 
                                    className="explore-more-btn"
                                    onClick={() => navigate('/app')}
                                  >
                                    Explore in Detail →
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="career-placeholder">Loading career data...</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
              {sessionData.dd214Insights && (
                <div className="stat-item">
                  <span className="stat-label">Military Experience</span>
                  <span className="stat-value">
                    {sessionData.dd214Insights.totalMonths ? `${Math.floor(sessionData.dd214Insights.totalMonths / 12)} years` : 'N/A'}
                  </span>
                </div>
              )}
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
          onSuccess={async () => {
            setShowAuthModal(false);
            // Re-check auth status without reloading
            await checkAuth();
          }}
        />
      )}
    </div>
  );
};