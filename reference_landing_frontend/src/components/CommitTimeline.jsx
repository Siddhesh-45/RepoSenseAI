import { useState } from 'react';

const CommitTimeline = ({ analysis }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!analysis || !analysis.commitHistory) return null;

  const maxCommits = Math.max(...analysis.commitHistory.map(h => h.commits), 1);
  const hotFiles = analysis.hotFiles || [];

  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
      <div 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⏱️ Commit Timeline
        </h3>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
          ▼
        </span>
      </div>

      {isOpen && (
        <div style={{ marginTop: 20, animation: 'fadeUp 0.3s forwards' }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', height: 100, gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {analysis.commitHistory.map((h, i) => {
              const heightPct = (h.commits / maxCommits) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div 
                    title={`${h.month}: ${h.commits} commits`}
                    style={{ 
                      width: '100%', 
                      height: `${heightPct}%`, 
                      background: 'var(--neon2)', 
                      opacity: 0.7,
                      borderTopLeftRadius: 2,
                      borderTopRightRadius: 2
                    }} 
                  />
                </div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
            <span>{analysis.commitHistory[0]?.month}</span>
            <span>{analysis.commitHistory[analysis.commitHistory.length - 1]?.month}</span>
          </div>

          {hotFiles.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: 12, color: 'var(--neon3)' }}>🔥 Hot Files (Frequently Changed)</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem' }}>
                {hotFiles.slice(0, 5).map((hf, i) => (
                  <li key={i} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', background: 'rgba(255,107,107,0.1)', padding: '4px 8px', borderRadius: 4 }}>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }} title={hf.nodeId}>{hf.nodeId.split('/').pop()}</span>
                    <span style={{ color: 'var(--neon3)' }}>{hf.changeFrequency}x</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default CommitTimeline;
