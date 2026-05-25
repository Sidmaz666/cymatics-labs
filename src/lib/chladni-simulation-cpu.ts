import { SimulationConfig } from './chladni-store';
import { computeChladniGradient } from './chladni-simulation';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
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

  constructor(canvas: HTMLCanvasElement, config: SimulationConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.config = config;
    
    this.initializeParticles();
    this.resize();
  }

  private initializeParticles(): void {
    this.particles = [];
    const count = this.config.particleCount;
    const halfPlate = this.config.plateSize * 0.95;
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 2 * halfPlate,
        y: (Math.random() - 0.5) * 2 * halfPlate,
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
    this.config = { ...this.config, ...config };
    
    // Recreate particles if count changed significantly
    if (config.particleCount && Math.abs(config.particleCount - prevCount) > 5000) {
      this.initializeParticles();
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
  }

  private getColor(life: number, intensity: number, x: number, y: number): [number, number, number] {
    const { colorScheme } = this.config;
    const t = life;
    const angle = Math.atan2(y, x);
    
    switch (colorScheme) {
      case 'classic':
        const brightness = Math.floor((0.6 + life * 0.4) * 255);
        return [brightness, Math.floor(brightness * 0.9), Math.floor(brightness * 0.8)];
      
      case 'rainbow':
        const hue = ((angle + Math.PI) / (2 * Math.PI) + this.time * 0.02) % 1;
        return this.hsvToRgb(hue * 360, 70, (0.6 + t * 0.4) * 100);
      
      case 'heat':
        const heat = t * 0.8 + intensity * 0.2;
        return [
          Math.floor(heat * 255),
          Math.floor(heat * heat * 100),
          Math.floor(heat * heat * heat * 50),
        ];
      
      case 'ocean':
        const oceanT = t * 0.7 + intensity * 0.3;
        return [
          Math.floor(oceanT * 50),
          Math.floor(oceanT * 150),
          Math.floor(150 + oceanT * 50),
        ];
      
      case 'neon':
        const cycle = Math.sin(this.time * 2 + x * 3 + y * 3) * 0.5 + 0.5;
        return [
          Math.floor((0.8 + t * 0.4) * (cycle * 255 + (1 - cycle) * 150)),
          Math.floor((0.8 + t * 0.4) * ((1 - cycle) * 255)),
          Math.floor((0.8 + t * 0.4) * 200),
        ];
      
      default:
        return [200, 180, 160];
    }
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

  private updatePhysics(): void {
    if (this.modes.length === 0) return;
    
    const { dampingFactor, noiseAmount, speedMultiplier, plateSize } = this.config;
    const halfPlate = plateSize;
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      // Compute gradient at particle position
      const { gx, gy } = computeChladniGradient(p.x, p.y, this.modes, plateSize);
      
      // Update velocity with gradient + noise (shaking effect)
      p.vx += gx * speedMultiplier * 0.01 + (Math.random() - 0.5) * noiseAmount * 0.1;
      p.vy += gy * speedMultiplier * 0.01 + (Math.random() - 0.5) * noiseAmount * 0.1;
      
      // Apply damping
      p.vx *= dampingFactor;
      p.vy *= dampingFactor;
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Boundary check
      if (Math.abs(p.x) > halfPlate) {
        p.x = Math.sign(p.x) * halfPlate;
        p.vx *= -0.5;
      }
      if (Math.abs(p.y) > halfPlate) {
        p.y = Math.sign(p.y) * halfPlate;
        p.vy *= -0.5;
      }
      
      // Update life based on velocity
      const speed = Math.sqrt(p.vx ** 2 + p.vy ** 2);
      p.life = Math.min(1.0, Math.max(0.1, 1.0 - speed * 5));
    }
  }

  private render(): void {
    if (!this.imageData) return;
    
    const { width, height } = this.canvas;
    const data = this.imageData.data;
    const halfPlate = this.config.plateSize;
    
    // Clear background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 10;     // R
      data[i + 1] = 10; // G
      data[i + 2] = 15; // B
      data[i + 3] = 255; // A
    }
    
    // Render particles
    const particleSize = Math.max(1, Math.floor(this.config.particleSize));
    
    for (const p of this.particles) {
      // Map particle position to pixel coordinates
      const px = Math.floor(((p.x / halfPlate + 1) / 2) * width);
      const py = Math.floor(((p.y / halfPlate + 1) / 2) * height);
      
      // Get color
      const [r, g, b] = this.getColor(p.life, Math.sqrt(p.vx ** 2 + p.vy ** 2) * 10, p.x, p.y);
      
      // Draw particle as a small square
      for (let dx = -particleSize; dx <= particleSize; dx++) {
        for (let dy = -particleSize; dy <= particleSize; dy++) {
          const ix = px + dx;
          const iy = py + dy;
          
          if (ix >= 0 && ix < width && iy >= 0 && iy < height) {
            const i = (iy * width + ix) * 4;
            const alpha = p.life * (1 - (dx * dx + dy * dy) / (particleSize * particleSize * 2 + 1));
            
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
  }

  destroy(): void {
    this.stop();
  }
}
