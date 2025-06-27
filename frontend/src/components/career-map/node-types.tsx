import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Node data structure
export interface CareerNodeData {
  label: string;
  type: 'current' | 'goal' | 'milestone' | 'education' | 'decision' | 'risk';
  timeline?: string;
  requirements?: string[];
  salaryRange?: { min: number; max: number };
  location?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  progress?: number;
  notes?: string;
  resources?: { title: string; url: string }[];
}

// Icon mapping for node types
const nodeIcons = {
  current: '◆',
  goal: '◎',
  milestone: '▣',
  education: '▤',
  decision: '◈',
  risk: '△',
};

// Color mapping for node types using CSS variables
const nodeColors = {
  current: { border: 'var(--color-cyan-30)', bg: 'var(--color-cyan-10)' },
  goal: { border: 'var(--color-success-30)', bg: 'var(--color-success-05)' },
  milestone: { border: 'var(--color-cyan-30)', bg: 'var(--color-cyan-05)' },
  education: { border: 'var(--color-special-30)', bg: 'var(--color-special-05)' },
  decision: { border: 'var(--color-warning-30)', bg: 'var(--color-warning-05)' },
  risk: { border: 'var(--color-danger-30)', bg: 'var(--color-danger-05)' },
};

// Base career node component
export const CareerNode: React.FC<NodeProps<CareerNodeData>> = ({ data, selected }) => {
  const [hover, setHover] = React.useState(false);
  const nodeType = data.type || 'goal';
  const colors = nodeColors[nodeType];

  return (
    <div 
      className={`career-node ${selected ? 'selected' : ''} ${hover ? 'hover' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ minWidth: '240px' }}
    >
      {/* Invisible handles for floating connections */}
      <Handle 
        type="source" 
        position={Position.Top} 
        style={{ background: 'transparent', border: 'none', width: '100%', height: '100%', top: 0, transform: 'none' }}
        isConnectable={true}
      />
      <Handle 
        type="target" 
        position={Position.Top}
        style={{ background: 'transparent', border: 'none', width: '100%', height: '100%', top: 0, transform: 'none' }}
        isConnectable={true}
      />
      
      <div 
        className="node-gradient-border"
        style={{ 
          borderColor: colors.border,
          backgroundColor: hover ? colors.bg : 'transparent',
        }}
      >
        <div className="node-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="node-icon" style={{ fontSize: '28px' }}>
              {nodeIcons[nodeType]}
            </div>
            <div className="node-content" style={{ flex: 1, textAlign: 'left' }}>
              <div className="node-title">{data.label || 'New Node'}</div>
              {data.timeline && (
                <div className="node-subtitle" style={{ fontSize: '11px', marginTop: '2px' }}>
                  {data.timeline}
                </div>
              )}
            </div>
          </div>
          
          {data.salaryRange && (
            <div style={{ 
              fontSize: '11px', 
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '8px'
            }}>
              ${(data.salaryRange.min / 1000).toFixed(0)}k - ${(data.salaryRange.max / 1000).toFixed(0)}k
            </div>
          )}
          
          {data.progress !== undefined && (
            <div className="node-progress">
              <div className="progress-bar" style={{ width: `${data.progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Junction node for branching paths
export const JunctionNode: React.FC<NodeProps> = ({ selected }) => {
  return (
    <div 
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'rgba(20, 24, 38, 0.95)',
        border: `2px solid ${selected ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Invisible handles covering entire node */}
      <Handle 
        type="source" 
        position={Position.Top} 
        style={{ background: 'transparent', border: 'none', width: '100%', height: '100%', top: 0, transform: 'none' }}
      />
      <Handle 
        type="target" 
        position={Position.Top}
        style={{ background: 'transparent', border: 'none', width: '100%', height: '100%', top: 0, transform: 'none' }}
      />
      
      <div style={{ 
        width: '8px', 
        height: '8px', 
        borderRadius: '50%', 
        background: 'rgba(255, 255, 255, 0.6)' 
      }} />
    </div>
  );
};

// Export all node types
export const nodeTypes = {
  career: CareerNode,
  junction: JunctionNode,
};