import { useState } from 'react';
import FileTreePanel from './FileTreePanel';
import SourceControlPanel from './SourceControlPanel';

const sidebarItems = [
  { id: 'files', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ), tooltip: 'File Structure' },
  { id: 'source', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
      <path d="M6 21V9a9 9 0 0 0 9 9"/>
    </svg>
  ), tooltip: 'Source Control' },
];

export default function ActivitySidebar({ graphData, onNodeSelect, selectedNodeId }) {
  const [activePanel, setActivePanel] = useState(null);

  const togglePanel = (id) => {
    setActivePanel(prev => prev === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Icon Rail */}
      <div style={{
        width: 48,
        background: 'var(--bg-surface)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '0.5rem',
        gap: '0.25rem',
        zIndex: 10,
      }}>
        {sidebarItems.map(item => (
          <button
            key={item.id}
            onClick={() => togglePanel(item.id)}
            title={item.tooltip}
            style={{
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activePanel === item.id ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
              border: 'none',
              borderLeft: activePanel === item.id ? '2px solid var(--accent-start)' : '2px solid transparent',
              color: activePanel === item.id ? 'var(--accent-start)' : 'var(--text-secondary)',
              cursor: 'pointer',
              borderRadius: '0 4px 4px 0',
              transition: 'all 0.2s',
              opacity: activePanel === item.id ? 1 : 0.6,
            }}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* Slide-out Panel */}
      <div style={{
        width: activePanel ? 280 : 0,
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        background: 'var(--bg-surface)',
        borderRight: activePanel ? '1px solid rgba(255,255,255,0.04)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {activePanel && (
          <div style={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Panel Header */}
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span className="font-mono" style={{
                color: 'var(--text-secondary)',
                fontSize: '0.6875rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                {activePanel === 'files' ? 'Explorer' : 'Source Control'}
              </span>
              <button
                onClick={() => setActivePanel(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  opacity: 0.5,
                  padding: '2px 6px',
                }}
              >
                ×
              </button>
            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activePanel === 'files' && (
                <FileTreePanel
                  nodes={graphData?.nodes || []}
                  onNodeSelect={onNodeSelect}
                  selectedNodeId={selectedNodeId}
                />
              )}
              {activePanel === 'source' && (
                <SourceControlPanel
                  commits={graphData?.commits || []}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
