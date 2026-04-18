import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { prepareGraphData } from './graphHelpers';

export default function GraphCanvas({ graphData, selectedNodeId, onNodeSelect, searchHighlights = [] }) {
  const fgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef();

  // Resize handler
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => prepareGraphData(graphData), [graphData]);

  // Zoom to node when selected via sidebar or search
  useEffect(() => {
    if (selectedNodeId && fgRef.current) {
      const node = data.nodes.find(n => n.id === selectedNodeId);
      if (node) {
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(4, 1000);
      }
    }
  }, [selectedNodeId, data.nodes]);

  const handleNodeClick = useCallback((node) => {
    fgRef.current.centerAt(node.x, node.y, 1000);
    fgRef.current.zoom(4, 1000);
    
    // Add fullPath so the sidebar knows the exact ID format it expects
    onNodeSelect({
      ...node,
      fullPath: node.id
    });
  }, [onNodeSelect]);

  const paintNode = useCallback((node, ctx, globalScale) => {
    const label = node.label;
    const isSelected = node.id === selectedNodeId;
    const isHighlighted = searchHighlights.length > 0 && searchHighlights.includes(node.id);
    const isFaded = searchHighlights.length > 0 && !isHighlighted;
    
    const size = node.val * 2.5; // Bigger nodes preserved
    const color = node.color;
    
    // Draw planet outer glow
    ctx.beginPath();
    ctx.arc(node.x, node.y, size * 1.5, 0, 2 * Math.PI, false);
    ctx.fillStyle = isSelected ? `${color}60` : `${color}20`; // Hex alpha
    ctx.fill();

    // Draw planet core
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = isFaded ? `${color}40` : color;
    
    if (isSelected || node.highImpact) {
      ctx.shadowColor = node.highImpact ? '#ef4444' : color;
      ctx.shadowBlur = node.highImpact ? 30 : 20;
    } else {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }
    
    ctx.fill();
    ctx.shadowBlur = 0; // reset
    ctx.shadowColor = "transparent"; // reset

    // Draw text (centered below planet)
    if (!isFaded) {
      const fontSize = isSelected ? 12 / globalScale : 8 / globalScale;
      ctx.font = `${fontSize}px Inter, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isSelected ? '#ffffff' : '#adaaaa';
      ctx.fillText(label, node.x, node.y + size + (6 / globalScale));
    }
  }, [selectedNodeId, searchHighlights]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'var(--bg-primary)', position: 'relative' }}>
      <div 
        style={{ 
          position: 'absolute', top: 10, left: 10, zIndex: 10, 
          color: 'var(--text-secondary)', fontSize: '0.65rem', fontFamily: 'monospace'
        }}
      >
        Scroll to zoom · Click to travel · Drag to pan
      </div>
      
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        nodeLabel="fullPath"
        nodeCanvasObject={paintNode}
        onNodeClick={handleNodeClick}
        backgroundColor="#050505"
        linkColor={(link) => {
          const isSelected = selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId);
          return isSelected ? '#0dff47' : 'rgba(255,255,255,0.03)'; // Barely visible until clicked
        }}
        linkWidth={(link) => {
          return (selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId)) ? 3 : 1;
        }}
        linkDirectionalParticles={(link) => {
          const isSelected = selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId);
          return isSelected ? 3 : 0; // Edges "created" with flow only when clicked
        }}
        linkDirectionalParticleWidth={(link) => {
          return (selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId)) ? 4 : 0; // TASK 2: Particle width
        }}
        linkDirectionalParticleSpeed={0.005}
        // Removed linkCurvature for strictly straight edges
        d3VelocityDecay={0.3} // Restored smooth zoom/camera drag mechanics
        warmupTicks={100} // Pre-calculate stable space positions
      />
    </div>
  );
}
