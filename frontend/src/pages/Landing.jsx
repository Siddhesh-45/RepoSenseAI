import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';

/* ─── SVG Icon components ─── */
const IconGraph = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#g1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#7b61ff"/></linearGradient></defs>
    <circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/>
    <path d="M7 12h10M17 6.5l-9.5 4M17 17.5l-9.5-4"/>
  </svg>
);
const IconAI = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#g2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#7b61ff"/></linearGradient></defs>
    <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4z"/>
    <path d="M9 12h6M10 9l4 6"/>
  </svg>
);
const IconImpact = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#g3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f472b6"/><stop offset="100%" stopColor="#7b61ff"/></linearGradient></defs>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);
const IconPath = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#g4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#34d399"/><stop offset="100%" stopColor="#60a5fa"/></linearGradient></defs>
    <path d="M3 12h4l3-9 4 18 3-9h4"/>
  </svg>
);
const IconSearch = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#g5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#f472b6"/></linearGradient></defs>
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    <path d="M11 8v6M8 11h6"/>
  </svg>
);
const IconOrphan = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#g6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f87171"/><stop offset="100%" stopColor="#fb923c"/></linearGradient></defs>
    <circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>
  </svg>
);

/* ─── Data ─── */
const FEATURES = [
  { Icon: IconGraph,  title: 'Architecture Graph',       desc: 'Render an interactive dependency graph of any codebase in seconds. Pan, zoom, and click into every node.' },
  { Icon: IconAI,     title: 'AI File Summaries',        desc: 'Claude generates plain-English explanations for every file — what it does, why it exists, and how it fits in.' },
  { Icon: IconImpact, title: 'High-Impact Detection',    desc: 'Instantly surface the critical modules that most of the codebase depends on — your blast-radius map.' },
  { Icon: IconPath,   title: 'Onboarding Path',          desc: 'A curated reading order built from dependency critical paths so new engineers ramp up 3× faster.' },
  { Icon: IconSearch, title: 'Natural Language Queries', desc: 'Ask "Where is user auth?" and see the exact files highlighted on the graph in real time.' },
  { Icon: IconOrphan, title: 'Orphan Detection',         desc: 'Automatically identify dead-code files with zero inbound references — clean up with confidence.' },
];

const STATS = [
  { value: '< 30s',  label: 'Average analysis time' },
  { value: '10+',    label: 'Languages supported' },
  { value: '100%',   label: 'Local & private repos' },
];

const SAMPLES = ['expressjs/express', 'facebook/react', 'vercel/next.js'];

/* ─── Scroll-reveal wrapper ─── */
const Reveal = ({ children, delay = 0, y = 24 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ─── Main component ─── */
const Landing = () => {
  const [url, setUrl] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) { setError('Enter a GitHub repository URL to continue.'); return; }
    if (!trimmed.includes('github.com')) { setError('Please enter a valid GitHub URL.'); return; }
    setError('');
    navigate('/analyze', { state: { repoUrl: trimmed } });
  };

  const handleSample = (repo) => {
    const full = `https://github.com/${repo}`;
    navigate('/analyze', { state: { repoUrl: full } });
  };

  /* Key shortcut: Enter submits, Esc clears */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setUrl(''); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      <AnimatedBackground />

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2.5rem', height: 64,
        background: 'rgba(2, 8, 24, 0.7)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(77,159,255,0.1)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4d9fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.01em' }}>
            RepoSense <span style={{ color: 'var(--neon)' }}>AI</span>
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="#features" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', padding: '0.5rem 0.875rem', borderRadius: 6, transition: 'color 0.2s' }}
            onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>
            Features
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', padding: '0.5rem 0.875rem', borderRadius: 6, border: '1px solid rgba(77,159,255,0.2)', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(77,159,255,0.5)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(77,159,255,0.2)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.37.6.1.82-.26.82-.57v-2c-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.08-.74.08-.73.08-.73 1.2.08 1.83 1.23 1.83 1.23 1.06 1.82 2.78 1.3 3.46.99.1-.77.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.82.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px', position: 'relative', zIndex: 1, textAlign: 'center',
      }}>
        {/* Dark center vignette so text is legible over neural bg */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 65% at 50% 50%, rgba(2,8,24,0.82) 0%, rgba(2,8,24,0.5) 65%, transparent 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, width: '100%' }}>
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(77,159,255,0.1)', border: '1px solid rgba(77,159,255,0.3)',
              borderRadius: 999, padding: '6px 16px', fontSize: '0.78rem', fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--neon)', letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon)', boxShadow: '0 0 8px var(--neon)', animation: 'pulse-dot 2s ease infinite' }} />
              AI-Powered Codebase Intelligence
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16,1,0.3,1] }}
            style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24, color: '#fff' }}
          >
            Understand any codebase<br />
            <span style={{ background: 'linear-gradient(100deg, #60a5fa 0%, #7b61ff 50%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              in under 2 minutes.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}
            style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.7 }}
          >
            Paste a GitHub URL — get an interactive dependency graph, AI-generated file summaries, and a curated onboarding path. Instantly.
          </motion.p>

          {/* Input form */}
          <motion.form
            onSubmit={handleAnalyze}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            style={{ display: 'flex', maxWidth: 680, margin: '0 auto', gap: 12, flexWrap: 'wrap' }}
          >
            <div style={{
              flex: 1, minWidth: 280,
              display: 'flex', alignItems: 'center',
              background: 'rgba(6,13,31,0.9)',
              border: `1.5px solid ${focused ? 'rgba(77,159,255,0.6)' : 'rgba(77,159,255,0.2)'}`,
              borderRadius: 12,
              boxShadow: focused ? '0 0 0 4px rgba(77,159,255,0.08), 0 0 24px rgba(77,159,255,0.12)' : 'none',
              transition: 'all 0.25s ease',
              padding: '0 20px',
            }}>
              <svg style={{ flexShrink: 0, marginRight: 10, opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                <path d="M9 18c-4.51 2-5-2-7-2"/>
              </svg>
              <input
                type="text"
                value={url}
                onChange={e => { setUrl(e.target.value); setError(''); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="https://github.com/username/repository"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '0.9375rem', padding: '18px 0',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            </div>
            <button type="submit" style={{
              background: 'linear-gradient(135deg, #7b61ff, #4d9fff)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '0 36px', fontSize: '0.9375rem', fontWeight: 700,
              fontFamily: "'Syne', sans-serif", cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.25s ease', minHeight: 58,
            }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(77,159,255,0.35)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              Analyze →
            </button>
          </motion.form>

          {/* Error */}
          {error && (
            <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ color: '#f87171', fontSize: '0.85rem', marginTop: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              ⚠ {error}
            </motion.p>
          )}

          {/* Sample repos */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Try:</span>
            {SAMPLES.map(repo => (
              <button key={repo} onClick={() => handleSample(repo)} style={{
                background: 'rgba(77,159,255,0.06)', border: '1px solid rgba(77,159,255,0.18)',
                borderRadius: 6, color: '#60a5fa', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8125rem', padding: '5px 12px', cursor: 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(77,159,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(77,159,255,0.4)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(77,159,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(77,159,255,0.18)'; }}>
                {repo}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(77,159,255,0.4)" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════ STATS BAR ══════════════ */}
      <Reveal y={16}>
        <section style={{
          position: 'relative', zIndex: 1,
          maxWidth: 900, margin: '0 auto', padding: '0 24px 80px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1, borderRadius: 16, overflow: 'hidden',
          border: '1px solid rgba(77,159,255,0.12)',
          background: 'rgba(6,13,31,0.7)', backdropFilter: 'blur(16px)',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '28px 32px', textAlign: 'center',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(77,159,255,0.1)' : 'none',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'Syne', sans-serif", background: 'linear-gradient(135deg, #60a5fa, #7b61ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </section>
      </Reveal>

      {/* ══════════════ FEATURES ══════════════ */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '80px 24px 120px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Section header */}
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span style={{
                display: 'inline-block', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'var(--neon)', marginBottom: 16,
              }}>What you get</span>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Everything you need to understand<br />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>any codebase, fast.</span>
              </h2>
            </div>
          </Reveal>

          {/* Cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 0.07} y={20}>
                <FeatureCard {...f} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA BANNER ══════════════ */}
      <Reveal y={20}>
        <section style={{ position: 'relative', zIndex: 1, padding: '0 24px 120px' }}>
          <div style={{
            maxWidth: 860, margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(77,159,255,0.08) 0%, rgba(123,97,255,0.12) 100%)',
            border: '1px solid rgba(77,159,255,0.2)', borderRadius: 24,
            padding: '64px 48px', textAlign: 'center',
            backdropFilter: 'blur(20px)',
          }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>
              Ready to explore your codebase?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 36, lineHeight: 1.6 }}>
              No sign-up. No installation. Just paste a GitHub URL and go.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                background: 'linear-gradient(135deg, #7b61ff, #4d9fff)', color: '#fff',
                border: 'none', borderRadius: 12, padding: '16px 44px',
                fontSize: '1rem', fontWeight: 700, fontFamily: "'Syne', sans-serif",
                cursor: 'pointer', transition: 'all 0.25s',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(77,159,255,0.35)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
              Get Started — It's Free
            </button>
          </div>
        </section>
      </Reveal>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(77,159,255,0.08)',
        padding: '24px 48px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4d9fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>RepoSense AI</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginLeft: 4 }}>·</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Built for developers</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['GitHub', 'Docs', 'Privacy'].map(l => (
            <a key={l} href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>
              {l}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

/* ─── Feature card (extracted for cleanliness) ─── */
const FeatureCard = ({ Icon, title, desc }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(6,13,31,0.7)', backdropFilter: 'blur(16px)',
        border: `1px solid ${hovered ? 'rgba(77,159,255,0.4)' : 'rgba(77,159,255,0.12)'}`,
        borderRadius: 16, padding: '40px 36px',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        boxShadow: hovered ? '0 24px 48px rgba(77,159,255,0.12)' : 'none',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 14, marginBottom: 24,
        background: 'rgba(77,159,255,0.08)', border: '1px solid rgba(77,159,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.3s',
        ...(hovered ? { background: 'rgba(77,159,255,0.14)' } : {}),
      }}>
        <Icon />
      </div>
      <h3 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 700,
        fontSize: '1.15rem', color: '#fff', marginBottom: 12, letterSpacing: '-0.01em',
      }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
};

export default Landing;
