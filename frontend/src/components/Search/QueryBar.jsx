import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNodeColor } from '../Graph/graphHelpers';
import { askQuestion } from '../../services/api';

const typeFilters = ['All', 'Entry', 'Core', 'Utility', 'High Impact'];

export default function QueryBar({ isOpen, onClose, nodes, onSelect, onHighlight }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIdx, setSelectedIdx] = useState(0);

  // AI Q&A state
  const [aiAnswer, setAiAnswer] = useState(null);   // { answer, sources }
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [mode, setMode] = useState('search');         // 'search' | 'ai'

  const inputRef = useRef(null);

  // Focus input on open, reset state
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIdx(0);
      setAiAnswer(null);
      setAiError(null);
      setMode('search');
    }
  }, [isOpen]);

  // Detect natural language: has a space and is longer than 5 chars
  const isNaturalLanguage = query.includes(' ') && query.trim().length > 5;

  // File search results (disabled in AI mode)
  const results = useMemo(() => {
    if (!nodes || mode === 'ai') return [];
    let filtered = [...nodes];

    if (activeFilter !== 'All') {
      const filterMap = { Entry: 'entry', Core: 'core', Utility: 'util', 'High Impact': null };
      if (activeFilter === 'High Impact') {
        filtered = filtered.filter(n => n.highImpact);
      } else {
        filtered = filtered.filter(n => n.type === filterMap[activeFilter]);
      }
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(n =>
        n.id.toLowerCase().includes(q) ||
        (n.type || '').toLowerCase().includes(q) ||
        (n.ai || '').toLowerCase().includes(q)
      ).sort((a, b) => {
        const aName = a.id.toLowerCase().includes(q) ? 2 : 0;
        const bName = b.id.toLowerCase().includes(q) ? 2 : 0;
        return bName - aName || b.impact - a.impact;
      });
    } else {
      filtered.sort((a, b) => b.impact - a.impact);
    }

    return filtered.slice(0, 15);
  }, [nodes, query, activeFilter, mode]);

  // Highlight matched nodes in graph (search mode)
  useEffect(() => {
    if (onHighlight && mode === 'search') {
      onHighlight(results.map(r => r.id));
    }
  }, [results, onHighlight, mode]);

  // Highlight source nodes in graph when AI answers
  useEffect(() => {
    if (onHighlight && mode === 'ai' && aiAnswer?.sources) {
      onHighlight(aiAnswer.sources);
    }
  }, [aiAnswer, onHighlight, mode]);

  // Call the RAG Q&A backend
  async function handleAskAI() {
    if (!query.trim() || aiLoading) return;
    setMode('ai');
    setAiLoading(true);
    setAiAnswer(null);
    setAiError(null);
    try {
      const result = await askQuestion(query.trim(), nodes);
      setAiAnswer(result);
    } catch (err) {
      setAiError('AI Q&A failed. Check backend connection.');
    } finally {
      setAiLoading(false);
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown' && mode === 'search') {
        e.preventDefault();
        setSelectedIdx(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp' && mode === 'search') {
        e.preventDefault();
        setSelectedIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (isNaturalLanguage) {
          handleAskAI();
        } else if (mode === 'search' && results[selectedIdx]) {
          handleSelect(results[selectedIdx]);
        }
      } else if (e.key === 'Escape') {
        if (mode === 'ai') {
          setMode('search');
          setAiAnswer(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, results, selectedIdx, onClose, isNaturalLanguage, mode, aiLoading]);

  function handleSelect(node) {
    onSelect({ ...node, fullPath: node.id, label: node.id.split('/').pop() });
    onClose();
  }

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
        onClick={() => { if (!aiLoading) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: 620, background: 'var(--bg-surface)',
            border: `1px solid ${mode === 'ai' ? 'rgba(0,200,255,0.25)' : 'rgba(0,255,70,0.2)'}`,
            boxShadow: mode === 'ai'
              ? '0 20px 40px rgba(0,200,255,0.08)'
              : '0 20px 40px rgba(0,255,70,0.08)',
            borderRadius: '0.375rem', overflow: 'hidden',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        >
          {/* ── Input row ── */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1rem', flexShrink: 0, opacity: mode === 'ai' ? 1 : 0.4, transition: 'opacity 0.2s' }}>
              {aiLoading ? '⟳' : mode === 'ai' ? '🤖' : '⌘'}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              disabled={aiLoading}
              onChange={e => {
                setQuery(e.target.value);
                setSelectedIdx(0);
                if (mode === 'ai') { setMode('search'); setAiAnswer(null); }
              }}
              placeholder='Search files · or ask "where is authentication?"'
              className="font-mono"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '1.0625rem',
                caretColor: mode === 'ai' ? '#00c8ff' : 'var(--accent-end)',
                opacity: aiLoading ? 0.5 : 1,
              }}
            />
            {isNaturalLanguage && mode === 'search' && !aiLoading && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleAskAI}
                className="font-mono"
                style={{
                  background: 'rgba(0,200,255,0.12)',
                  border: '1px solid rgba(0,200,255,0.3)',
                  color: '#00c8ff', fontSize: '0.6875rem', fontWeight: 600,
                  padding: '0.3rem 0.625rem', borderRadius: '0.25rem',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                Ask AI ↵
              </motion.button>
            )}
            {aiLoading && (
              <span className="font-mono" style={{ fontSize: '0.6875rem', color: '#00c8ff', opacity: 0.7 }}>
                Thinking…
              </span>
            )}
          </div>

          {/* ── AI Answer Panel ── */}
          {mode === 'ai' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '1.25rem', maxHeight: 420, overflowY: 'auto' }}
            >
              {aiLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[80, 65, 90, 50].map((w, i) => (
                    <div key={i} style={{
                      height: 10, width: `${w}%`,
                      background: 'rgba(0,200,255,0.08)', borderRadius: 4,
                      animation: `pulse 1.4s ease-in-out ${i * 0.1}s infinite`,
                    }} />
                  ))}
                </div>
              )}

              {aiError && (
                <p className="font-mono" style={{ color: '#ef4444', fontSize: '0.8125rem', opacity: 0.8 }}>
                  {aiError}
                </p>
              )}

              {aiAnswer && !aiLoading && (
                <>
                  <div style={{ borderLeft: '2px solid rgba(0,200,255,0.4)', paddingLeft: '1rem', marginBottom: '1.25rem' }}>
                    <p className="font-mono" style={{
                      color: 'rgba(0,200,255,0.6)', fontSize: '0.6rem',
                      letterSpacing: '0.15em', textTransform: 'uppercase',
                      marginBottom: '0.625rem', fontWeight: 600,
                    }}>
                      🤖 AI Answer
                    </p>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                      {aiAnswer.answer}
                    </p>
                  </div>

                  {aiAnswer.sources?.length > 0 && (
                    <div>
                      <p className="font-mono" style={{
                        color: 'var(--text-secondary)', fontSize: '0.6rem',
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        marginBottom: '0.5rem', opacity: 0.6,
                      }}>
                        Retrieved from {aiAnswer.sources.length} file{aiAnswer.sources.length !== 1 ? 's' : ''}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {aiAnswer.sources.map(src => {
                          const srcNode = nodes?.find(n => n.id === src);
                          const color = getNodeColor(srcNode?.type || 'core');
                          return (
                            <button
                              key={src}
                              className="font-mono"
                              onClick={() => {
                                if (srcNode) {
                                  onSelect({ ...srcNode, fullPath: srcNode.id, label: srcNode.id.split('/').pop() });
                                  onClose();
                                }
                              }}
                              style={{
                                background: `${color}14`, border: `1px solid ${color}40`,
                                color, fontSize: '0.6875rem', padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                cursor: srcNode ? 'pointer' : 'default',
                              }}
                            >
                              {src.split('/').pop()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ── File Search Results ── */}
          {mode === 'search' && (
            <>
              <div style={{
                display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                {typeFilters.map(f => (
                  <button key={f} onClick={() => { setActiveFilter(f); setSelectedIdx(0); }} style={{
                    background: activeFilter === f ? 'var(--accent-end)' : 'var(--bg-nested)',
                    color: activeFilter === f ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    border: 'none', padding: '0.3rem 0.75rem', borderRadius: '0.375rem',
                    fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    {f}
                  </button>
                ))}
              </div>

              {isNaturalLanguage && (
                <div className="font-mono" style={{
                  textAlign: 'center', padding: '0.5rem', fontSize: '0.6875rem',
                  color: '#00c8ff', opacity: 0.65,
                  borderBottom: '1px solid rgba(0,200,255,0.08)',
                }}>
                  Press ↵ or click "Ask AI" for an AI-powered answer
                </div>
              )}

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
                    onMouseEnter={() => setSelectedIdx(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 1.25rem', cursor: 'pointer',
                      background: i === selectedIdx ? 'var(--bg-nested)' : 'transparent',
                      borderLeft: i === selectedIdx ? '2px solid var(--accent-end)' : '2px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: getNodeColor(node.type) }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {node.id.split('/').pop()}
                      </p>
                      <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.6875rem', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {node.id}
                      </p>
                    </div>
                    <span className="font-mono" style={{ fontSize: '0.6875rem', fontWeight: 600, flexShrink: 0, color: node.impact >= 7 ? '#ef4444' : 'var(--text-secondary)' }}>
                      {node.impact}/10
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Keyboard hints ── */}
          <div className="font-mono" style={{
            padding: '0.625rem 1.25rem', fontSize: '0.6875rem',
            color: 'var(--text-secondary)', opacity: 0.4,
            borderTop: '1px solid rgba(255,255,255,0.04)',
            textAlign: 'center',
          }}>
            {mode === 'ai'
              ? 'ESC go back  ·  click source file to navigate'
              : isNaturalLanguage
              ? '↵ Ask AI  ·  ESC close'
              : '↑↓ navigate  ·  ↵ select  ·  ESC close'}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
