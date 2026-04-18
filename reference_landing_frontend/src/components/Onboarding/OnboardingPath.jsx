import { motion } from 'framer-motion';

export default function OnboardingPath({ path, nodes, onNodeSelect }) {
  if (!path || path.length === 0) return null;

  return (
    <div style={{ padding: '1.25rem', overflowY: 'auto', height: '100%' }}>
      <p className="font-mono" style={{
        color: 'var(--accent-end)', fontSize: '0.6rem', letterSpacing: '0.2em',
        textTransform: 'uppercase', marginBottom: '1.25rem', fontWeight: 600,
      }}>
        Start Here
      </p>

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
              }}
            >
              {/* Number circle */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--accent-end)', color: 'var(--bg-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.625rem', fontWeight: 700, flexShrink: 0,
                position: 'absolute', left: '-2rem', top: 0,
                zIndex: 1,
              }}>
                {i + 1}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <p className="font-mono" style={{
                  color: 'var(--text-primary)', fontSize: '0.75rem',
                  marginBottom: '0.25rem',
                }}>
                  {fileId.split('/').pop()}
                </p>
                <p style={{
                  color: 'var(--text-secondary)', fontSize: '0.6875rem',
                  lineHeight: 1.5, opacity: 0.7,
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
