import { useChladniStore } from './chladni-store'

class AudioCaptureManager {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private stream: MediaStream | null = null
  private rafId: number | null = null
  private bufferSource: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private _active: 'mic' | 'file' | null = null
  private decodedBuffer: AudioBuffer | null = null
  private _hasFile = false

  get active(): 'mic' | 'file' | null {
    return this._active
  }

  get hasFile(): boolean {
    return this._hasFile
  }

  /** Call synchronously inside a user-gesture handler to ensure AudioContext runs. */
  initContext(): void {
    if (this.ctx) {
      if (this.ctx.state === 'closed') this.ctx = null
      else return
    }
    this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  /** Load an audio file: decode and store the buffer. Does NOT start playback. */
  async loadFile(buffer: ArrayBuffer): Promise<void> {
    this.stop()
    if (!this.ctx) this.initContext()
    this.decodedBuffer = await this.ctx!.decodeAudioData(buffer.slice(0))
    this._hasFile = true
    this._active = 'file'
  }

  /** Start playback of the loaded audio file. Creates audio graph and FFT loop. */
  startPlayback(): void {
    if (!this.decodedBuffer || this._active !== 'file') return

    this.analyser = this.ctx!.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.7

    this.gainNode = this.ctx!.createGain()
    this.gainNode.gain.value = useChladniStore.getState().masterVolume

    this.bufferSource = this.ctx!.createBufferSource()
    this.bufferSource.buffer = this.decodedBuffer
    this.bufferSource.loop = true
    this.bufferSource.connect(this.analyser)
    this.analyser.connect(this.gainNode)
    this.gainNode.connect(this.ctx!.destination)
    this.bufferSource.start()
    this.startLoop()
  }

  /** Stop playback: disconnect nodes and stop FFT loop. Keeps decoded buffer for replay. */
  stopPlayback(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.bufferSource) {
      try { this.bufferSource.stop() } catch { /* */ }
      this.bufferSource.disconnect()
      this.bufferSource = null
    }
    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }
    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }
    useChladniStore.getState().setExternalFrequencies([])
  }

  async startMic(): Promise<void> {
    this.stop()
    if (!this.ctx) this.initContext()

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    this.analyser = this.ctx!.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.7

    this.source = this.ctx!.createMediaStreamSource(this.stream)
    this.source.connect(this.analyser)
    this._active = 'mic'
    this.startLoop()
  }

  private startLoop(): void {
    const poll = () => {
      if (!this.analyser) return
      const freqs = extractDominantFrequencies(this.analyser, 5)
      const store = useChladniStore.getState()
      if (this.gainNode) {
        this.gainNode.gain.value = store.masterVolume
      }
      const prev = store.externalFrequencies
      if (freqs.length !== prev.length || freqs.some((f, i) => f !== prev[i])) {
        store.setExternalFrequencies(freqs)
      }
      this.rafId = requestAnimationFrame(poll)
    }
    poll()
  }

  /** Full stop: stops playback and mic capture. Keeps decoded buffer for replay. */
  stop(): void {
    this.stopPlayback()
    if (this.source && this.source instanceof MediaStreamAudioSourceNode) {
      this.source.disconnect()
    }
    this.source = null
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
    this._active = null
  }

  /** Full cleanup including AudioContext and decoded buffer. Used only on unmount. */
  cleanup(): void {
    this.stop()
    this.decodedBuffer = null
    this._hasFile = false
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}

function extractDominantFrequencies(analyser: AnalyserNode, count: number): number[] {
  const bufferLength = analyser.frequencyBinCount
  const data = new Float32Array(bufferLength)
  analyser.getFloatFrequencyData(data)

  const sampleRate = analyser.context.sampleRate
  const nyquist = sampleRate / 2

  const peaks: { freq: number; amp: number }[] = []

  for (let bin = 1; bin < bufferLength - 1; bin++) {
    if (data[bin] > data[bin - 1] && data[bin] > data[bin + 1] && data[bin] > -80) {
      const freq = (bin / bufferLength) * nyquist
      if (freq >= 20 && freq <= 4000) {
        peaks.push({ freq, amp: data[bin] })
      }
    }
  }

  peaks.sort((a, b) => b.amp - a.amp)
  return peaks.slice(0, count).map((p) => Math.round(p.freq))
}

let instance: AudioCaptureManager | null = null

export function getAudioCapture(): AudioCaptureManager {
  if (!instance) instance = new AudioCaptureManager()
  return instance
}

export function destroyAudioCapture(): void {
  if (instance) {
    instance.cleanup()
    instance = null
  }
}
