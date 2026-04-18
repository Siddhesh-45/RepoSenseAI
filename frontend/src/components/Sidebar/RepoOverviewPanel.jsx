import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function RepoOverviewPanel({ repoSummary }) {
  if (!repoSummary) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
        <div className="spinner" style={{ width: 24, height: 24 }} />
        <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.6 }}>
          Awaiting repository overview...
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem', overflowY: 'auto', gap: '1.25rem' }}
    >
      
      {/* Human Summary */}
      {repoSummary.humanSummary && (
        <motion.div variants={itemVariants} className="glass-card accent-top" style={{ borderRadius: '0.5rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem', opacity: 0.1 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-end)" strokeWidth="1">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="font-mono" style={{ color: 'var(--accent-end)', fontSize: '0.625rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-end)', display: 'inline-block', boxShadow: '0 0 8px var(--accent-end)' }}></span>
            AI Synthesis
          </p>
          <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.6, textShadow: '0 2px 4px rgba(0,0,0,0.5)', opacity: 0.9 }}>
            {repoSummary.humanSummary}
          </p>
        </motion.div>
      )}

      {/* Structured Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <InfoBlock title="Name & Purpose" content={repoSummary.name ? `${repoSummary.name} — ${repoSummary.purpose}` : repoSummary.purpose} delay={0.1} />
        <InfoBlock title="Architecture" content={repoSummary.architecture} delay={0.2} />
        <InfoBlock title="Key Components" content={repoSummary.components} delay={0.3} />
        <InfoBlock title="Data Flow" content={repoSummary.data_flow} delay={0.4} />
        <InfoBlock title="Key Files" content={repoSummary.key_files} delay={0.5} />
        <InfoBlock title="Design Patterns" content={repoSummary.patterns} delay={0.6} />
      </div>

    </motion.div>
  );
}

function InfoBlock({ title, content, delay }) {
  if (!content || typeof content !== 'string') return null;
  return (
    <motion.div variants={itemVariants}>
      <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', marginBottom: '0.375rem', letterSpacing: '0.05em' }}>
        {title.toUpperCase()}
      </p>
      <div style={{ 
        color: 'var(--text-primary)', 
        fontSize: '0.8125rem', 
        lineHeight: 1.5, 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '0.75rem', 
        borderRadius: '0.375rem',
        transition: 'all 0.3s var(--ease-synapse)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
      }}
      >
        {content}
      </div>
    </motion.div>
  );
}
