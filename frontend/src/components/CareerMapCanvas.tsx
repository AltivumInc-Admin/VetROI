import React, { useCallback, useRef } from 'react';
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
  NodeTypes,
  Handle,
  Position,
  getOutgoers,
  getIncomers,
  getConnectedEdges,
  MarkerType,
  EdgeTypes,
  EdgeProps,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '../styles/CareerMapCanvas.css';

// Custom node component with enhanced styling
const CareerNode = ({ data, selected }: any) => {
  const [hover, setHover] = React.useState(false);
  
  return (
    <div 
      className={`career-node ${selected ? 'selected' : ''} ${hover ? 'hover' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Handle 
        type="target" 
        position={Position.Left}
        className="career-handle career-handle-target"
      />
      <div className="node-gradient-border">
        <div className="node-inner">
          <div className="node-icon">🎯</div>
          <div className="node-content">
            <div className="node-title">{data.label || 'New Node'}</div>
            {data.subtitle && <div className="node-subtitle">{data.subtitle}</div>}
          </div>
          {data.progress && (
            <div className="node-progress">
              <div className="progress-bar" style={{ width: `${data.progress}%` }} />
            </div>
          )}
        </div>
      </div>
      <Handle 
        type="source" 
        position={Position.Right}
        className="career-handle career-handle-source"
      />
    </div>
  );
};

// Custom edge with animated gradient
const AnimatedEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan edge-label-wrapper"
        >
          <button className="edge-button">+</button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes: NodeTypes = {
  careerNode: CareerNode,
};

const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const CareerMapCanvasInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = React.useState(1);
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile device
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load from localStorage on mount
  React.useEffect(() => {
    const savedState = localStorage.getItem('careerMapState');
    if (savedState) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedState);
        setNodes(savedNodes || []);
        setEdges(savedEdges || []);
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, [setNodes, setEdges]);

  // Save to localStorage on changes
  React.useEffect(() => {
    const state = { nodes, edges };
    localStorage.setItem('careerMapState', JSON.stringify(state));
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      type: 'animated',
      animated: true,
      style: { stroke: '#00d4ff', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#00d4ff',
      },
    }, eds)),
    [setEdges]
  );

  // Mobile: Single tap to edit, Desktop: Double click
  const handleNodeEdit = useCallback(
    (node: Node) => {
      const newLabel = prompt('Enter node text:', node.data.label || '');
      if (newLabel !== null) {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  label: newLabel,
                },
              };
            }
            return n;
          })
        );
      }
    },
    [setNodes]
  );

  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!isMobile) {
        handleNodeEdit(node);
      }
    },
    [handleNodeEdit, isMobile]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (isMobile) {
        // On mobile, single tap edits the node
        handleNodeEdit(node);
      }
    },
    [handleNodeEdit, isMobile]
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      // Mobile: Always create node on tap
      // Desktop: Only create if shift is held
      if (!isMobile && !event.shiftKey) return;

      const reactFlowBounds = reactFlowWrapper.current!.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75, // Center the node
        y: event.clientY - reactFlowBounds.top - 20,
      };

      const newNode: Node = {
        id: `node-${nodeIdCounter}`,
        type: 'careerNode',
        position,
        data: { 
          label: `Node ${nodeIdCounter}`,
          subtitle: 'Click to edit',
          progress: 0,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setNodeIdCounter(nodeIdCounter + 1);

      // On mobile, immediately edit the new node
      if (isMobile) {
        setTimeout(() => {
          const newLabel = prompt('Enter node text:', `Node ${nodeIdCounter}`);
          if (newLabel !== null) {
            setNodes((nds) =>
              nds.map((n) => {
                if (n.id === newNode.id) {
                  return { ...n, data: { ...n.data, label: newLabel } };
                }
                return n;
              })
            );
          }
        }, 100);
      }
    },
    [nodeIdCounter, setNodes, isMobile]
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      setEdges(
        deleted.reduce((acc, node) => {
          const incomers = getIncomers(node, nodes, edges);
          const outgoers = getOutgoers(node, nodes, edges);
          const connectedEdges = getConnectedEdges([node], edges);

          const remainingEdges = acc.filter(
            (edge) => !connectedEdges.includes(edge)
          );

          const createdEdges = incomers.flatMap(({ id: source }) =>
            outgoers.map(({ id: target }) => ({
              id: `${source}->${target}`,
              source,
              target,
              animated: true,
            }))
          );

          return [...remainingEdges, ...createdEdges];
        }, edges)
      );
    },
    [nodes, edges, setEdges]
  );

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      setNodes([]);
      setEdges([]);
      localStorage.removeItem('careerMapState');
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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={isMobile ? [] : ['Delete', 'Backspace']}
        panOnScroll={!isMobile}
        zoomOnScroll={!isMobile}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={30} 
          size={2}
          color="rgba(0, 212, 255, 0.03)"
        />
        <Controls />
        <MiniMap 
          nodeColor={() => '#00d4ff'}
          style={{
            backgroundColor: 'rgba(10, 14, 26, 0.8)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
          }}
        />
        <Panel position="top-left" className="career-map-panel">
          <div className="toolbar-hint">
            {isMobile 
              ? 'Tap to create • Tap node to edit • Drag to connect'
              : 'Shift+Click to create • Double-click to edit • Delete key to remove • Drag to connect'
            }
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
      </ReactFlow>
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