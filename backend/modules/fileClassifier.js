/**
 * Purpose:
 * Classifies every file in the dependency map into one of four semantic
 * architecture roles: entry, core, util, or config.
 *
 * Role in System:
 * Acts as the semantic tagging layer immediately after dependency extraction.
 * Its classifications are consumed by both graphBuilder (for node type
 * coloring/shaping) and onboardingPath (to identify traversal start points).
 *
 * Key Responsibility:
 * Applies a prioritized rule-based system that inspects file basenames and
 * directory path segments — matching patterns like 'index', 'server', 'route',
 * 'util', and 'config' — to deterministically assign one of four node types
 * without any ML overhead.
 *
 * Important Insight:
 * Used by the analyze route as Step 3 of the 8-step pipeline, making it one
 * of the earliest enrichment steps. This file depends on 0 modules (pure JS)
 * and is used by 2 files (routes/analyze.js and indirectly by aiSummarizer.js
 * via the classifications argument). It likely handles architecture-role
 * inference, entry-point detection, and config/utility separation.
 */
export function classifyFile(filename) {
  const lower = filename.toLowerCase();
  const basename = lower.split('/').pop();
  
  // Entry points
  if (basename.includes('index') || basename.includes('main') || basename.includes('app.') ||
      basename === 'express.js' || basename === 'server.js' || basename.includes('startup') ||
      basename.includes('entry') || basename === 'bootstrap.js') {
    return 'entry';
  }
  
  // Configuration files
  if (basename.includes('config') || basename.endsWith('.json') || basename.includes('.env') || basename.includes('settings')) {
    return 'config';
  }
  
  // Utilities / Helpers
  if (basename.includes('util') || basename.includes('helper') || basename.includes('constant') || basename.includes('types') || basename.includes('common')) {
    return 'util';
  }
  
  // Core logic - routes, controllers, middleware, services, models
  if (basename.includes('route') || basename.includes('controller') || basename.includes('middleware') || 
      basename.includes('service') || basename.includes('model') || basename.includes('handler') ||
      basename.includes('component') || basename.includes('view') || basename.includes('page')) {
    return 'core';
  }
  
  // Check directory path for clues
  if (lower.includes('/routes/') || lower.includes('/controllers/') || lower.includes('/middleware/') ||
      lower.includes('/services/') || lower.includes('/models/') || lower.includes('/handlers/') ||
      lower.includes('/components/') || lower.includes('/pages/') || lower.includes('/views/')) {
    return 'core';
  }
  
  if (lower.includes('/utils/') || lower.includes('/helpers/') || lower.includes('/lib/') || lower.includes('/common/')) {
    return 'util';
  }
  
  if (lower.includes('/config/') || lower.includes('/configs/')) {
    return 'config';
  }
  
  // Default to core
  return 'core';
}

/**
 * Classify all files in the dependency tree
 */
export function classifyAllFiles(deps) {
  const classifications = {};
  for (const file of Object.keys(deps)) {
    classifications[file] = classifyFile(file);
  }
  return classifications;
}
