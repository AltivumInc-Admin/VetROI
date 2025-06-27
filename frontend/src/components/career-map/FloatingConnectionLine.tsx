import React from 'react';
import { ConnectionLineComponentProps, getStraightPath } from 'reactflow';

const FloatingConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}) => {
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="var(--color-cyan-50)"
        strokeWidth={2}
        strokeDasharray="5 5"
        className="animated"
        d={edgePath}
        style={{
          ...connectionLineStyle,
          filter: 'drop-shadow(0 0 4px var(--color-cyan-50))',
        }}
      />
      <circle
        cx={toX}
        cy={toY}
        r={6}
        fill="var(--color-cyan-10)"
        stroke="var(--color-cyan-50)"
        strokeWidth={2}
        style={{
          filter: 'drop-shadow(0 0 4px var(--color-cyan-50))',
        }}
      />
      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -10;
            }
          }
          
          .animated {
            animation: dash 1s linear infinite;
          }
        `}
      </style>
    </g>
  );
};

export default FloatingConnectionLine;