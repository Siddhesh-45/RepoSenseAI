import { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let mouse = { x: -9999, y: -9999 };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMouseMove);

    // Color palette — deep blue / indigo / violet
    const COLORS = ['#4d9fff', '#7b61ff', '#00c8ff', '#a78bfa', '#60a5fa'];

    class Node {
      constructor() { this.reset(true); }

      reset(initial = false) {
        this.x   = Math.random() * canvas.width;
        this.y   = initial ? Math.random() * canvas.height : -20;
        this.vx  = (Math.random() - 0.5) * 0.4;
        this.vy  = (Math.random() - 0.5) * 0.4;
        // Vary depth: 0=distant/small, 1=close/large
        this.depth  = Math.random();
        this.radius = 1.5 + this.depth * 4;
        this.baseRadius = this.radius;
        this.color  = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.pulse  = Math.random() * Math.PI * 2; // phase offset
        this.pulseSpeed = 0.02 + Math.random() * 0.03;
        this.alpha  = 0.2 + this.depth * 0.3;  // dimmer overall
        this.isHub  = Math.random() < 0.08; // 8% are bigger hub nodes
        if (this.isHub) { this.radius = 3.5 + this.depth * 3; this.baseRadius = this.radius; }
      }

      update(t) {
        // Mouse repulsion
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          this.x += (dx / dist) * force * 1.5;
          this.y += (dy / dist) * force * 1.5;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Wrap edges
        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;
        if (this.y < -20) this.y = canvas.height + 20;
        if (this.y > canvas.height + 20) this.y = -20;

        // Pulse radius
        this.pulse += this.pulseSpeed;
        this.radius = this.baseRadius + Math.sin(this.pulse) * (this.isHub ? 2 : 0.8);
      }

      draw() {
        // Softer glow — smaller radius, lower opacity stop
        const glowR = this.radius * (this.isHub ? 3.5 : 2);
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowR);
        grd.addColorStop(0, this.color + '66');
        grd.addColorStop(1, this.color + '00');
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Create nodes — more = richer neural feel
    const COUNT = Math.min(120, Math.floor((canvas.width * canvas.height) / 12000));
    const nodes = Array.from({ length: COUNT }, () => new Node());

    // Draw animated connection between two nodes
    const drawConnection = (a, b, dist, maxDist) => {
      const opacity = (1 - dist / maxDist) * 0.18; // dimmer connections
      const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      gradient.addColorStop(0, a.color + Math.round(opacity * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, b.color + Math.round(opacity * 255).toString(16).padStart(2, '0'));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = a.isHub || b.isHub ? 1.2 : 0.6;
      ctx.stroke();
    };

    // Deep background: radial vignette
    const drawBackground = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Base dark navy
      ctx.fillStyle = '#020818';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle grid
      ctx.strokeStyle = 'rgba(77,159,255,0.04)';
      ctx.lineWidth = 1;
      const gs = 50;
      for (let x = 0; x < canvas.width; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Radial glow blobs for depth
      const blobs = [
        { x: canvas.width * 0.15, y: canvas.height * 0.25, r: 380, c: '#1a3a6e' },
        { x: canvas.width * 0.85, y: canvas.height * 0.6,  r: 300, c: '#1e1060' },
        { x: canvas.width * 0.5,  y: canvas.height * 0.9,  r: 250, c: '#0d2a5e' },
      ];
      blobs.forEach(b => {
        const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grd.addColorStop(0, b.c + '55');
        grd.addColorStop(1, b.c + '00');
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });
    };

    let t = 0;
    const MAX_DIST = 160;

    const animate = () => {
      drawBackground();
      t += 0.01;

      // Connections first (behind nodes)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Hubs connect farther
          const maxD = (nodes[i].isHub || nodes[j].isHub) ? MAX_DIST * 1.6 : MAX_DIST;
          if (dist < maxD) drawConnection(nodes[i], nodes[j], dist, maxD);
        }
      }

      // Nodes
      nodes.forEach(n => { n.update(t); n.draw(); });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
};

export default AnimatedBackground;
