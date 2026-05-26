import { SimulationConfig, ModeInput, ColorScheme, computeChladniGradient, applyWaveformToGradient, OscillatorType } from './chladni-physics'

function hexToRGB(hex: string): [number, number, number] {
  const c = parseInt(hex.replace('#', ''), 16)
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255]
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

export class ChladniSimulationCPU {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private config: SimulationConfig
  private modes: ModeInput[] = []
  private currentWaveform: OscillatorType = 'sine'
  private animId: number | null = null
  private time = 0
  private lastTime = 0
  private destroyed = false

  public zoom = 1
  public panX = 0
  public panY = 0

  constructor(canvas: HTMLCanvasElement, config: SimulationConfig) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.config = { ...config }
    this.initParticles()
    this.resize()
    this.render()
  }

  private initParticles(): void {
    this.particles = []
    const count = this.config.particleCount
    const half = this.config.plateSize
    const spread = half * 3

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 2 * spread,
        y: (Math.random() - 0.5) * 2 * spread,
        vx: (Math.random() - 0.5) * 0.01,
        vy: (Math.random() - 0.5) * 0.01,
        life: 0.5 + Math.random() * 0.5,
      })
    }
  }

  setModes(modes: ModeInput[], waveform?: OscillatorType): void {
    this.modes = modes
    if (waveform) this.currentWaveform = waveform
  }

  updateConfig(config: Partial<SimulationConfig>): void {
    const prevCount = this.config.particleCount
    Object.assign(this.config, config)

    if (config.particleCount !== undefined && Math.abs(config.particleCount - prevCount) > 5000) {
      this.initParticles()
      if (this.animId === null) this.render()
    }
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio, 2)
    this.canvas.width = Math.floor(rect.width * dpr)
    this.canvas.height = Math.floor(rect.height * dpr)
    this.ctx.imageSmoothingEnabled = false
    if (this.animId === null) this.render()
  }

  setZoomPan(zoom: number, panX: number, panY: number): void {
    this.zoom = Math.max(1, zoom)
    this.panX = panX
    this.panY = panY
    if (this.animId === null) this.render()
  }

  private rgb(r: number, g: number, b: number, a = 255): number {
    return (a << 24) | (b << 16) | (g << 8) | r
  }

  private particleColor(life: number, intensity: number): number {
    const { colorScheme, glowIntensity, contrastBoost, brightness } = this.config
    const t = Math.pow(life, 1 + contrastBoost)
    const glow = 1 + intensity * glowIntensity

    let r = 0, g = 0, b = 0

    switch (colorScheme) {
      case 'classic': {
        const v = Math.min(255, (0.6 + t * 0.4) * 255 * brightness * glow)
        r = v; g = v * 0.9; b = v * 0.78
        break
      }
      case 'rainbow': {
        const hue = (this.time * 0.02) % 1
        const h = hue * 6
        const i = Math.floor(h)
        const f = h - i
        const v = (0.6 + t * 0.4) * brightness * glow
        const s = 0.7
        const p = v * (1 - s)
        const q = v * (1 - s * f)
        const t2 = v * (1 - s * (1 - f))
        switch (i) {
          case 0: [r, g, b] = [v, t2, p]; break
          case 1: [r, g, b] = [q, v, p]; break
          case 2: [r, g, b] = [p, v, t2]; break
          case 3: [r, g, b] = [p, q, v]; break
          case 4: [r, g, b] = [t2, p, v]; break
          default: [r, g, b] = [v, p, q]; break
        }
        r *= 255; g *= 255; b *= 255
        break
      }
      case 'heat': {
        const ht = t * 0.8 + intensity * 0.2
        r = Math.min(255, ht * 255 * brightness * glow)
        g = Math.min(255, ht * ht * 100 * brightness)
        b = Math.min(255, ht * ht * ht * 50 * brightness)
        break
      }
      case 'ocean': {
        const ot = t * 0.7 + intensity * 0.3
        r = Math.min(255, ot * 50 * brightness)
        g = Math.min(255, ot * 150 * brightness * glow)
        b = Math.min(255, (150 + ot * 50) * brightness)
        break
      }
      case 'neon': {
        const cycle = Math.sin(this.time * 2) * 0.5 + 0.5
        const base = (0.8 + t * 0.4) * brightness
        r = Math.min(255, base * (cycle * 255 + (1 - cycle) * 150))
        g = Math.min(255, base * ((1 - cycle) * 255))
        b = Math.min(255, base * (200 + glowIntensity * 60))
        break
      }
      case 'custom': {
        const [pr, pg, pb] = hexToRGB(this.config.customPrimary)
        const [sr, sg, sb] = hexToRGB(this.config.customSecondary)
        const frac = t * 0.7 + intensity * 0.3
        r = pr * (1 - frac) + sr * frac
        g = pg * (1 - frac) + sg * frac
        b = pb * (1 - frac) + sb * frac
        r *= brightness
        g *= brightness
        b *= brightness
        break
      }
    }

    return this.rgb(
      Math.floor(Math.min(255, r)),
      Math.floor(Math.min(255, g)),
      Math.floor(Math.min(255, b))
    )
  }

  private tickPhysics(dt: number): void {
    if (this.modes.length === 0) return
    const { dampingFactor, noiseAmount, speedMultiplier, plateSize, vibrationIntensity } = this.config
    const half = plateSize
    const dtScale = Math.min(dt, 0.05)

    for (const p of this.particles) {
      const { gx, gy } = computeChladniGradient(p.x, p.y, this.modes, plateSize)
      const wg = applyWaveformToGradient(gx, gy, this.currentWaveform)

      p.vx += (wg.gx * vibrationIntensity * speedMultiplier * 0.01 + (Math.random() - 0.5) * noiseAmount * 0.1) * dtScale
      p.vy += (wg.gy * vibrationIntensity * speedMultiplier * 0.01 + (Math.random() - 0.5) * noiseAmount * 0.1) * dtScale

      p.vx *= dampingFactor
      p.vy *= dampingFactor

      p.x += p.vx
      p.y += p.vy

      const period = half * 2
      if (p.x > half) p.x -= period
      else if (p.x < -half) p.x += period
      if (p.y > half) p.y -= period
      else if (p.y < -half) p.y += period

      const speed = Math.sqrt(p.vx ** 2 + p.vy ** 2)
      p.life = Math.min(1, Math.max(0.1, 1.0 - speed * 5))
    }
  }

  private render(): void {
    const { width, height } = this.canvas
    const { brightness, particleSize, plateSize } = this.config
    const half = plateSize
    const z = this.zoom

    const imageData = this.ctx.createImageData(width, height)
    const data = imageData.data

    const [bgr, bgg, bgb] = hexToRGB(this.config.backgroundColor)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(bgr * brightness)
      data[i + 1] = Math.floor(bgg * brightness)
      data[i + 2] = Math.floor(bgb * brightness)
      data[i + 3] = 255
    }

    const size = Math.max(1, Math.floor(particleSize))
    const glow = Math.floor(this.config.glowIntensity * 2)

    const visibleLeft = (-half + this.panX) / z
    const visibleRight = (half + this.panX) / z
    const visibleTop = (half + this.panY) / z
    const visibleBottom = (-half + this.panY) / z

    for (const p of this.particles) {
      const px = Math.floor(((p.x - visibleLeft) / (visibleRight - visibleLeft)) * width)
      const py = Math.floor(((p.y - visibleBottom) / (visibleTop - visibleBottom)) * height)

      const col = this.particleColor(p.life, Math.sqrt(p.vx ** 2 + p.vy ** 2) * 10)
      const r = col & 0xff
      const g = (col >> 8) & 0xff
      const b = (col >> 16) & 0xff

      const totalSize = size + glow
      for (let dy = -totalSize; dy <= totalSize; dy++) {
        for (let dx = -totalSize; dx <= totalSize; dx++) {
          const ix = px + dx
          const iy = py + dy
          if (ix < 0 || ix >= width || iy < 0 || iy >= height) continue
          const idx = (iy * width + ix) * 4
          const dist = Math.sqrt(dx * dx + dy * dy)
          const alpha = p.life * Math.max(0, 1 - dist / (totalSize + 1))

          data[idx] = Math.min(255, data[idx] + Math.floor(r * alpha))
          data[idx + 1] = Math.min(255, data[idx + 1] + Math.floor(g * alpha))
          data[idx + 2] = Math.min(255, data[idx + 2] + Math.floor(b * alpha))
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0)
  }

  start(): void {
    if (this.animId !== null) return
    this.lastTime = performance.now()

    const loop = (now: number) => {
      if (this.destroyed) return
      const dt = (now - this.lastTime) / 1000
      this.lastTime = now
      this.time += dt

      this.tickPhysics(dt)
      this.render()
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
  }

  getStats(fps: number): Record<string, string | number> {
    const count = this.particles.length
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
      const p = this.particles[i]
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
      sumSpeed += speed
      sumSpeedSq += speed * speed
      sumSpeed3 += speed * speed * speed
      sumSpeed4 += speed * speed * speed * speed
      if (speed > maxSpeed) maxSpeed = speed
      if (speed < minSpeed) minSpeed = speed
      if (speed < 0.01) settledCount++
      if (speed > 0.05) activeCount++
      sumVx += p.vx
      sumVy += p.vy
      sumVort += (p.x * p.vy - p.y * p.vx)
      const dist = Math.sqrt(p.x * p.x + p.y * p.y)
      sumDistCenter += dist
      if (dist < half * 0.3) nearCenterCount++

      const { gx, gy } = computeChladniGradient(p.x, p.y, this.modes, half)
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
  }
}
