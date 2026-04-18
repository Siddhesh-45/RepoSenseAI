import { motion } from 'framer-motion';

const steps = [
  { label: 'Fetching repository', key: 'fetch' },
  { label: 'Extracting dependencies', key: 'deps' },
  { label: 'Classifying files', key: 'classify' },
  { label: 'Scoring impact', key: 'score' },
  { label: 'Generating AI summaries', key: 'ai' },
  { label: 'Building graph', key: 'build' },
];

export default function AnalysisLoader({ repoName, currentStep = 0, error = null }) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', zIndex: 100,
    }}>
      {/* Grid bg */}
      <div className="grid-overlay" />

      {/* Pulsing hexagon */}
      <motion.div
        className="hex-pulse"
        style={{
          width: 80, height: 80, marginBottom: '2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80">
          <polygon
            points="40,4 72,22 72,58 40,76 8,58 8,22"
            fill="none"
            stroke="#0dff47"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <polygon
            points="40,14 62,28 62,52 40,66 18,52 18,28"
            fill="rgba(0,255,70,0.06)"
            stroke="#0dff47"
            strokeWidth="0.5"
            opacity="0.4"
          />
        </svg>
      </motion.div>

      {/* Repo name */}
      <p className="font-mono" style={{
        color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2.5rem',
        letterSpacing: '0.05em',
      }}>
        Analyzing <span style={{ color: 'var(--text-primary)' }}>{repoName || 'repository'}</span>
      </p>

      {/* Error state */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '0.375rem', padding: '1rem 1.5rem', marginBottom: '1.5rem',
          maxWidth: 400, textAlign: 'center',
        }}>
          <p style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}>Analysis Failed</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{error}</p>
        </div>
      )}

      {/* Step list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 300 }}>
        {steps.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep && !error;
          const isPending = i > currentStep;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
              }}
            >
              {/* Icon */}
              <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isDone && (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <circle cx="9" cy="9" r="8" fill="none" stroke="#0dff47" strokeWidth="1.5" />
                    <path d="M5.5 9.5l2 2 5-5" stroke="#0dff47" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {isActive && (
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                )}
                {isPending && (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <circle cx="9" cy="9" r="8" fill="none" stroke="#adaaaa" strokeWidth="1" opacity="0.3" />
                  </svg>
                )}
                {i === currentStep && error && (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <circle cx="9" cy="9" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                    <path d="M6 6l6 6M12 6l-6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </div>

              {/* Label */}
              <span className="font-mono" style={{
                fontSize: '0.8125rem',
                color: isDone ? 'var(--text-secondary)' : isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                opacity: isPending ? 0.4 : 1,
                fontWeight: isActive ? 500 : 400,
              }}>
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 3,
        background: 'var(--bg-surface)',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${error ? progress : progress}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: '100%',
            background: error ? '#ef4444' : 'linear-gradient(90deg, var(--accent-start), var(--accent-end))',
          }}
        />
      </div>
    </div>
  );
}
