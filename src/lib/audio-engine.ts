import { OscillatorConfig } from './chladni-physics'

interface OscillatorNodeData {
  oscillator: OscillatorNode
  gainNode: GainNode
  config: OscillatorConfig
}

export class ChladniAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private analyserNode: AnalyserNode | null = null
  private oscillators: Map<string, OscillatorNodeData> = new Map()
  private _isActive = false
  private pendingQueue: OscillatorConfig[] = []
  private masterVolumeValue = 0.3

  get isActive(): boolean {
    return this._isActive
  }

  async init(): Promise<void> {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this.masterVolumeValue

    this.analyserNode = this.ctx.createAnalyser()
    this.analyserNode.fftSize = 2048
    this.analyserNode.smoothingTimeConstant = 0.8

    this.masterGain.connect(this.analyserNode)
    this.analyserNode.connect(this.ctx.destination)

    for (const config of this.pendingQueue) {
      this.createOscillatorNode(config)
    }
    this.pendingQueue = []
  }

  setMasterVolume(v: number): void {
    this.masterVolumeValue = v
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02)
    }
  }

  addOscillator(config: OscillatorConfig): void {
    if (!this.ctx || !this.masterGain) {
      this.pendingQueue.push({ ...config })
      return
    }
    if (this.oscillators.has(config.id)) {
      this.updateOscillator(config.id, config)
      return
    }
    this.createOscillatorNode(config)
  }

  private createOscillatorNode(config: OscillatorConfig): void {
    if (!this.ctx || !this.masterGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = config.waveform
    osc.frequency.value = config.frequency
    osc.detune.value = config.detune
    gain.gain.value = config.enabled ? config.amplitude : 0

    osc.connect(gain)
    gain.connect(this.masterGain)

    this.oscillators.set(config.id, { oscillator: osc, gainNode: gain, config })
    if (this._isActive) osc.start()
  }

  syncOscillators(configs: OscillatorConfig[]): void {
    const currentIds = new Set(configs.map((c) => c.id))
    const existingIds = new Set(this.oscillators.keys())

    for (const config of configs) {
      if (!existingIds.has(config.id)) {
        this.addOscillator(config)
      } else {
        this.updateOscillator(config.id, config)
      }
    }

    for (const id of existingIds) {
      if (!currentIds.has(id)) this.removeOscillator(id)
    }
  }

  updateOscillator(id: string, updates: Partial<OscillatorConfig>): void {
    const data = this.oscillators.get(id)
    if (!data || !this.ctx) return

    const { oscillator, gainNode, config } = data
    const next = { ...config, ...updates }
    const now = this.ctx.currentTime

    if (updates.waveform !== undefined) oscillator.type = updates.waveform
    if (updates.frequency !== undefined) oscillator.frequency.setTargetAtTime(updates.frequency, now, 0.02)
    if (updates.detune !== undefined) oscillator.detune.setTargetAtTime(updates.detune, now, 0.02)
    if ((updates.amplitude !== undefined || updates.enabled !== undefined) && this._isActive) {
      const amp = (updates.enabled ?? config.enabled) ? (updates.amplitude ?? config.amplitude) : 0
      gainNode.gain.setTargetAtTime(amp, now, 0.02)
    }

    data.config = next
  }

  removeOscillator(id: string): void {
    const data = this.oscillators.get(id)
    if (!data) return
    try { data.oscillator.stop() } catch { /* already stopped */ }
    data.oscillator.disconnect()
    data.gainNode.disconnect()
    this.oscillators.delete(id)
  }

  start(): void {
    if (!this.ctx || this._isActive) return
    if (this.ctx.state === 'suspended') this.ctx.resume()

    const now = this.ctx.currentTime
    for (const { oscillator, gainNode, config } of this.oscillators.values()) {
      try { oscillator.start() } catch { /* already started */ }
      const amp = config.enabled ? config.amplitude : 0
      gainNode.gain.setTargetAtTime(amp, now, 0.02)
    }
    this._isActive = true
  }

  stop(): void {
    if (!this.ctx || !this._isActive) return
    const now = this.ctx.currentTime
    for (const { gainNode } of this.oscillators.values()) {
      gainNode.gain.setTargetAtTime(0, now, 0.02)
    }
    this._isActive = false
  }

  getFrequencyData(): Float32Array {
    if (!this.analyserNode) return new Float32Array(0)
    const data = new Float32Array(this.analyserNode.frequencyBinCount)
    this.analyserNode.getFloatFrequencyData(data)
    return data
  }

  getActiveModes(): Array<{ m: number; n: number; amplitude: number; frequency: number }> {
    const modes: Array<{ m: number; n: number; amplitude: number; frequency: number }> = []
    for (const { config } of this.oscillators.values()) {
      if (config.enabled) {
        modes.push({ m: config.modeM, n: config.modeN, amplitude: config.amplitude, frequency: config.frequency })
      }
    }
    return modes
  }

  destroy(): void {
    this.stop()
    for (const { oscillator, gainNode } of this.oscillators.values()) {
      try { oscillator.stop() } catch { /* already stopped */ }
      oscillator.disconnect()
      gainNode.disconnect()
    }
    this.oscillators.clear()
    this.pendingQueue = []
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
    this._isActive = false
  }
}

let instance: ChladniAudioEngine | null = null

export function getAudioEngine(): ChladniAudioEngine {
  if (!instance) instance = new ChladniAudioEngine()
  return instance
}

export function destroyAudioEngine(): void {
  if (instance) {
    instance.destroy()
    instance = null
  }
}
