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
import LabeledGroupNodeDemo from './nodes/LabeledGroupNode';
import './nodes/TooltipNode.css';
import './nodes/PlaceholderNode.css';
import './nodes/DatabaseSchemaNode.css';
import './nodes/AnnotationNode.css';
import './nodes/LabeledGroupNode.css';
 
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
  group: LabeledGroupNodeDemo,
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
    let nodeStyle: any = {};
    let nodeType = undefined;
    
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
      nodeType = 'databaseNode';
    } else if (typeId === 'annotation') {
      nodeData = {
        number: `${nodeCounter}.`,
        content: 'Add your annotation here...\n- Use **bold** for emphasis\n- Use *italic* for notes\n- Start lines with - for lists',
        variant: 'note'
      };
      nodeType = 'annotationNode';
    } else if (typeId === 'group') {
      nodeData = {
        label: 'New Group',
        variant: 'default'
      };
      nodeType = 'group';
      // Groups need explicit width/height for React Flow
      nodeStyle = {
        width: 400,
        height: 300,
        backgroundColor: 'rgba(13, 17, 33, 0.3)',
        zIndex: -1  // Groups should be behind other nodes
      };
    } else if (typeId === 'tooltip') {
      nodeType = 'tooltipNode';
    } else if (typeId === 'placeholder') {
      nodeType = 'placeholderNode';
    }
    
    const newNode: any = {
      id: `${nodeCounter}`,
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: nodeData,
      type: nodeType
    };
    
    // Add style if needed (for group nodes)
    if (Object.keys(nodeStyle).length > 0) {
      newNode.style = nodeStyle;
    }
    
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
        fitView
        nodesDraggable
        nodesConnectable
        nodesFocusable
        onNodeDragStop={(_event, node) => {
          // Don't process if this is a group node
          if ((node as any).type === 'group') return;
          
          // Small delay to ensure positions are updated
          setTimeout(() => {
            // Get the latest nodes state
            setNodes((currentNodes) => {
              const groupNodes = currentNodes.filter(n => (n as any).type === 'group');
              let nodeUpdated = false;
              
              const updatedNodes = currentNodes.map((n) => {
                if (n.id === node.id) {
                  // Check each group
                  for (const group of groupNodes) {
                    if (group.id === node.id) continue;
                    
                    const groupBounds = {
                      x: group.position.x,
                      y: group.position.y,
                      width: (group as any).style?.width || 400,
                      height: (group as any).style?.height || 300
                    };
                    
                    // Use node's actual position
                    const nodeX = node.position.x;
                    const nodeY = node.position.y;
                    
                    // Check if node is within group bounds
                    if (
                      nodeX >= groupBounds.x &&
                      nodeX <= groupBounds.x + groupBounds.width - 50 &&
                      nodeY >= groupBounds.y &&
                      nodeY <= groupBounds.y + groupBounds.height - 50
                    ) {
                      nodeUpdated = true;
                      // Add node to group
                      return {
                        ...n,
                        parentNode: group.id,
                        extent: 'parent' as const,
                        position: {
                          x: nodeX - groupBounds.x,
                          y: nodeY - groupBounds.y
                        },
                        expandParent: true
                      };
                    }
                  }
                  
                  // If not in any group but had a parent, remove parent
                  if (!nodeUpdated && (n as any).parentNode) {
                    const parent = currentNodes.find(p => p.id === (n as any).parentNode);
                    if (parent) {
                      const { parentNode, extent, expandParent, ...rest } = n as any;
                      return {
                        ...rest,
                        position: {
                          x: node.position.x,
                          y: node.position.y
                        }
                      };
                    }
                  }
                }
                return n;
              });
              
              return updatedNodes;
            });
          }, 50);
        }}
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