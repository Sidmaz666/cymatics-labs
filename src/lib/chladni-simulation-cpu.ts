import { SimulationConfig } from './chladni-store';
import { computeChladniField } from './chladni-simulation';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  prevX: number;
  prevY: number;
}

export class ChladniSimulationCPU {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private config: SimulationConfig;
  private modes: Array<{ m: number; n: number; amplitude: number }> = [];
  private animationId: number | null = null;
  private time: number = 0;
  private imageData: ImageData | null = null;
  private trailCanvas: HTMLCanvasElement | null = null;
  private trailCtx: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement, config: SimulationConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.config = config;
    
    // Create trail canvas for persistence effect
    if (typeof document !== 'undefined') {
      this.trailCanvas = document.createElement('canvas');
      this.trailCtx = this.trailCanvas.getContext('2d')!;
    }
    
    this.initializeParticles();
    this.resize();
  }

  private initializeParticles(): void {
    this.particles = [];
    const count = this.config.particleCount;
    const halfPlate = this.config.plateSize * 0.95;
    
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 2 * halfPlate;
      const y = (Math.random() - 0.5) * 2 * halfPlate;
      this.particles.push({
        x,
        y,
        prevX: x,
        prevY: y,
        vx: (Math.random() - 0.5) * 0.01,
        vy: (Math.random() - 0.5) * 0.01,
        life: 0.5 + Math.random() * 0.5,
      });
    }
  }

  setModes(modes: Array<{ m: number; n: number; amplitude: number }>): void {
    this.modes = modes;
  }

  updateConfig(config: Partial<SimulationConfig>): void {
    const prevCount = this.config.particleCount;
    const prevTrail = this.config.particleTrail;
    this.config = { ...this.config, ...config };
    
    // Recreate particles if count changed significantly
    if (config.particleCount && Math.abs(config.particleCount - prevCount) > 5000) {
      this.initializeParticles();
    }
    
    // Reset trail canvas if trail setting changed
    if (config.particleTrail !== undefined && config.particleTrail !== prevTrail && this.trailCtx) {
      this.trailCtx.clearRect(0, 0, this.trailCanvas!.width, this.trailCanvas!.height);
    }
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);
    
    this.canvas.width = width;
    this.canvas.height = height;
    this.imageData = this.ctx.createImageData(width, height);
    
    // Resize trail canvas
    if (this.trailCanvas && this.trailCtx) {
      this.trailCanvas.width = width;
      this.trailCanvas.height = height;
    }
  }

  private getColor(life: number, intensity: number, x: number, y: number): [number, number, number] {
    const { colorScheme, glowIntensity, contrastBoost, brightness } = this.config;
    const t = Math.pow(life, 1 + contrastBoost);
    const angle = Math.atan2(y, x);
    const glow = 1 + intensity * glowIntensity;
    
    let r = 0, g = 0, b = 0;
    
    switch (colorScheme) {
      case 'classic':
        const bright = (0.6 + t * 0.4) * brightness * glow;
        r = Math.min(255, bright * 255);
        g = Math.min(255, bright * 230);
        b = Math.min(255, bright * 200);
        break;
      
      case 'rainbow':
        const hue = ((angle + Math.PI) / (2 * Math.PI) + this.time * 0.02) % 1;
        [r, g, b] = this.hsvToRgb(hue * 360, 70, (0.6 + t * 0.4) * 100 * brightness);
        r = Math.min(255, r * glow);
        g = Math.min(255, g * glow);
        b = Math.min(255, b * glow);
        break;
      
      case 'heat':
        const heat = t * 0.8 + intensity * 0.2;
        r = Math.min(255, heat * 255 * brightness * glow);
        g = Math.min(255, heat * heat * 100 * brightness);
        b = Math.min(255, heat * heat * heat * 50 * brightness);
        break;
      
      case 'ocean':
        const oceanT = t * 0.7 + intensity * 0.3;
        r = Math.min(255, oceanT * 50 * brightness);
        g = Math.min(255, oceanT * 150 * brightness * glow);
        b = Math.min(255, (150 + oceanT * 50) * brightness);
        break;
      
      case 'neon':
        const cycle = Math.sin(this.time * 2 + x * 3 + y * 3) * 0.5 + 0.5;
        r = Math.min(255, (0.8 + t * 0.4) * (cycle * 255 + (1 - cycle) * 150) * brightness);
        g = Math.min(255, (0.8 + t * 0.4) * ((1 - cycle) * 255) * brightness);
        b = Math.min(255, (0.8 + t * 0.4) * 200 * brightness * glow);
        break;
    }
    
    return [Math.floor(r), Math.floor(g), Math.floor(b)];
  }

  private hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    s /= 100;
    v /= 100;
    
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    
    let r = 0, g = 0, b = 0;
    
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    
    return [
      Math.floor((r + m) * 255),
      Math.floor((g + m) * 255),
      Math.floor((b + m) * 255),
    ];
  }

  private computeGradient(x: number, y: number): { gx: number; gy: number } {
    if (this.modes.length === 0) return { gx: 0, gy: 0 };
    
    const { plateSize, vibrationIntensity, harmonicStrength, modeMixing, timeEvolution, symmetryLock } = this.config;
    
    // Apply time evolution
    const timeOffset = timeEvolution > 0 ? Math.sin(this.time * timeEvolution) * 0.1 : 0;
    
    const epsilon = 0.001;
    let gxTotal = 0, gyTotal = 0;
    
    for (let i = 0; i < this.modes.length; i++) {
      const mode = this.modes[i];
      
      // Apply symmetry lock
      let effectiveM = mode.m + (symmetryLock ? timeOffset : 0);
      let effectiveN = mode.n + (symmetryLock ? timeOffset : 0);
      
      // Apply harmonic strength
      const harmonicFactor = 1 + harmonicStrength * 0.1;
      
      const zCenter = computeChladniField(x, y, [{ ...mode, m: effectiveM, n: effectiveN }], plateSize);
      const zRight = computeChladniField(x + epsilon, y, [{ ...mode, m: effectiveM, n: effectiveN }], plateSize);
      const zUp = computeChladniField(x, y + epsilon, [{ ...mode, m: effectiveM, n: effectiveN }], plateSize);
      
      const dzdx = (zRight - zCenter) / epsilon;
      const dzdy = (zUp - zCenter) / epsilon;
      
      // Apply mode mixing
      const mixFactor = modeMixing > 0 ? Math.sin(this.time * 0.5 + i) * modeMixing * 0.2 : 0;
      
      gxTotal += (-2 * zCenter * dzdx * (1 + mixFactor)) * harmonicFactor;
      gyTotal += (-2 * zCenter * dzdy * (1 + mixFactor)) * harmonicFactor;
    }
    
    // Apply vibration intensity
    return {
      gx: gxTotal * vibrationIntensity,
      gy: gyTotal * vibrationIntensity,
    };
  }

  private updatePhysics(): void {
    if (this.modes.length === 0) return;
    
    const { 
      dampingFactor, 
      noiseAmount, 
      speedMultiplier, 
      plateSize, 
      particleMass,
      gravity,
      friction,
      bounceCoefficient,
      particleDensity
    } = this.config;
    
    const halfPlate = plateSize;
    const massFactor = 1 / Math.sqrt(particleMass);
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      // Store previous position for trail
      p.prevX = p.x;
      p.prevY = p.y;
      
      // Compute gradient at particle position
      const { gx, gy } = this.computeGradient(p.x, p.y);
      
      // Apply density-based clustering force
      const densityForce = particleDensity > 1 ? Math.sin(this.time * 2) * particleDensity * 0.001 : 0;
      
      // Update velocity with gradient + noise (shaking effect) + gravity
      p.vx += gx * speedMultiplier * 0.01 * massFactor + 
              (Math.random() - 0.5) * noiseAmount * 0.1 +
              densityForce;
      p.vy += gy * speedMultiplier * 0.01 * massFactor + 
              (Math.random() - 0.5) * noiseAmount * 0.1 +
              gravity; // Add gravity
      
      // Apply friction
      p.vx *= (1 - friction);
      p.vy *= (1 - friction);
      
      // Apply damping
      p.vx *= dampingFactor;
      p.vy *= dampingFactor;
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Boundary check with bounce
      if (Math.abs(p.x) > halfPlate) {
        p.x = Math.sign(p.x) * halfPlate;
        p.vx *= -bounceCoefficient;
      }
      if (Math.abs(p.y) > halfPlate) {
        p.y = Math.sign(p.y) * halfPlate;
        p.vy *= -bounceCoefficient;
      }
      
      // Update life based on velocity
      const speed = Math.sqrt(p.vx ** 2 + p.vy ** 2);
      p.life = Math.min(1.0, Math.max(0.1, 1.0 - speed * 5));
    }
  }

  private render(): void {
    if (!this.imageData) return;
    
    const { width, height } = this.canvas;
    const { particleTrail, brightness } = this.config;
    const halfPlate = this.config.plateSize;
    
    // Handle trail effect
    if (particleTrail > 0 && this.trailCtx && this.trailCanvas) {
      // Fade existing trail
      this.trailCtx.fillStyle = `rgba(10, 10, 15, ${1 - particleTrail})`;
      this.trailCtx.fillRect(0, 0, width, height);
      
      // Draw particles to trail canvas
      this.trailCtx.fillStyle = `rgba(255, 255, 255, ${particleTrail})`;
      const particleSize = Math.max(1, Math.floor(this.config.particleSize));
      
      for (const p of this.particles) {
        const px = Math.floor(((p.x / halfPlate + 1) / 2) * width);
        const py = Math.floor(((p.y / halfPlate + 1) / 2) * height);
        
        const [r, g, b] = this.getColor(p.life, Math.sqrt(p.vx ** 2 + p.vy ** 2) * 10, p.x, p.y);
        this.trailCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particleTrail * p.life})`;
        this.trailCtx.beginPath();
        this.trailCtx.arc(px, py, particleSize, 0, Math.PI * 2);
        this.trailCtx.fill();
      }
      
      // Copy trail to main canvas
      this.ctx.drawImage(this.trailCanvas, 0, 0);
      return;
    }
    
    // Standard rendering without trails
    const data = this.imageData.data;
    
    // Clear background
    const bgIntensity = Math.floor(10 * brightness);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = bgIntensity;
      data[i + 1] = bgIntensity;
      data[i + 2] = Math.floor(bgIntensity * 1.5);
      data[i + 3] = 255;
    }
    
    // Render particles
    const particleSize = Math.max(1, Math.floor(this.config.particleSize));
    
    for (const p of this.particles) {
      // Map particle position to pixel coordinates
      const px = Math.floor(((p.x / halfPlate + 1) / 2) * width);
      const py = Math.floor(((p.y / halfPlate + 1) / 2) * height);
      
      // Get color
      const [r, g, b] = this.getColor(p.life, Math.sqrt(p.vx ** 2 + p.vy ** 2) * 10, p.x, p.y);
      
      // Draw particle as a small square with glow
      const size = particleSize + Math.floor(this.config.glowIntensity * 2);
      for (let dx = -size; dx <= size; dx++) {
        for (let dy = -size; dy <= size; dy++) {
          const ix = px + dx;
          const iy = py + dy;
          
          if (ix >= 0 && ix < width && iy >= 0 && iy < height) {
            const i = (iy * width + ix) * 4;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const alpha = p.life * Math.max(0, 1 - dist / (size + 1));
            
            // Additive blending
            data[i] = Math.min(255, data[i] + Math.floor(r * alpha));
            data[i + 1] = Math.min(255, data[i + 1] + Math.floor(g * alpha));
            data[i + 2] = Math.min(255, data[i + 2] + Math.floor(b * alpha));
          }
        }
      }
    }
    
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  start(): void {
    if (this.animationId !== null) return;
    
    const animate = () => {
      this.time += 0.016;
      this.updatePhysics();
      this.render();
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  reset(): void {
    this.initializeParticles();
    // Clear trail canvas
    if (this.trailCtx && this.trailCanvas) {
      this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
    }
  }

  destroy(): void {
    this.stop();
  }
}
