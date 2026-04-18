export default function MetricsBar({ metrics }) {
  if (!metrics) return null;

  const items = [
    { label: 'TOTAL FILES', value: metrics.totalFiles, color: 'var(--text-primary)' },
    { label: 'HIGH IMPACT', value: metrics.highImpactFiles, color: '#ef4444' },
    { label: 'DEPENDENCIES', value: metrics.totalEdges, color: 'var(--text-primary)' },
    { label: 'DENSITY', value: metrics.density, color: 'var(--text-primary)' },
    { label: 'ENTRY POINTS', value: metrics.entryPoints || 0, color: '#22c55e' },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '0', background: 'var(--bg-surface)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '0.5rem 1rem', width: '100%',
    }}>
      {items.map((item, i) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
          <div className="font-mono" style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0 1rem', fontSize: '0.6875rem',
          }}>
            <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              {item.label}:
            </span>
            <span style={{ color: item.color, fontWeight: 600 }}>
              {item.value}
            </span>
          </div>
          {i < items.length - 1 && (
            <div style={{
              width: 1, height: 16,
              background: 'rgba(255,255,255,0.08)',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}
