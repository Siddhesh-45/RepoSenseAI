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

  return { nodes, links };
}
