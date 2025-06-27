import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeProps, Position, Handle } from '@xyflow/react';

interface TooltipNodeProps {
  children: React.ReactNode;
  selected?: boolean;
  onContentChange?: (triggerText: string, tooltipText: string) => void;
}

interface TooltipContentProps {
  children: React.ReactNode;
  position: Position;
  isEditing?: boolean;
  onEdit?: (text: string) => void;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  isEditing?: boolean;
  onEdit?: (text: string) => void;
}

export const TooltipNode: React.FC<TooltipNodeProps> = ({ children, selected, onContentChange }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [editMode, setEditMode] = useState<'none' | 'trigger' | 'content'>('none');
  const [triggerText, setTriggerText] = useState('Hover');
  const [tooltipText, setTooltipText] = useState('Hidden Content');
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      if (clickCountRef.current === 2) {
        setEditMode('trigger');
        setIsHovered(false);
      } else if (clickCountRef.current === 3) {
        setEditMode('content');
        setIsHovered(true);
      }
      clickCountRef.current = 0;
    }, 300);
  };

  const handleTriggerEdit = (text: string) => {
    setTriggerText(text);
    if (onContentChange) {
      onContentChange(text, tooltipText);
    }
  };

  const handleTooltipEdit = (text: string) => {
    setTooltipText(text);
    if (onContentChange) {
      onContentChange(triggerText, text);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (editMode !== 'none') {
        setEditMode('none');
        // Hide tooltip when done editing tooltip content
        if (editMode === 'content') {
          setIsHovered(false);
        }
      }
    };

    if (editMode !== 'none') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editMode]);

  return (
    <div 
      className={`tooltip-node ${selected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        // Don't hide tooltip if we're editing it
        if (editMode !== 'content') {
          setIsHovered(false);
        }
      }}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} />
      <div className="tooltip-node-wrapper">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const props: any = { isHovered };
            
            if (child.type === TooltipContent) {
              props.isEditing = editMode === 'content';
              props.onEdit = handleTooltipEdit;
              props.text = tooltipText;
            } else if (child.type === TooltipTrigger) {
              props.isEditing = editMode === 'trigger';
              props.onEdit = handleTriggerEdit;
              props.text = triggerText;
            }
            
            return React.cloneElement(child as React.ReactElement<any>, props);
          }
          return child;
        })}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export const TooltipContent: React.FC<TooltipContentProps & { 
  isHovered?: boolean;
  text?: string;
}> = ({ 
  children, 
  position, 
  isHovered,
  isEditing,
  onEdit,
  text
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [localText, setLocalText] = useState(text || children?.toString() || '');

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // Auto-resize textarea
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalText(text || children?.toString() || '');
  }, [text, children]);

  if (!isHovered && !isEditing) return null;

  const positionClasses = {
    [Position.Top]: 'tooltip-content-top',
    [Position.Bottom]: 'tooltip-content-bottom',
    [Position.Left]: 'tooltip-content-left',
    [Position.Right]: 'tooltip-content-right',
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
    if (onEdit) {
      onEdit(e.target.value);
    }
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Trigger click outside to finish editing
      document.dispatchEvent(new MouseEvent('mousedown'));
    }
  };

  return (
    <div className={`tooltip-content ${positionClasses[position]} ${isEditing ? 'editing' : ''}`}>
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={localText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="tooltip-edit-input"
          rows={1}
        />
      ) : (
        localText
      )}
    </div>
  );
};

export const TooltipTrigger: React.FC<TooltipTriggerProps & { 
  isEditing?: boolean;
  text?: string;
}> = ({ 
  children, 
  isEditing, 
  onEdit,
  text
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localText, setLocalText] = useState(text || children?.toString() || '');

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalText(text || children?.toString() || '');
  }, [text, children]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalText(e.target.value);
    if (onEdit) {
      onEdit(e.target.value);
    }
  };

  return (
    <div className="tooltip-trigger">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={localText}
          onChange={handleChange}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="trigger-edit-input"
        />
      ) : (
        localText
      )}
    </div>
  );
};

// Demo component for the node type
const TooltipNodeDemo = memo(({ selected }: NodeProps) => {
  const handleContentChange = (trigger: string, tooltip: string) => {
    // This would normally update the node data in the parent
    console.log('Content changed:', { trigger, tooltip });
  };

  return (
    <TooltipNode selected={selected} onContentChange={handleContentChange}>
      <TooltipContent position={Position.Top}>Hidden Content</TooltipContent>
      <TooltipTrigger>Hover</TooltipTrigger>
    </TooltipNode>
  );
});

export default TooltipNodeDemo;