import { motion } from 'framer-motion';

export default function OnboardingPath({ path, nodes, onNodeSelect, selectedNodeId }) {
  if (!path || path.length === 0) return null;

  const isFiltered = !!selectedNodeId;

  return (
    <div style={{ padding: '1.25rem', overflowY: 'auto', height: '100%' }}>
      <p className="font-mono" style={{
        color: 'var(--accent-end)', fontSize: '0.6rem', letterSpacing: '0.2em',
        textTransform: 'uppercase', marginBottom: isFiltered ? '0.5rem' : '1.25rem', fontWeight: 600,
      }}>
        {isFiltered ? 'Filtered Path' : 'Start Here'}
      </p>

      {/* Filtered path banner */}
      {isFiltered && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '1.25rem',
            padding: '0.4rem 0.625rem',
            background: 'rgba(13,255,71,0.07)',
            border: '1px solid rgba(13,255,71,0.18)',
            borderRadius: '0.25rem',
            fontSize: '0.6rem',
            color: 'rgba(13,255,71,0.7)',
            fontFamily: 'monospace',
            letterSpacing: '0.03em',
          }}
        >
          Showing subpath for · {selectedNodeId.split('/').pop()}
        </motion.div>
      )}

      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 11, top: 16, bottom: 16,
          width: 1, background: 'rgba(13,255,71,0.2)',
        }} />

        {path.map((fileId, i) => {
          const node = nodes?.find(n => n.id === fileId);
          const ai = node?.ai || 'Part of the dependency chain.';
          const shortAi = ai.length > 60 ? ai.substring(0, 60) + '...' : ai;
          const isActive = fileId === selectedNodeId;

          return (
            <motion.div
              key={fileId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                if (node) {
                  onNodeSelect({
                    ...node,
                    fullPath: node.id,
                    label: node.id.split('/').pop(),
                  });
                }
              }}
              style={{
                display: 'flex', gap: '0.75rem', marginBottom: '1.25rem',
                cursor: 'pointer', position: 'relative',
                background: isActive ? 'rgba(13,255,71,0.06)' : 'transparent',
                borderRadius: isActive ? '0.375rem' : 0,
                padding: isActive ? '0.375rem 0.5rem 0.375rem 0' : 0,
                marginLeft: isActive ? '-0.5rem' : 0,
                paddingLeft: isActive ? '0.5rem' : 0,
                outline: isActive ? '1px solid rgba(13,255,71,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {/* Number circle */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: isActive ? 'var(--accent-end)' : 'rgba(13,255,71,0.25)',
                color: isActive ? 'var(--bg-primary)' : 'var(--accent-end)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.625rem', fontWeight: 700, flexShrink: 0,
                position: 'absolute', left: '-2rem', top: isActive ? '0.375rem' : 0,
                zIndex: 1,
                boxShadow: isActive ? '0 0 10px rgba(13,255,71,0.5)' : 'none',
                transition: 'all 0.2s',
              }}>
                {i + 1}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <p className="font-mono" style={{
                  color: isActive ? 'var(--accent-end)' : 'var(--text-primary)',
                  fontSize: '0.75rem',
                  marginBottom: '0.25rem',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'color 0.2s',
                }}>
                  {fileId.split('/').pop()}
                  {isActive && (
                    <span style={{
                      marginLeft: '0.4rem', fontSize: '0.55rem',
                      color: 'rgba(13,255,71,0.6)', fontWeight: 400,
                      verticalAlign: 'middle',
                    }}>◉ selected</span>
                  )}
                </p>
                <p style={{
                  color: 'var(--text-secondary)', fontSize: '0.6875rem',
                  lineHeight: 1.5, opacity: isActive ? 0.9 : 0.7,
                }}>
                  {shortAi}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
