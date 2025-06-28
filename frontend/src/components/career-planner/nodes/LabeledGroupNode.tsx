import React, { memo, forwardRef, useState, useRef, useEffect } from 'react';
import { NodeProps, useReactFlow } from '@xyflow/react';
import './LabeledGroupNode.css';

// Types
type GroupVariant = 'default' | 'skills' | 'education' | 'career-phase' | 'department';

interface LabeledGroupNodeProps {
  selected?: boolean;
  label?: string;
  variant?: GroupVariant;
  collapsed?: boolean;
  onLabelChange?: (label: string) => void;
  childCount?: number;
}

// Utility function for className concatenation
const cn = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Base Labeled Group Node - Note: No handles for group nodes
export const LabeledGroupNode = forwardRef<HTMLDivElement, LabeledGroupNodeProps>(
  ({ selected, label = 'Group', variant = 'default', collapsed = false, onLabelChange, childCount = 0 }, ref) => {
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [editValue, setEditValue] = useState(label);
    const [isCollapsed, setIsCollapsed] = useState(collapsed);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isEditingLabel && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditingLabel]);

    const handleSaveLabel = () => {
      if (onLabelChange) {
        onLabelChange(editValue);
      }
      setIsEditingLabel(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSaveLabel();
      } else if (e.key === 'Escape') {
        setEditValue(label);
        setIsEditingLabel(false);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.stopPropagation();
      }
    };

    const toggleCollapse = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsCollapsed(!isCollapsed);
    };

    return (
      <div 
        ref={ref} 
        className={cn(
          'labeled-group-node',
          `group-${variant}`,
          selected && 'selected',
          isCollapsed && 'collapsed'
        )}
      >
        {/* Group Header */}
        <div className="group-header">
          <div className="group-label-section">
            {isEditingLabel ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveLabel}
                onKeyDown={handleKeyDown}
                className="group-label-input"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span 
                className="group-label"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingLabel(true);
                }}
              >
                {label}
              </span>
            )}
            {childCount > 0 && (
              <span className="child-count">{childCount}</span>
            )}
          </div>
          <button 
            className="collapse-toggle"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand group" : "Collapse group"}
          >
            {isCollapsed ? '+' : '−'}
          </button>
        </div>
        
        {/* Group Body */}
        {!isCollapsed && (
          <div className="group-body">
            <div className="drop-hint">
              Drop nodes here to add to group
            </div>
          </div>
        )}
      </div>
    );
  }
);

LabeledGroupNode.displayName = 'LabeledGroupNode';

// Demo component
const LabeledGroupNodeDemo = memo(({ id, data, selected }: NodeProps) => {
  const { setNodes, getNodes } = useReactFlow();
  const nodeData = data as any;
  
  const [label, setLabel] = useState(nodeData?.label || 'New Group');
  const [variant, setVariant] = useState<GroupVariant>(nodeData?.variant || 'default');
  const [childNodes, setChildNodes] = useState<string[]>([]);

  // Count child nodes
  useEffect(() => {
    const nodes = getNodes();
    const children = nodes.filter(node => (node as any).parentNode === id);
    setChildNodes(children.map(n => n.id));
  }, [id, getNodes]);

  // Update node data when label changes
  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    setNodes((nodes) => 
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel
            }
          };
        }
        return node;
      })
    );
  };

  // Cycle through variants on double-click
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      const variants: GroupVariant[] = ['default', 'skills', 'education', 'career-phase', 'department'];
      const currentIndex = variants.indexOf(variant);
      const nextVariant = variants[(currentIndex + 1) % variants.length];
      setVariant(nextVariant);
      
      setNodes((nodes) => 
        nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                variant: nextVariant
              }
            };
          }
          return node;
        })
      );
    }
  };

  // This node is configured as a group node in React Flow
  // It should have: type: 'group', style: { width, height }
  return (
    <div onDoubleClick={handleDoubleClick}>
      <LabeledGroupNode 
        selected={selected}
        label={label}
        variant={variant}
        onLabelChange={handleLabelChange}
        childCount={childNodes.length}
      />
    </div>
  );
});

export default LabeledGroupNodeDemo;