import * as THREE from 'three';
import { SimulationConfig } from './chladni-store';

// Vertex shader for particle rendering
const vertexShader = `
  attribute vec2 aPosition;
  attribute vec2 aVelocity;
  attribute float aLife;
  
  uniform float uPointSize;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uPlateSize;
  
  varying float vLife;
  varying float vIntensity;
  varying vec2 vPos;
  
  void main() {
    vLife = aLife;
    vPos = aPosition;
    
    // Calculate intensity based on velocity
    vIntensity = length(aVelocity) * 10.0;
    
    // Map position to clip space
    vec2 clipPos = aPosition / uPlateSize;
    
    gl_Position = vec4(clipPos, 0.0, 1.0);
    gl_PointSize = uPointSize * (0.5 + vLife * 0.5);
  }
`;

// Fragment shader for particle rendering with color schemes
const fragmentShader = `
  precision highp float;
  
  uniform int uColorScheme;
  uniform float uTime;
  
  varying float vLife;
  varying float vIntensity;
  varying vec2 vPos;
  
  vec3 classicColor(float life, float intensity) {
    float brightness = 0.6 + life * 0.4;
    return vec3(brightness * 0.95, brightness * 0.85, brightness * 0.75);
  }
  
  vec3 rainbowColor(float life, float intensity, vec2 pos) {
    float angle = atan(pos.y, pos.x);
    float hue = (angle + 3.14159) / (2.0 * 3.14159);
    hue += uTime * 0.05;
    
    // HSV to RGB
    float h = hue * 6.0;
    float s = 0.7 + intensity * 0.3;
    float v = 0.6 + life * 0.4;
    
    int i = int(floor(h));
    float f = h - floor(h);
    float p = v * (1.0 - s);
    float q = v * (1.0 - s * f);
    float t = v * (1.0 - s * (1.0 - f));
    
    if (i == 0) return vec3(v, t, p);
    if (i == 1) return vec3(q, v, p);
    if (i == 2) return vec3(p, v, t);
    if (i == 3) return vec3(p, q, v);
    if (i == 4) return vec3(t, p, v);
    return vec3(v, p, q);
  }
  
  vec3 heatColor(float life, float intensity) {
    float t = life * 0.8 + intensity * 0.2;
    return mix(
      mix(vec3(0.0, 0.0, 0.3), vec3(0.8, 0.2, 0.0), t),
      vec3(1.0, 1.0, 0.8),
      t * t
    );
  }
  
  vec3 oceanColor(float life, float intensity) {
    float t = life * 0.7 + intensity * 0.3;
    return mix(
      vec3(0.0, 0.1, 0.3),
      mix(vec3(0.0, 0.5, 0.7), vec3(0.8, 1.0, 1.0), t),
      t
    );
  }
  
  vec3 neonColor(float life, float intensity) {
    float t = life;
    vec3 pink = vec3(1.0, 0.0, 0.6);
    vec3 cyan = vec3(0.0, 1.0, 1.0);
    vec3 purple = vec3(0.6, 0.0, 1.0);
    
    float cycle = sin(uTime * 2.0 + vPos.x * 3.0 + vPos.y * 3.0) * 0.5 + 0.5;
    return mix(mix(pink, cyan, cycle), purple, t) * (0.8 + t * 0.4);
  }
  
  void main() {
    // Circular particle with soft edges
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    alpha *= vLife;
    
    vec3 color;
    if (uColorScheme == 0) {
      color = classicColor(vLife, vIntensity);
    } else if (uColorScheme == 1) {
      color = rainbowColor(vLife, vIntensity, vPos);
    } else if (uColorScheme == 2) {
      color = heatColor(vLife, vIntensity);
    } else if (uColorScheme == 3) {
      color = oceanColor(vLife, vIntensity);
    } else {
      color = neonColor(vLife, vIntensity);
    }
    
    // Add glow effect
    color += vIntensity * 0.3;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Physics compute shader - calculates Chladni force field
export function computeChladniField(
  x: number,
  y: number,
  modes: Array<{ m: number; n: number; amplitude: number }>,
  plateSize: number
): number {
  // Normalize coordinates to [-1, 1]
  const nx = (x / plateSize) * Math.PI;
  const ny = (y / plateSize) * Math.PI;
  
  let z = 0;
  let totalAmplitude = 0;
  
  for (const mode of modes) {
    // Chladni equation: z = cos(mπx)cos(nπy) - cos(nπx)cos(mπy)
    // This creates standing wave patterns on a square plate
    const term1 = Math.cos(mode.m * nx) * Math.cos(mode.n * ny);
    const term2 = Math.cos(mode.n * nx) * Math.cos(mode.m * ny);
    z += mode.amplitude * (term1 - term2);
    totalAmplitude += mode.amplitude;
  }
  
  // Normalize
  return totalAmplitude > 0 ? z / totalAmplitude : 0;
}

// Compute gradient of the Chladni field (for particle movement)
export function computeChladniGradient(
  x: number,
  y: number,
  modes: Array<{ m: number; n: number; amplitude: number }>,
  plateSize: number
): { gx: number; gy: number } {
  const epsilon = 0.001;
  
  const zCenter = computeChladniField(x, y, modes, plateSize);
  const zRight = computeChladniField(x + epsilon, y, modes, plateSize);
  const zUp = computeChladniField(x, y + epsilon, modes, plateSize);
  
  // Gradient points towards nodes (where z = 0)
  // We want particles to move AWAY from antinodes (high |z|) towards nodes (low |z|)
  // So we compute gradient of |z|² and move in the negative direction
  
  const dzdx = (zRight - zCenter) / epsilon;
  const dzdy = (zUp - zCenter) / epsilon;
  
  // Gradient of z² is 2z * gradient(z)
  // Particles move towards nodes, so we return the gradient of amplitude
  return {
    gx: -2 * zCenter * dzdx,
    gy: -2 * zCenter * dzdy,
  };
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export class ChladniSimulation {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  private particles: Float32Array;
  private velocities: Float32Array;
  private lives: Float32Array;
  private config: SimulationConfig;
  private modes: Array<{ m: number; n: number; amplitude: number }> = [];
  private animationId: number | null = null;
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement, config: SimulationConfig) {
    this.canvas = canvas;
    this.config = config;
    
    // Initialize Three.js
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0a0a0f, 1);
    
    this.scene = new THREE.Scene();
    
    // Orthographic camera for 2D
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Initialize particle data
    const count = config.particleCount;
    this.particles = new Float32Array(count * 2);
    this.velocities = new Float32Array(count * 2);
    this.lives = new Float32Array(count);
    
    this.initializeParticles();
    
    // Create geometry
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('aPosition', new THREE.BufferAttribute(this.particles, 2));
    this.particleGeometry.setAttribute('aVelocity', new THREE.BufferAttribute(this.velocities, 2));
    this.particleGeometry.setAttribute('aLife', new THREE.BufferAttribute(this.lives, 1));
    
    // Create material with shaders
    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPointSize: { value: config.particleSize },
        uResolution: { value: new THREE.Vector2(canvas.width, canvas.height) },
        uTime: { value: 0 },
        uPlateSize: { value: config.plateSize },
        uColorScheme: { value: 0 },
      },
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    
    // Create points
    const points = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(points);
    
    this.resize();
  }

  private initializeParticles(): void {
    const count = this.particles.length / 2;
    const halfPlate = this.config.plateSize * 0.95;
    
    for (let i = 0; i < count; i++) {
      // Random initial position within the plate
      this.particles[i * 2] = (Math.random() - 0.5) * 2 * halfPlate;
      this.particles[i * 2 + 1] = (Math.random() - 0.5) * 2 * halfPlate;
      
      // Random initial velocity
      this.velocities[i * 2] = (Math.random() - 0.5) * 0.01;
      this.velocities[i * 2 + 1] = (Math.random() - 0.5) * 0.01;
      
      // Random life
      this.lives[i] = 0.5 + Math.random() * 0.5;
    }
  }

  setModes(modes: Array<{ m: number; n: number; amplitude: number }>): void {
    this.modes = modes;
  }

  updateConfig(config: Partial<SimulationConfig>): void {
    const prevCount = this.config.particleCount;
    this.config = { ...this.config, ...config };
    
    // Recreate particles if count changed
    if (config.particleCount && config.particleCount !== prevCount) {
      const count = config.particleCount;
      this.particles = new Float32Array(count * 2);
      this.velocities = new Float32Array(count * 2);
      this.lives = new Float32Array(count);
      this.initializeParticles();
      
      this.particleGeometry.setAttribute('aPosition', new THREE.BufferAttribute(this.particles, 2));
      this.particleGeometry.setAttribute('aVelocity', new THREE.BufferAttribute(this.velocities, 2));
      this.particleGeometry.setAttribute('aLife', new THREE.BufferAttribute(this.lives, 1));
    }
    
    // Update uniforms
    if (config.particleSize !== undefined) {
      this.particleMaterial.uniforms.uPointSize.value = config.particleSize;
    }
    if (config.plateSize !== undefined) {
      this.particleMaterial.uniforms.uPlateSize.value = config.plateSize;
    }
    
    // Update color scheme
    const colorMap: Record<string, number> = {
      classic: 0,
      rainbow: 1,
      heat: 2,
      ocean: 3,
      neon: 4,
    };
    this.particleMaterial.uniforms.uColorScheme.value = colorMap[config.colorScheme ?? 'classic'];
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    const width = rect.width * dpr;
    const height = rect.height * dpr;
    
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.setSize(width, height);
    
    // Update aspect ratio
    const aspect = width / height;
    this.camera.left = -aspect;
    this.camera.right = aspect;
    this.camera.updateProjectionMatrix();
    
    this.particleMaterial.uniforms.uResolution.value.set(width, height);
  }

  private updatePhysics(): void {
    if (this.modes.length === 0) return;
    
    const count = this.particles.length / 2;
    const { dampingFactor, noiseAmount, speedMultiplier, plateSize } = this.config;
    const halfPlate = plateSize;
    
    for (let i = 0; i < count; i++) {
      const x = this.particles[i * 2];
      const y = this.particles[i * 2 + 1];
      
      // Compute gradient at particle position
      const { gx, gy } = computeChladniGradient(x, y, this.modes, plateSize);
      
      // Update velocity with gradient + noise (shaking effect)
      this.velocities[i * 2] += gx * speedMultiplier * 0.01 + (Math.random() - 0.5) * noiseAmount * 0.1;
      this.velocities[i * 2 + 1] += gy * speedMultiplier * 0.01 + (Math.random() - 0.5) * noiseAmount * 0.1;
      
      // Apply damping
      this.velocities[i * 2] *= dampingFactor;
      this.velocities[i * 2 + 1] *= dampingFactor;
      
      // Update position
      this.particles[i * 2] += this.velocities[i * 2];
      this.particles[i * 2 + 1] += this.velocities[i * 2 + 1];
      
      // Boundary check - bounce off edges
      if (Math.abs(this.particles[i * 2]) > halfPlate) {
        this.particles[i * 2] = Math.sign(this.particles[i * 2]) * halfPlate;
        this.velocities[i * 2] *= -0.5;
      }
      if (Math.abs(this.particles[i * 2 + 1]) > halfPlate) {
        this.particles[i * 2 + 1] = Math.sign(this.particles[i * 2 + 1]) * halfPlate;
        this.velocities[i * 2 + 1] *= -0.5;
      }
      
      // Update life based on velocity
      const speed = Math.sqrt(
        this.velocities[i * 2] ** 2 + this.velocities[i * 2 + 1] ** 2
      );
      this.lives[i] = Math.min(1.0, Math.max(0.1, 1.0 - speed * 5));
    }
    
    // Update buffer attributes
    this.particleGeometry.attributes.aPosition.needsUpdate = true;
    this.particleGeometry.attributes.aVelocity.needsUpdate = true;
    this.particleGeometry.attributes.aLife.needsUpdate = true;
  }

  start(): void {
    if (this.animationId !== null) return;
    
    const animate = () => {
      this.time += 0.016;
      this.particleMaterial.uniforms.uTime.value = this.time;
      
      this.updatePhysics();
      this.renderer.render(this.scene, this.camera);
      
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
    this.particleGeometry.attributes.aPosition.needsUpdate = true;
    this.particleGeometry.attributes.aVelocity.needsUpdate = true;
    this.particleGeometry.attributes.aLife.needsUpdate = true;
  }

  destroy(): void {
    this.stop();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.renderer.dispose();
  }
}
