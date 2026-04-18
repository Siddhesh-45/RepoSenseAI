import { useState } from 'react';
import axios from 'axios';
import { useGraphStore } from '../store/graphStore';

const NLQueryBar = ({ repoId }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultCount, setResultCount] = useState(null);
  
  const { setHighlightedNodes } = useGraphStore();

  const examples = [
    "Show the payment flow",
    "Where is user auth?",
    "What handles database connections?",
    "Find the API entry points"
  ];

  const handleSubmit = async (text) => {
    if (!text.trim()) return;
    setLoading(true);
    setResultCount(null);
    setQuery(text);

    try {
      const res = await axios.post('/api/query', { repoId, query: text });
      const nodes = res.data.highlightedNodes || [];
      setHighlightedNodes(nodes);
      setResultCount(nodes.length);
    } catch (err) {
      console.error('Query failed', err);
      // Fallback: clear highlight
      setHighlightedNodes([]);
      setResultCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSubmit(query); }}
        style={{ position: 'relative' }}
      >
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Where is authentication handled?"
          style={{ 
            width: '100%', 
            background: 'rgba(0,0,0,0.3)', 
            border: '1px solid var(--border)', 
            color: '#fff', 
            padding: '12px 16px', 
            paddingRight: '40px',
            borderRadius: 8,
            fontFamily: 'JetBrains Mono',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            position: 'absolute', 
            right: 8, 
            top: 8, 
            background: loading ? 'transparent' : 'var(--neon)', 
            color: loading ? 'rgba(255,255,255,0.5)' : '#000', 
            border: 'none', 
            borderRadius: 6, 
            padding: '6px 10px',
            cursor: loading ? 'default' : 'pointer'
          }}
        >
          {loading ? '...' : 'Go'}
        </button>
      </form>

      {resultCount !== null && !loading && (
        <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--neon)' }}>
          {resultCount} files highlighted
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {examples.map(ex => (
          <span 
            key={ex} 
            onClick={() => handleSubmit(ex)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '6px 10px', 
              borderRadius: 20, 
              fontSize: '0.75rem', 
              cursor: 'pointer',
              border: '1px solid var(--border)',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
          >
            {ex}
          </span>
        ))}
      </div>
    </div>
  );
};

export default NLQueryBar;
