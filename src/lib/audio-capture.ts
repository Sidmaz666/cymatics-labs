import { useChladniStore } from './chladni-store'

class AudioCaptureManager {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | AudioBufferSourceNode | null = null
  private stream: MediaStream | null = null
  private rafId: number | null = null
  private bufferSource: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private _active: 'mic' | 'file' | null = null

  get active(): 'mic' | 'file' | null {
    return this._active
  }

  /** Call synchronously inside a user-gesture handler to ensure AudioContext runs.
   *  Safe to call multiple times; only the first call creates the context. */
  initContext(): void {
    if (this.ctx) return
    this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  async startMic(): Promise<void> {
    this.stop()
    if (!this.ctx) this.ctx = new AudioContext()

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.7

    this.source = this.ctx.createMediaStreamSource(this.stream)
    this.source.connect(this.analyser)
    this._active = 'mic'
    this.startLoop()
  }

  async startFileFromBuffer(buffer: ArrayBuffer, fileName: string): Promise<void> {
    this.stop()
    if (!this.ctx) this.ctx = new AudioContext()

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.7

    const audioBuffer = await this.ctx.decodeAudioData(buffer.slice(0))

    this.gainNode = this.ctx.createGain()
    this.gainNode.gain.value = 0

    this.bufferSource = this.ctx.createBufferSource()
    this.bufferSource.buffer = audioBuffer
    this.bufferSource.loop = true
    this.bufferSource.connect(this.analyser)
    this.analyser.connect(this.gainNode)
    this.bufferSource.start()
    this._active = 'file'
    this.startLoop()
  }

  private startLoop(): void {
    const poll = () => {
      if (!this.analyser) return
      const freqs = extractDominantFrequencies(this.analyser, 5)
      useChladniStore.getState().setExternalFrequencies(freqs)
      this.rafId = requestAnimationFrame(poll)
    }
    poll()
  }

  stop(): void {
    this._active = null
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.bufferSource) {
      try { this.bufferSource.stop() } catch { /* */ }
      this.bufferSource.disconnect()
      this.bufferSource = null
    }
    if (this.source && this.source instanceof MediaStreamAudioSourceNode) {
      this.source.disconnect()
    }
    this.source = null
    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }
    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
    useChladniStore.getState().setExternalFrequencies([])
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
    instance.stop()
    instance = null
  }
}
