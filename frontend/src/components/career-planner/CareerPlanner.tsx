import { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node
} from '@xyflow/react';
 
import '@xyflow/react/dist/style.css';
import './CareerPlanner.css';
 
const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
  { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

const nodeTypes = [
  { id: 'tooltip', label: 'Tooltip', icon: '◉' },
  { id: 'placeholder', label: 'Placeholder', icon: '□' },
  { id: 'database', label: 'Database Schema', icon: '▤' },
  { id: 'annotation', label: 'Annotation', icon: '✎' },
  { id: 'group', label: 'Group with Label', icon: '▣' },
  { id: 'header', label: 'Node Header', icon: '▬' },
  { id: 'base', label: 'Base Node', icon: '●' },
  { id: 'status', label: 'Node Status Indicator', icon: '◈' }
];
 
export default function CareerPlanner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [nodeCounter, setNodeCounter] = useState(3);
 
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${nodeCounter}`,
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: { label: `${type} ${nodeCounter}` }
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
            {nodeTypes.map((type) => (
              <button
                key={type.id}
                className="node-menu-item"
                onClick={() => addNode(type.label)}
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