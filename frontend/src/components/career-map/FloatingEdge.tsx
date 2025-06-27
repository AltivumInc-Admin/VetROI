import React from 'react';
import { 
  EdgeProps, 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath,
  useStore,
  ReactFlowState,
  Node
} from 'reactflow';

// Get node intersections for floating edges
function getNodeIntersection(node: Node, targetNode: Node) {
  const nodeWidth = node.width || 240;
  const nodeHeight = node.height || 100;
  
  const w = nodeWidth / 2;
  const h = nodeHeight / 2;
  
  const x2 = targetNode.position.x + (targetNode.width || 240) / 2;
  const y2 = targetNode.position.y + (targetNode.height || 100) / 2;
  const x1 = node.position.x + w;
  const y1 = node.position.y + h;
  
  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x1;
  const y = h * (-xx3 + yy3) + y1;
  
  return { x, y };
}

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
  source,
  target,
  markerEnd,
  style = {},
  data,
}) => {
  const sourceNode = useStore(
    (s: ReactFlowState) => s.nodeInternals.get(source)
  );
  const targetNode = useStore(
    (s: ReactFlowState) => s.nodeInternals.get(target)
  );

  const [isHovered, setIsHovered] = React.useState(false);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { x: sourceX, y: sourceY } = getNodeIntersection(sourceNode, targetNode);
  const { x: targetX, y: targetY } = getNodeIntersection(targetNode, sourceNode);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
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