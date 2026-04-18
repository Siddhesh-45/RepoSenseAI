import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useGraphStore } from '../store/graphStore';

const GraphCanvas = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const { nodes, edges, selectNode, highlightedNodes, selectedNode } = useGraphStore();

  useEffect(() => {
    if (!nodes.length || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', [0, 0, width, height]);

    // Zoom and pan
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        
        // Hide labels when zoomed out
        svg.selectAll('.node-label')
          .style('opacity', event.transform.k > 0.6 ? 1 : 0);
      });

    svg.call(zoom);

    // Defs for glows and markers
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow markers
    const createMarker = (id, color) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 24) // offset for node radius
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    };

    createMarker('arrow-import', 'rgba(255,255,255,0.2)');
    createMarker('arrow-highlight', '#00f5c4');

    const g = svg.append('g');

    // Clone data for d3 simulation
    const domNodes = nodes.map(d => Object.create(d));
    const domEdges = edges.map(d => {
      return { ...d, source: d.source, target: d.target };
    });

    const nodeRadius = (d) => Math.min(6 + d.impactScore * 0.9, 26);

    const simulation = d3.forceSimulation(domNodes)
      .force('link', d3.forceLink(domEdges).id(d => d.id).distance(80).strength(0.8))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => nodeRadius(d) + 12));

    const link = g.append('g')
      .attr('stroke', 'rgba(255,255,255,0.12)')
      .selectAll('line')
      .data(domEdges)
      .join('line')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow-import)');

    const nodeGroup = g.append('g')
      .selectAll('.node')
      .data(domNodes)
      .join('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .call(drag(simulation))
      .on('click', (event, d) => {
        event.stopPropagation();
        selectNode(d.id);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        svg.transition().duration(750).call(
          zoom.transform, 
          d3.zoomIdentity.translate(width/2 - d.x * 1.5, height/2 - d.y * 1.5).scale(1.5)
        );
      });

    svg.on('click', () => {
      selectNode(null);
    });

    const getColor = (type) => {
      switch(type) {
        case 'entry': return '#00f5c4';
        case 'core': return '#7b61ff';
        case 'utility': return '#ffd93d';
        case 'external': return '#666666';
        case 'test': return '#333333';
        default: return '#7b61ff';
      }
    };

    // High impact pulsing ring
    nodeGroup.filter(d => d.isHighImpact)
      .append('circle')
      .attr('r', d => nodeRadius(d) + 6)
      .attr('fill', 'none')
      .attr('stroke', '#ff6b6b')
      .attr('stroke-width', 2)
      .attr('opacity', 0.6)
      .style('animation', 'pulseBorder 2s infinite');

    // Main circle
    nodeGroup.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', d => getColor(d.type))
      .attr('stroke', d => d.isOrphaned ? '#fff' : '#000')
      .attr('stroke-width', d => d.isOrphaned ? 1 : 1.5)
      .attr('stroke-dasharray', d => d.isOrphaned ? '4 2' : 'none')
      .attr('opacity', d => d.isOrphaned ? 0.45 : 1)
      .style('filter', d => (d.type === 'entry' || d.isHighImpact) ? 'url(#glow)' : 'none');

    // Tooltip via title
    nodeGroup.append('title')
      .text(d => `${d.label} (${d.type})\nImpact: ${d.impactScore}\n${d.aiSummary ? d.aiSummary.slice(0,50)+'...' : ''}`);

    const labels = nodeGroup.append('text')
      .attr('class', 'node-label')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', d => nodeRadius(d) + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.7)')
      .style('font-size', '10px')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 2px #000, 0 -1px 2px #000');

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Handle highlighted nodes (NL Query)
    if (highlightedNodes.length > 0) {
      nodeGroup.selectAll('circle')
        .attr('stroke', d => highlightedNodes.includes(d.id) ? '#fff' : '#000')
        .attr('stroke-width', d => highlightedNodes.includes(d.id) ? 3 : 1)
        .attr('opacity', d => {
          if (highlightedNodes.includes(d.id)) return 1;
          return 0.2;
        });

      link.attr('opacity', 0.1);

      // Auto-zoom to bounding box of highlighted nodes
      const hNodes = domNodes.filter(d => highlightedNodes.includes(d.id));
      if (hNodes.length > 0) {
        // Wait a tick for layout to settle roughly
        setTimeout(() => {
          const xExtent = d3.extent(hNodes, d => d.x);
          const yExtent = d3.extent(hNodes, d => d.y);
          if (xExtent[0] && yExtent[0]) {
             const cx = (xExtent[0] + xExtent[1]) / 2;
             const cy = (yExtent[0] + yExtent[1]) / 2;
             svg.transition().duration(1000).call(
               zoom.transform,
               d3.zoomIdentity.translate(width/2 - cx, height/2 - cy).scale(1)
             );
          }
        }, 500);
      }
    } else if (selectedNode) {
      // Highlight selection logic
      const connectedEdges = domEdges.filter(e => e.source.id === selectedNode.id || e.target.id === selectedNode.id);
      const connectedNodeIds = new Set(connectedEdges.flatMap(e => [e.source.id, e.target.id]));
      
      nodeGroup.attr('opacity', d => connectedNodeIds.has(d.id) ? 1 : 0.2);
      link
        .attr('opacity', d => (d.source.id === selectedNode.id || d.target.id === selectedNode.id) ? 1 : 0.05)
        .attr('stroke', d => (d.source.id === selectedNode.id || d.target.id === selectedNode.id) ? 'var(--neon)' : 'rgba(255,255,255,0.12)')
        .attr('marker-end', d => (d.source.id === selectedNode.id || d.target.id === selectedNode.id) ? 'url(#arrow-highlight)' : 'url(#arrow-import)');
    }

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, highlightedNodes, selectedNode, selectNode]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at center, #1b1b2f 0%, var(--bg-color) 100%)' }} />
      
      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 24, left: 24, background: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 8, backdropFilter: 'blur(8px)', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <span style={{ color: '#00f5c4' }}>● Entry</span>
          <span style={{ color: '#7b61ff' }}>● Core</span>
          <span style={{ color: '#ffd93d' }}>● Utility</span>
          <span style={{ color: '#666' }}>● External</span>
          <span style={{ color: '#333' }}>● Test</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)' }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, border: '1px solid #ff6b6b' }}></div> High Impact
          <div style={{ width: 10, height: 10, borderRadius: 5, border: '1px dashed #fff' }}></div> Orphaned
        </div>
      </div>
    </div>
  );
};

export default GraphCanvas;
