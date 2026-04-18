import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import { useGraphStore } from '../store/graphStore';
import GraphCanvas from '../components/GraphCanvas';
import NodePanel from '../components/NodePanel';
import NLQueryBar from '../components/NLQueryBar';
import OnboardingPath from '../components/OnboardingPath';
import CommitTimeline from '../components/CommitTimeline';

const Dashboard = () => {
  const { repoId } = useParams();
  const { pipeline, isComplete: socketComplete, hasError } = useSocket(repoId);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const { setAnalysis, selectedNode, clearSelection } = useGraphStore();
  const [repoInfo, setLocalRepoInfo] = useState(null);

  const fetchAnalysis = async () => {
    try {
      const res = await axios.get(`/api/analysis/${repoId}`);
      setLocalRepoInfo(res.data.repository);
      if (res.data.repository.status === 'complete') {
        setAnalysis(res.data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [repoId]);

  useEffect(() => {
    if (socketComplete) {
      fetchAnalysis(); // refetch full data when socket says complete
    }
  }, [socketComplete]);

  const isProcessing = (repoInfo?.status !== 'complete' && repoInfo?.status !== 'error') || (!socketComplete && pipeline.stage !== 'pending' && pipeline.stage !== 'complete');

  if (initialLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      {/* Left Sidebar */}
      <div className="glass-card" style={{ width: 340, borderLeft: 'none', borderTop: 'none', borderBottom: 'none', borderRadius: 0, display: 'flex', flexDirection: 'column', zIndex: 5, background: 'rgba(10,10,26,0.95)' }}>
        
        <div style={{ padding: 24, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.8rem' }}>← New Scan</Link>
            <a href={repoInfo?.url} target="_blank" rel="noreferrer" style={{ color: 'var(--neon)', fontSize: '0.8rem', textDecoration: 'none' }}>GitHub ↗</a>
          </div>
          <h2 style={{ fontSize: '1.2rem', wordBreak: 'break-all' }}>{repoInfo?.name || 'Repository'}</h2>
          
          {repoInfo?.status !== 'complete' && (
             <div className="badge" style={{ marginTop: 12, border: '1px solid var(--neon4)', color: 'var(--neon4)' }}>
               {pipeline.stage || repoInfo?.status} ({pipeline.progress}%)
             </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {isProcessing ? (
            <div style={{ marginTop: 40, textAlign: 'center' }}>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ height: '100%', width: `${pipeline.progress}%`, background: 'var(--neon)', transition: 'width 0.3s' }} />
              </div>
              <p style={{ color: 'var(--neon)', fontStyle: 'italic', fontSize: '0.9rem' }}>{pipeline.message || 'Analyzing codebase...'}</p>
            </div>
          ) : hasError || repoInfo?.status === 'error' ? (
            <div style={{ color: 'var(--neon3)', textAlign: 'center', marginTop: 40 }}>
              Analysis failed. <br /> {repoInfo?.errorMessage}
            </div>
          ) : (
            <div style={{ animation: 'fadeUp 0.5s' }}>
              <NLQueryBar repoId={repoId} />
              <OnboardingPath />
              {/* <CommitTimeline analysis={useGraphStore.getState().analysis} /> */} 
              {/* Note: Store might be empty initially on render, passing from store inside comp is better if I extracted it, but OnboardingPath does it cleanly */}
              <CommitTimelineWrapper /> 
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <GraphCanvas />
        <NodePanel nodeData={selectedNode} onClose={clearSelection} onNodeClick={(n) => useGraphStore.getState().selectNode(n.id)} />
        
        {/* Top Header Over Canvas */}
        <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 2, display: 'flex', gap: 16 }}>
           <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
             <span style={{ color: 'var(--neon)' }}>{useGraphStore(state => state.nodes.length)}</span> files
           </div>
           {!isProcessing && (
             <button className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: '#fff', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)' }} onClick={() => fetchAnalysis()}>
               Refresh
             </button>
           )}
        </div>
      </div>

    </div>
  );
};

// Extracted to hook into store simply
const CommitTimelineWrapper = () => {
    const analysis = useGraphStore(state => state.analysis);
    return <CommitTimeline analysis={analysis} />;
}

export default Dashboard;
