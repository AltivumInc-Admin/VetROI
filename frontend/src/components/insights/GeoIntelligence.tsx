import React, { useState, useRef, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { veteranHubs, migrationArcs, VeteranHub } from '../../data/veteranHubsData';
import './GeoIntelligence.css';

interface GeoIntelligenceProps {
  className?: string;
}

export const GeoIntelligence: React.FC<GeoIntelligenceProps> = ({ className = '' }) => {
  const globeEl = useRef<any>();
  const [selectedHub, setSelectedHub] = useState<VeteranHub | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Auto-rotation effect
  React.useEffect(() => {
    if (globeEl.current && isRotating) {
      const animate = () => {
        if (globeEl.current && isRotating) {
          globeEl.current.controls().autoRotate = true;
          globeEl.current.controls().autoRotateSpeed = 0.5;
        }
      };
      animate();
    } else if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
    }
  }, [isRotating]);

  // Filter hubs based on category
  const filteredHubs = activeCategory === 'all' 
    ? veteranHubs 
    : veteranHubs.filter(hub => hub.category === activeCategory);

  // Handle point click
  const handlePointClick = useCallback((point: any) => {
    setSelectedHub(point);
    setIsRotating(false);
    
    // Fly to the clicked location
    if (globeEl.current) {
      const coords = { lat: point.lat, lng: point.lng, altitude: 0.5 };
      globeEl.current.pointOfView(coords, 1000);
    }
  }, []);

  // Reset view
  const handleResetView = () => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 39.8283, lng: -98.5795, altitude: 2.5 }, 1000);
    }
    setSelectedHub(null);
    setIsRotating(true);
  };

  // Toggle category filter
  const handleCategoryFilter = (category: string) => {
    setActiveCategory(category);
    setSelectedHub(null);
  };

  return (
    <div className={`geo-intelligence ${className}`}>
      {/* Header Section */}
      <div className="geo-header">
        <div className="geo-title-section">
          <h2>
            <span className="section-icon">●</span>
            Geographic Intelligence
            <span className="beta-badge">Beta Preview</span>
          </h2>
          <p className="geo-subtitle">
            Explore veteran career hotspots across the nation. Click on any location to discover opportunities.
          </p>
        </div>

        {/* Controls */}
        <div className="geo-controls">
          <div className="category-filters">
            <button 
              className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleCategoryFilter('all')}
            >
              All Hubs
            </button>
            <button 
              className={`filter-btn tech ${activeCategory === 'tech' ? 'active' : ''}`}
              onClick={() => handleCategoryFilter('tech')}
            >
              <span className="filter-icon">💻</span> Tech
            </button>
            <button 
              className={`filter-btn defense ${activeCategory === 'defense' ? 'active' : ''}`}
              onClick={() => handleCategoryFilter('defense')}
            >
              <span className="filter-icon">🛡️</span> Defense
            </button>
            <button 
              className={`filter-btn healthcare ${activeCategory === 'healthcare' ? 'active' : ''}`}
              onClick={() => handleCategoryFilter('healthcare')}
            >
              <span className="filter-icon">🏥</span> Healthcare
            </button>
            <button 
              className={`filter-btn education ${activeCategory === 'education' ? 'active' : ''}`}
              onClick={() => handleCategoryFilter('education')}
            >
              <span className="filter-icon">🎓</span> Education
            </button>
          </div>

          <div className="view-controls">
            <button 
              className="control-btn"
              onClick={() => setIsRotating(!isRotating)}
              title={isRotating ? "Pause rotation" : "Resume rotation"}
            >
              {isRotating ? '⏸️' : '▶️'}
            </button>
            <button 
              className="control-btn"
              onClick={handleResetView}
              title="Reset view"
            >
              🏠
            </button>
          </div>
        </div>
      </div>

      {/* Globe Container */}
      <div className="globe-container">
        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          pointsData={filteredHubs}
          pointLat="lat"
          pointLng="lng"
          pointColor={d => (d as VeteranHub).color || '#00d4ff'}
          pointAltitude={0.01}
          pointRadius={d => (d as VeteranHub).size * 0.15}
          pointLabel={d => {
            const hub = d as VeteranHub;
            return `
              <div class="globe-tooltip">
                <div class="tooltip-city">${hub.city}, ${hub.state}</div>
                <div class="tooltip-stat">${hub.veteranPopulation} veterans</div>
                <div class="tooltip-stat">${hub.avgSalary} avg salary</div>
              </div>
            `;
          }}
          onPointClick={handlePointClick}
          arcsData={migrationArcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={1500}
          arcStroke={0.5}
          enablePointerInteraction={true}
          width={window.innerWidth > 768 ? 800 : window.innerWidth - 40}
          height={window.innerWidth > 768 ? 600 : 400}
        />

        {/* Selected Hub Details */}
        {selectedHub && (
          <div className="hub-details-panel">
            <button className="close-details" onClick={() => setSelectedHub(null)}>×</button>
            <h3>{selectedHub.city}, {selectedHub.state}</h3>
            <p className="hub-description">{selectedHub.description}</p>
            
            <div className="hub-stats">
              <div className="stat-item">
                <span className="stat-label">Veteran Population</span>
                <span className="stat-value">{selectedHub.veteranPopulation}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average Salary</span>
                <span className="stat-value">{selectedHub.avgSalary}</span>
              </div>
            </div>

            <div className="hub-companies">
              <h4>Major Employers</h4>
              <div className="company-list">
                {selectedHub.companies.map((company, idx) => (
                  <span key={idx} className="company-tag">{company}</span>
                ))}
              </div>
            </div>

            <div className="hub-industries">
              <h4>Key Industries</h4>
              <div className="industry-list">
                {selectedHub.industries.map((industry, idx) => (
                  <span key={idx} className="industry-tag">{industry}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Future Vision Section */}
      <div className="future-vision">
        <h3>▶ Coming Soon</h3>
        <div className="future-features">
          <div className="future-item">
            <span className="future-icon">◆</span>
            <div>
              <strong>Personalized Matching</strong>
              <p>Location recommendations based on your MOS and career goals</p>
            </div>
          </div>
          <div className="future-item">
            <span className="future-icon">▬</span>
            <div>
              <strong>Real-Time Jobs</strong>
              <p>Live job openings at each location matching your skills</p>
            </div>
          </div>
          <div className="future-item">
            <span className="future-icon">$</span>
            <div>
              <strong>Cost Analysis</strong>
              <p>Cost of living comparison and salary adjustments</p>
            </div>
          </div>
          <div className="future-item">
            <span className="future-icon">⬥</span>
            <div>
              <strong>Veteran Networks</strong>
              <p>Connect with veterans already working in each city</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <h4>Hub Categories</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot tech"></span>
            <span>Tech & Innovation</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot defense"></span>
            <span>Defense & Aerospace</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot healthcare"></span>
            <span>Healthcare</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot education"></span>
            <span>Education & Research</span>
          </div>
          <div className="legend-item">
            <span className="legend-arc"></span>
            <span>Common Migration Paths</span>
          </div>
        </div>
      </div>
    </div>
  );
};