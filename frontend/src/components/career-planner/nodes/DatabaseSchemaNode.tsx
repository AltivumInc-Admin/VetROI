import React, { memo, forwardRef, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import './DatabaseSchemaNode.css';

interface SchemaField {
  name: string;
  type: string;
  key?: boolean;
}

interface DatabaseSchemaNodeProps {
  selected?: boolean;
  children?: React.ReactNode;
}

interface DatabaseSchemaNodeHeaderProps {
  children: React.ReactNode;
}

interface DatabaseSchemaNodeBodyProps {
  children: React.ReactNode;
}

interface DatabaseSchemaTableRowProps {
  children: React.ReactNode;
  isKey?: boolean;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

// Base Database Schema Node
export const DatabaseSchemaNode = forwardRef<HTMLDivElement, DatabaseSchemaNodeProps>(
  ({ selected, children }, ref) => {
    return (
      <div ref={ref} className={`database-schema-node ${selected ? 'selected' : ''}`}>
        <Handle type="target" position={Position.Top} />
        {children}
        <Handle type="source" position={Position.Bottom} />
      </div>
    );
  }
);

DatabaseSchemaNode.displayName = 'DatabaseSchemaNode';

// Header Component
export const DatabaseSchemaNodeHeader: React.FC<DatabaseSchemaNodeHeaderProps> = ({ children }) => {
  return (
    <div className="database-schema-header">
      <span className="database-icon">▤</span>
      <span className="database-title">{children}</span>
    </div>
  );
};

// Body Component
export const DatabaseSchemaNodeBody: React.FC<DatabaseSchemaNodeBodyProps> = ({ children }) => {
  return <div className="database-schema-body">{children}</div>;
};

// Table Row Component
export const DatabaseSchemaTableRow: React.FC<DatabaseSchemaTableRowProps> = ({ children, isKey }) => {
  return (
    <div className={`database-schema-row ${isKey ? 'key-field' : ''}`}>
      {children}
    </div>
  );
};

// Table Cell Component
export const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
  return <div className={`table-cell ${className}`}>{children}</div>;
};

// Editable Table Cell Component
interface EditableTableCellProps {
  value: string;
  className?: string;
  onSave: (value: string) => void;
  placeholder?: string;
}

const EditableTableCell: React.FC<EditableTableCellProps> = ({ 
  value, 
  className = '', 
  onSave,
  placeholder = 'Enter value'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Prevent deletion of the node when editing
      e.stopPropagation();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`editable-input ${className}`}
        placeholder={placeholder}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div 
      className={`table-cell editable ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {value}
    </div>
  );
};

// Editable Header Component
const EditableHeader: React.FC<{ value: string; onSave: (value: string) => void }> = ({ 
  value, 
  onSave 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Prevent deletion of the node when editing
      e.stopPropagation();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="header-edit-input"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span 
      className="database-title editable"
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {value}
    </span>
  );
};

// Demo component with editable functionality
const DatabaseSchemaDemo = memo(({ id, data, selected }: NodeProps) => {
  const { setNodes } = useReactFlow();
  
  // Default schema if none provided
  const defaultSchema: SchemaField[] = [
    { name: 'id', type: 'INTEGER', key: true },
    { name: 'name', type: 'VARCHAR(255)' },
    { name: 'created_at', type: 'TIMESTAMP' }
  ];

  const nodeData = data as any;
  const [schema, setSchema] = useState<SchemaField[]>(nodeData?.schema || defaultSchema);
  const [tableName, setTableName] = useState(nodeData?.label || 'Table');

  // Update node data when schema or tableName changes
  const updateNodeData = (newSchema?: SchemaField[], newTableName?: string) => {
    setNodes((nodes) => 
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              schema: newSchema || schema,
              label: newTableName || tableName
            }
          };
        }
        return node;
      })
    );
  };

  const handleFieldNameChange = (index: number, newName: string) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], name: newName };
    setSchema(newSchema);
    updateNodeData(newSchema);
  };

  const handleFieldTypeChange = (index: number, newType: string) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], type: newType };
    setSchema(newSchema);
    updateNodeData(newSchema);
  };

  const handleTableNameChange = (newName: string) => {
    setTableName(newName);
    updateNodeData(undefined, newName);
  };

  const togglePrimaryKey = (index: number) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], key: !newSchema[index].key };
    setSchema(newSchema);
    updateNodeData(newSchema);
  };

  const addField = () => {
    const newField: SchemaField = {
      name: `field_${schema.length + 1}`,
      type: 'VARCHAR(50)'
    };
    const newSchema = [...schema, newField];
    setSchema(newSchema);
    updateNodeData(newSchema);
  };

  const removeField = (index: number) => {
    if (schema.length > 1) {
      const newSchema = schema.filter((_, i) => i !== index);
      setSchema(newSchema);
      updateNodeData(newSchema);
    }
  };

  return (
    <DatabaseSchemaNode selected={selected}>
      <div className="database-schema-header">
        <span className="database-icon">▤</span>
        <EditableHeader 
          value={tableName} 
          onSave={handleTableNameChange}
        />
      </div>
      <DatabaseSchemaNodeBody>
        {schema.map((field: SchemaField, index: number) => (
          <DatabaseSchemaTableRow key={index} isKey={field.key}>
            <div className="field-row-content">
              <button 
                className="key-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePrimaryKey(index);
                }}
                title="Toggle primary key"
              >
                {field.key ? '⚿' : '○'}
              </button>
              <EditableTableCell
                value={field.name}
                className="field-name"
                onSave={(value) => handleFieldNameChange(index, value)}
                placeholder="field_name"
              />
              <EditableTableCell
                value={field.type}
                className="field-type"
                onSave={(value) => handleFieldTypeChange(index, value)}
                placeholder="TYPE"
              />
              <button 
                className="remove-field"
                onClick={(e) => {
                  e.stopPropagation();
                  removeField(index);
                }}
                title="Remove field"
              >
                ×
              </button>
            </div>
          </DatabaseSchemaTableRow>
        ))}
        <button 
          className="add-field-btn"
          onClick={(e) => {
            e.stopPropagation();
            addField();
          }}
        >
          + Add Field
        </button>
      </DatabaseSchemaNodeBody>
    </DatabaseSchemaNode>
  );
});

export default DatabaseSchemaDemo;