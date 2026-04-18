import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { prepareGraphData } from './graphHelpers';
import { analyzeSemantic } from '../../services/api';

export default function GraphCanvas({ graphData, selectedNodeId, onNodeSelect, searchHighlights = [], traversalState = null }) {
  const fgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef();
  
  // Local state for HUD
  const [hudData, setHudData] = useState(null);
  const [isHudLoading, setIsHudLoading] = useState(false);
  const [selectedRootId, setSelectedRootId] = useState('');

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

  // Set default root
  useEffect(() => {
    if (graphData?.nodes?.length > 0 && !selectedRootId) {
       const entries = graphData.nodes.filter(n => n.type === 'entry').sort((a,b) => b.impact - a.impact);
       if (entries.length > 0) setSelectedRootId(entries[0].id);
       else setSelectedRootId(graphData.nodes[0].id);
    }
  }, [graphData, selectedRootId]);

  // Fetch semantic UI
  useEffect(() => {
    if (traversalState?.currentNodeId) {
       setIsHudLoading(true);
       let isMounted = true;
       analyzeSemantic(traversalState.currentNodeId, graphData.nodes, graphData.edges)
         .then(res => {
            if (isMounted) setHudData(res);
         })
         .finally(() => {
            if (isMounted) setIsHudLoading(false);
         });
       return () => { isMounted = false; };
    } else {
       setHudData(null);
    }
  }, [traversalState?.currentNodeId, graphData]);

  // Auto-center current traversal node
  useEffect(() => {
    if (traversalState?.currentNodeId && fgRef.current) {
      const node = data.nodes.find(n => n.id === traversalState.currentNodeId);
      if (node) {
        // Slow pan to node to maintain visual continuity
        fgRef.current.centerAt(node.x, node.y, 800);
      }
    }
  }, [traversalState?.currentNodeId, data.nodes]);

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
    const label = node.label || node.id || '?';
    const isSelected = node.id === selectedNodeId;
    const isHighlighted = searchHighlights.length > 0 && searchHighlights.includes(node.id);
    let isFaded = searchHighlights.length > 0 && !isHighlighted;
    
    // Traversal Visual Encoding
    const isTraversalActive = traversalState && (traversalState.traversalStep > 0 || traversalState.stack.length > 0);
    const isCurrent = isTraversalActive && traversalState.currentNodeId === node.id;
    const isVisited = isTraversalActive && traversalState.visited.has(node.id) && !isCurrent;
    const isPending = isTraversalActive && traversalState.stack.includes(node.id);
    const isRoot = isTraversalActive && traversalState.rootNodeId === node.id;

    if (isTraversalActive) {
       if (!isCurrent && !isVisited && !isPending && !isRoot) {
          isFaded = true; // dim unvisited/uninvolved nodes during active traversal
       } else {
          isFaded = false;
       }
    }
    
    // Safe fallbacks for dynamically created ghost nodes from edges
    const safeVal = node.val || 2;
    const baseSize = safeVal * 2.5;
    let size = baseSize;
    if (isCurrent) size = baseSize * 1.8;
    else if (isPending) size = baseSize * 1.2;
    else if (isVisited) size = baseSize * 0.8;

    let color = node.color || '#52525b';
    
    if (isTraversalActive) {
       if (isCurrent) color = '#0ea5e9'; // vivid neon sky blue
       else if (isPending) color = '#f59e0b'; // warm amber
       else if (isVisited) color = '#22c55e'; // muted green
       else color = '#52525b'; // neutral gray
    }
    
    // Draw outer glow / pulse
    ctx.beginPath();
    let glowSize = size * 1.5;
    if (isCurrent) {
       // Continuous pulse based on time
       const time = Date.now();
       const pulse = (Math.sin(time / 200) + 1) / 2; // 0 to 1
       glowSize = size * (1.5 + pulse * 1.0); 
    }
    
    ctx.arc(node.x, node.y, glowSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = isCurrent ? `${color}40` : isSelected ? `${color}60` : `${color}20`; // Hex alpha
    ctx.fill();

    // Draw Root crown/star
    if (isRoot) {
       ctx.beginPath();
       ctx.arc(node.x, node.y, size * 2.5, 0, 2 * Math.PI, false);
       ctx.strokeStyle = '#a855f7'; // Purple crown marker
       ctx.lineWidth = 2 / globalScale;
       ctx.stroke();
    }

    // Draw planet core
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = isFaded ? `${color}40` : color;
    
    // Shadow / Glow
    if (isCurrent) {
       ctx.shadowColor = color;
       ctx.shadowBlur = 40;
    } else if (isSelected || node.highImpact) {
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
    if (!isFaded || isRoot) {
       const fontSize = (isSelected || isCurrent) ? 14 / globalScale : 10 / globalScale;
       ctx.font = `${isCurrent ? 'bold' : 'normal'} ${fontSize}px Inter, monospace`;
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.fillStyle = isCurrent ? '#ffffff' : (isSelected ? '#ffffff' : (isVisited ? '#86efac' : '#adaaaa'));
       ctx.fillText(label, node.x, node.y + size + (8 / globalScale));
    }
  }, [selectedNodeId, searchHighlights, traversalState]);

  // Edges Encodings
  const getLinkColor = useCallback((link) => {
     if (!traversalState) return 'rgba(255,255,255,0.03)';
     const isTraversalActive = traversalState.traversalStep > 0 || traversalState.stack.length > 0;
     if (!isTraversalActive) {
         const isSelected = selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId);
         return isSelected ? '#0dff47' : 'rgba(255,255,255,0.03)';
     }

     const linkKeyFwd = `${link.source.id}|${link.target.id}`;
     const linkKeyBwd = `${link.target.id}|${link.source.id}`;
     
     const isActiveEdge = 
        (traversalState.previousNodeId === link.source.id && traversalState.currentNodeId === link.target.id) ||
        (traversalState.previousNodeId === link.target.id && traversalState.currentNodeId === link.source.id);
        
     const isTraveled = traversalState.traversedEdges.has(linkKeyFwd) || traversalState.traversedEdges.has(linkKeyBwd) || isActiveEdge;

     if (isActiveEdge) return '#0ef'; // Very bright cyan for current edge
     if (isTraveled) return '#06b6d4'; // Soft cyan for traveled
     return 'rgba(255,255,255,0.05)'; // Dashed gray, low opacity
  }, [traversalState, selectedNodeId]);

  const getLinkWidth = useCallback((link) => {
     if (!traversalState) return 1;
     const isTraversalActive = traversalState.traversalStep > 0 || traversalState.stack.length > 0;
     if (!isTraversalActive) {
         return (selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId)) ? 3 : 1;
     }

     const linkKeyFwd = `${link.source.id}|${link.target.id}`;
     const linkKeyBwd = `${link.target.id}|${link.source.id}`;
     
     const isActiveEdge = 
        (traversalState.previousNodeId === link.source.id && traversalState.currentNodeId === link.target.id) ||
        (traversalState.previousNodeId === link.target.id && traversalState.currentNodeId === link.source.id);
     
     if (isActiveEdge) return 4;
     if (traversalState.traversedEdges.has(linkKeyFwd) || traversalState.traversedEdges.has(linkKeyBwd)) return 2;
     return 1;
  }, [traversalState, selectedNodeId]);

  const getLinkParticles = useCallback((link) => {
     if (!traversalState) return 0;
     const isTraversalActive = traversalState.traversalStep > 0 || traversalState.stack.length > 0;
     if (!isTraversalActive) {
         const isSelected = selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId);
         return isSelected ? 3 : 0;
     }

     const isActiveEdge = 
        (traversalState.previousNodeId === link.source.id && traversalState.currentNodeId === link.target.id) ||
        (traversalState.previousNodeId === link.target.id && traversalState.currentNodeId === link.source.id);
        
     return isActiveEdge ? 4 : 0; // emitting a thick, fast-moving gold/cyan particle beam
  }, [traversalState, selectedNodeId]);

  // Main UI Render
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'var(--bg-primary)', position: 'relative' }}>
      
      {/* ── Overlay Controls (Top-Left) ── */}
      {traversalState && (
         <div style={{
            position: 'absolute', top: 20, left: 20, zIndex: 50,
            background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
         }}>
            <select 
               value={traversalState.mode} 
               onChange={e => traversalState.setMode(e.target.value)}
               disabled={traversalState.traversalStep > 0}
               style={{
                  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none'
               }}
            >
               <option value="DFS">DFS Traversal</option>
               <option value="BFS">BFS Traversal</option>
            </select>

            <select 
               value={selectedRootId} 
               onChange={e => setSelectedRootId(e.target.value)}
               disabled={traversalState.traversalStep > 0}
               style={{
                  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '200px',
                  color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none'
               }}
            >
               {graphData?.nodes?.map(n => <option key={n.id} value={n.id}>{n.id.split('/').pop()}</option>)}
            </select>

            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

            {/* Play Controls */}
            {traversalState.traversalStep === 0 && traversalState.stack.length === 0 ? (
               <button 
                  onClick={() => traversalState.start(selectedRootId)}
                  style={{ background: '#22c55e', color: '#000', border: 'none', padding: '6px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
               >
                  SEED ROOT
               </button>
            ) : (
               <>
                  <button 
                     onClick={() => traversalState.togglePlay(1200)}
                     disabled={traversalState.stack.length === 0}
                     style={{ background: traversalState.isPlaying ? 'rgba(255,255,255,0.1)' : '#f59e0b', color: traversalState.isPlaying ? '#fff' : '#000', border: 'none', padding: '6px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: traversalState.stack.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
                  >
                     {traversalState.isPlaying ? '⏸ PAUSE' : '▶ AUTO-PLAY'}
                  </button>
                  <button 
                     onClick={traversalState.step}
                     disabled={traversalState.isPlaying || traversalState.stack.length === 0}
                     style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: (traversalState.isPlaying || traversalState.stack.length === 0) ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
                  >
                     STEP →
                  </button>
                  <button 
                     onClick={traversalState.reset}
                     style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                     RESET
                  </button>
               </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '8px' }}>
               <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>PENDING: <strong style={{color:'#f59e0b'}}>{traversalState.stack.length}</strong></span>
               <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>STEPS: <strong>{traversalState.traversalStep}</strong></span>
            </div>
         </div>
      )}

      {/* ── Semantic HUD Overlay (Bottom-Centered) ── */}
      {traversalState && traversalState.currentNodeId && (
         <div style={{
            position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
            background: 'rgba(10, 10, 15, 0.90)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(14, 165, 233, 0.4)', borderRadius: '12px',
            width: '80%', maxWidth: '800px', padding: '20px',
            boxShadow: '0 -4px 30px rgba(14, 165, 233, 0.15), 0 10px 40px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.3s ease-out'
         }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ height: '12px', width: '12px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 10px #0ea5e9', animation: 'pulse 1.5s infinite' }} />
                  <h3 className="font-mono" style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{traversalState.currentNodeId}</h3>
               </div>
               {isHudLoading && <span style={{ fontSize: '0.75rem', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Analyzing...</span>}
            </div>

            {hudData ? (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                        <strong>Purpose:</strong> {hudData.modulePurpose}
                     </p>
                     <div>
                        <strong style={{ fontSize: '0.75rem', color: '#0ea5e9', textTransform: 'uppercase' }}>Key Interfaces:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                           {hudData.exportedInterface?.slice(0, 4).map((exp, i) => (
                              <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>{exp}</span>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                     <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase' }}>Dependencies ({hudData.dependencies?.length || 0}):</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                           {hudData.dependencies?.slice(0, 3).map((dep, i) => (
                              <span key={i} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fcd34d', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'monospace', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                 {dep.split('/').pop()}
                              </span>
                           ))}
                           {hudData.dependencies?.length > 3 && (
                              <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#aaa', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                                 +{hudData.dependencies.length - 3} more
                              </span>
                           )}
                           {(!hudData.dependencies || hudData.dependencies.length === 0) && <span style={{ color: '#aaa', fontSize: '0.7rem' }}>None</span>}
                        </div>
                     </div>
                     <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '0.75rem', color: '#22c55e', textTransform: 'uppercase' }}>Imported By ({hudData.dependents?.length || 0}):</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                           {hudData.dependents?.slice(0, 3).map((dep, i) => (
                              <span key={i} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#86efac', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'monospace', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                 {dep.split('/').pop()}
                              </span>
                           ))}
                           {hudData.dependents?.length > 3 && (
                              <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#aaa', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                                 +{hudData.dependents.length - 3} more
                              </span>
                           )}
                           {(!hudData.dependents || hudData.dependents.length === 0) && <span style={{ color: '#aaa', fontSize: '0.7rem' }}>None</span>}
                        </div>
                     </div>
                     <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '2px 8px', borderRadius: '4px' }}>Layer: {hudData.architecturalLayer}</span>
                        {hudData.designPatterns?.length > 0 && <span style={{ fontSize: '0.75rem', background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6', padding: '2px 8px', borderRadius: '4px' }}>Pattern: {hudData.designPatterns[0]}</span>}
                     </div>
                  </div>
               </div>
            ) : !isHudLoading && (
               <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Insufficient data to generate AI description for this node.</div>
            )}
         </div>
      )}

      {/* ── Background Instructions ── */}
      {!traversalState?.currentNodeId && (
         <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 10, color: 'var(--text-secondary)', fontSize: '0.65rem', fontFamily: 'monospace', opacity: 0.5 }}>
            Scroll to zoom · Click to travel · Drag to pan
         </div>
      )}
      
      {/* ── Canvas Rendering Engine ── */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        nodeLabel="fullPath"
        nodeCanvasObject={paintNode}
        onNodeClick={handleNodeClick}
        backgroundColor="#050505"
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalParticles={getLinkParticles}
        linkDirectionalParticleWidth={(link) => {
           const isActiveEdge = traversalState?.previousNodeId === link.source.id && traversalState?.currentNodeId === link.target.id || traversalState?.previousNodeId === link.target.id && traversalState?.currentNodeId === link.source.id;
           if (isActiveEdge) return 4;
           if (!traversalState || traversalState.traversalStep === 0) {
               return (selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId)) ? 4 : 0;
           }
           return 0;
        }}
        linkDirectionalParticleSpeed={(link) => {
            // Flow backwards graphically if walking backwards
            if (traversalState?.previousNodeId === link.target.id && traversalState?.currentNodeId === link.source.id) {
                return -0.015;
            }
            return 0.015;
        }}
        linkLineDash={(link) => {
           // Dashed line for unvisited during traversal
           if (!traversalState) return [];
           const isTraversalActive = traversalState.traversalStep > 0 || traversalState.stack.length > 0;
           const linkKeyFwd = `${link.source.id}|${link.target.id}`;
           const linkKeyBwd = `${link.target.id}|${link.source.id}`;
           const isActiveEdge = traversalState.previousNodeId === link.source.id && traversalState.currentNodeId === link.target.id || traversalState?.previousNodeId === link.target.id && traversalState?.currentNodeId === link.source.id;
           
           if (isTraversalActive && !traversalState.traversedEdges.has(linkKeyFwd) && !traversalState.traversedEdges.has(linkKeyBwd) && !isActiveEdge) {
              return [2, 4];
           }
           return []; // solid
        }}
        d3VelocityDecay={0.3} // smooth zoom/camera drag mechanics
        warmupTicks={100} // Pre-calculate stable space positions
      />
    </div>
  );
}
