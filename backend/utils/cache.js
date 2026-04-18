/**
 * In-memory LRU-style cache for caching analysis results.
 * Avoids re-processing the entire repository if analyzed recently.
 */

const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function getCachedAnalysis(repoUrl) {
  const entry = cache.get(repoUrl);
  if (entry) {
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(repoUrl);
      return null;
    }
    return entry.data;
  }
  return null;
}

export function setCachedAnalysis(repoUrl, data) {
  cache.set(repoUrl, {
    data,
    timestamp: Date.now()
  });

  // Keep cache size manageable (max 50 items)
  if (cache.size > 50) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

export function clearCache(repoUrl) {
  if (repoUrl) {
    cache.delete(repoUrl);
  } else {
    cache.clear();
  }
}
