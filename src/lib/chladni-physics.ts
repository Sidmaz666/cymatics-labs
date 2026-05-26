export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle'

export type ColorScheme = 'classic' | 'rainbow' | 'heat' | 'ocean' | 'neon' | 'custom'

export interface OscillatorConfig {
  id: string
  enabled: boolean
  frequency: number
  amplitude: number
  modeM: number
  modeN: number
  phase: number
  waveform: OscillatorType
  detune: number
}

export interface SimulationConfig {
  particleCount: number
  particleSize: number
  dampingFactor: number
  noiseAmount: number
  speedMultiplier: number
  plateSize: number
  vibrationIntensity: number
  colorScheme: ColorScheme
  glowIntensity: number
  contrastBoost: number
  brightness: number
  showFieldOverlay: boolean
  customPrimary: string
  customSecondary: string
  backgroundColor: string
}

export interface Preset {
  id: string
  name: string
  oscillators: OscillatorConfig[]
  simulation: Partial<SimulationConfig>
}

export interface ModeInput {
  m: number
  n: number
  amplitude: number
}

export function applyWaveformToGradient(
  gx: number,
  gy: number,
  waveform: OscillatorType
): { gx: number; gy: number } {
  switch (waveform) {
    case 'sine':
      return { gx, gy }
    case 'square': {
      const mag = Math.sqrt(gx * gx + gy * gy)
      if (mag < 1e-10) return { gx: 0, gy: 0 }
      const factor = Math.min(0.08, mag) / mag
      return { gx: gx * factor, gy: gy * factor }
    }
    case 'sawtooth': {
      return { gx: gx + gy * 0.35, gy: gy - gx * 0.35 }
    }
    case 'triangle': {
      const mag = Math.sqrt(gx * gx + gy * gy)
      const squash = Math.sqrt(mag) / (mag + 0.001)
      return { gx: gx * squash, gy: gy * squash }
    }
  }
}

export function computeChladniField(
  x: number,
  y: number,
  modes: ModeInput[],
  plateSize: number
): number {
  const nx = (x / plateSize) * Math.PI
  const ny = (y / plateSize) * Math.PI

  let z = 0

  for (const mode of modes) {
    const term1 = Math.cos(mode.m * nx) * Math.cos(mode.n * ny)
    const term2 = Math.cos(mode.n * nx) * Math.cos(mode.m * ny)
    z += mode.amplitude * (term1 - term2)
  }

  return z
}

export function computeChladniGradient(
  x: number,
  y: number,
  modes: ModeInput[],
  plateSize: number
): { gx: number; gy: number } {
  const eps = 0.0001

  const zx_plus = computeChladniField(x + eps, y, modes, plateSize)
  const zx_minus = computeChladniField(x - eps, y, modes, plateSize)
  const zy_plus = computeChladniField(x, y + eps, modes, plateSize)
  const zy_minus = computeChladniField(x, y - eps, modes, plateSize)
  const z = computeChladniField(x, y, modes, plateSize)

  const dzdx = (zx_plus - zx_minus) / (2 * eps)
  const dzdy = (zy_plus - zy_minus) / (2 * eps)

  return {
    gx: -2 * z * dzdx,
    gy: -2 * z * dzdy,
  }
}

export function computeModesFromFrequency(freq: number): { modeM: number; modeN: number } {
  const ratio = Math.sqrt(freq / 220)
  return {
    modeM: Math.max(1, Math.min(20, Math.round(ratio * 3))),
    modeN: Math.max(1, Math.min(20, Math.round(ratio * 5))),
  }
}

export const FREQUENCY_PRESETS = [55, 110, 220, 330, 440, 660, 880]

export const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: 'classic', label: 'Classic Sand' },
  { value: 'rainbow', label: 'Rainbow' },
  { value: 'heat', label: 'Heat Map' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'neon', label: 'Neon' },
  { value: 'custom', label: 'Custom' },
]

export function createDefaultOscillator(id: string): OscillatorConfig {
  return {
    id,
    enabled: true,
    frequency: 220,
    amplitude: 1.0,
    modeM: 3,
    modeN: 5,
    phase: 0,
    waveform: 'sine',
    detune: 0,
  }
}

export function createDefaultSimulation(): SimulationConfig {
  return {
    particleCount: 50000,
    particleSize: 2.0,
    dampingFactor: 0.98,
    noiseAmount: 0.15,
    speedMultiplier: 1.0,
    plateSize: 2.0,
    vibrationIntensity: 1.0,
    colorScheme: 'classic',
    glowIntensity: 0.3,
    contrastBoost: 0.0,
    brightness: 1.0,
    showFieldOverlay: false,
    customPrimary: '#00ff88',
    customSecondary: '#ff0066',
    backgroundColor: '#0a0a0f',
  }
}

export const BUILTIN_PRESETS: Preset[] = [
  // ═══ SACRED GEOMETRY & YANTRA ═══
  {
    id: 'preset-1',
    name: 'Bindu — The Seed',
    oscillators: [{ ...createDefaultOscillator('osc-1'), modeM: 1, modeN: 2, frequency: 55, amplitude: 1.0 }],
    simulation: { colorScheme: 'classic', vibrationIntensity: 1.5, dampingFactor: 0.97, noiseAmount: 0.08 },
  },
  {
    id: 'preset-2',
    name: 'Sri Yantra',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 3, frequency: 110, amplitude: 1.0 },
      { ...createDefaultOscillator('osc-2'), modeM: 3, modeN: 2, frequency: 137.5, amplitude: 0.8 },
      { ...createDefaultOscillator('osc-3'), modeM: 2, modeN: 5, frequency: 165, amplitude: 0.5 },
      { ...createDefaultOscillator('osc-4'), modeM: 5, modeN: 2, frequency: 192.5, amplitude: 0.4 },
    ],
    simulation: { particleCount: 90000, colorScheme: 'neon', vibrationIntensity: 1.2, glowIntensity: 0.7, speedMultiplier: 0.8 },
  },
  {
    id: 'preset-3',
    name: 'Mandala — Sacred Circle',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 1, modeN: 2, frequency: 82.5, amplitude: 0.5 },
      { ...createDefaultOscillator('osc-2'), modeM: 2, modeN: 3, frequency: 165, amplitude: 0.7 },
      { ...createDefaultOscillator('osc-3'), modeM: 3, modeN: 4, frequency: 247.5, amplitude: 0.8 },
      { ...createDefaultOscillator('osc-4'), modeM: 4, modeN: 5, frequency: 330, amplitude: 0.6 },
      { ...createDefaultOscillator('osc-5'), modeM: 5, modeN: 6, frequency: 440, amplitude: 0.4 },
    ],
    simulation: { particleCount: 100000, colorScheme: 'rainbow', glowIntensity: 0.5, brightness: 1.1, dampingFactor: 0.97 },
  },
  {
    id: 'preset-4',
    name: 'Padma — Lotus Unfolding',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 1, modeN: 4, frequency: 110, amplitude: 1.0 },
      { ...createDefaultOscillator('osc-2'), modeM: 4, modeN: 1, frequency: 165, amplitude: 0.7 },
      { ...createDefaultOscillator('osc-3'), modeM: 2, modeN: 5, frequency: 220, amplitude: 0.5 },
      { ...createDefaultOscillator('osc-4'), modeM: 5, modeN: 2, frequency: 275, amplitude: 0.3 },
    ],
    simulation: { particleCount: 80000, colorScheme: 'neon', glowIntensity: 0.8, vibrationIntensity: 1.1, speedMultiplier: 0.7 },
  },
  {
    id: 'preset-5',
    name: 'Pranava — Sacred Om',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 3, frequency: 110, amplitude: 0.6 },
      { ...createDefaultOscillator('osc-2'), modeM: 3, modeN: 5, frequency: 220, amplitude: 1.0 },
      { ...createDefaultOscillator('osc-3'), modeM: 4, modeN: 6, frequency: 330, amplitude: 0.5 },
    ],
    simulation: { particleCount: 75000, colorScheme: 'classic', glowIntensity: 0.4, vibrationIntensity: 1.3, dampingFactor: 0.98 },
  },
  {
    id: 'preset-6',
    name: 'Swastika — Auspicious Cross',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 5, frequency: 137.5, amplitude: 1.0 },
      { ...createDefaultOscillator('osc-2'), modeM: 5, modeN: 2, frequency: 165, amplitude: 0.8 },
      { ...createDefaultOscillator('osc-3'), modeM: 3, modeN: 7, frequency: 220, amplitude: 0.5 },
      { ...createDefaultOscillator('osc-4'), modeM: 7, modeN: 3, frequency: 275, amplitude: 0.4 },
    ],
    simulation: { particleCount: 85000, colorScheme: 'heat', glowIntensity: 0.6, vibrationIntensity: 1.4, noiseAmount: 0.1 },
  },
  {
    id: 'preset-7',
    name: 'Sahasrara — Crown Chakra',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 4, frequency: 110, amplitude: 0.7 },
      { ...createDefaultOscillator('osc-2'), modeM: 3, modeN: 5, frequency: 165, amplitude: 1.0 },
      { ...createDefaultOscillator('osc-3'), modeM: 4, modeN: 6, frequency: 220, amplitude: 0.7 },
      { ...createDefaultOscillator('osc-4'), modeM: 5, modeN: 7, frequency: 275, amplitude: 0.5 },
    ],
    simulation: { particleCount: 100000, colorScheme: 'rainbow', glowIntensity: 0.9, brightness: 1.2, speedMultiplier: 0.7 },
  },
  {
    id: 'preset-8',
    name: 'Trishula — Divine Trident',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 1, modeN: 3, frequency: 110, amplitude: 1.0 },
      { ...createDefaultOscillator('osc-2'), modeM: 3, modeN: 1, frequency: 165, amplitude: 0.7 },
      { ...createDefaultOscillator('osc-3'), modeM: 2, modeN: 5, frequency: 220, amplitude: 0.5 },
    ],
    simulation: { particleCount: 70000, colorScheme: 'neon', glowIntensity: 0.7, vibrationIntensity: 1.5, dampingFactor: 0.97 },
  },
  {
    id: 'preset-9',
    name: 'Navagraha — Celestial Orbits',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 3, frequency: 110, amplitude: 0.8 },
      { ...createDefaultOscillator('osc-2'), modeM: 3, modeN: 5, frequency: 220, amplitude: 0.6 },
      { ...createDefaultOscillator('osc-3'), modeM: 4, modeN: 7, frequency: 440, amplitude: 0.4 },
    ],
    simulation: { particleCount: 80000, colorScheme: 'ocean', glowIntensity: 0.6, brightness: 1.0, speedMultiplier: 0.9 },
  },
  {
    id: 'preset-10',
    name: 'Kubera Yantra — Abundance',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 3, modeN: 4, frequency: 165, amplitude: 1.0 },
      { ...createDefaultOscillator('osc-2'), modeM: 4, modeN: 3, frequency: 192.5, amplitude: 0.8 },
      { ...createDefaultOscillator('osc-3'), modeM: 3, modeN: 6, frequency: 247.5, amplitude: 0.6 },
      { ...createDefaultOscillator('osc-4'), modeM: 6, modeN: 3, frequency: 275, amplitude: 0.4 },
      { ...createDefaultOscillator('osc-5'), modeM: 4, modeN: 7, frequency: 330, amplitude: 0.3 },
    ],
    simulation: { particleCount: 90000, colorScheme: 'heat', glowIntensity: 0.7, brightness: 1.1, vibrationIntensity: 1.1 },
  },

  // ═══ SONIC & HARMONIC PATTERNS ═══
  {
    id: 'preset-11',
    name: 'Fundamental — Pure Tone',
    oscillators: [{ ...createDefaultOscillator('osc-1'), modeM: 1, modeN: 2, frequency: 55, amplitude: 1.0, waveform: 'sine' }],
    simulation: { particleCount: 50000, colorScheme: 'classic', vibrationIntensity: 1.5, noiseAmount: 0.05 },
  },
  {
    id: 'preset-12',
    name: 'Perfect Octave — 1:2',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 3, frequency: 110, amplitude: 1.0, waveform: 'sine' },
      { ...createDefaultOscillator('osc-2'), modeM: 3, modeN: 5, frequency: 220, amplitude: 0.6, waveform: 'sine' },
    ],
    simulation: { particleCount: 70000, colorScheme: 'classic', vibrationIntensity: 1.2, brightness: 1.1 },
  },
  {
    id: 'preset-13',
    name: 'Perfect Fifth — 2:3',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 3, modeN: 5, frequency: 220, amplitude: 1.0, waveform: 'sine' },
      { ...createDefaultOscillator('osc-2'), modeM: 4, modeN: 6, frequency: 330, amplitude: 0.7, waveform: 'sine' },
    ],
    simulation: { particleCount: 75000, colorScheme: 'ocean', glowIntensity: 0.5, vibrationIntensity: 1.3 },
  },
  {
    id: 'preset-14',
    name: 'Major Triad — 4:5:6',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 3, modeN: 5, frequency: 220, amplitude: 1.0, waveform: 'sine' },
      { ...createDefaultOscillator('osc-2'), modeM: 4, modeN: 6, frequency: 275, amplitude: 0.6, waveform: 'sine' },
      { ...createDefaultOscillator('osc-3'), modeM: 4, modeN: 7, frequency: 330, amplitude: 0.4, waveform: 'sine' },
    ],
    simulation: { particleCount: 80000, colorScheme: 'rainbow', glowIntensity: 0.6, vibrationIntensity: 1.1 },
  },
  {
    id: 'preset-15',
    name: 'Harmonic Series 1-2-3-4',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 3, frequency: 110, amplitude: 1.0, waveform: 'sine' },
      { ...createDefaultOscillator('osc-2'), modeM: 3, modeN: 5, frequency: 220, amplitude: 0.7, waveform: 'sine' },
      { ...createDefaultOscillator('osc-3'), modeM: 4, modeN: 6, frequency: 330, amplitude: 0.5, waveform: 'sine' },
      { ...createDefaultOscillator('osc-4'), modeM: 5, modeN: 7, frequency: 440, amplitude: 0.3, waveform: 'sine' },
    ],
    simulation: { particleCount: 100000, colorScheme: 'heat', glowIntensity: 0.5, brightness: 1.1, dampingFactor: 0.97 },
  },
  {
    id: 'preset-16',
    name: 'Resonance Cascade',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 3, frequency: 110, amplitude: 0.5, waveform: 'sine' },
      { ...createDefaultOscillator('osc-2'), modeM: 3, modeN: 5, frequency: 220, amplitude: 0.7, waveform: 'sine' },
      { ...createDefaultOscillator('osc-3'), modeM: 4, modeN: 7, frequency: 440, amplitude: 0.6, waveform: 'sine' },
      { ...createDefaultOscillator('osc-4'), modeM: 6, modeN: 10, frequency: 880, amplitude: 0.4, waveform: 'sine' },
    ],
    simulation: { particleCount: 100000, colorScheme: 'neon', glowIntensity: 0.8, speedMultiplier: 0.8, vibrationIntensity: 1.2 },
  },
  {
    id: 'preset-17',
    name: 'Dissonant Interference',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 3, modeN: 5, frequency: 220, amplitude: 1.0, waveform: 'sawtooth' },
      { ...createDefaultOscillator('osc-2'), modeM: 5, modeN: 3, frequency: 286, amplitude: 0.5, waveform: 'sawtooth' },
      { ...createDefaultOscillator('osc-3'), modeM: 4, modeN: 7, frequency: 440, amplitude: 0.4, waveform: 'sawtooth' },
    ],
    simulation: { particleCount: 85000, colorScheme: 'heat', glowIntensity: 0.6, vibrationIntensity: 1.6, noiseAmount: 0.2 },
  },
  {
    id: 'preset-18',
    name: 'Subharmonic Bass',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 1, modeN: 2, frequency: 55, amplitude: 1.0, waveform: 'triangle' },
      { ...createDefaultOscillator('osc-2'), modeM: 2, modeN: 3, frequency: 82.5, amplitude: 0.8, waveform: 'triangle' },
      { ...createDefaultOscillator('osc-3'), modeM: 2, modeN: 4, frequency: 110, amplitude: 0.6, waveform: 'triangle' },
    ],
    simulation: { particleCount: 60000, particleSize: 3.0, colorScheme: 'heat', vibrationIntensity: 2.0, speedMultiplier: 0.6, dampingFactor: 0.97 },
  },
  {
    id: 'preset-19',
    name: 'Standing Wave — Axial',
    oscillators: [{ ...createDefaultOscillator('osc-1'), modeM: 1, modeN: 6, frequency: 165, amplitude: 1.0, waveform: 'sine' }],
    simulation: { particleCount: 60000, colorScheme: 'classic', vibrationIntensity: 1.4, noiseAmount: 0.08, brightness: 1.2 },
  },
  {
    id: 'preset-20',
    name: 'Tritone — Diabolus',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 3, modeN: 5, frequency: 220, amplitude: 1.0, waveform: 'square' },
      { ...createDefaultOscillator('osc-2'), modeM: 3, modeN: 6, frequency: 311, amplitude: 0.6, waveform: 'square' },
    ],
    simulation: { particleCount: 70000, colorScheme: 'neon', glowIntensity: 0.5, vibrationIntensity: 1.5, dampingFactor: 0.96, noiseAmount: 0.15 },
  },

  // ═══ CLASSICAL CHLADNI PATTERNS ═══
  {
    id: 'preset-21',
    name: 'Chladni (1,2)',
    oscillators: [{ ...createDefaultOscillator('osc-1'), modeM: 1, modeN: 2, frequency: 82.5, amplitude: 1.0 }],
    simulation: { particleCount: 50000, colorScheme: 'classic', vibrationIntensity: 1.3 },
  },
  {
    id: 'preset-22',
    name: 'Chladni (2,3)',
    oscillators: [{ ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 3, frequency: 137.5, amplitude: 1.0 }],
    simulation: { particleCount: 50000, colorScheme: 'classic' },
  },
  {
    id: 'preset-23',
    name: 'Chladni (3,5) — Classic',
    oscillators: [{ ...createDefaultOscillator('osc-1'), modeM: 3, modeN: 5, frequency: 220, amplitude: 1.0 }],
    simulation: { particleCount: 50000, colorScheme: 'classic' },
  },
  {
    id: 'preset-24',
    name: 'Chladni (4,7)',
    oscillators: [{ ...createDefaultOscillator('osc-1'), modeM: 4, modeN: 7, frequency: 385, amplitude: 1.0 }],
    simulation: { particleCount: 60000, colorScheme: 'classic', vibrationIntensity: 1.2 },
  },
  {
    id: 'preset-25',
    name: 'Chladni (5,8)',
    oscillators: [{ ...createDefaultOscillator('osc-1'), modeM: 5, modeN: 8, frequency: 550, amplitude: 1.0 }],
    simulation: { particleCount: 70000, colorScheme: 'classic', vibrationIntensity: 1.4 },
  },

  // ═══ COMPLEX & SYMMETRIC ═══
  {
    id: 'preset-26',
    name: 'Symmetric Cross — X Pattern',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 5, frequency: 165, amplitude: 1.0 },
      { ...createDefaultOscillator('osc-2'), modeM: 5, modeN: 2, frequency: 192.5, amplitude: 0.8 },
    ],
    simulation: { particleCount: 75000, colorScheme: 'classic', vibrationIntensity: 1.2, brightness: 1.1 },
  },
  {
    id: 'preset-27',
    name: 'Diamond Lattice',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 6, frequency: 165, amplitude: 1.0 },
      { ...createDefaultOscillator('osc-2'), modeM: 6, modeN: 2, frequency: 192.5, amplitude: 0.7 },
      { ...createDefaultOscillator('osc-3'), modeM: 3, modeN: 7, frequency: 247.5, amplitude: 0.5 },
    ],
    simulation: { particleCount: 80000, colorScheme: 'rainbow', glowIntensity: 0.5, speedMultiplier: 0.8, dampingFactor: 0.97 },
  },
  {
    id: 'preset-28',
    name: 'Tidal Interference',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 8, frequency: 55, amplitude: 1.0, waveform: 'sawtooth' },
      { ...createDefaultOscillator('osc-2'), modeM: 8, modeN: 2, frequency: 110, amplitude: 0.6, waveform: 'sawtooth' },
      { ...createDefaultOscillator('osc-3'), modeM: 3, modeN: 9, frequency: 165, amplitude: 0.4, waveform: 'sawtooth' },
    ],
    simulation: { particleCount: 90000, colorScheme: 'ocean', glowIntensity: 0.7, speedMultiplier: 0.6, noiseAmount: 0.25 },
  },
  {
    id: 'preset-29',
    name: 'Starburst — Radial Rays',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 6, modeN: 1, frequency: 220, amplitude: 0.8 },
      { ...createDefaultOscillator('osc-2'), modeM: 1, modeN: 6, frequency: 330, amplitude: 0.8 },
      { ...createDefaultOscillator('osc-3'), modeM: 8, modeN: 2, frequency: 440, amplitude: 0.5 },
      { ...createDefaultOscillator('osc-4'), modeM: 2, modeN: 8, frequency: 550, amplitude: 0.5 },
    ],
    simulation: { particleCount: 100000, colorScheme: 'neon', glowIntensity: 1.0, brightness: 1.5, vibrationIntensity: 1.2, plateSize: 2.5 },
  },
  {
    id: 'preset-30',
    name: 'Cosmic Web — Many Modes',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 2, modeN: 3, frequency: 110, amplitude: 0.5 },
      { ...createDefaultOscillator('osc-2'), modeM: 3, modeN: 4, frequency: 165, amplitude: 0.6 },
      { ...createDefaultOscillator('osc-3'), modeM: 3, modeN: 5, frequency: 220, amplitude: 0.7 },
      { ...createDefaultOscillator('osc-4'), modeM: 4, modeN: 5, frequency: 275, amplitude: 0.5 },
      { ...createDefaultOscillator('osc-5'), modeM: 4, modeN: 6, frequency: 330, amplitude: 0.4 },
      { ...createDefaultOscillator('osc-6'), modeM: 5, modeN: 7, frequency: 440, amplitude: 0.3 },
    ],
    simulation: { particleCount: 120000, colorScheme: 'neon', glowIntensity: 0.8, brightness: 1.1, dampingFactor: 0.97, speedMultiplier: 0.7 },
  },
  {
    id: 'preset-31',
    name: 'Aurora Nebula',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 3, modeN: 7, frequency: 440, amplitude: 0.7 },
      { ...createDefaultOscillator('osc-2'), modeM: 7, modeN: 3, frequency: 660, amplitude: 0.5 },
      { ...createDefaultOscillator('osc-3'), modeM: 5, modeN: 9, frequency: 880, amplitude: 0.3 },
      { ...createDefaultOscillator('osc-4'), modeM: 9, modeN: 5, frequency: 1100, amplitude: 0.2 },
    ],
    simulation: { particleCount: 120000, colorScheme: 'ocean', glowIntensity: 0.8, brightness: 1.2, speedMultiplier: 0.8 },
  },
  {
    id: 'preset-32',
    name: 'Heavy Grains',
    oscillators: [{ ...createDefaultOscillator('osc-1'), modeM: 5, modeN: 7, frequency: 330, amplitude: 1.0 }],
    simulation: { particleCount: 30000, particleSize: 4.0, colorScheme: 'classic', vibrationIntensity: 1.3 },
  },
  {
    id: 'preset-33',
    name: 'Fine Dust — Snowfall',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 3, modeN: 5, frequency: 220, amplitude: 0.4, waveform: 'triangle' },
      { ...createDefaultOscillator('osc-2'), modeM: 4, modeN: 6, frequency: 330, amplitude: 0.3, waveform: 'triangle' },
    ],
    simulation: { particleCount: 20000, particleSize: 1.0, colorScheme: 'ocean', glowIntensity: 0.1, brightness: 1.8, noiseAmount: 0.5, speedMultiplier: 0.3, dampingFactor: 0.99 },
  },
  {
    id: 'preset-34',
    name: 'Lava Flow — Magma',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 4, modeN: 7, frequency: 165, amplitude: 0.9 },
      { ...createDefaultOscillator('osc-2'), modeM: 7, modeN: 10, frequency: 220, amplitude: 0.6 },
    ],
    simulation: { particleCount: 75000, colorScheme: 'heat', glowIntensity: 0.7, vibrationIntensity: 1.8, dampingFactor: 0.96, noiseAmount: 0.2 },
  },
  {
    id: 'preset-35',
    name: 'Quantum Foam',
    oscillators: [
      { ...createDefaultOscillator('osc-1'), modeM: 9, modeN: 4, frequency: 550, amplitude: 0.7 },
      { ...createDefaultOscillator('osc-2'), modeM: 4, modeN: 9, frequency: 770, amplitude: 0.5 },
      { ...createDefaultOscillator('osc-3'), modeM: 12, modeN: 7, frequency: 990, amplitude: 0.3 },
    ],
    simulation: { particleCount: 85000, colorScheme: 'rainbow', glowIntensity: 0.6, contrastBoost: 0.4, plateSize: 1.8, dampingFactor: 0.97 },
  },
]
