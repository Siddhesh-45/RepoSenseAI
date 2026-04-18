import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GraphCanvas from '../components/Graph/GraphCanvas';
import FileDetailPanel from '../components/Sidebar/FileDetailPanel';
import OnboardingPath from '../components/Onboarding/OnboardingPath';
import MetricsBar from '../components/Dashboard/MetricsBar';
import QueryBar from '../components/Search/QueryBar';
import AnalysisLoader from '../components/Loading/AnalysisLoader';
import { analyzeRepo } from '../services/api';

/* Icon sidebar items */
const sidebarIcons = [
  { id: 'graph', icon: '⬡', tooltip: 'Graph' },
  { id: 'info', icon: '◉', tooltip: 'Info' },
  { id: 'path', icon: '⟐', tooltip: 'Path' },
  { id: 'search', icon: '⌘', tooltip: 'Search' },
];

export default function Analyzer() {
  const location = useLocation();
  const navigate = useNavigate();
  const repoUrl = location.state?.repoUrl;

  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('info');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHighlights, setSearchHighlights] = useState([]);

  // Extract repo name for display
  const repoName = repoUrl
    ? repoUrl.replace('https://github.com/', '').replace(/\.git$/, '')
    : 'repository';

  // Fetch data on mount
  useEffect(() => {
    if (!repoUrl) {
      navigate('/');
      return;
    }

    async function doAnalyze() {
      try {
        setLoading(true);
        setError(null);
        setLoadingStep(0);

        // Simulate progressive steps (real progress comes from backend)
        const stepInterval = setInterval(() => {
          setLoadingStep(prev => {
            if (prev < 4) return prev + 1;
            return prev;
          });
        }, 3000);

        const data = await analyzeRepo(repoUrl);
        clearInterval(stepInterval);
        setLoadingStep(5);

        // Small delay to show completion
        setTimeout(() => {
          setGraphData(data);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Analysis failed');
        setLoading(false);
      }
    }

    doAnalyze();
  }, [repoUrl, navigate]);

  // Cmd+K handler
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNodeSelect = useCallback((nodeData) => {
    setSelectedNode(nodeData);
    setSidebarTab('info');
    setSearchOpen(false);
    setSearchHighlights([]);
  }, []);

  const handleSearchHighlight = useCallback((ids) => {
    setSearchHighlights(ids);
  }, []);

  // Loading state
  if (loading || !graphData) {
    return (
      <AnalysisLoader
        repoName={repoName}
        currentStep={loadingStep}
        error={error}
      />
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: 'var(--bg-primary)', overflow: 'hidden',
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.5rem 1rem', background: 'var(--bg-surface)', zIndex: 20,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {/* Left: Logo + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="font-mono" style={{
            color: 'var(--accent-start)', fontSize: '0.875rem', fontWeight: 700,
            cursor: 'pointer',
          }} onClick={() => navigate('/')}>
            ⬡ RepoNav AI
          </span>
          <div
            onClick={() => setSearchOpen(true)}
            className="font-mono"
            style={{
              background: 'var(--bg-nested)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '0.375rem', padding: '0.375rem 0.875rem',
              fontSize: '0.75rem', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              minWidth: 240, transition: 'border-color 0.2s',
            }}
          >
            <span style={{ opacity: 0.5 }}>⌘K</span>
            <span style={{ opacity: 0.4 }}>Search files or ask &quot;where is auth?&quot;</span>
          </div>
        </div>

        {/* Center: Stats */}
        <div className="font-mono" style={{
          fontSize: '0.6875rem', color: 'var(--text-secondary)',
          display: 'flex', gap: '0.5rem',
        }}>
          <span>{graphData.metrics.totalFiles} files</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>{graphData.metrics.totalEdges} dependencies</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>{graphData.metrics.highImpactFiles} high-impact</span>
        </div>

        {/* Right: Repo name */}
        <div className="font-mono" style={{
          fontSize: '0.6875rem', color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ opacity: 0.5 }}>{repoName}</span>
          <button
            onClick={() => navigate('/')}
            className="btn-ghost"
            style={{ padding: '0.25rem 0.625rem', fontSize: '0.6875rem' }}
          >
            New Repo
          </button>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left icon sidebar */}
        <div style={{
          width: 48, background: 'var(--bg-surface)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: '0.75rem', gap: '0.25rem',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}>
          {sidebarIcons.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'search') setSearchOpen(true);
                else setSidebarTab(item.id === 'graph' ? 'info' : item.id);
              }}
              title={item.tooltip}
              style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'transparent', border: 'none',
                color: (sidebarTab === item.id || (item.id === 'graph' && sidebarTab === 'info'))
                  ? 'var(--accent-end)' : 'var(--text-secondary)',
                fontSize: '1rem', cursor: 'pointer', borderRadius: '0.375rem',
                transition: 'all 0.2s',
                opacity: (sidebarTab === item.id || (item.id === 'graph' && sidebarTab === 'info'))
                  ? 1 : 0.5,
              }}
            >
              {item.icon}
            </button>
          ))}
        </div>

        {/* Center: Graph Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <GraphCanvas
            graphData={graphData}
            selectedNodeId={selectedNode?.fullPath}
            onNodeSelect={handleNodeSelect}
            searchHighlights={searchHighlights}
          />
        </div>

        {/* Right: Detail Sidebar */}
        <div style={{
          width: 280, background: 'var(--bg-surface)',
          borderTop: '1px solid var(--green-top)',
          borderLeft: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Tab headers */}
          <div style={{
            display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <button
              onClick={() => setSidebarTab('info')}
              className="font-mono"
              style={{
                flex: 1, padding: '0.625rem', background: 'transparent', border: 'none',
                color: sidebarTab === 'info' ? 'var(--accent-end)' : 'var(--text-secondary)',
                fontSize: '0.6875rem', cursor: 'pointer', letterSpacing: '0.05em',
                borderBottom: sidebarTab === 'info' ? '1px solid var(--accent-end)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              INFO
            </button>
            <button
              onClick={() => setSidebarTab('path')}
              className="font-mono"
              style={{
                flex: 1, padding: '0.625rem', background: 'transparent', border: 'none',
                color: sidebarTab === 'path' ? 'var(--accent-end)' : 'var(--text-secondary)',
                fontSize: '0.6875rem', cursor: 'pointer', letterSpacing: '0.05em',
                borderBottom: sidebarTab === 'path' ? '1px solid var(--accent-end)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              PATH
            </button>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {sidebarTab === 'info' ? (
              <FileDetailPanel
                node={selectedNode}
                allNodes={graphData.nodes}
                onNodeSelect={handleNodeSelect}
              />
            ) : (
              <OnboardingPath
                path={graphData.onboardingPath}
                nodes={graphData.nodes}
                onNodeSelect={handleNodeSelect}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Metrics Bar ── */}
      <MetricsBar metrics={graphData.metrics} />

      {/* ── Search Overlay ── */}
      <QueryBar
        isOpen={searchOpen}
        onClose={() => { setSearchOpen(false); setSearchHighlights([]); }}
        nodes={graphData.nodes}
        onSelect={handleNodeSelect}
        onHighlight={handleSearchHighlight}
      />
    </div>
  );
}
