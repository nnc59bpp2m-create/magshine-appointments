// Cursor-Reactive Fluid Mesh - WebGL Implementation
class FluidMesh {
  constructor(container, options = {}) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    this.width = 0;
    this.height = 0;
    this.mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    this.particles = [];
    this.particleCount = options.particleCount || 120;
    this.interactionRadius = options.interactionRadius || 180;
    this.connectionDistance = options.connectionDistance || 120;
    this.colorStops = options.colorStops || [
      { stop: 0, color: 'rgba(0, 255, 136, 0.35)' },
      { stop: 0.5, color: 'rgba(0, 204, 106, 0.2)' },
      { stop: 1, color: 'rgba(0, 255, 153, 0.05)' }
    ];
    this.animationId = null;
    this.lastTime = 0;
    this.isReady = false;
    this.init();
  }

  init() {
    this.container.appendChild(this.canvas);
    this.resize();
    // Wait for valid dimensions before creating particles
    if (this.width > 0 && this.height > 0) {
      this.createParticles();
      this.isReady = true;
      this.bindEvents();
      this.animate();
    } else {
      // Retry on next frame
      requestAnimationFrame(() => this.init());
    }
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    if (this.width <= 0 || this.height <= 0) return false;
    
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.updateParticleBounds();
    return true;
  }

  createParticles() {
    if (this.width <= 0 || this.height <= 0) return;
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 3 + 1,
        baseRadius: Math.random() * 3 + 1,
        alpha: Math.random() * 0.4 + 0.1,
        hue: Math.random() * 60 + 140
      });
    }
  }

  updateParticleBounds() {
    if (this.width <= 0 || this.height <= 0) return;
    this.particles.forEach(p => {
      p.x = Math.min(Math.max(p.x, 0), this.width);
      p.y = Math.min(Math.max(p.y, 0), this.height);
    });
  }

  bindEvents() {
    this.handleMouseMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.mouse.targetX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.mouse.targetY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      }
    };
    this.handleMouseLeave = () => {
      this.mouse.targetX = 0.5;
      this.mouse.targetY = 0.5;
    };
    this.handleResize = () => this.resize();

    this.container.addEventListener('mousemove', this.handleMouseMove);
    this.container.addEventListener('mouseleave', this.handleMouseLeave);
    window.addEventListener('resize', this.handleResize);
  }

  animate(time) {
    if (!this.isReady || this.width <= 0 || this.height <= 0) {
      this.animationId = requestAnimationFrame((t) => this.animate(t));
      return;
    }

    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      const dx = this.mouse.x * this.width - p.x;
      const dy = this.mouse.y * this.height - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = this.interactionRadius;

      if (dist < maxDist && dist > 0) {
        const force = (1 - dist / maxDist) * 0.8;
        p.vx += (dx / dist) * force * dt * 60;
        p.vy += (dy / dist) * force * dt * 60;
        p.radius = p.baseRadius * (1 + force * 2);
        p.alpha = Math.min(0.8, p.alpha + force * 0.5);
      } else {
        p.radius = p.baseRadius;
        p.alpha = Math.max(0.1, p.alpha * 0.98);
      }

      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      if (p.x < 0) { p.x = 0; p.vx *= -0.5; }
      if (p.x > this.width) { p.x = this.width; p.vx *= -0.5; }
      if (p.y < 0) { p.y = 0; p.vy *= -0.5; }
      if (p.y > this.height) { p.y = this.height; p.vy *= -0.5; }

      // Guard against invalid values
      if (isFinite(p.x) && isFinite(p.y) && isFinite(p.radius) && p.radius > 0) {
        this.drawParticle(p);
      }
    });

    this.drawConnections();

    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  drawParticle(p) {
    const r = p.radius * 3;
    if (!isFinite(r) || r <= 0) return;
    
    try {
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      gradient.addColorStop(0, `hsla(${p.hue}, 100%, 50%, ${p.alpha})`);
      gradient.addColorStop(0.5, `hsla(${p.hue}, 100%, 45%, ${p.alpha * 0.4})`);
      gradient.addColorStop(1, 'hsla(150, 100%, 40%, 0)');

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    } catch (e) {
      // Silently skip invalid particles
    }
  }

  drawConnections() {
    const maxDist = this.connectionDistance;
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = dx * dx + dy * dy;

        if (dist < maxDist * maxDist && isFinite(dist)) {
          const opacity = (1 - Math.sqrt(dist) / maxDist) * 0.15;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    this.container.removeEventListener('mousemove', this.handleMouseMove);
    this.container.removeEventListener('mouseleave', this.handleMouseLeave);
    window.removeEventListener('resize', this.handleResize);
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}

export function initFluidMesh(containerSelector, options) {
  const container = document.querySelector(containerSelector);
  if (!container) return null;
  return new FluidMesh(container, options);
}

if (typeof window !== 'undefined') {
  window.FluidMesh = FluidMesh;
  window.initFluidMesh = initFluidMesh;
}