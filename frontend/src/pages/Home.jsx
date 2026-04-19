import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ─── Particle Background ─── */
function ParticleCanvas() {
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 15,
      size: 1 + Math.random() * 2,
    })), []);

  const streamers = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      height: 80 + Math.random() * 200,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 10,
    })), []);

  return (
    <>
      <div className="particle-canvas">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
        {streamers.map(s => (
          <div
            key={`s-${s.id}`}
            className="matrix-streamer"
            style={{
              left: `${s.left}%`,
              height: `${s.height}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="grid-overlay" />
    </>
  );
}

/* ─── Feature Data ─── */
const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0dff47" strokeWidth="1.5">
        <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
        <path d="M12 7v4M7.5 17.5L10 13M16.5 17.5L14 13" />
      </svg>
    ),
    title: 'Dependency Graph',
    desc: 'Visualize thousands of files in milliseconds. Uncover hidden architectural patterns instantly.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0dff47" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M8 10h8M8 14h5" />
      </svg>
    ),
    title: 'AI Explanations',
    desc: 'Automated module descriptions and intent analysis powered by advanced language models.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0dff47" strokeWidth="1.5">
        <path d="M9 5l7 7-7 7" />
      </svg>
    ),
    title: 'Onboarding Path',
    desc: 'Generate step-by-step reading guides based on dependency critical paths.',
  },
];

/* ─── Sample repos ─── */
const sampleRepos = ['expressjs/express', 'facebook/react', 'vercel/next.js'];

/* ─── Home Page ─── */
export default function Home() {
  const [url, setUrl] = useState('');
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [mode, setMode] = useState('url'); // 'url', 'zip'
  const fileInputRef = useRef(null);

  async function handleAnalyze(e) {
    e && e.preventDefault();
    if (mode === 'url') {
      if (!url.trim()) return;
      navigate('/analyze', { state: { repoUrl: url.trim() } });
    }
  }

  function handleZipUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Create a temporary object URL to represent the upload payload state, or navigate passing the file
    // Note: React Router state can't easily proxy non-serializable File objects across pages cleanly.
    // Instead of passing the File object to Analyzer, we send the File directly to the backend here,
    // and wait for the response, then pass the graph data to Analyzer (or re-architect Analyzer to accept File).
    // Given the current architecture, Analyzer.jsx triggers the fetch. 
    // We should navigate to Analyzer with a special flag: { isZip: true, file: file }
    navigate('/analyze', { state: { isZip: true, file: file } });
  }

  function handleSample(repo) {
    setUrl(`https://github.com/${repo}`);
    setMode('url');
    // Allow a tick for state to settle, then navigate
    setTimeout(() => {
      navigate('/analyze', { state: { repoUrl: `https://github.com/${repo}` } });
    }, 10);
  }

  /* focus on mount */
  useEffect(() => { if (mode !== 'zip') inputRef.current?.focus(); }, [mode]);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', position: 'relative' }}>
      <ParticleCanvas />

      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2rem', position: 'relative', zIndex: 10,
      }}>
        <span className="font-mono" style={{ color: 'var(--accent-start)', fontSize: '1.125rem', fontWeight: 700 }}>
          ⬡ RepoNav AI
        </span>
        <a href="https://github.com" target="_blank" rel="noreferrer"
          className="btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          GitHub ↗
        </a>
      </nav>

      {/* ── Hero ── */}
      <main style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: '6rem', position: 'relative', zIndex: 10,
      }}>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-mono"
          style={{
            color: 'var(--accent-end)', letterSpacing: '0.2em',
            fontSize: '0.75rem', marginBottom: '1.25rem', textTransform: 'uppercase',
          }}
        >
          Developer Onboarding Accelerator
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.02em',
            textAlign: 'center', lineHeight: 1.1, marginBottom: '1.25rem',
          }}
        >
          Understand Any Codebase
          <br />
          <span style={{ color: 'var(--accent-start)' }}>In Under 2 Minutes.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          style={{
            color: 'var(--text-secondary)', fontSize: '1.125rem',
            textAlign: 'center', maxWidth: '540px', lineHeight: 1.6,
            marginBottom: '2.5rem',
          }}
        >
          AI-powered dependency graphs, file explanations,
          and guided onboarding paths — generated in seconds.
        </motion.p>

        {/* ── Input Mode Selector ── */}
        <motion.div
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
           style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}
        >
          {['url', 'zip'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`chip ${mode === m ? 'active' : ''}`} style={{ background: mode === m ? 'var(--green-border)' : 'transparent', color: mode === m ? '#000' : 'var(--text-secondary)' }}>
               {m === 'url' ? '🔗 URL' : '📦 Upload ZIP'}
            </button>
          ))}
        </motion.div>

        {/* ── URL Input ── */}
        <motion.form
          onSubmit={handleAnalyze}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          style={{
            display: 'flex', width: '100%', maxWidth: '680px',
            background: 'var(--bg-nested)',
            border: `1px solid ${focused ? 'rgba(0,255,70,0.35)' : 'var(--green-border)'}`,
            borderRadius: '0.375rem', overflow: 'hidden',
            boxShadow: focused ? '0 0 30px rgba(0,255,70,0.12)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {mode === 'zip' ? (
             <div style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
               <input type="file" ref={fileInputRef} accept=".zip" onChange={handleZipUpload} style={{ width: '100%' }} />
             </div>
          ) : (
             <input
               ref={inputRef}
               type="text"
               value={url}
               onChange={e => setUrl(e.target.value)}
               onFocus={() => setFocused(true)}
               onBlur={() => setFocused(false)}
               placeholder="https://github.com/username/repository"
               className="font-mono"
               style={{
                 flex: 1, background: 'transparent', border: 'none', outline: 'none',
                 color: 'var(--text-primary)', padding: '1rem 1.25rem', fontSize: '0.9375rem',
               }}
             />
          )}

          {mode !== 'zip' && (
             <button type="submit" className="btn-primary" style={{ padding: '1rem 1.75rem', fontSize: '0.9375rem', borderRadius: 0 }}>
               Analyze →
             </button>
          )}
        </motion.form>


        {/* ── Sample Repos ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginTop: '1.25rem', flexWrap: 'wrap', justifyContent: 'center',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            Try a sample repo:
          </span>
          {sampleRepos.map(repo => (
            <button key={repo} className="chip" onClick={() => handleSample(repo)}>
              {repo}
            </button>
          ))}
        </motion.div>

        {/* ── Feature Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.25rem', marginTop: '5rem', width: '100%', maxWidth: '900px',
            padding: '0 1.5rem',
          }}
        >
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ marginBottom: '1rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Footer ── */}
        <footer style={{
          display: 'flex', gap: '1.5rem', alignItems: 'center',
          marginTop: '6rem', marginBottom: '2rem', padding: '1rem',
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>GitHub</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Docs</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--node-entry)' }} />
            Status
          </span>
        </footer>
      </main>
    </div>
  );
}
