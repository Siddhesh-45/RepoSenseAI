/**
 * Map API response to 3D Force Graph format
 */

const typeColors = {
  entry: '#22c55e',
  core: '#3b82f6',
  util: '#a855f7',
  config: '#f59e0b',
};

export function getNodeColor(type) {
  return typeColors[type] || typeColors.core;
}

export function prepareGraphData(apiData) {
  // Deep clone to prevent react-force-graph from mutating the React state directly
  const nodes = apiData.nodes.map(n => ({
    ...n,
    label: n.id.split('/').pop(),
    fullPath: n.id,
    color: getNodeColor(n.type),
    val: 1 + Math.sqrt(n.impact || 1) * 2 // Planet size based on impact
  }));

  const links = apiData.edges.map(e => ({
    source: e.source,
    target: e.target,
    id: e.id
  }));

  // --- LAYERED LAYOUT ALGORITHM (BFS) ---

  // 1. Calculate incoming edges to find roots
  const incomingCount = {};
  nodes.forEach(n => incomingCount[n.id] = 0);
  links.forEach(l => {
    if (incomingCount[l.target] !== undefined) {
      incomingCount[l.target]++;
    }
  });

  // 2. Detect Entry Points (Layer 0)
  const entryPoints = nodes.filter(n => {
    if (incomingCount[n.id] === 0) return true;
    const lower = n.label.toLowerCase();
    return lower === 'index.js' || lower === 'main.js' || lower === 'app.js' || lower === 'server.js';
  }).map(n => n.id);

  // Fallback: If no entry points found, just pick the first node
  if (entryPoints.length === 0 && nodes.length > 0) {
    entryPoints.push(nodes[0].id);
  }

  // 3. BFS to assign levels
  const nodeLevels = {}; // id -> level
  const visited = new Set();
  const queue = entryPoints.map(id => ({ id, level: 0 }));

  while (queue.length > 0) {
    const { id, level } = queue.shift();
    
    // We update level to the longest path essentially, to push it to the right
    // If it's visited but we reached it at a deeper level, we can push it deeper,
    // but to avoid cycle loops, let's just stick to the basic BFS for the first reached level
    if (!visited.has(id)) {
      visited.add(id);
      nodeLevels[id] = level;
      
      const outgoing = links.filter(l => l.source === id).map(l => l.target);
      for (const targetId of outgoing) {
        if (!visited.has(targetId)) {
          queue.push({ id: targetId, level: level + 1 });
        }
      }
    }
  }

  // Handle completely disconnected nodes
  nodes.forEach(n => {
    if (nodeLevels[n.id] === undefined) {
      nodeLevels[n.id] = 0;
    }
  });

  // 4. Calculate fixed coordinates (fx, fy)
  const levelIndexMap = {};
  nodes.forEach(node => {
    const level = nodeLevels[node.id];
    node.level = level;
    levelIndexMap[level] = (levelIndexMap[level] || 0) + 1;
  });

  const levelCounters = {};
  const HORIZONTAL_SPACING = 300;
  const VERTICAL_SPACING = 120;

  nodes.forEach(node => {
    const level = node.level;
    if (levelCounters[level] === undefined) levelCounters[level] = 0;
    
    const currentIndex = levelCounters[level];
    const totalInLevel = levelIndexMap[level];
    
    // Center vertically around Y=0
    const startY = -((totalInLevel - 1) * VERTICAL_SPACING) / 2;
    
    // Set fx and fy to freeze the layout (avoid force-directed simulation)
    node.fx = level * HORIZONTAL_SPACING;
    node.fy = startY + (currentIndex * VERTICAL_SPACING);
    // Also assign x and y so initial load doesn't jump
    node.x = node.fx;
    node.y = node.fy;
    
    levelCounters[level]++;
  });

  return { nodes, links };
}
