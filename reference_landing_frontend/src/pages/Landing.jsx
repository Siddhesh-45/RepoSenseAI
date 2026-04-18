import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';

const Landing = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!repoUrl) return;
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/analysis/start', { repoUrl });
      const { repoId } = res.data;
      navigate(`/dashboard/${repoId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start analysis.');
      setLoading(false);
    }
  };

  const features = [
    { icon: '🕸️', title: 'Interactive Architecture Graph', desc: 'Visualize dependencies and structural flow effortlessly.' },
    { icon: '🧠', title: 'AI File Summaries', desc: 'Auto-generated plaintext explanations powered by Claude.' },
    { icon: '💥', title: 'High-Impact File Detection', desc: 'Identify critical modules that heavily influence the codebase.' },
    { icon: '🎓', title: 'Recommended Onboarding Path', desc: 'Get a curated reading list to learn new repositories fast.' },
    { icon: '🔍', title: 'Natural Language Queries', desc: 'Ask "Where is user auth?" and see the exact files lit up.' },
    { icon: '🗑️', title: 'Orphan Detection', desc: 'Find dead code modules with zero references.' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <AnimatedBackground />

      <main className="container" style={{ zIndex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '15vh' }}>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="badge badge-outline" style={{ marginBottom: 24, fontSize: '0.8rem', padding: '6px 12px' }}>
            CodeNavigator v1.0
          </div>
        </motion.div>

        <motion.h1 
          className="animate-float"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          style={{ fontSize: '4rem', lineHeight: 1.1, marginBottom: 24, textShadow: '0 0 40px rgba(0,245,196,0.3)' }}
        >
          Understand any <br />
          <span className="neon-text">codebase instantly</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
          style={{ maxWidth: 600, fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', marginBottom: 48, lineHeight: 1.6 }}
        >
          Paste a GitHub URL to generate a dynamic architecture visualization, plain-English AI module summaries, and smart impact metrics.
        </motion.p>

        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
          onSubmit={handleAnalyze} 
          style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 700, position: 'relative' }}
        >
          <input 
            type="text" 
            placeholder="https://github.com/owner/repo" 
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="glass-card"
            style={{ 
              flex: 1, 
              padding: '20px 24px', 
              fontSize: '1.1rem', 
              border: '1px solid rgba(0,245,196,0.3)', 
              color: '#fff', 
              outline: 'none',
              fontFamily: 'JetBrains Mono',
              boxShadow: '0 0 20px rgba(0,245,196,0.1)'
            }}
          />
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0 40px', fontSize: '1.1rem' }}>
            {loading ? <span className="skeleton-shimmer" style={{ display: 'inline-block', width: 60, height: 20 }}></span> : 'Analyze'}
          </button>
        </motion.form>
        {error && <div style={{ color: 'var(--neon3)', marginTop: 16 }}>{error}</div>}

        <div style={{ marginTop: '12vh', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, width: '100%', paddingBottom: 80 }}>
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 + (i * 0.1) }}
              className="glass-card"
              style={{ padding: 32, textAlign: 'left', transition: 'transform 0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 12 }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.5 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>

      </main>
    </div>
  );
};

export default Landing;
