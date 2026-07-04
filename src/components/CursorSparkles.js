import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';

export default function CursorSparkles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4.5 + 2; // Larger particles (2px to 6.5px)
        this.speedX = Math.random() * 2 - 1.0; // Higher speed/drift range
        this.speedY = Math.random() * 2 - 1.0;
        // Cyberpunk palette: neon cyan or purple
        this.color = Math.random() > 0.5 ? '#00F0FF' : '#A855F7';
        this.alpha = 1;
        this.decay = Math.random() * 0.01 + 0.008; // Slower decay (lasts longer)
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.decay;
      }

      draw(context) {
        context.save();
        context.globalAlpha = this.alpha;
        context.shadowBlur = 6; // Enhanced glow shadow blur
        context.shadowColor = this.color;
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
    }

    let particles = [];

    const handleMouseMove = (e) => {
      // Spawn subtle sparkles on movement
      for (let i = 0; i < 2; i++) {
        particles.push(new Particle(e.clientX, e.clientY));
      }
      
      if (particles.length > 100) {
        particles.shift();
      }
    };

    const handleTouch = (e) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        // Spawn 4 particles per touch for higher brightness on mobile
        for (let i = 0; i < 4; i++) {
          particles.push(new Particle(touch.clientX, touch.clientY));
        }
      }
      if (particles.length > 100) {
        particles.shift();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          p.draw(ctx);
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View 
      pointerEvents="none" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 999999,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </View>
  );
}
