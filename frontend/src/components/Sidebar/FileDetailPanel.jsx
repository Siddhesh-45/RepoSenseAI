import { motion } from 'framer-motion';
import { getNodeColor } from '../Graph/graphHelpers';

const typeLabels = { entry: 'Entry', core: 'Core', util: 'Utility', config: 'Config' };

export default function FileDetailPanel({ node, allNodes, onNodeSelect }) {
  if (!node) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem' }}>
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }} 
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
            <line x1="12" y1="22" x2="12" y2="12"></line>
            <line x1="22" y1="8.5" x2="12" y2="12"></line>
            <line x1="2" y1="8.5" x2="12" y2="12"></line>
          </svg>
        </motion.div>
        <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center', opacity: 0.6, letterSpacing: '0.05em' }}>
          SELECT A NODE ⬡
        </p>
      </div>
    );
  }

  const color = getNodeColor(node.type);
  const pathIdentifier = node.fullPath || node.id || '';
  const dependents = allNodes ? allNodes.filter(n => n.deps && n.deps.some(d => 
    d === pathIdentifier || d.endsWith(pathIdentifier) || pathIdentifier.endsWith(d)
  )) : [];

  return (
    <motion.div
      key={node.fullPath}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={{ padding: '1.25rem', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Header */}
      <div>
        <p className="font-mono" style={{ color: 'var(--text-primary)', fontSize: '0.85rem', wordBreak: 'break-all', lineHeight: 1.5, marginBottom: '0.75rem', fontWeight: 600 }}>
          {node.fullPath || node.id || 'Unknown Path'}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className={`badge-${node.type}`} style={{ padding: '0.25rem 0.625rem', borderRadius: '0.25rem', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {typeLabels[node.type] || node.type}
          </span>
          {node.highImpact && (
            <span className="badge-high pulse-high" style={{ padding: '0.25rem 0.625rem', borderRadius: '0.25rem', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              ⚠ HIGH IMPACT
            </span>
          )}
        </div>
      </div>

      {/* AI Explanation */}
      <div>
        <p className="font-mono" style={{ color: 'var(--accent-end)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-end)', display: 'inline-block', boxShadow: '0 0 8px var(--accent-end)' }}></span>
           AI Explanation
        </p>
        <div className="glass-card accent-top" style={{ borderRadius: '0.5rem', padding: '1rem', position: 'relative' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
            {node.ai || 'No AI summary available for this node.'}
          </p>
        </div>
      </div>

      {/* Impact Score */}
      <div>
        <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Impact Score
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {node.impact}
          </span>
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/10</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginBottom: '0.5rem' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(node.impact / 10) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: '100%', borderRadius: 2,
              background: node.impact >= 7 ? '#ef4444' : node.impact >= 4 ? '#f59e0b' : '#22c55e',
              boxShadow: `0 0 10px ${node.impact >= 7 ? '#ef4444' : node.impact >= 4 ? '#f59e0b' : '#22c55e'}`
            }}
          />
        </div>
        <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', opacity: 0.6 }}>
          {dependents.length} files directly depend on this
        </p>
      </div>

      {/* Relational graph metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Imports */}
        {node.deps && node.deps.length > 0 && (
          <div>
            <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Imports ({node.deps.length}) ↘
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {node.deps.map((dep, i) => {
                const depNode = allNodes?.find(n => n.id === dep || dep.endsWith(n.id) || n.id.endsWith(dep));
                const depColor = depNode ? getNodeColor(depNode.type) : 'var(--text-secondary)';
                return (
                  <motion.button 
                    key={dep} 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    onClick={() => { if (depNode) onNodeSelect(depNode); }} 
                    className="font-mono chip" 
                    style={{ borderColor: `rgba(255,255,255,0.08)`, color: depColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = depColor; e.currentTarget.style.boxShadow = `0 0 8px ${depColor}40`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = `rgba(255,255,255,0.08)`; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {dep.split('/').pop()}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dependents */}
        {dependents.length > 0 && (
          <div>
            <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Used By ({dependents.length}) ↖
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {dependents.map((dep, i) => {
                const depColor = getNodeColor(dep.type);
                return (
                  <motion.button 
                    key={dep.id} 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    onClick={() => onNodeSelect(dep)} 
                    className="font-mono chip" 
                    style={{ borderColor: `rgba(255,255,255,0.08)`, color: depColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = depColor; e.currentTarget.style.boxShadow = `0 0 8px ${depColor}40`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = `rgba(255,255,255,0.08)`; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {dep.id.split('/').pop()}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
    </motion.div>
  );
}
