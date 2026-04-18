import { create } from 'zustand';

export const useGraphStore = create((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  highlightedNodes: [],
  onboardingPath: [],
  repoInfo: null,
  analysis: null,

  setAnalysis: (analysisData) => set({ 
    analysis: analysisData,
    nodes: analysisData.nodes || [],
    edges: analysisData.edges || [],
    onboardingPath: analysisData.onboardingPath || []
  }),
  setRepoInfo: (info) => set({ repoInfo: info }),
  selectNode: (nodeId) => set((state) => ({ 
    selectedNode: state.nodes.find(n => n.id === nodeId) || null 
  })),
  clearSelection: () => set({ selectedNode: null }),
  setHighlightedNodes: (nodeIds) => set({ highlightedNodes: nodeIds }),
  markFileRead: (nodeId) => set((state) => {
    // We could persist this to localStorage but for now it's in memory store
    const readFiles = JSON.parse(localStorage.getItem('codenav_read_files') || '[]');
    if (!readFiles.includes(nodeId)) {
      readFiles.push(nodeId);
      localStorage.setItem('codenav_read_files', JSON.stringify(readFiles));
    }
    return { ...state }; // Trigger re-render if needed, though local component state might handle checkboxes
  }),
}));
