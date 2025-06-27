import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection
} from '@xyflow/react';
 
import '@xyflow/react/dist/style.css';
import './CareerPlanner.css';

// Import custom node types
import TooltipNodeDemo from './nodes/TooltipNode';
import PlaceholderNodeDemo from './nodes/PlaceholderNode';
import DatabaseSchemaDemo from './nodes/DatabaseSchemaNode';
import AnnotationNodeDemo from './nodes/AnnotationNode';
import './nodes/TooltipNode.css';
import './nodes/PlaceholderNode.css';
import './nodes/DatabaseSchemaNode.css';
import './nodes/AnnotationNode.css';
 
const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
  { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

// Define available node types for the menu
const nodeTypeOptions = [
  { id: 'tooltip', label: 'Tooltip', icon: '◉' },
  { id: 'placeholder', label: 'Placeholder', icon: '□' },
  { id: 'database', label: 'Database Schema', icon: '▤' },
  { id: 'annotation', label: 'Annotation', icon: '✎' },
  { id: 'group', label: 'Group with Label', icon: '▣' },
  { id: 'header', label: 'Node Header', icon: '▬' },
  { id: 'base', label: 'Base Node', icon: '●' },
  { id: 'status', label: 'Node Status Indicator', icon: '◈' }
];

// Define React Flow node types
const nodeTypes = {
  tooltipNode: TooltipNodeDemo,
  placeholderNode: PlaceholderNodeDemo,
  databaseNode: DatabaseSchemaDemo,
  annotationNode: AnnotationNodeDemo,
};
 
// Add window interface for career communication
declare global {
  interface Window {
    careerToAdd?: any;
  }
}

export default function CareerPlanner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [nodeCounter, setNodeCounter] = useState(3);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  
  // Listen for career additions from parent
  useEffect(() => {
    const checkForCareer = () => {
      if (window.careerToAdd) {
        const career = window.careerToAdd;
        const newNode = {
          id: `career-${career.code}`,
          position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 50 },
          data: { 
            label: career.code,
            trigger: career.title || career.code,
            content: career.description || 'Career node'
          },
          type: 'tooltipNode'
        };
        setNodes((nds) => [...nds.filter(n => n.id !== `career-${career.code}`), newNode]);
        window.careerToAdd = null;
      }
    };
    
    // Check periodically for new careers to add
    const interval = setInterval(checkForCareer, 500);
    return () => clearInterval(interval);
  }, [setNodes]);
 
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Handle node selection
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: any[] }) => {
    setSelectedNodes(selectedNodes.map(n => n.id));
  }, []);

  // Handle keyboard events for deletion
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodes.length > 0) {
        setNodes((nds) => nds.filter((node) => !selectedNodes.includes(node.id)));
        setEdges((eds) => eds.filter((edge) => !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target)));
        setSelectedNodes([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, setNodes, setEdges]);

  const addNode = (typeId: string) => {
    let nodeData: any = { label: `Node ${nodeCounter}` };
    
    // Add specific data for different node types
    if (typeId === 'database') {
      nodeData = {
        label: 'Career Skills',
        schema: [
          { name: 'skill_id', type: 'INTEGER', key: true },
          { name: 'skill_name', type: 'VARCHAR(100)' },
          { name: 'category', type: 'VARCHAR(50)' },
          { name: 'proficiency', type: 'INTEGER' },
          { name: 'years_exp', type: 'DECIMAL(3,1)' }
        ]
      };
    } else if (typeId === 'annotation') {
      nodeData = {
        number: `${nodeCounter}.`,
        content: 'Add your annotation here...\n- Use **bold** for emphasis\n- Use *italic* for notes\n- Start lines with - for lists',
        variant: 'note'
      };
    }
    
    const newNode = {
      id: `${nodeCounter}`,
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: nodeData,
      type: typeId === 'tooltip' ? 'tooltipNode' : 
            typeId === 'placeholder' ? 'placeholderNode' :
            typeId === 'database' ? 'databaseNode' :
            typeId === 'annotation' ? 'annotationNode' :
            undefined
    };
    setNodes((nds) => [...nds, newNode]);
    setNodeCounter(nodeCounter + 1);
    setShowNodeMenu(false);
  };
 
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        deleteKeyCode={['Delete', 'Backspace']}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
      
      {/* Node Creation UI */}
      <div className="node-creation-ui">
        <button 
          className="node-button"
          onClick={() => setShowNodeMenu(!showNodeMenu)}
        >
          <span className="node-button-icon">+</span>
          <span className="node-button-text">Node</span>
        </button>
        
        {showNodeMenu && (
          <div className="node-menu">
            {nodeTypeOptions.map((type) => (
              <button
                key={type.id}
                className="node-menu-item"
                onClick={() => addNode(type.id)}
              >
                <span className="node-menu-icon">{type.icon}</span>
                <span className="node-menu-label">{type.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}