import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/CareerMapCanvas.css';

interface Node {
  id: string;
  x: number;
  y: number;
  text: string;
  selected?: boolean;
}

interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

interface CanvasState {
  nodes: Node[];
  connections: Connection[];
  offset: { x: number; y: number };
  scale: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  selectedNodeId: string | null;
  connectingFromNodeId: string | null;
  editingNodeId: string | null;
  editingText: string;
}

const STORAGE_KEY = 'careerMapData';

export const CareerMapCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Load initial state from localStorage
  const loadInitialState = (): CanvasState => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return {
          nodes: parsed.nodes || [],
          connections: parsed.connections || [],
          offset: parsed.offset || { x: 0, y: 0 },
          scale: parsed.scale || 1,
          isDragging: false,
          dragStart: { x: 0, y: 0 },
          selectedNodeId: null,
          connectingFromNodeId: null,
          editingNodeId: null,
          editingText: ''
        };
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    }
    
    return {
      nodes: [],
      connections: [],
      offset: { x: 0, y: 0 },
      scale: 1,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      selectedNodeId: null,
      connectingFromNodeId: null,
      editingNodeId: null,
      editingText: ''
    };
  };
  
  const [state, setState] = useState<CanvasState>(loadInitialState);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      nodes: state.nodes,
      connections: state.connections,
      offset: state.offset,
      scale: state.scale
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [state.nodes, state.connections, state.offset, state.scale]);

  // Draw dot grid background
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    const gridSize = 20;
    ctx.fillStyle = '#e0e0e0';
    
    // Apply transformations for grid
    ctx.save();
    ctx.translate(state.offset.x, state.offset.y);
    ctx.scale(state.scale, state.scale);

    // Calculate visible grid area
    const startX = Math.floor(-state.offset.x / state.scale / gridSize) * gridSize;
    const endX = Math.ceil((width - state.offset.x) / state.scale / gridSize) * gridSize;
    const startY = Math.floor(-state.offset.y / state.scale / gridSize) * gridSize;
    const endY = Math.ceil((height - state.offset.y) / state.scale / gridSize) * gridSize;

    // Draw dots
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }, [state.offset, state.scale]);

  // Draw arrow between two points
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 10;
    const headAngle = Math.PI / 6;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Draw the line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    
    // Create a curved path
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const offsetX = (toY - fromY) * 0.2;
    const offsetY = (fromX - toX) * 0.2;
    
    ctx.quadraticCurveTo(midX + offsetX, midY + offsetY, toX, toY);
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - headAngle),
      toY - headLength * Math.sin(angle - headAngle)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + headAngle),
      toY - headLength * Math.sin(angle + headAngle)
    );
    ctx.stroke();
  };

  // Draw connections
  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.translate(state.offset.x, state.offset.y);
    ctx.scale(state.scale, state.scale);
    
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    
    state.connections.forEach(conn => {
      const fromNode = state.nodes.find(n => n.id === conn.fromNodeId);
      const toNode = state.nodes.find(n => n.id === conn.toNodeId);
      
      if (fromNode && toNode) {
        // Calculate edge points
        const nodeRadius = 30;
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
        
        const fromX = fromNode.x + nodeRadius * Math.cos(angle);
        const fromY = fromNode.y + nodeRadius * Math.sin(angle);
        const toX = toNode.x - nodeRadius * Math.cos(angle);
        const toY = toNode.y - nodeRadius * Math.sin(angle);
        
        drawArrow(ctx, fromX, fromY, toX, toY);
      }
    });
    
    ctx.restore();
  }, [state.connections, state.nodes, state.offset, state.scale]);

  // Draw nodes
  const drawNodes = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.translate(state.offset.x, state.offset.y);
    ctx.scale(state.scale, state.scale);

    state.nodes.forEach(node => {
      const isEditing = node.id === state.editingNodeId;
      const isSelected = node.selected || node.id === state.selectedNodeId;
      
      // Determine text to display
      let displayText = '';
      if (isEditing) {
        displayText = state.editingText || '';
      } else if (!node.text) {
        displayText = 'Double-click to edit';
      } else {
        displayText = node.text;
      }
      
      // Measure text for dynamic width
      const padding = 20;
      ctx.font = '14px Inter, system-ui, sans-serif';
      const textMetrics = ctx.measureText(displayText);
      const minWidth = 120; // Minimum width to ensure "Double-click to edit" fits
      const maxWidth = 300; // Maximum width to prevent nodes from being too wide
      let width = Math.max(minWidth, Math.min(maxWidth, textMetrics.width + padding * 2));
      const height = 40;
      
      // Add glow effect for editing nodes
      if (isEditing) {
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // Node background
      ctx.fillStyle = isEditing ? '#f0f9ff' : '#ffffff';
      ctx.strokeStyle = isEditing ? '#00ffff' : (isSelected ? '#ff6b6b' : '#00d4ff');
      ctx.lineWidth = isEditing ? 3 : (isSelected ? 3 : 2);

      // Draw rounded rectangle
      const radius = 5;
      ctx.beginPath();
      ctx.moveTo(node.x - width/2 + radius, node.y - height/2);
      ctx.lineTo(node.x + width/2 - radius, node.y - height/2);
      ctx.quadraticCurveTo(node.x + width/2, node.y - height/2, node.x + width/2, node.y - height/2 + radius);
      ctx.lineTo(node.x + width/2, node.y + height/2 - radius);
      ctx.quadraticCurveTo(node.x + width/2, node.y + height/2, node.x + width/2 - radius, node.y + height/2);
      ctx.lineTo(node.x - width/2 + radius, node.y + height/2);
      ctx.quadraticCurveTo(node.x - width/2, node.y + height/2, node.x - width/2, node.y + height/2 - radius);
      ctx.lineTo(node.x - width/2, node.y - height/2 + radius);
      ctx.quadraticCurveTo(node.x - width/2, node.y - height/2, node.x - width/2 + radius, node.y - height/2);
      ctx.closePath();
      
      ctx.fill();
      ctx.stroke();

      // Clear shadow after drawing the node background
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // Draw text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Set text style based on state
      if (isEditing) {
        // Show current editing text
        ctx.fillStyle = '#0088cc';
        ctx.font = '14px Inter, system-ui, sans-serif';
      } else if (!node.text) {
        // Show placeholder for empty nodes
        ctx.fillStyle = '#999';
        ctx.font = 'italic 14px Inter, system-ui, sans-serif';
      } else {
        // Show normal text
        ctx.fillStyle = '#1a1a1a';
        ctx.font = '14px Inter, system-ui, sans-serif';
      }
      
      // Truncate text if it's too long
      let finalText = displayText;
      const maxTextWidth = width - padding * 2;
      if (textMetrics.width > maxTextWidth) {
        // Truncate text with ellipsis
        const ellipsis = '...';
        const ellipsisWidth = ctx.measureText(ellipsis).width;
        let truncatedText = displayText;
        
        while (ctx.measureText(truncatedText).width + ellipsisWidth > maxTextWidth && truncatedText.length > 0) {
          truncatedText = truncatedText.slice(0, -1);
        }
        
        finalText = truncatedText + ellipsis;
      }
      
      ctx.fillText(finalText, node.x, node.y);
    });

    ctx.restore();
  }, [state.nodes, state.offset, state.scale, state.selectedNodeId, state.editingNodeId, state.editingText]);

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw connections
    drawConnections(ctx);

    // Draw nodes
    drawNodes(ctx);
  }, [drawGrid, drawConnections, drawNodes]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      render();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Render on state change
  useEffect(() => {
    render();
  }, [state, render]);

  // Get node at position
  const getNodeAtPosition = (x: number, y: number): Node | null => {
    const worldX = (x - state.offset.x) / state.scale;
    const worldY = (y - state.offset.y) / state.scale;
    
    // Create a temporary canvas context to measure text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.font = '14px Inter, system-ui, sans-serif';
    
    // Check nodes in reverse order (top to bottom)
    for (let i = state.nodes.length - 1; i >= 0; i--) {
      const node = state.nodes[i];
      
      // Calculate actual node dimensions
      const isEditing = node.id === state.editingNodeId;
      let displayText = '';
      if (isEditing) {
        displayText = state.editingText || '';
      } else if (!node.text) {
        displayText = 'Double-click to edit';
      } else {
        displayText = node.text;
      }
      
      const padding = 20;
      const textMetrics = ctx.measureText(displayText);
      const minWidth = 120;
      const maxWidth = 300;
      const nodeWidth = Math.max(minWidth, Math.min(maxWidth, textMetrics.width + padding * 2));
      const nodeHeight = 40;
      
      if (
        worldX >= node.x - nodeWidth / 2 &&
        worldX <= node.x + nodeWidth / 2 &&
        worldY >= node.y - nodeHeight / 2 &&
        worldY <= node.y + nodeHeight / 2
      ) {
        return node;
      }
    }
    
    return null;
  };

  // Focus input when editing starts
  useEffect(() => {
    if (state.editingNodeId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [state.editingNodeId]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedNodeId && !state.editingNodeId) {
          e.preventDefault();
          // Delete selected node and its connections
          setState(prev => ({
            ...prev,
            nodes: prev.nodes.filter(n => n.id !== prev.selectedNodeId),
            connections: prev.connections.filter(
              c => c.fromNodeId !== prev.selectedNodeId && c.toNodeId !== prev.selectedNodeId
            ),
            selectedNodeId: null,
            connectingFromNodeId: null
          }));
        }
      } else if (e.key === 'Escape') {
        // Cancel current operation
        setState(prev => ({
          ...prev,
          selectedNodeId: null,
          connectingFromNodeId: null,
          editingNodeId: null,
          editingText: ''
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedNodeId, state.editingNodeId]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 0) { // Left click
      const clickedNode = getNodeAtPosition(x, y);
      
      if (e.shiftKey && !clickedNode) {
        // Create new node
        const worldX = (x - state.offset.x) / state.scale;
        const worldY = (y - state.offset.y) / state.scale;
        
        const newNode: Node = {
          id: `node-${Date.now()}`,
          x: worldX,
          y: worldY,
          text: ''
        };

        setState(prev => ({
          ...prev,
          nodes: [...prev.nodes, newNode],
          selectedNodeId: newNode.id,
          connectingFromNodeId: null,
          editingNodeId: newNode.id,
          editingText: ''
        }));
      } else if (clickedNode) {
        // Handle node click
        if (state.connectingFromNodeId && state.connectingFromNodeId !== clickedNode.id) {
          // Complete connection
          const newConnection: Connection = {
            id: `conn-${Date.now()}`,
            fromNodeId: state.connectingFromNodeId,
            toNodeId: clickedNode.id
          };
          
          setState(prev => ({
            ...prev,
            connections: [...prev.connections, newConnection],
            connectingFromNodeId: null,
            selectedNodeId: clickedNode.id
          }));
        } else {
          // Select node and start potential connection
          setState(prev => ({
            ...prev,
            selectedNodeId: clickedNode.id,
            connectingFromNodeId: clickedNode.id
          }));
        }
      } else {
        // Click on empty space - start panning or deselect
        if (!e.shiftKey) {
          setState(prev => ({
            ...prev,
            isDragging: true,
            dragStart: { x: x - prev.offset.x, y: y - prev.offset.y },
            selectedNodeId: null,
            connectingFromNodeId: null
          }));
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setState(prev => ({
      ...prev,
      offset: {
        x: x - prev.dragStart.x,
        y: y - prev.dragStart.y
      }
    }));
  };

  const handleMouseUp = () => {
    setState(prev => ({ ...prev, isDragging: false }));
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedNode = getNodeAtPosition(x, y);

    if (clickedNode) {
      setState(prev => ({
        ...prev,
        editingNodeId: clickedNode.id,
        editingText: clickedNode.text
      }));
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const scaleFactor = 1.1;
    const scale = e.deltaY < 0 ? state.scale * scaleFactor : state.scale / scaleFactor;
    
    // Limit scale
    if (scale < 0.1 || scale > 5) return;

    setState(prev => ({ ...prev, scale }));
  };

  // Handle editing input
  const handleEditingSubmit = () => {
    if (state.editingNodeId) {
      setState(prev => ({
        ...prev,
        nodes: prev.nodes.map(node =>
          node.id === prev.editingNodeId
            ? { ...node, text: prev.editingText }
            : node
        ),
        editingNodeId: null,
        editingText: ''
      }));
    }
  };

  // Clear canvas
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
      setState({
        nodes: [],
        connections: [],
        offset: { x: 0, y: 0 },
        scale: 1,
        isDragging: false,
        dragStart: { x: 0, y: 0 },
        selectedNodeId: null,
        connectingFromNodeId: null,
        editingNodeId: null,
        editingText: ''
      });
    }
  };

  // Position the editing input over the node
  const getEditingInputStyle = (): React.CSSProperties | undefined => {
    if (!state.editingNodeId) return undefined;

    const node = state.nodes.find(n => n.id === state.editingNodeId);
    if (!node) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const rect = canvas.getBoundingClientRect();
    const x = node.x * state.scale + state.offset.x + rect.left;
    const y = node.y * state.scale + state.offset.y + rect.top;

    // Calculate dynamic width based on text content
    const minWidth = 120;
    const maxWidth = 300;
    const padding = 40; // Account for input padding
    const charWidth = 8; // Approximate character width
    const textWidth = Math.max(minWidth, Math.min(maxWidth, (state.editingText.length || 20) * charWidth + padding));

    return {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translate(-50%, -50%)',
      width: `${textWidth}px`,
      zIndex: 1001
    };
  };

  return (
    <div className="career-map-container">
      <div className="career-map-toolbar">
        <div className="toolbar-hint">
          Shift+Click to create node • Click to select • Double-click to edit • Delete key to remove • Click nodes to connect
        </div>
        <button className="clear-button" onClick={handleClear}>
          Clear Canvas
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="career-map-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      />
      {state.editingNodeId && (
        <>
          <div className="edit-overlay" onClick={handleEditingSubmit} />
          <input
            ref={inputRef}
            type="text"
            className="node-edit-input"
            value={state.editingText}
            onChange={e => setState(prev => ({ ...prev, editingText: e.target.value }))}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleEditingSubmit();
              } else if (e.key === 'Escape') {
                setState(prev => ({ ...prev, editingNodeId: null, editingText: '' }));
              }
            }}
            onBlur={handleEditingSubmit}
            style={getEditingInputStyle()}
            placeholder="Enter node text..."
            autoFocus
          />
        </>
      )}
    </div>
  );
};