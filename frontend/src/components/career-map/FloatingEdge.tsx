import React from 'react';
import { getBezierPath, EdgeProps, BaseEdge, EdgeLabelRenderer, Position } from 'reactflow';

// Helper function to get the edge center for floating connections
const getEdgeCenter = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position
) => {
  const sourceIntersectionPoint = getNodeIntersection(
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY },
    sourcePosition
  );

  const targetIntersectionPoint = getNodeIntersection(
    { x: targetX, y: targetY },
    { x: sourceX, y: sourceY },
    targetPosition
  );

  const path = getBezierPath({
    sourceX: sourceIntersectionPoint.x,
    sourceY: sourceIntersectionPoint.y,
    sourcePosition,
    targetX: targetIntersectionPoint.x,
    targetY: targetIntersectionPoint.y,
    targetPosition,
  });

  return { path, labelX: (sourceX + targetX) / 2, labelY: (sourceY + targetY) / 2 };
};

// Get the intersection point between the node and the edge
function getNodeIntersection(center: { x: number; y: number }, target: { x: number; y: number }, position: Position) {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const angle = Math.atan2(dy, dx);
  
  // Assuming rectangular nodes, calculate intersection based on position
  const nodeWidth = 220; // Match node width from CSS
  const nodeHeight = 100; // Approximate node height
  
  let intersectionX = center.x;
  let intersectionY = center.y;
  
  if (position === Position.Right || position === Position.Left) {
    intersectionX = center.x + (position === Position.Right ? nodeWidth / 2 : -nodeWidth / 2);
    intersectionY = center.y + Math.tan(angle) * (nodeWidth / 2) * (position === Position.Right ? 1 : -1);
    
    // Clamp Y to node bounds
    intersectionY = Math.max(center.y - nodeHeight / 2, Math.min(center.y + nodeHeight / 2, intersectionY));
  } else {
    intersectionY = center.y + (position === Position.Bottom ? nodeHeight / 2 : -nodeHeight / 2);
    intersectionX = center.x + (nodeHeight / 2) / Math.tan(angle) * (position === Position.Bottom ? 1 : -1);
    
    // Clamp X to node bounds
    intersectionX = Math.max(center.x - nodeWidth / 2, Math.min(center.x + nodeWidth / 2, intersectionX));
  }
  
  return { x: intersectionX, y: intersectionY };
}

interface FloatingEdgeProps extends EdgeProps {
  data?: {
    timeline?: string;
    requirements?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    isAlternative?: boolean;
  };
}

const FloatingEdge: React.FC<FloatingEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
  style = {},
  markerEnd,
  data,
}) => {
  const { path, labelX, labelY } = getEdgeCenter(
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition
  );

  const [isHovered, setIsHovered] = React.useState(false);

  // Style based on edge type
  const edgeStyle = {
    ...style,
    strokeWidth: isHovered ? 3 : 2,
    stroke: data?.isAlternative ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.5)',
    strokeDasharray: data?.isAlternative ? '5 5' : undefined,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <>
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BaseEdge 
          path={path[0]} 
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
                background: 'rgba(20, 24, 38, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '4px 8px',
                color: 'rgba(255, 255, 255, 0.8)',
                whiteSpace: 'nowrap',
              }}
            >
              {data?.timeline || 'Add timeline'}
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
            className="nodrag nopan"
          >
            <button
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'rgba(20, 24, 38, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onClick={(e) => {
                e.stopPropagation();
                // This will be handled by parent component
                const event = new CustomEvent('createJunction', { 
                  detail: { edgeId: id, x: labelX, y: labelY } 
                });
                window.dispatchEvent(event);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
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