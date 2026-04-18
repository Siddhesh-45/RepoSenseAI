/**
 * Search engine for querying nodes
 * Matches against: filenames, type labels, AI summaries
 * Returns array of matching node IDs with relevance scores
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
