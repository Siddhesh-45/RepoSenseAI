import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNodeColor } from '../Graph/graphHelpers';

const typeFilters = ['All', 'Entry', 'Core', 'Utility', 'High Impact'];

export default function QueryBar({ isOpen, onClose, nodes, onSelect, onHighlight }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIdx(0);
    }
  }, [isOpen]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) onClose(); // toggle - parent handles this
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Filter and search
  const results = useMemo(() => {
    if (!nodes) return [];
    let filtered = [...nodes];

    // Type filter
    if (activeFilter !== 'All') {
      const filterMap = { Entry: 'entry', Core: 'core', Utility: 'util', 'High Impact': null };
      if (activeFilter === 'High Impact') {
        filtered = filtered.filter(n => n.highImpact);
      } else {
        filtered = filtered.filter(n => n.type === filterMap[activeFilter]);
      }
    }

    // Search query
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(n =>
        n.id.toLowerCase().includes(q) ||
        (n.type || '').toLowerCase().includes(q) ||
        (n.ai || '').toLowerCase().includes(q)
      ).sort((a, b) => {
        // Prioritize filename matches
        const aName = a.id.toLowerCase().includes(q) ? 2 : 0;
        const bName = b.id.toLowerCase().includes(q) ? 2 : 0;
        return bName - aName || b.impact - a.impact;
      });
    } else {
      filtered.sort((a, b) => b.impact - a.impact);
    }

    return filtered.slice(0, 15);
  }, [nodes, query, activeFilter]);

  // Update highlights
  useEffect(() => {
    if (onHighlight) {
      onHighlight(results.map(r => r.id));
    }
  }, [results, onHighlight]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIdx]) {
        e.preventDefault();
        handleSelect(results[selectedIdx]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, results, selectedIdx, onClose]);

  function handleSelect(node) {
    onSelect({
      ...node,
      fullPath: node.id,
      label: node.id.split('/').pop(),
    });
    onClose();
  }

  // Check if query looks like natural language
  const isNaturalLanguage = query.includes(' ') && query.length > 5;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)', zIndex: 200,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: '12vh',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: 600, background: 'var(--bg-surface)',
            border: '1px solid rgba(0,255,70,0.2)',
            boxShadow: '0 20px 40px rgba(0,255,70,0.08)',
            borderRadius: '0.375rem', overflow: 'hidden',
          }}
        >
          {/* Search input */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
              placeholder='Search files or ask "where is authentication?"'
              className="font-mono"
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '1.125rem',
                caretColor: 'var(--accent-end)',
              }}
            />
          </div>

          {/* Filter pills */}
          <div style={{
            display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            {typeFilters.map(f => (
              <button key={f} onClick={() => { setActiveFilter(f); setSelectedIdx(0); }} style={{
                background: activeFilter === f ? 'var(--accent-end)' : 'var(--bg-nested)',
                color: activeFilter === f ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: 'none', padding: '0.3rem 0.75rem', borderRadius: '0.375rem',
                fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                {f}
              </button>
            ))}
          </div>

          {/* Natural language indicator */}
          {isNaturalLanguage && query.trim() && (
            <div className="font-mono" style={{
              textAlign: 'center', padding: '0.625rem', fontSize: '0.6875rem',
              color: 'var(--accent-end)', opacity: 0.7,
            }}>
              ── AI matched for: '{query}' ──
            </div>
          )}

          {/* Results */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {results.length === 0 && query && (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', opacity: 0.5 }}>
                  No matches found
                </p>
              </div>
            )}
            {results.map((node, i) => (
              <div
                key={node.id}
                onClick={() => handleSelect(node)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 1.25rem', cursor: 'pointer',
                  background: i === selectedIdx ? 'var(--bg-nested)' : 'transparent',
                  borderLeft: i === selectedIdx ? '2px solid var(--accent-end)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                {/* Type dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: getNodeColor(node.type),
                }} />

                {/* File info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-mono" style={{
                    color: 'var(--text-primary)', fontSize: '0.8125rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {node.id.split('/').pop()}
                  </p>
                  <p className="font-mono" style={{
                    color: 'var(--text-secondary)', fontSize: '0.6875rem', opacity: 0.6,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {node.id}
                  </p>
                </div>

                {/* Impact badge */}
                <span className="font-mono" style={{
                  fontSize: '0.6875rem', fontWeight: 600, flexShrink: 0,
                  color: node.impact >= 7 ? '#ef4444' : 'var(--text-secondary)',
                }}>
                  {node.impact}/10
                </span>
              </div>
            ))}
          </div>

          {/* Keyboard hints */}
          <div className="font-mono" style={{
            padding: '0.625rem 1.25rem', fontSize: '0.6875rem',
            color: 'var(--text-secondary)', opacity: 0.4,
            borderTop: '1px solid rgba(255,255,255,0.04)',
            textAlign: 'center',
          }}>
            ↑↓ navigate  ·  ↵ select  ·  ESC close
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
