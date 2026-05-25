import { OscillatorConfig } from './chladni-store';

export class ChladniAudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private oscillators: Map<string, {
    oscillator: OscillatorNode;
    gainNode: GainNode;
    config: OscillatorConfig;
  }> = new Map();
  private frequencyData: Float32Array = new Float32Array(0);
  private isActive = false;

  async initialize(): Promise<void> {
    if (this.audioContext) return;
    
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    this.frequencyData = new Float32Array(this.analyser.frequencyBinCount);
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(volume, this.audioContext!.currentTime, 0.01);
    }
  }

  addOscillator(config: OscillatorConfig): void {
    if (!this.audioContext || !this.masterGain) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = config.waveform;
    oscillator.frequency.setTargetAtTime(config.frequency, this.audioContext.currentTime, 0.01);
    oscillator.detune.setTargetAtTime(config.detune, this.audioContext.currentTime, 0.01);
    
    gainNode.gain.setTargetAtTime(config.enabled ? config.amplitude : 0, this.audioContext.currentTime, 0.01);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    this.oscillators.set(config.id, { oscillator, gainNode, config });
    
    if (this.isActive) {
      oscillator.start();
    }
  }

  updateOscillator(id: string, updates: Partial<OscillatorConfig>): void {
    const oscData = this.oscillators.get(id);
    if (!oscData || !this.audioContext) return;
    
    const { oscillator, gainNode, config } = oscData;
    const newConfig = { ...config, ...updates };
    
    if (updates.waveform !== undefined) {
      oscillator.type = updates.waveform;
    }
    if (updates.frequency !== undefined) {
      oscillator.frequency.setTargetAtTime(updates.frequency, this.audioContext.currentTime, 0.01);
    }
    if (updates.detune !== undefined) {
      oscillator.detune.setTargetAtTime(updates.detune, this.audioContext.currentTime, 0.01);
    }
    if (updates.amplitude !== undefined || updates.enabled !== undefined) {
      const amp = (updates.enabled ?? config.enabled) ? (updates.amplitude ?? config.amplitude) : 0;
      gainNode.gain.setTargetAtTime(amp, this.audioContext.currentTime, 0.01);
    }
    
    this.oscillators.set(id, { oscillator, gainNode, config: newConfig });
  }

  removeOscillator(id: string): void {
    const oscData = this.oscillators.get(id);
    if (oscData) {
      oscData.oscillator.stop();
      oscData.oscillator.disconnect();
      oscData.gainNode.disconnect();
      this.oscillators.delete(id);
    }
  }

  start(): void {
    if (!this.audioContext || this.isActive) return;
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.oscillators.forEach(({ oscillator }) => {
      try {
        oscillator.start();
      } catch {
        // Oscillator already started
      }
    });
    
    this.isActive = true;
  }

  stop(): void {
    if (!this.audioContext || !this.isActive) return;
    
    this.oscillators.forEach(({ oscillator, gainNode }) => {
      gainNode.gain.setTargetAtTime(0, this.audioContext!.currentTime, 0.01);
    });
    
    this.isActive = false;
  }

  getFrequencyData(): Float32Array {
    if (!this.analyser) return this.frequencyData;
    this.analyser.getFloatFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  getTimeDomainData(): Float32Array {
    if (!this.analyser) return new Float32Array(0);
    const data = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(data);
    return data;
  }

  getActiveModes(): Array<{ m: number; n: number; amplitude: number; frequency: number }> {
    const modes: Array<{ m: number; n: number; amplitude: number; frequency: number }> = [];
    
    this.oscillators.forEach(({ config }) => {
      if (config.enabled) {
        modes.push({
          m: config.modeM,
          n: config.modeN,
          amplitude: config.amplitude,
          frequency: config.frequency,
        });
      }
    });
    
    return modes;
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate ?? 44100;
  }

  destroy(): void {
    this.stop();
    this.oscillators.forEach(({ oscillator, gainNode }) => {
      oscillator.disconnect();
      gainNode.disconnect();
    });
    this.oscillators.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
let audioEngineInstance: ChladniAudioEngine | null = null;

export function getAudioEngine(): ChladniAudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new ChladniAudioEngine();
  }
  return audioEngineInstance;
}
