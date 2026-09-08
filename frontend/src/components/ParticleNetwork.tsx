"use client";

import React, { useEffect, useRef } from 'react';

export default function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particlesArray: Particle[] = [];
    let mouse = { x: -1000, y: -1000 };

    // HIGH DPI SCALING FOR ULTRA-SHARP RESOLUTION
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x to save GPU
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      color: string;
      glowColor: string;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string, glowColor: string) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
        this.glowColor = glowColor;
      }

      draw() {
        if (!ctx) return;
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.glowColor;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.shadowBlur = 0;
      }

      update() {
        if (!canvas) return;
        const logicalWidth = window.innerWidth;
        const logicalHeight = window.innerHeight;

        if (this.x > logicalWidth || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > logicalHeight || this.y < 0) {
          this.directionY = -this.directionY;
        }

        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120) {
          this.x -= dx / 15;
          this.y -= dy / 15;
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    const init = () => {
      if (!canvas) return;
      particlesArray = [];
      const logicalWidth = window.innerWidth;
      const logicalHeight = window.innerHeight;
      
      // CRITICAL FIX: Cap maximum particles to 120 to prevent O(N^2) lag on massive zoom-outs
      const calculatedParticles = (logicalHeight * logicalWidth) / 12000;
      const numberOfParticles = Math.min(calculatedParticles, 120); 
      
      for (let i = 0; i < numberOfParticles; i++) {
        let size = Math.random() * 1.5 + 0.5; 
        let x = Math.random() * (logicalWidth - size * 2) + size * 2;
        let y = Math.random() * (logicalHeight - size * 2) + size * 2;
        let directionX = (Math.random() * 0.6) - 0.3; 
        let directionY = (Math.random() * 0.6) - 0.3;
        
        let color = Math.random() > 0.5 ? '#10b981' : '#ffffff'; 
        let glowColor = color === '#10b981' ? 'rgba(16,185,129,0.8)' : 'rgba(255,255,255,0.8)';
        
        particlesArray.push(new Particle(x, y, directionX, directionY, size, color, glowColor));
      }
    };

    const animate = () => {
      requestAnimationFrame(animate);
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      connect();
    };

    const connect = () => {
      let opacityValue = 1;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          let distance = 
            ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) + 
            ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
          
          // CRITICAL FIX: Fixed maximum connection radius instead of scaling with huge window sizes
          if (distance < 25000) {
            opacityValue = 1 - (distance / 25000);
            if (!ctx) return;
            ctx.strokeStyle = `rgba(16, 185, 129, ${opacityValue * 0.4})`; // Much higher contrast lines
            ctx.lineWidth = 1.5; // Thicker lines for better resolution rendering
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };

    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        pointerEvents: 'none',
        zIndex: 0 
      }} 
    />
  );
}
