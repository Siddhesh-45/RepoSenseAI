import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

export function useTraversal(graphData) {
  const [state, setState] = useState({
    mode: 'DFS',
    rootNodeId: null,
    stack: [],
    visited: new Set(),
    traversalOrder: [],
    currentNodeId: null,
    previousNodeId: null,
    traversedEdges: new Set(), // Store "source|target"
    traversalStep: 0,
    explanation: null,
    isAnalyzing: false,
    isPlaying: false
  });

  const timerRef = useRef(null);

  const adjList = useMemo(() => {
    const list = {};
    if (!graphData?.nodes) return list;
    graphData.nodes.forEach(n => list[n.id] = []);
    if (graphData?.edges) {
      graphData.edges.forEach(e => {
        const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
        const targetId = typeof e.target === 'object' ? e.target.id : e.target;
        if (list[sourceId] && !list[sourceId].includes(targetId)) {
            list[sourceId].push(targetId);
        }
      });
    }
    return list;
  }, [graphData]);

  const setMode = useCallback((mode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const setExplanation = useCallback((explanation) => {
    setState(prev => ({ ...prev, explanation, isAnalyzing: false }));
  }, []);

  const setIsAnalyzing = useCallback((isAnalyzing) => {
    setState(prev => ({ ...prev, isAnalyzing }));
  }, []);

  const start = useCallback((rootId) => {
    setState(prev => ({
      ...prev,
      rootNodeId: rootId,
      stack: [rootId],
      visited: new Set(),
      traversalOrder: [],
      currentNodeId: null,
      previousNodeId: null,
      traversedEdges: new Set(),
      traversalStep: 0,
      explanation: null,
      isAnalyzing: false,
      isPlaying: false
    }));
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      rootNodeId: null,
      stack: [],
      visited: new Set(),
      traversalOrder: [],
      currentNodeId: null,
      previousNodeId: null,
      traversedEdges: new Set(),
      traversalStep: 0,
      explanation: null,
      isAnalyzing: false,
      isPlaying: false
    }));
  }, []);

  const step = useCallback(() => {
    setState(prev => {
      if (prev.stack.length === 0) {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        return { ...prev, isPlaying: false };
      }

      const newStack = [...prev.stack];
      let nextNodeId;
      
      if (prev.mode === 'DFS') {
        nextNodeId = newStack.pop();
      } else { // BFS
        nextNodeId = newStack.shift();
      }

      const newVisited = new Set(prev.visited);
      newVisited.add(nextNodeId);

      const newTraversalOrder = [...prev.traversalOrder, nextNodeId];
      
      // Determine previous node purely by checking which visited node connects to nextNodeId
      // In a strict setup, we should track path. For visual purposes, finding the first active incoming edge works.
      let incomingEdgeNode = prev.currentNodeId; // default to sequence
      if (!incomingEdgeNode || !adjList[incomingEdgeNode]?.includes(nextNodeId)) {
         // Find a visited node that points to nextNodeId
         const possibleParents = Array.from(prev.visited).filter(v => adjList[v]?.includes(nextNodeId));
         if (possibleParents.length > 0) incomingEdgeNode = possibleParents[possibleParents.length - 1]; // Latest visited parent
         else incomingEdgeNode = null;
      }

      const newTraversedEdges = new Set(prev.traversedEdges);
      if (incomingEdgeNode) {
         newTraversedEdges.add(`${incomingEdgeNode}|${nextNodeId}`);
      }
      
      const neighbors = adjList[nextNodeId] || [];
      const unvisitedNeighbors = neighbors.filter(n => !newVisited.has(n) && !newStack.includes(n));
      
      if (prev.mode === 'DFS') {
        for (let i = unvisitedNeighbors.length - 1; i >= 0; i--) {
          newStack.push(unvisitedNeighbors[i]);
        }
      } else { // BFS
        for (let i = 0; i < unvisitedNeighbors.length; i++) {
          newStack.push(unvisitedNeighbors[i]);
        }
      }

      return {
        ...prev,
        stack: newStack,
        visited: newVisited,
        traversalOrder: newTraversalOrder,
        currentNodeId: nextNodeId,
        previousNodeId: incomingEdgeNode,
        traversedEdges: newTraversedEdges,
        traversalStep: prev.traversalStep + 1,
        explanation: null,
        isAnalyzing: false
      };
    });
  }, [adjList]);

  const togglePlay = useCallback((intervalMs = 1500) => {
    if (state.isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState(prev => ({ ...prev, isPlaying: false }));
    } else {
      if (state.stack.length > 0) {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
          step();
        }, intervalMs);
        setState(prev => ({ ...prev, isPlaying: true }));
      }
    }
  }, [state.isPlaying, state.stack.length, step]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    ...state,
    setMode,
    start,
    step,
    reset,
    togglePlay,
    setExplanation,
    setIsAnalyzing,
    adjList 
  };
}
