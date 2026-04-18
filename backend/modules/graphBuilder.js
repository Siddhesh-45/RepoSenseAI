/**
 * Assemble final graph JSON response from all processed data
 */
export function buildGraph(deps, classifications, scores, summaries, onboardingPath) {
  const allFiles = Object.keys(deps);
  
  // Build nodes
  const nodes = allFiles.map((file) => {
    const score = scores[file] || { impact: 0, highImpact: false, incomingEdges: 0 };
    
    return {
      id: file,
      type: classifications[file] || 'core',
      impact: score.impact,
      highImpact: score.highImpact,
      ai: summaries[file] || 'No summary available.',
      deps: deps[file] || [],
      incomingEdges: score.incomingEdges || 0
    };
  });
  
  // Build edges
  const edges = [];
  let edgeId = 0;
  for (const [source, targets] of Object.entries(deps)) {
    for (const target of targets) {
      // Resolve target to actual file key
      const resolvedTarget = resolveTarget(target, source, allFiles);
      if (resolvedTarget) {
        edges.push({
          id: `e${edgeId++}`,
          source,
          target: resolvedTarget
        });
      }
    }
  }
  
  // Calculate metrics
  const highImpactFiles = nodes.filter(n => n.highImpact).length;
  const entryPoints = nodes.filter(n => n.type === 'entry').length;
  const density = allFiles.length > 0 ? parseFloat((edges.length / allFiles.length).toFixed(1)) : 0;
  
  const metrics = {
    totalFiles: allFiles.length,
    highImpactFiles,
    totalEdges: edges.length,
    density,
    entryPoints
  };
  
  return {
    nodes,
    edges,
    onboardingPath: onboardingPath || [],
    metrics
  };
}

/**
 * Resolve a dependency target to an actual file in the graph
 */
function resolveTarget(target, source, allFiles) {
  if (allFiles.includes(target)) return target;
  
  // Resolve relative path
  if (target.startsWith('.')) {
    const sourceDir = source.includes('/') ? source.substring(0, source.lastIndexOf('/')) : '';
    const parts = target.split('/');
    const baseParts = sourceDir ? sourceDir.split('/') : [];
    const resolved = [...baseParts];
    
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') resolved.pop();
      else resolved.push(part);
    }
    
    const resolvedPath = resolved.join('/');
    if (allFiles.includes(resolvedPath)) return resolvedPath;
    
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts', '/index.jsx', '/index.tsx'];
    for (const ext of extensions) {
      if (allFiles.includes(resolvedPath + ext)) return resolvedPath + ext;
    }
  }
  
  // Partial match
  const match = allFiles.find(f => f.endsWith('/' + target) || f.endsWith(target));
  return match || null;
}
