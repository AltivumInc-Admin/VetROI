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
import './nodes/TooltipNode.css';
import './nodes/PlaceholderNode.css';
 
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

  const addNode = (typeId: string) => {
    const newNode = {
      id: `${nodeCounter}`,
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: { label: `Node ${nodeCounter}` },
      type: typeId === 'tooltip' ? 'tooltipNode' : 
            typeId === 'placeholder' ? 'placeholderNode' :
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