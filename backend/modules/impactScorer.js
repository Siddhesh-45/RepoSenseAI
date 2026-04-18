/**
 * Purpose:
 * Scores the relative impact of every file in the dependency graph based on
 * how many other files depend on it (incoming edge count).
 *
 * Role in System:
 * Acts as the topology-analysis layer between raw dependency mapping and final
 * graph assembly. Its output directly determines node sizing/highlighting in
 * the frontend visualizer and drives the AI summarizer's file-priority order.
 *
 * Key Responsibility:
 * Counts incoming edges for each file, clamps the value to a 0–10 scale, and
 * flags files with score ≥ 7 as high-impact critical nodes. Handles both
 * direct matches and extension-less / index-fallback path resolution.
 *
 * Important Insight:
 * Used by the analyze route as Step 4 of the 8-step pipeline, immediately
 * before AI summarization. This file depends on 0 modules (pure JS) and is
 * used by 2 files (routes/analyze.js and modules/aiSummarizer.js — scores
 * are passed into the summarizer to prioritize its top-30 selection).
 * It likely handles topological ranking and hotspot detection.
 */
export function scoreImpact(deps) {
  // Count incoming edges for each file
  const incomingCount = {};
  
  // Initialize all files with 0
  for (const file of Object.keys(deps)) {
    if (!incomingCount[file]) incomingCount[file] = 0;
  }
  
  // Count how many files import each target
  for (const [source, targets] of Object.entries(deps)) {
    for (const target of targets) {
      // Normalize target path - handle relative imports
      const normalizedTarget = normalizeImport(target, source);
      if (incomingCount[normalizedTarget] !== undefined) {
        incomingCount[normalizedTarget]++;
      } else {
        // Try matching without extension
        const matched = findMatchingFile(normalizedTarget, Object.keys(deps));
        if (matched) {
          incomingCount[matched] = (incomingCount[matched] || 0) + 1;
        }
      }
    }
  }
  
  // Build scores
  const scores = {};
  for (const [file, count] of Object.entries(incomingCount)) {
    const score = Math.min(count, 10);
    scores[file] = {
      impact: score,
      highImpact: score >= 7,
      incomingEdges: count
    };
  }
  
  return scores;
}

/**
 * Normalize import path relative to source file
 */
function normalizeImport(importPath, sourceFile) {
  if (!importPath.startsWith('.')) return importPath;
  
  const sourceDir = sourceFile.includes('/') 
    ? sourceFile.substring(0, sourceFile.lastIndexOf('/'))
    : '';
    
  const parts = importPath.split('/');
  const sourceParts = sourceDir ? sourceDir.split('/') : [];
  
  const result = [...sourceParts];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      result.pop();
    } else {
      result.push(part);
    }
  }
  
  return result.join('/');
}

/**
 * Try to find a matching file (with or without extension)
 */
function findMatchingFile(target, files) {
  // Direct match
  if (files.includes(target)) return target;
  
  // Try common extensions
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '/index.js', '/index.ts', '/index.jsx', '/index.tsx'];
  for (const ext of extensions) {
    if (files.includes(target + ext)) return target + ext;
  }
  
  return null;
}
