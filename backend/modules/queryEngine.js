/**
 * Purpose:
 * Provides a lightweight full-text search engine for querying graph nodes
 * by filename, architecture type, or AI-generated summary content.
 *
 * Role in System:
 * Acts as the query interface layer, decoupled from the core analysis pipeline.
 * It is called independently by the POST /api/search endpoint (not the
 * /api/analyze pipeline), making it the only module solely responsible for
 * real-time interactive search from the frontend QueryBar component.
 *
 * Key Responsibility:
 * Tokenizes the search query, scores each node across three weighted fields
 * (filename weight 3, type weight 2, AI summary weight 1), and applies bonus
 * scoring for exact and starts-with filename matches. Returns a ranked list
 * of matching node IDs with zero-score entries filtered out.
 *
 * Important Insight:
 * Used exclusively by routes/analyze.js's /search handler. This file depends
 * on 0 modules (pure JS) and is used by 1 file (routes/analyze.js).
 * It likely handles relevance ranking, multi-field text scoring, and
 * real-time node filtering for the graph explorer UI.
 */
export function searchNodes(query, nodes) {
  if (!query || query.trim().length === 0) {
    return nodes.map(n => n.id);
  }
  
  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  
  const results = nodes.map(node => {
    let score = 0;
    const searchableFields = [
      { text: node.id.toLowerCase(), weight: 3 },
      { text: (node.type || '').toLowerCase(), weight: 2 },
      { text: (node.ai || '').toLowerCase(), weight: 1 }
    ];
    
    for (const term of searchTerms) {
      for (const field of searchableFields) {
        if (field.text.includes(term)) {
          score += field.weight;
          
          // Bonus for exact filename match
          if (field.weight === 3 && field.text === term) {
            score += 5;
          }
          
          // Bonus for starts-with match
          if (field.weight === 3 && field.text.startsWith(term)) {
            score += 2;
          }
        }
      }
    }
    
    return { id: node.id, score };
  });
  
  return results
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.id);
}
