import React from 'react';
import { 
  EdgeProps, 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath,
  Position
} from 'reactflow';

interface FloatingEdgeData {
  timeline?: string;
  requirements?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  isAlternative?: boolean;
}

interface FloatingEdgeProps extends EdgeProps {
  data?: FloatingEdgeData;
}

const FloatingEdge: React.FC<FloatingEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
  markerEnd,
  style = {},
  data,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine gradient based on edge type
  const getEdgeGradient = () => {
    if (data?.difficulty === 'hard') return 'url(#edge-gradient-risk)';
    if (data?.difficulty === 'easy') return 'url(#edge-gradient-success)';
    return 'url(#edge-gradient-default)';
  };

  // Enhanced edge styling
  const edgeStyle = {
    ...style,
    strokeWidth: isHovered ? 3 : 2,
    stroke: isHovered ? getEdgeGradient() : (data?.isAlternative 
      ? 'var(--color-cyan-30)' 
      : 'var(--color-cyan-50)'),
    strokeDasharray: data?.isAlternative ? '5 5' : undefined,
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    filter: isHovered ? 'drop-shadow(0 0 8px var(--color-cyan-50))' : undefined,
  };

  return (
    <>
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BaseEdge 
          path={edgePath} 
          markerEnd={markerEnd} 
          style={edgeStyle}
        />
      </g>
      
      {/* Enhanced Edge Tooltip */}
      {(data?.timeline || isHovered) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              fontSize: 11,
              fontWeight: 500,
              zIndex: 10,
            }}
            className="nodrag nopan"
          >
            <div 
              style={{
                background: 'rgba(20, 24, 38, 0.95)',
                border: '1px solid var(--color-cyan-30)',
                borderRadius: '8px',
                padding: isHovered && (data?.requirements || data?.difficulty) ? '12px' : '6px 10px',
                color: 'var(--text-high)',
                backdropFilter: 'var(--glass-blur-heavy)',
                boxShadow: 'var(--shadow-lg)',
                transition: 'all 0.3s ease',
                maxWidth: isHovered ? '200px' : 'none',
              }}
            >
              <div style={{ 
                fontWeight: 600, 
                marginBottom: isHovered && (data?.requirements || data?.difficulty) ? '8px' : 0,
                color: 'var(--color-cyan-100)'
              }}>
                {data?.timeline || '1-3 months'}
              </div>
              
              {isHovered && data?.difficulty && (
                <div style={{ 
                  fontSize: '10px', 
                  marginBottom: '6px',
                  color: data.difficulty === 'hard' ? 'var(--color-danger)' : 
                         data.difficulty === 'easy' ? 'var(--color-success)' : 
                         'var(--color-warning)'
                }}>
                  Difficulty: {data.difficulty}
                </div>
              )}
              
              {isHovered && data?.requirements && (
                <div style={{ fontSize: '10px', color: 'var(--text-mid)' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>Requirements:</div>
                  {data.requirements.map((req, i) => (
                    <div key={i} style={{ marginLeft: '8px' }}>• {req}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Junction point indicator when hovering */}
      {isHovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 20}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan edge-button-wrapper"
          >
            <button
              className="edge-button"
              onClick={(e) => {
                e.stopPropagation();
                // Dispatch event for parent to handle
                const event = new CustomEvent('createJunction', { 
                  detail: { edgeId: id, x: labelX, y: labelY } 
                });
                window.dispatchEvent(event);
              }}
            >
              +
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default FloatingEdge;