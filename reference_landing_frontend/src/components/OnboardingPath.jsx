import { useGraphStore } from '../store/graphStore';
import { useState, useEffect } from 'react';

const OnboardingPath = () => {
  const { onboardingPath, selectNode } = useGraphStore();
  const [readDirs, setReadDirs] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('codenav_read_files') || '[]');
      setReadDirs(stored);
    } catch(e) {}
  }, []);

  const handleToggle = (nodeId) => {
    const updated = readDirs.includes(nodeId)
      ? readDirs.filter(id => id !== nodeId)
      : [...readDirs, nodeId];
      
    setReadDirs(updated);
    localStorage.setItem('codenav_read_files', JSON.stringify(updated));
  };

  if (!onboardingPath || onboardingPath.length === 0) return null;

  const readCount = onboardingPath.filter(p => readDirs.includes(p.nodeId)).length;
  const progressPercent = (readCount / onboardingPath.length) * 100;

  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        🎓 Recommended Reading Order
      </h3>
      
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span>Progress</span>
        <span>{readCount} / {onboardingPath.length} files read</span>
      </div>

      <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--neon2)', transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {onboardingPath.map((path, idx) => {
          const isRead = readDirs.includes(path.nodeId);
          return (
            <div 
              key={path.nodeId} 
              style={{ 
                display: 'flex', 
                gap: 12, 
                alignItems: 'flex-start',
                opacity: isRead ? 0.6 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              <input 
                type="checkbox" 
                checked={isRead}
                onChange={() => handleToggle(path.nodeId)}
                style={{ marginTop: 4, cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div 
                  onClick={() => selectNode(path.nodeId)}
                  style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', marginBottom: 4 }}
                  onMouseOver={(e) => e.target.style.color = 'var(--neon)'}
                  onMouseOut={(e) => e.target.style.color = '#fff'}
                >
                  <span style={{ color: 'var(--neon2)', marginRight: 6 }}>{idx + 1}.</span> 
                  {path.nodeId.split('/').pop()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{path.reason}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingPath;
