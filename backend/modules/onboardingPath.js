/**
 * Purpose:
 * Generates a recommended file-reading sequence for developers onboarding
 * onto a new codebase by performing a BFS traversal of the dependency graph.
 *
 * Role in System:
 * Acts as the UX-guidance layer of the analysis pipeline, turning graph
 * topology into an actionable learning path. Its ordered array is embedded
 * directly into the final graph JSON and drives the OnboardingPath frontend
 * component's step-through navigation.
 *
 * Key Responsibility:
 * Starts from entry-point nodes (or the most-connected file if no entry
 * points exist) and fans out layer by layer through the dependency tree
 * using BFS. Unvisited files are appended at the end so every file in
 * the repository is always represented in the path.
 *
 * Important Insight:
 * Used by the analyze route as Step 6 of the 8-step pipeline, just before
 * final graph assembly. This file depends on 0 modules (pure JS) and is used
 * by 1 file (routes/analyze.js). It likely handles graph traversal, new-hire
 * documentation ordering, and dependency-aware sequencing.
 */
export function buildOnboardingPath(deps, classifications) {
  // Find all entry-type nodes
  const entryNodes = Object.keys(classifications).filter(f => classifications[f] === 'entry');
  
  if (entryNodes.length === 0) {
    // If no entry nodes, start from files with most outgoing deps
    const sorted = Object.entries(deps)
      .sort((a, b) => b[1].length - a[1].length);
    if (sorted.length > 0) {
      entryNodes.push(sorted[0][0]);
    }
  }
  
  // BFS traversal
  const visited = new Set();
  const queue = [...entryNodes];
  const path = [];
  
  // Add entry nodes first
  for (const entry of entryNodes) {
    if (!visited.has(entry)) {
      visited.add(entry);
      path.push(entry);
    }
  }
  
  // BFS through dependencies
  while (queue.length > 0) {
    const current = queue.shift();
    const dependencies = deps[current] || [];
    
    for (const dep of dependencies) {
      // Try to find the actual file key
      const resolvedDep = resolveDepKey(dep, current, Object.keys(deps));
      if (resolvedDep && !visited.has(resolvedDep)) {
        visited.add(resolvedDep);
        path.push(resolvedDep);
        queue.push(resolvedDep);
      }
    }
  }
  
  // Add any remaining files not yet visited
  for (const file of Object.keys(deps)) {
    if (!visited.has(file)) {
      path.push(file);
    }
  }
  
  return path;
}

/**
 * Resolve a dependency reference to an actual file key
 */
function resolveDepKey(dep, sourceFile, allFiles) {
  // Direct match
  if (allFiles.includes(dep)) return dep;
  
  // Relative path resolution
  if (dep.startsWith('.')) {
    const sourceDir = sourceFile.includes('/')
      ? sourceFile.substring(0, sourceFile.lastIndexOf('/'))
      : '';
    
    const parts = dep.split('/');
    const baseParts = sourceDir ? sourceDir.split('/') : [];
    const resolved = [...baseParts];
    
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') resolved.pop();
      else resolved.push(part);
    }
    
    const resolvedPath = resolved.join('/');
    if (allFiles.includes(resolvedPath)) return resolvedPath;
    
    // Try with extensions
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts'];
    for (const ext of extensions) {
      if (allFiles.includes(resolvedPath + ext)) return resolvedPath + ext;
    }
  }
  
  // Partial match
  const match = allFiles.find(f => f.endsWith('/' + dep) || f === dep);
  return match || null;
}
