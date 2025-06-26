import React from 'react';
import { getBezierPath, ConnectionLineComponentProps } from 'reactflow';

const FloatingConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}) => {
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={2}
        strokeDasharray="5 5"
        className="animated"
        d={edgePath}
        style={{
          ...connectionLineStyle,
          animation: 'dash 1s linear infinite',
        }}
      />
      <circle
        cx={toX}
        cy={toY}
        r={6}
        fill="rgba(255, 255, 255, 0.2)"
        stroke="rgba(255, 255, 255, 0.6)"
        strokeWidth={2}
      />
      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -10;
            }
          }
        `}
      </style>
    </g>
  );
};

export default FloatingConnectionLine;