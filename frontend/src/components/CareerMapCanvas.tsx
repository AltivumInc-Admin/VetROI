import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Panel,
  ReactFlowProvider,
  MarkerType,
  ConnectionMode,
  useReactFlow,
  reconnectEdge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '../styles/CareerMapCanvas.css';

// Import custom components
import FloatingEdge from './career-map/FloatingEdge';
import FloatingConnectionLine from './career-map/FloatingConnectionLine';
import { nodeTypes, CareerNodeData } from './career-map/node-types';

// Define edge types
const edgeTypes = {
  floating: FloatingEdge,
};

// Helper function to create a new node
const createNode = (
  id: string, 
  position: { x: number; y: number }, 
  type: CareerNodeData['type'],
  label: string
): Node<CareerNodeData> => ({
  id,
  type: 'career',
  position,
  data: {
    label,
    type,
    progress: 0,
  },
});

const CareerMapCanvasInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<CareerNodeData['type']>('goal');
  const [connectingNodes, setConnectingNodes] = useState<string[]>([]);
  const connectingNodeRef = useRef<string | null>(null);
  const edgeReconnectSuccessful = useRef(true);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('careerMapState');
    if (savedState) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedState);
        setNodes(savedNodes || []);
        setEdges(savedEdges || []);
        
        // Update node counter
        if (savedNodes && savedNodes.length > 0) {
          const maxId = Math.max(...savedNodes.map((n: Node) => {
            const match = n.id.match(/node-(\d+)/);
            return match ? parseInt(match[1]) : 0;
          }));
          setNodeIdCounter(maxId + 1);
        }
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    } else {
      // Create initial node
      const initialNode = createNode('node-0', { x: 100, y: 100 }, 'current', 'Current Position');
      setNodes([initialNode]);
    }
  }, [setNodes, setEdges]);

  // Save to localStorage on changes
  useEffect(() => {
    const state = { nodes, edges };
    localStorage.setItem('careerMapState', JSON.stringify(state));
  }, [nodes, edges]);

  // Listen for junction creation events
  useEffect(() => {
    const handleCreateJunction = (event: CustomEvent) => {
      const { edgeId, x, y } = event.detail;
      const edge = edges.find(e => e.id === edgeId);
      if (!edge) return;

      // Create junction node
      const junctionId = `junction-${Date.now()}`;
      const junctionNode: Node = {
        id: junctionId,
        type: 'junction',
        position: project({ x, y }),
        data: {},
      };

      // Split the edge
      const newEdge1: Edge = {
        id: `${edge.source}-${junctionId}`,
        source: edge.source,
        target: junctionId,
        type: 'floating',
        data: edge.data,
      };

      const newEdge2: Edge = {
        id: `${junctionId}-${edge.target}`,
        source: junctionId,
        target: edge.target,
        type: 'floating',
        data: edge.data,
      };

      // Update nodes and edges
      setNodes(nds => [...nds, junctionNode]);
      setEdges(eds => {
        const filtered = eds.filter(e => e.id !== edgeId);
        return [...filtered, newEdge1, newEdge2];
      });
    };

    window.addEventListener('createJunction', handleCreateJunction as EventListener);
    return () => {
      window.removeEventListener('createJunction', handleCreateJunction as EventListener);
    };
  }, [edges, project, setNodes, setEdges]);

  // Connection validation
  const isValidConnection = useCallback((connection: Connection) => {
    // Prevent self-connections
    if (connection.source === connection.target) return false;

    // Prevent duplicate connections
    const exists = edges.some(
      edge => 
        (edge.source === connection.source && edge.target === connection.target) ||
        (edge.source === connection.target && edge.target === connection.source)
    );
    if (exists) return false;

    // Check for circular dependencies (simplified)
    const wouldCreateCycle = (source: string, target: string): boolean => {
      const visited = new Set<string>();
      const queue = [target];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === source) return true;
        if (visited.has(current)) continue;
        visited.add(current);
        
        const outgoing = edges.filter(e => e.source === current);
        queue.push(...outgoing.map(e => e.target));
      }
      
      return false;
    };

    if (wouldCreateCycle(connection.source!, connection.target!)) {
      return false;
    }

    return true;
  }, [edges]);

  // Handle connection start
  const onConnectStart = useCallback((_: any, { nodeId }: any) => {
    connectingNodeRef.current = nodeId;
    
    // Highlight compatible nodes
    const compatibleNodes = nodes
      .filter(n => n.id !== nodeId && isValidConnection({ source: nodeId, target: n.id, sourceHandle: null, targetHandle: null }))
      .map(n => n.id);
    
    setConnectingNodes(compatibleNodes);
  }, [nodes, isValidConnection]);

  // Handle connection end
  const onConnectEnd = useCallback(() => {
    connectingNodeRef.current = null;
    setConnectingNodes([]);
  }, []);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (!isValidConnection(params)) return;
      
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'floating',
            markerEnd: { type: MarkerType.Arrow, color: 'rgba(255, 255, 255, 0.5)' },
            data: { timeline: '1-3 months' },
          },
          eds
        )
      );
    },
    [setEdges, isValidConnection]
  );

  // Handle edge reconnection
  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    if (!isValidConnection(newConnection)) return;
    edgeReconnectSuccessful.current = true;
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
  }, [isValidConnection, setEdges]);

  const onReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
    edgeReconnectSuccessful.current = true;
  }, [setEdges]);

  // Node changes handler with custom logic
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Filter out deletion of junction nodes if they have connections
      const filteredChanges = changes.filter(change => {
        if (change.type === 'remove') {
          const node = nodes.find(n => n.id === change.id);
          if (node?.type === 'junction') {
            const connections = edges.filter(e => e.source === change.id || e.target === change.id);
            if (connections.length > 2) return false; // Keep junction if it has more than 2 connections
          }
        }
        return true;
      });
      
      setNodes((nds) => applyNodeChanges(filteredChanges, nds));
    },
    [nodes, edges, setNodes]
  );

  // Edge changes handler
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  // Create new node on canvas click
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      // Mobile: Always create node on tap
      // Desktop: Only create if shift is held
      if (!isMobile && !event.shiftKey) return;

      const reactFlowBounds = reactFlowWrapper.current!.getBoundingClientRect();
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = createNode(
        `node-${nodeIdCounter}`,
        position,
        selectedNodeType,
        `New ${selectedNodeType}`
      );

      setNodes((nds) => nds.concat(newNode));
      setNodeIdCounter(nodeIdCounter + 1);
    },
    [nodeIdCounter, setNodes, isMobile, selectedNodeType, project]
  );

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      setNodes([]);
      setEdges([]);
      localStorage.removeItem('careerMapState');
      setNodeIdCounter(1);
    }
  };

  const handleExport = () => {
    const state = { nodes, edges };
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `career-map-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="career-map-flow-wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes.map(node => ({
          ...node,
          className: connectingNodes.includes(node.id) ? 'connectable-node' : '',
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onReconnectStart={onReconnectStart}
        onReconnect={onReconnect}
        onReconnectEnd={onReconnectEnd}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineComponent={FloatingConnectionLine}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={isValidConnection}
        fitView
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={isMobile ? [] : ['Delete', 'Backspace']}
        panOnScroll={!isMobile}
        zoomOnScroll={!isMobile}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        edgeUpdaterRadius={20}
        snapToGrid={true}
        snapGrid={[15, 15]}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={30} 
          size={2}
          color="rgba(255, 255, 255, 0.03)"
        />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'junction') return 'rgba(255, 255, 255, 0.3)';
            return 'rgba(255, 255, 255, 0.5)';
          }}
          style={{
            backgroundColor: 'rgba(10, 14, 26, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        />
        
        {/* Main Panel */}
        <Panel position="top-left" className="career-map-panel">
          <div className="toolbar-hint">
            {isMobile 
              ? 'Tap to create • Drag to connect • Hold to move'
              : 'Shift+Click to create • Drag to connect • Delete key to remove'
            }
          </div>
          
          {/* Node Type Selector */}
          <div style={{ 
            display: 'flex', 
            gap: '4px', 
            marginBottom: '8px',
            flexWrap: 'wrap'
          }}>
            {(['current', 'goal', 'milestone', 'education', 'decision', 'risk'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedNodeType(type)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  background: selectedNodeType === type ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div className="toolbar-buttons">
            <button className="export-button" onClick={handleExport}>
              Export
            </button>
            <button className="clear-button" onClick={handleClear}>
              Clear
            </button>
          </div>
        </Panel>
        
        {/* Connection hint panel */}
        {connectingNodeRef.current && (
          <Panel position="bottom-center" style={{ 
            background: 'rgba(20, 24, 38, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
          }}>
            Drag to a compatible node to create connection
          </Panel>
        )}
      </ReactFlow>
      
      <style>{`
        .connectable-node {
          animation: pulse 1s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { 
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
          }
          50% { 
            filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.5));
          }
        }
      `}</style>
    </div>
  );
};

export const CareerMapCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CareerMapCanvasInner />
    </ReactFlowProvider>
  );
};