import React, { memo, useState } from 'react';
import { NodeProps, Position, Handle } from '@xyflow/react';

interface TooltipNodeProps {
  children: React.ReactNode;
  selected?: boolean;
}

interface TooltipContentProps {
  children: React.ReactNode;
  position: Position;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
}

export const TooltipNode: React.FC<TooltipNodeProps> = ({ children, selected }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`tooltip-node ${selected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="target" position={Position.Top} />
      <div className="tooltip-node-wrapper">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { isHovered });
          }
          return child;
        })}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export const TooltipContent: React.FC<TooltipContentProps & { isHovered?: boolean }> = ({ 
  children, 
  position, 
  isHovered 
}) => {
  if (!isHovered) return null;

  const positionClasses = {
    [Position.Top]: 'tooltip-content-top',
    [Position.Bottom]: 'tooltip-content-bottom',
    [Position.Left]: 'tooltip-content-left',
    [Position.Right]: 'tooltip-content-right',
  };

  return (
    <div className={`tooltip-content ${positionClasses[position]}`}>
      {children}
    </div>
  );
};

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children }) => {
  return <div className="tooltip-trigger">{children}</div>;
};

// Demo component for the node type
const TooltipNodeDemo = memo(({ selected }: NodeProps) => {
  return (
    <TooltipNode selected={selected}>
      <TooltipContent position={Position.Top}>Hidden Content</TooltipContent>
      <TooltipTrigger>Hover</TooltipTrigger>
    </TooltipNode>
  );
});

export default TooltipNodeDemo;