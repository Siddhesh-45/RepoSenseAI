import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GraphCanvas from '../components/Graph/GraphCanvas';
import FileDetailPanel from '../components/Sidebar/FileDetailPanel';
import OnboardingPath from '../components/Onboarding/OnboardingPath';
import RepoOverviewPanel from '../components/Sidebar/RepoOverviewPanel';
import ActivitySidebar from '../components/Sidebar/ActivitySidebar';
import MetricsBar from '../components/Dashboard/MetricsBar';
import QueryBar from '../components/Search/QueryBar';
import AnalysisLoader from '../components/Loading/AnalysisLoader';
import { analyzeRepo, uploadRepoZip } from '../services/api';
import { useTraversal } from '../hooks/useTraversal';

export default function Analyzer() {
  const location = useLocation();
  const navigate = useNavigate();
  const repoUrl = location.state?.repoUrl;
  const isZip = location.state?.isZip;
  const file = location.state?.file;

  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('overview');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHighlights, setSearchHighlights] = useState([]);
  
  const traversal = useTraversal(graphData);

  // Extract repo name for display
  const repoName = isZip 
    ? (file?.name || 'Uploaded ZIP')
    : (repoUrl ? repoUrl.split('/').pop().replace(/\.git$/, '') : '');

  // Fetch data on mount
  useEffect(() => {
    if (!repoUrl && !isZip) {
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

        let data;
        if (isZip && file) {
          data = await uploadRepoZip(file);
        } else {
          data = await analyzeRepo(repoUrl);
        }
        
        clearInterval(stepInterval);
        setLoadingStep(5);

        // Small delay to show completion
        setTimeout(() => {
          setGraphData(data);
          setLoading(false);
          
          // Log dependencies for EACH AND EVERY node into the browser console as requested!
          console.group('\n📊 MADGE DEPENDENCY GRAPH OUTPUT (ALL NODES):');
          data.nodes.forEach(node => {
            console.log(`\n📄 Node: ${node.id}`);
            console.log(`   ➡ Imports (Dependencies):`, node.deps || []);
          });
          console.groupEnd();
          
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
    
    // Log the Madge tool dependencies and AI explanation straight to the browser console
    console.log(`\n📌 Node Selected: ${nodeData.fullPath || nodeData.id}`);
    console.log(`📦 Imports (Dependencies from Madge):`, nodeData.deps || []);
    
    // Find the dependents (Used By)
    setGraphData(currentGraph => {
      if (currentGraph) {
        const pathIdentifier = nodeData.fullPath || nodeData.id || '';
        const usedBy = currentGraph.nodes.filter(n => n.deps && n.deps.some(d => 
          d === pathIdentifier || d.endsWith(pathIdentifier) || pathIdentifier.endsWith(d)
        )).map(n => n.id);
        
        console.log(`🔗 Used By (Dependents):`, usedBy);
      }
      return currentGraph;
    });
    
    console.log(`🤖 AI Explanation:`, nodeData.ai || 'None');
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
          <h2 className="repo-title" style={{
            color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 600,
            cursor: 'pointer', margin: 0, fontFamily: "'Inter', sans-serif"
          }} onClick={() => navigate('/')}>
            {repoName ? <><span style={{color: 'var(--accent-end)'}}>Repository:</span> {repoName}</> : "⬡ RepoNav AI"}
          </h2>
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
        {/* Left: Activity Sidebar (Explorer + Source Control) */}
        <ActivitySidebar
          graphData={graphData}
          onNodeSelect={handleNodeSelect}
          selectedNodeId={selectedNode?.fullPath || selectedNode?.id}
        />

        {/* Center: Graph Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <GraphCanvas
            graphData={graphData}
            selectedNodeId={selectedNode?.fullPath}
            onNodeSelect={handleNodeSelect}
            searchHighlights={searchHighlights}
            traversalState={traversal}
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
              onClick={() => setSidebarTab('overview')}
              className="font-sans"
              style={{
                flex: 1, padding: '0.625rem', background: 'transparent', border: 'none',
                color: sidebarTab === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em',
                borderBottom: sidebarTab === 'overview' ? '2px solid var(--accent-end)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setSidebarTab('info')}
              className="font-sans"
              style={{
                flex: 1, padding: '0.625rem', background: 'transparent', border: 'none',
                color: sidebarTab === 'info' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em',
                borderBottom: sidebarTab === 'info' ? '2px solid var(--accent-end)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              File Info
            </button>
            <button
              onClick={() => setSidebarTab('path')}
              className="font-sans"
              style={{
                flex: 1, padding: '0.625rem', background: 'transparent', border: 'none',
                color: sidebarTab === 'path' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em',
                borderBottom: sidebarTab === 'path' ? '2px solid var(--accent-end)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              Path
            </button>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {sidebarTab === 'overview' ? (
              <RepoOverviewPanel repoSummary={graphData.repoSummary} />
            ) : sidebarTab === 'info' ? (
              <FileDetailPanel
                node={selectedNode}
                allNodes={graphData.nodes}
                onNodeSelect={handleNodeSelect}
              />
            ) : (() => {
              // When a node is selected, filter the path to only include:
              // 1. The selected node itself
              // 2. All path entries that appear BEFORE it (ancestor chain up to it)
              // 3. All path entries that are direct/transitive deps of the selected node
              let displayPath = graphData.onboardingPath;
              if (selectedNode) {
                const selectedId = selectedNode.fullPath || selectedNode.id;
                const selectedInPath = graphData.onboardingPath.includes(selectedId);

                if (selectedInPath) {
                  const selectedIndex = graphData.onboardingPath.indexOf(selectedId);

                  // Collect all transitive deps of the selected node (BFS through graphData.nodes)
                  const selectedNodeData = graphData.nodes.find(n => n.id === selectedId);
                  const transitiveDepSet = new Set();
                  const queue = [...(selectedNodeData?.deps || [])];
                  while (queue.length > 0) {
                    const dep = queue.shift();
                    // Resolve partial dep name to full node id
                    const resolved = graphData.nodes.find(n =>
                      n.id === dep || n.id.endsWith('/' + dep) || n.id.endsWith(dep)
                    );
                    if (resolved && !transitiveDepSet.has(resolved.id)) {
                      transitiveDepSet.add(resolved.id);
                      queue.push(...(resolved.deps || []));
                    }
                  }

                  // Include: ancestors in path (index < selectedIndex) + selected node + transitive deps
                  displayPath = graphData.onboardingPath.filter((fileId, idx) => {
                    if (fileId === selectedId) return true;        // the node itself
                    if (idx < selectedIndex) return true;           // all ancestors before it
                    return transitiveDepSet.has(fileId);            // transitive deps after it
                  });
                }
              }

              return (
                <OnboardingPath
                  path={displayPath}
                  nodes={graphData.nodes}
                  onNodeSelect={handleNodeSelect}
                  selectedNodeId={selectedNode ? (selectedNode.fullPath || selectedNode.id) : null}
                />
              );
            })()}
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
