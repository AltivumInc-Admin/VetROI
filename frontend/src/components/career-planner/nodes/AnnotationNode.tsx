import React, { memo, forwardRef, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import './AnnotationNode.css';

// Types
type AnnotationVariant = 'note' | 'warning' | 'info' | 'success';

interface AnnotationNodeProps {
  selected?: boolean;
  children?: React.ReactNode;
  variant?: AnnotationVariant;
  className?: string;
}

interface AnnotationNodeNumberProps {
  children: React.ReactNode;
  editable?: boolean;
  onEdit?: (value: string) => void;
}

interface AnnotationNodeContentProps {
  children: React.ReactNode;
  editable?: boolean;
  onEdit?: (value: string) => void;
}

interface AnnotationNodeIconProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right';
}

// Utility function for className concatenation
const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Base Annotation Node
export const AnnotationNode = forwardRef<HTMLDivElement, AnnotationNodeProps>(
  ({ selected, children, variant = 'note', className }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn(
          'annotation-node',
          `annotation-${variant}`,
          selected ? 'selected' : '',
          className
        )}
      >
        <Handle type="target" position={Position.Top} />
        <div className="annotation-content-wrapper">
          {children}
        </div>
        <Handle type="source" position={Position.Bottom} />
      </div>
    );
  }
);

AnnotationNode.displayName = 'AnnotationNode';

// Annotation Number Component
export const AnnotationNodeNumber: React.FC<AnnotationNodeNumberProps> = ({ 
  children, 
  editable = true,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(children?.toString() || '1.');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (onEdit) onEdit(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(children?.toString() || '1.');
      setIsEditing(false);
    }
  };

  if (editable && isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="annotation-number-input"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div 
      className={cn('annotation-number', editable ? 'editable' : '')}
      onClick={(e) => {
        if (editable) {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
    >
      {value}
    </div>
  );
};

// Annotation Content Component
export const AnnotationNodeContent: React.FC<AnnotationNodeContentProps> = ({ 
  children, 
  editable = true,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(children?.toString() || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      // Auto-resize
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleSave = () => {
    if (onEdit) onEdit(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(children?.toString() || '');
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  if (editable && isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="annotation-content-input"
        onClick={(e) => e.stopPropagation()}
        placeholder="Enter annotation..."
        rows={1}
      />
    );
  }

  // Simple markdown-like rendering
  const renderContent = () => {
    const lines = value.split('\n');
    return lines.map((line, index) => {
      // Bold text
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={index}>{line.slice(2, -2)}</strong>;
      }
      // Italic text
      if (line.startsWith('*') && line.endsWith('*')) {
        return <em key={index}>{line.slice(1, -1)}</em>;
      }
      // List items
      if (line.startsWith('- ')) {
        return <div key={index} className="annotation-list-item">• {line.slice(2)}</div>;
      }
      return <div key={index}>{line}</div>;
    });
  };

  return (
    <div 
      className={cn('annotation-content', editable ? 'editable' : '')}
      onClick={(e) => {
        if (editable) {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
    >
      {renderContent()}
    </div>
  );
};

// Annotation Icon Component
export const AnnotationNodeIcon: React.FC<AnnotationNodeIconProps> = ({ 
  children, 
  direction = 'down-right' 
}) => {
  const getArrow = () => {
    switch (direction) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'left': return '←';
      case 'right': return '→';
      case 'up-left': return '↖';
      case 'up-right': return '↗';
      case 'down-left': return '↙';
      case 'down-right': return '↘';
      default: return children;
    }
  };

  return (
    <div className={`annotation-icon arrow-${direction}`}>
      {getArrow()}
    </div>
  );
};

// Demo component
const AnnotationNodeDemo = memo(({ id, data, selected }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const nodeData = data as any;
  
  const [number, setNumber] = useState(nodeData?.number || '1.');
  const [content, setContent] = useState(nodeData?.content || 'Add your annotation here...');
  const [variant, setVariant] = useState<AnnotationVariant>(nodeData?.variant || 'note');

  // Update node data when content changes
  const updateNodeData = (updates: any) => {
    setNodes((nodes) => 
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates
            }
          };
        }
        return node;
      })
    );
  };

  const handleNumberEdit = (value: string) => {
    setNumber(value);
    updateNodeData({ number: value });
  };

  const handleContentEdit = (value: string) => {
    setContent(value);
    updateNodeData({ content: value });
  };

  // Cycle through variants on double-click
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      const variants: AnnotationVariant[] = ['note', 'warning', 'info', 'success'];
      const currentIndex = variants.indexOf(variant);
      const nextVariant = variants[(currentIndex + 1) % variants.length];
      setVariant(nextVariant);
      updateNodeData({ variant: nextVariant });
    }
  };

  return (
    <AnnotationNode 
      selected={selected} 
      variant={variant}
      className="annotation-demo"
    >
      <div className="annotation-layout" onDoubleClick={handleDoubleClick}>
        <AnnotationNodeNumber 
          editable={true}
          onEdit={handleNumberEdit}
        >
          {number}
        </AnnotationNodeNumber>
        <AnnotationNodeContent 
          editable={true}
          onEdit={handleContentEdit}
        >
          {content}
        </AnnotationNodeContent>
        <AnnotationNodeIcon direction="down-right">
          <span>↘</span>
        </AnnotationNodeIcon>
      </div>
    </AnnotationNode>
  );
});

export default AnnotationNodeDemo;