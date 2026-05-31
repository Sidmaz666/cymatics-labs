import * as THREE from 'three'
import { SimulationConfig, ModeInput, ColorScheme, computeChladniGradient, applyWaveformToGradient, OscillatorType } from './chladni-physics'

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

function hexToCSS(hex: string): string {
  return hex
}

const VERTEX_SHADER = `
  attribute float aLife;
  attribute vec2 aVelocity;

  uniform float uPointSize;
  uniform float uTime;

  varying float vLife;
  varying float vIntensity;

  void main() {
    vLife = aLife;
    vIntensity = length(aVelocity) * 10.0;

    vec4 mvPosition = modelViewMatrix * vec4(position.xy, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uPointSize * (0.5 + vLife * 0.5);
  }
`

function fragmentShaderForScheme(scheme: ColorScheme): string {
  const schemeFn = getSchemeFn(scheme)

  return `
    precision highp float;

    varying float vLife;
    varying float vIntensity;

    uniform float uGlow;
    uniform float uBrightness;

    ${schemeFn}

    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      if (dist > 0.5) discard;

      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
      alpha *= vLife;

      vec3 color = getColor(vLife, vIntensity);
      color *= uBrightness;
      color *= (1.0 + uGlow * 0.3);

      gl_FragColor = vec4(color, alpha);
    }
  `
}

function getSchemeFn(scheme: ColorScheme): string {
  switch (scheme) {
    case 'classic':
      return `
        vec3 getColor(float life, float intensity) {
          float b = 0.6 + life * 0.4;
          return vec3(b * 0.95, b * 0.85, b * 0.75);
        }
      `
    case 'rainbow':
      return `
        uniform float uTime;
        vec3 getColor(float life, float intensity) {
          float b = 0.6 + life * 0.4;
          float hue = uTime * 0.05;
          float h = fract(hue) * 6.0;
          int i = int(floor(h));
          float f = h - floor(h);
          float p = b * (1.0 - 0.7);
          float q = b * (1.0 - 0.7 * f);
          float t = b * (1.0 - 0.7 * (1.0 - f));
          if (i == 0) return vec3(b, t, p);
          if (i == 1) return vec3(q, b, p);
          if (i == 2) return vec3(p, b, t);
          if (i == 3) return vec3(p, q, b);
          if (i == 4) return vec3(t, p, b);
          return vec3(b, p, q);
        }
      `
    case 'heat':
      return `
        vec3 getColor(float life, float intensity) {
          float t = life * 0.8 + intensity * 0.2;
          if (t < 0.5) {
            return mix(vec3(0.0, 0.0, 0.3), vec3(0.8, 0.2, 0.0), t * 2.0);
          }
          return mix(vec3(0.8, 0.2, 0.0), vec3(1.0, 1.0, 0.8), (t - 0.5) * 2.0);
        }
      `
    case 'ocean':
      return `
        vec3 getColor(float life, float intensity) {
          float t = life * 0.7 + intensity * 0.3;
          return mix(vec3(0.0, 0.1, 0.3), mix(vec3(0.0, 0.5, 0.7), vec3(0.8, 1.0, 1.0), t), t);
        }
      `
    case 'neon':
      return `
        uniform float uTime;
        vec3 getColor(float life, float intensity) {
          float t = life;
          vec3 pink = vec3(1.0, 0.0, 0.6);
          vec3 cyan = vec3(0.0, 1.0, 1.0);
          float cycle = sin(uTime * 2.0) * 0.5 + 0.5;
          return mix(mix(pink, cyan, cycle), vec3(0.6, 0.0, 1.0), t) * (0.8 + t * 0.4);
        }
      `
    case 'custom':
      return `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        vec3 getColor(float life, float intensity) {
          float t = life * 0.7 + intensity * 0.3;
          return mix(uColorA, uColorB, t);
        }
      `
  }
}

export class ChladniSimulation {
  private canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private geometry: THREE.BufferGeometry
  private material: THREE.ShaderMaterial
  private points: THREE.Points

  private pos: Float32Array
  private vel: Float32Array
  private life: Float32Array

  private config: SimulationConfig
  private modes: ModeInput[] = []
  private currentWaveform: OscillatorType = 'sine'
  private time = 0
  private lastTime = 0
  private animId: number | null = null
  private destroyed = false

  public zoom = 1
  public panX = 0
  public panY = 0

  constructor(canvas: HTMLCanvasElement, config: SimulationConfig) {
    this.canvas = canvas
    this.config = { ...config }

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(hexToColor(config.backgroundColor), 1)

    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const count = config.particleCount
    this.pos = new Float32Array(count * 3)
    this.vel = new Float32Array(count * 2)
    this.life = new Float32Array(count)

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3))
    this.geometry.setAttribute('aVelocity', new THREE.BufferAttribute(this.vel, 2))
    this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.life, 1))

    const fragSrc = fragmentShaderForScheme(config.colorScheme)
    const uniforms: Record<string, THREE.IUniform> = {
      uPointSize: { value: config.particleSize },
      uTime: { value: 0 },
      uGlow: { value: config.glowIntensity },
      uBrightness: { value: config.brightness },
    }
    if (config.colorScheme === 'custom') {
      uniforms.uColorA = { value: hexToColor(config.customPrimary) }
      uniforms.uColorB = { value: hexToColor(config.customSecondary) }
    }

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: fragSrc,
      uniforms,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.points)

    this.initParticles()
    this.resize()
    this.renderer.render(this.scene, this.camera)
  }

  private initParticles(): void {
    const count = this.pos.length / 3
    const half = this.config.plateSize
    const spread = half * 3

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const i2 = i * 2
      this.pos[i3] = (Math.random() - 0.5) * 2 * spread
      this.pos[i3 + 1] = (Math.random() - 0.5) * 2 * spread
      this.pos[i3 + 2] = 0
      this.vel[i2] = (Math.random() - 0.5) * 0.01
      this.vel[i2 + 1] = (Math.random() - 0.5) * 0.01
      this.life[i] = 0.5 + Math.random() * 0.5
    }
  }

  setModes(modes: ModeInput[], waveform?: OscillatorType): void {
    this.modes = modes
    if (waveform) this.currentWaveform = waveform
  }

  updateConfig(config: Partial<SimulationConfig>): void {
    const prevCount = this.config.particleCount
    const prevScheme = this.config.colorScheme
    Object.assign(this.config, config)

    if (config.particleCount !== undefined && config.particleCount !== prevCount) {
      const count = config.particleCount
      this.pos = new Float32Array(count * 3)
      this.vel = new Float32Array(count * 2)
      this.life = new Float32Array(count)
      this.initParticles()
      this.geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3))
      this.geometry.setAttribute('aVelocity', new THREE.BufferAttribute(this.vel, 2))
      this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.life, 1))
      if (this.animId === null) this.renderer.render(this.scene, this.camera)
    }

    if (config.colorScheme !== undefined && config.colorScheme !== prevScheme) {
      const fragSrc = fragmentShaderForScheme(this.config.colorScheme)
      const uniforms: Record<string, THREE.IUniform> = {
        uPointSize: { value: this.config.particleSize },
        uTime: { value: this.time },
        uGlow: { value: this.config.glowIntensity },
        uBrightness: { value: this.config.brightness },
      }
      if (this.config.colorScheme === 'custom') {
        uniforms.uColorA = { value: hexToColor(this.config.customPrimary) }
        uniforms.uColorB = { value: hexToColor(this.config.customSecondary) }
      }
      this.material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: fragSrc,
        uniforms,
        transparent: true,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      })
      this.points.material = this.material
    }

    if (config.customPrimary !== undefined && this.material.uniforms.uColorA) {
      this.material.uniforms.uColorA.value = hexToColor(config.customPrimary)
    }
    if (config.customSecondary !== undefined && this.material.uniforms.uColorB) {
      this.material.uniforms.uColorB.value = hexToColor(config.customSecondary)
    }
    if (config.backgroundColor !== undefined) {
      this.renderer.setClearColor(hexToColor(config.backgroundColor), 1)
    }

    if (config.particleSize !== undefined) {
      this.material.uniforms.uPointSize.value = config.particleSize
    }
    if (config.glowIntensity !== undefined && this.material.uniforms.uGlow) {
      this.material.uniforms.uGlow.value = config.glowIntensity
    }
    if (config.brightness !== undefined && this.material.uniforms.uBrightness) {
      this.material.uniforms.uBrightness.value = config.brightness
    }
    if (config.plateSize !== undefined) {
      this.resize()
    }
  }

  resize(): void {
    if (this.destroyed) return
    const rect = this.canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio, 2)
    const w = rect.width * dpr
    const h = rect.height * dpr
    this.renderer.setSize(w, h, false)
    const aspect = w / h
    const half = this.config.plateSize
    const z = this.zoom
    if (aspect > 1) {
      this.camera.left = (-half + this.panX) / z
      this.camera.right = (half + this.panX) / z
      this.camera.top = (half / aspect + this.panY) / z
      this.camera.bottom = (-half / aspect + this.panY) / z
    } else {
      this.camera.left = (-half * aspect + this.panX) / z
      this.camera.right = (half * aspect + this.panX) / z
      this.camera.top = (half + this.panY) / z
      this.camera.bottom = (-half + this.panY) / z
    }
    this.camera.updateProjectionMatrix()
    if (this.animId === null) this.renderer.render(this.scene, this.camera)
  }

  setZoomPan(zoom: number, panX: number, panY: number): void {
    this.zoom = Math.max(1, zoom)
    this.panX = panX
    this.panY = panY
    this.resize()
  }

  private tickPhysics(dt: number): void {
    if (this.modes.length === 0) return

    const count = this.pos.length / 3
    const { dampingFactor, noiseAmount, speedMultiplier, plateSize, vibrationIntensity } = this.config
    const half = plateSize
    const dtScale = Math.min(dt, 0.05)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const i2 = i * 2
      const x = this.pos[i3]
      const y = this.pos[i3 + 1]

      const { gx, gy } = computeChladniGradient(x, y, this.modes, plateSize)
      const wg = applyWaveformToGradient(gx, gy, this.currentWaveform)

      this.vel[i2] += (wg.gx * vibrationIntensity * speedMultiplier * 0.01 + (Math.random() - 0.5) * noiseAmount * 0.1) * dtScale
      this.vel[i2 + 1] += (wg.gy * vibrationIntensity * speedMultiplier * 0.01 + (Math.random() - 0.5) * noiseAmount * 0.1) * dtScale

      this.vel[i2] *= dampingFactor
      this.vel[i2 + 1] *= dampingFactor

      this.pos[i3] += this.vel[i2]
      this.pos[i3 + 1] += this.vel[i2 + 1]

      const period = half * 2
      if (this.pos[i3] > half) this.pos[i3] -= period
      else if (this.pos[i3] < -half) this.pos[i3] += period
      if (this.pos[i3 + 1] > half) this.pos[i3 + 1] -= period
      else if (this.pos[i3 + 1] < -half) this.pos[i3 + 1] += period

      const speed = Math.sqrt(this.vel[i2] ** 2 + this.vel[i2 + 1] ** 2)
      this.life[i] = Math.min(1, Math.max(0.1, 1.0 - speed * 5))
    }

    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.aVelocity.needsUpdate = true
    this.geometry.attributes.aLife.needsUpdate = true
  }

  start(): void {
    if (this.animId !== null) return
    this.lastTime = performance.now()

    const loop = (now: number) => {
      if (this.destroyed) return
      const dt = (now - this.lastTime) / 1000
      this.lastTime = now

      this.time += dt
      if (this.material.uniforms.uTime) {
        this.material.uniforms.uTime.value = this.time
      }

      this.tickPhysics(dt)
      this.renderer.render(this.scene, this.camera)
      this.animId = requestAnimationFrame(loop)
    }

    this.animId = requestAnimationFrame(loop)
  }

  stop(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId)
      this.animId = null
    }
  }

  reset(): void {
    this.initParticles()
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.aVelocity.needsUpdate = true
    this.geometry.attributes.aLife.needsUpdate = true
  }

  getStats(fps: number): Record<string, string | number> {
    const count = this.pos.length / 3
    const half = this.config.plateSize
    let sumSpeed = 0
    let sumSpeedSq = 0
    let sumSpeed3 = 0
    let sumSpeed4 = 0
    let maxSpeed = 0
    let minSpeed = Infinity
    let settledCount = 0
    let activeCount = 0
    let sumVx = 0
    let sumVy = 0
    let sumVort = 0
    let sumDistCenter = 0
    let nearCenterCount = 0
    let sumGradMag = 0
    const sampleRate = Math.max(1, Math.floor(count / 5000))
    let samples = 0

    for (let i = 0; i < count; i += sampleRate) {
      const i2 = i * 2
      const i3 = i * 3
      const vx = this.vel[i2]
      const vy = this.vel[i2 + 1]
      const speed = Math.sqrt(vx * vx + vy * vy)
      sumSpeed += speed
      sumSpeedSq += speed * speed
      sumSpeed3 += speed * speed * speed
      sumSpeed4 += speed * speed * speed * speed
      if (speed > maxSpeed) maxSpeed = speed
      if (speed < minSpeed) minSpeed = speed
      if (speed < 0.01) settledCount++
      if (speed > 0.05) activeCount++
      sumVx += vx
      sumVy += vy
      sumVort += (this.pos[i3] * vy - this.pos[i3 + 1] * vx)
      const dx = this.pos[i3]
      const dy = this.pos[i3 + 1]
      const dist = Math.sqrt(dx * dx + dy * dy)
      sumDistCenter += dist
      if (dist < half * 0.3) nearCenterCount++

      const { gx, gy } = computeChladniGradient(this.pos[i3], this.pos[i3 + 1], this.modes, half)
      sumGradMag += Math.sqrt(gx * gx + gy * gy)
      samples++
    }

    const avgSpeed = sumSpeed / samples
    const dispersion = Math.sqrt(sumSpeedSq / samples - avgSpeed * avgSpeed)
    const variance = sumSpeedSq / samples - avgSpeed * avgSpeed
    const skewness = variance > 0 ? (sumSpeed3 / samples - 3 * avgSpeed * variance - avgSpeed * avgSpeed * avgSpeed) / (Math.sqrt(variance) ** 3) : 0
    const kurtosis = variance > 0 ? (sumSpeed4 / samples) / (variance * variance) - 3 : 0
    const driftVx = sumVx / samples
    const driftVy = sumVy / samples
    const driftMag = Math.sqrt(driftVx * driftVx + driftVy * driftVy)
    const avgVort = sumVort / samples
    const avgDistCenter = sumDistCenter / samples
    const centerBias = (nearCenterCount / samples) * 100
    const avgGrad = sumGradMag / samples

    return {
      fps: Math.round(fps),
      particles: count,
      activeMode: this.modes.length,
      modesDetail: this.modes.map((m) => `(${m.m},${m.n})`).join(' '),
      waveform: this.currentWaveform,
      avgSpeed: avgSpeed.toFixed(5),
      maxSpeed: maxSpeed.toFixed(5),
      minSpeed: minSpeed.toFixed(5),
      dispersion: dispersion.toFixed(5),
      settled: ((settledCount / samples) * 100).toFixed(1) + '%',
      energy: (sumSpeedSq * 0.5).toFixed(3),
      temperature: (sumSpeedSq / samples * 0.5).toFixed(5),
      activePct: ((activeCount / samples) * 100).toFixed(1) + '%',
      drift: driftMag.toFixed(5),
      vorticity: avgVort.toFixed(5),
      centerDist: avgDistCenter.toFixed(3),
      centerBias: centerBias.toFixed(1) + '%',
      gradient: avgGrad.toFixed(5),
      skewness: skewness.toFixed(3),
      kurtosis: kurtosis.toFixed(3),
      sweep: `+${(sumVx / samples * 1000).toFixed(3)}` + ` / ${(sumVy / samples * 1000).toFixed(3)}`,
    }
  }

  destroy(): void {
    this.destroyed = true
    this.stop()
    this.geometry.dispose()
    this.material.dispose()
    this.renderer.dispose()
  }
}
