import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import './PlaceholderNode.css';

interface PlaceholderNodeProps {
  selected?: boolean;
  children?: React.ReactNode;
}

export const PlaceholderNode: React.FC<PlaceholderNodeProps> = ({ selected, children }) => {
  return (
    <div className={`placeholder-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="placeholder-node-content">
        {children || <div className="placeholder-icon">+</div>}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const PlaceholderNodeDemo = memo(({ selected }: NodeProps) => {
  return (
    <PlaceholderNode selected={selected}>
      <div className="placeholder-icon">+</div>
    </PlaceholderNode>
  );
});

export default PlaceholderNodeDemo;