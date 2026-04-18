/**
 * Rule-based file classification
 * Returns: 'entry' | 'core' | 'util' | 'config'
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
