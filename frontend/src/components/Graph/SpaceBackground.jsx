import { useEffect, useRef } from 'react';

export default function SpaceBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = 0;
    let height = 0;

    let mouse = { x: -1000, y: -1000 };

    // Update canvas size
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);
    resize();

    // Generate spheres
    const numSpheres = 150;
    const spheres = [];
    for (let i = 0; i < numSpheres; i++) {
       const size = Math.random() * 2 + 0.5; // small spheres
       spheres.push({
          x: Math.random() * width,
          y: Math.random() * height,
          originX: 0,
          originY: 0,
          size: size,
          baseSize: size,
          vx: (Math.random() - 0.5) * 0.2, // slow wander
          vy: (Math.random() - 0.5) * 0.2,
          color: `rgba(255, 255, 255, ${Math.random() * 0.25 + 0.05})`,
          phase: Math.random() * Math.PI * 2
       });
    }

    // Interactive mouse tracking
    const handleMouseMove = (e) => {
       const rect = canvas.getBoundingClientRect();
       mouse.x = e.clientX - rect.left;
       mouse.y = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = (time) => {
       ctx.clearRect(0, 0, width, height);

       // Deep dark space background gradient
       const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
       gradient.addColorStop(0, '#0f172a'); // slate-900
       gradient.addColorStop(1, '#020617'); // slate-950
       ctx.fillStyle = gradient;
       ctx.fillRect(0, 0, width, height);

       for (let i = 0; i < spheres.length; i++) {
          const s = spheres[i];
          
          // Hovering / Wander
          s.x += s.vx;
          s.y += s.vy;
          
          // Sine wave size pulsing for hovering vibe
          s.size = s.baseSize + Math.sin(time / 1000 + s.phase) * (s.baseSize * 0.5);

          // Wrap around edges
          if (s.x < -10) s.x = width + 10;
          if (s.x > width + 10) s.x = -10;
          if (s.y < -10) s.y = height + 10;
          if (s.y > height + 10) s.y = -10;

          // Interactive repulsion
          const dx = mouse.x - s.x;
          const dy = mouse.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          let offsetX = 0;
          let offsetY = 0;
          if (dist < 150) {
             const force = (150 - dist) / 150;
             offsetX = -(dx / dist) * force * 20;
             offsetY = -(dy / dist) * force * 20;
          }

          // Draw Sphere
          ctx.beginPath();
          ctx.arc(s.x + offsetX, s.y + offsetY, Math.max(0.1, s.size), 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.fill();

          // Subtle glow
          ctx.shadowBlur = 15;
          ctx.shadowColor = s.color;
          ctx.fill();
          ctx.shadowBlur = 0; // reset
       }

       animationFrameId = window.requestAnimationFrame(render);
    };
    render(0);

    return () => {
       window.removeEventListener('resize', resize);
       window.removeEventListener('mousemove', handleMouseMove);
       window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
       ref={canvasRef} 
       style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',  // let clicks pass through to the graph
          zIndex: 0
       }} 
    />
  );
}
