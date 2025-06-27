import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import './PlaceholderNode.css';

interface PlaceholderNodeProps {
  id: string;
  selected?: boolean;
  children?: React.ReactNode;
}

export const PlaceholderNode: React.FC<PlaceholderNodeProps> = ({ id, selected, children }) => {
  const { setNodes, setEdges } = useReactFlow();

  const handleClick = useCallback(() => {
    if (!id) return;

    // Stop animation on edges targeting this node
    setEdges((edges) =>
      edges.map((edge) =>
        edge.target === id ? { ...edge, animated: false } : edge
      )
    );

    // Transform this placeholder into a default node
    setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, label: 'Node' },
            type: 'default',
          };
        }
        return node;
      });
    });
  }, [id, setEdges, setNodes]);

  return (
    <div 
      className={`placeholder-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} />
      <div className="placeholder-node-content">
        {children || <div className="placeholder-icon">+</div>}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const PlaceholderNodeDemo = memo(({ id, selected }: NodeProps) => {
  return (
    <PlaceholderNode id={id} selected={selected}>
      <div className="placeholder-icon">+</div>
    </PlaceholderNode>
  );
});

export default PlaceholderNodeDemo;