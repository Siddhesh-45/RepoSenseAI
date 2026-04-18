import { motion } from 'framer-motion';
import { useGraphStore } from '../store/graphStore';

const NodePanel = ({ nodeData, onClose, onNodeClick }) => {
  const { edges, nodes } = useGraphStore();

  if (!nodeData) return null;

  const typeConfig = {
    entry: { color: 'var(--neon)', label: 'Entry Point' },
    core: { color: 'var(--neon2)', label: 'Core Module' },
    utility: { color: 'var(--neon4)', label: 'Utility' },
    external: { color: '#666', label: 'External Wrapper' },
    test: { color: '#333', label: 'Test' }
  };

  const config = typeConfig[nodeData.type] || typeConfig.core;
  
  // Find dependents and dependencies
  const dependencies = edges.filter(e => {
    const sourceId = typeof e.source === 'string' ? e.source : e.source.id;
    return sourceId === nodeData.id;
  }).map(e => {
    const targetId = typeof e.target === 'string' ? e.target : e.target.id;
    return nodes.find(n => n.id === targetId);
  }).filter(Boolean);

  const dependents = edges.filter(e => {
    const targetId = typeof e.target === 'string' ? e.target : e.target.id;
    return targetId === nodeData.id;
  }).map(e => {
    const sourceId = typeof e.source === 'string' ? e.source : e.source.id;
    return nodes.find(n => n.id === sourceId);
  }).filter(Boolean);

  // Simple progress bar calculating score out of somewhat arbitrary max (like 50)
  const scorePercent = Math.min((nodeData.impactScore / 50) * 100, 100);
  const barColor = scorePercent > 50 ? 'var(--neon3)' : scorePercent > 20 ? 'var(--neon4)' : 'var(--neon)';

  return (
    <motion.div 
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="glass-card"
      style={{
        position: 'absolute',
        top: 24,
        right: 24,
        bottom: 24,
        width: 380,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        overflow: 'hidden'
      }}
    >
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: 24, top: 24, background: 'none', border:'none', color:'#fff', cursor:'pointer', fontSize: '1.2rem' }}>&times;</button>
        <div className="badge" style={{ border: `1px solid ${config.color}`, color: config.color, marginBottom: 16 }}>{config.label}</div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: 8, wordBreak: 'break-all' }}>{nodeData.label}</h3>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{nodeData.relativePath}</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        
        {nodeData.isOrphaned && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid var(--neon3)', padding: 12, borderRadius: 8, marginBottom: 20, color: 'var(--neon3)', fontSize: '0.85rem' }}>
            <strong>Warning:</strong> This module has no imports or dependents.
          </div>
        )}

        {nodeData.isHighImpact && (
          <div style={{ background: 'rgba(255,217,61,0.1)', border: '1px solid var(--neon4)', padding: 12, borderRadius: 8, marginBottom: 20, color: 'var(--neon4)', fontSize: '0.85rem' }}>
            <strong>High-Risk:</strong> Changes here affect {nodeData.importedByCount} modules.
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: 8 }}>Impact Score <span style={{ float:'right' }}>{nodeData.impactScore}</span></h4>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${scorePercent}%`, background: barColor, transition: 'width 0.3s ease' }} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: 8 }}>AI Summary</h4>
          <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, borderLeft: '3px solid var(--neon2)' }}>
            "{nodeData.aiSummary}"
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Dependencies ({dependencies.length})</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {dependencies.map(d => (
              <span key={d.id} onClick={() => onNodeClick(d)} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', color: '#ccc' }}>
                {d.label}
              </span>
            ))}
            {dependencies.length === 0 && <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>None</span>}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Dependents ({dependents.length})</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {dependents.map(d => (
              <span key={d.id} onClick={() => onNodeClick(d)} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', color: '#ccc' }}>
                {d.label}
              </span>
            ))}
            {dependents.length === 0 && <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>None</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NodePanel;
