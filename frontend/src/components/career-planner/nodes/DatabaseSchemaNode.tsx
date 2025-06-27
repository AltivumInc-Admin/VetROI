import React, { memo, forwardRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
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

// Demo component with sample data
const DatabaseSchemaDemo = memo(({ data, selected }: NodeProps) => {
  // Default schema if none provided
  const defaultSchema: SchemaField[] = [
    { name: 'id', type: 'INTEGER', key: true },
    { name: 'name', type: 'VARCHAR(255)' },
    { name: 'created_at', type: 'TIMESTAMP' }
  ];

  const nodeData = data as any;
  const schema = nodeData?.schema || defaultSchema;
  const tableName = nodeData?.label || 'Table';

  return (
    <DatabaseSchemaNode selected={selected}>
      <DatabaseSchemaNodeHeader>{tableName}</DatabaseSchemaNodeHeader>
      <DatabaseSchemaNodeBody>
        {schema.map((field: SchemaField, index: number) => (
          <DatabaseSchemaTableRow key={index} isKey={field.key}>
            <TableCell className="field-name">
              {field.key && <span className="key-icon">⚿ </span>}
              {field.name}
            </TableCell>
            <TableCell className="field-type">{field.type}</TableCell>
          </DatabaseSchemaTableRow>
        ))}
      </DatabaseSchemaNodeBody>
    </DatabaseSchemaNode>
  );
});

export default DatabaseSchemaDemo;