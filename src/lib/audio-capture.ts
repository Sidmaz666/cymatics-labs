export class AudioCapture {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | AudioBufferSourceNode | null = null
  private stream: MediaStream | null = null
  private rafId: number | null = null
  private onFrequencies: (freqs: number[]) => void
  private bufferSource: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null

  constructor(onFrequencies: (freqs: number[]) => void) {
    this.onFrequencies = onFrequencies
  }

  async startMic(): Promise<void> {
    this.stop()

    this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.7

    this.source = this.ctx.createMediaStreamSource(this.stream)
    this.source.connect(this.analyser)

    this.startLoop()
  }

  async startFile(file: File): Promise<void> {
    this.stop()

    this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') await this.ctx.resume()

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.7

    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer)

    this.gainNode = this.ctx.createGain()
    this.gainNode.gain.value = 0

    this.bufferSource = this.ctx.createBufferSource()
    this.bufferSource.buffer = audioBuffer
    this.bufferSource.loop = true
    this.bufferSource.connect(this.analyser)
    this.analyser.connect(this.gainNode)
    this.bufferSource.start()

    this.startLoop()
  }

  private startLoop(): void {
    const poll = () => {
      if (!this.analyser) return
      const freqs = extractDominantFrequencies(this.analyser, 5)
      this.onFrequencies(freqs)
      this.rafId = requestAnimationFrame(poll)
    }
    poll()
  }

  stop(): void {
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
    this.onFrequencies([])
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
