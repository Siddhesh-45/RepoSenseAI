import { memo, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';

const typeColors = {
  entry: '#22c55e',
  core: '#3b82f6',
  util: '#a855f7',
  config: '#f59e0b',
};

function CustomNode({ data, selected }) {
  const { label, type, impact, highImpact } = data;

  const color = typeColors[type] || typeColors.core;
  const radius = 10 + Math.sqrt(impact || 1) * 4;
  const size = radius * 2;

  const glowStyle = useMemo(() => {
    if (highImpact) {
      return {
        boxShadow: `0 0 ${12 + impact}px rgba(239,68,68,0.5)`,
        animation: 'pulse-glow 2s ease-in-out infinite',
      };
    }
    return {
      boxShadow: selected ? `0 0 16px ${color}60` : `0 0 8px ${color}30`,
    };
  }, [highImpact, impact, selected, color]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      cursor: 'pointer',
    }}>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: color, border: 'none', width: 5, height: 5, opacity: 0 }}
      />

      {/* Node circle */}
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${color}, ${color}99)`,
        border: selected ? '2px solid white' : `1.5px solid ${color}80`,
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        transform: selected ? 'scale(1.15)' : 'scale(1)',
        ...glowStyle,
      }} />

      {/* Label */}
      <div className="font-mono" style={{
        marginTop: 6,
        fontSize: '0.5625rem',
        color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
        maxWidth: 90,
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}>
        {label}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: color, border: 'none', width: 5, height: 5, opacity: 0 }}
      />
    </div>
  );
}

export default memo(CustomNode);
