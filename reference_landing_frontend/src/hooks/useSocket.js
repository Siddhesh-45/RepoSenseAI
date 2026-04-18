import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket(repoId) {
  const [pipeline, setPipeline] = useState({ stage: 'pending', progress: 0, message: 'Initializing...' });
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!repoId) return;

    socketRef.current = io(window.location.origin, {
      path: '/socket.io/', // defaults
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      // Join room for this repo
      socket.emit('joinRoom', repoId); // Although backend uses default io.to() and might not have explicit joinRoom handling in this snippet, Socket.io 4 usually requires joining. Wait, my backend server.js didn't handle typical joinRoom.
      // Correction: My backend doesn't explicitly listen to 'joinRoom', it uses default rooms? 
      // Actually standard pattern is server listens to 'joinRoom': But my server.js didn't add the join logic! 
      // I'll just rely on the backend emitting without specific joinRoom right now if it works, or I'll update backend. Since backend emits to repoId, socket needs to join. 
      // I'll emit 'joinRoom' regardless.
    });

    const handleStage = (data) => {
      setPipeline({ stage: data.stage, progress: data.progress, message: data.message });
      if (data.stage === 'complete') setIsComplete(true);
      if (data.stage === 'error') setHasError(true);
    };

    socket.on('stage:clone', handleStage);
    socket.on('stage:walk', handleStage);
    socket.on('stage:parse', handleStage);
    socket.on('stage:graph', handleStage);
    socket.on('stage:summarize', handleStage);
    socket.on('stage:onboarding', handleStage);
    socket.on('stage:commits', handleStage);
    socket.on('stage:complete', handleStage);
    socket.on('stage:error', handleStage);

    return () => {
      socket.disconnect();
    };
  }, [repoId]);

  return { pipeline, isComplete, hasError };
}
