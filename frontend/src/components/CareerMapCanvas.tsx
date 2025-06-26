import React, { useRef, useEffect, useState, useCallback } from 'react';
import '../styles/CareerMapCanvas.css';

interface Node {
  id: string;
  x: number;
  y: number;
  text: string;
}

interface CanvasState {
  nodes: Node[];
  offset: { x: number; y: number };
  scale: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
}

export const CareerMapCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<CanvasState>({
    nodes: [],
    offset: { x: 0, y: 0 },
    scale: 1,
    isDragging: false,
    dragStart: { x: 0, y: 0 }
  });

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

  // Draw nodes
  const drawNodes = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.translate(state.offset.x, state.offset.y);
    ctx.scale(state.scale, state.scale);

    state.nodes.forEach(node => {
      // Node background
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      
      const padding = 10;
      ctx.font = '14px Inter, system-ui, sans-serif';
      const textMetrics = ctx.measureText(node.text || 'New Node');
      const width = textMetrics.width + padding * 2;
      const height = 30;

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

      // Draw text
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.text || 'New Node', node.x, node.y);
    });

    ctx.restore();
  }, [state.nodes, state.offset, state.scale]);

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

    // Draw nodes
    drawNodes(ctx);
  }, [drawGrid, drawNodes]);

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

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 0) { // Left click
      if (e.shiftKey) {
        // Create new node
        const worldX = (x - state.offset.x) / state.scale;
        const worldY = (y - state.offset.y) / state.scale;
        
        const newNode: Node = {
          id: `node-${Date.now()}`,
          x: worldX,
          y: worldY,
          text: 'New Node'
        };

        setState(prev => ({
          ...prev,
          nodes: [...prev.nodes, newNode]
        }));
      } else {
        // Start panning
        setState(prev => ({
          ...prev,
          isDragging: true,
          dragStart: { x: x - prev.offset.x, y: y - prev.offset.y }
        }));
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

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const scaleFactor = 1.1;
    const scale = e.deltaY < 0 ? state.scale * scaleFactor : state.scale / scaleFactor;
    
    // Limit scale
    if (scale < 0.1 || scale > 5) return;

    setState(prev => ({ ...prev, scale }));
  };

  return (
    <div className="career-map-container">
      <div className="career-map-toolbar">
        <div className="toolbar-hint">
          Shift+Click to create node • Drag to pan • Scroll to zoom
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="career-map-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
};