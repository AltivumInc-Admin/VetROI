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

  // Enhanced edge styling
  const edgeStyle = {
    ...style,
    strokeWidth: isHovered ? 3 : 2,
    stroke: data?.isAlternative 
      ? 'var(--color-cyan-30)' 
      : 'var(--color-cyan-50)',
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
      
      {/* Edge Label */}
      {(data?.timeline || isHovered) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              fontSize: 11,
              fontWeight: 500,
            }}
            className="nodrag nopan"
          >
            <div 
              style={{
                background: 'var(--color-bg-600)',
                border: '1px solid var(--color-cyan-30)',
                borderRadius: '6px',
                padding: '4px 8px',
                color: 'var(--text-high)',
                whiteSpace: 'nowrap',
                backdropFilter: 'var(--glass-blur)',
                boxShadow: isHovered ? 'var(--shadow-sm)' : undefined,
              }}
            >
              {data?.timeline || 'Timeline'}
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