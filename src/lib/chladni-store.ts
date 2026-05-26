import { create } from 'zustand'
import {
  OscillatorConfig,
  SimulationConfig,
  Preset,
  createDefaultOscillator,
  createDefaultSimulation,
  computeModesFromFrequency,
  BUILTIN_PRESETS,
} from './chladni-physics'

interface ChladniState {
  oscillators: OscillatorConfig[]
  simulation: SimulationConfig
  isPlaying: boolean
  masterVolume: number
  showControls: boolean
  presets: Preset[]

  micEnabled: boolean
  audioFileName: string | null
  audioFileEnabled: boolean
  audioFileData: ArrayBuffer | null
  externalFrequencies: number[]

  addOscillator: () => void
  removeOscillator: (id: string) => void
  updateOscillator: (id: string, updates: Partial<OscillatorConfig>) => void

  updateSimulation: (updates: Partial<SimulationConfig>) => void

  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
  setMasterVolume: (volume: number) => void
  setShowControls: (show: boolean) => void

  setMicEnabled: (enabled: boolean) => void
  setAudioFile: (fileName: string | null, fileData?: ArrayBuffer | null) => void
  setAudioFileEnabled: (enabled: boolean) => void
  setExternalFrequencies: (freqs: number[]) => void

  savePreset: (name: string) => void
  loadPreset: (id: string) => void
  deletePreset: (id: string) => void

  resetSimulation: () => void
}

export const useChladniStore = create<ChladniState>((set, get) => ({
  oscillators: [{ ...createDefaultOscillator('osc-1') }],
  simulation: createDefaultSimulation(),
  isPlaying: false,
  masterVolume: 0.3,
  showControls: true,
  presets: BUILTIN_PRESETS,

  micEnabled: false,
  audioFileName: null,
  audioFileEnabled: false,
  audioFileData: null,
  externalFrequencies: [],

  addOscillator: () => {
    const id = `osc-${Date.now()}`
    set((s) => ({
      oscillators: [...s.oscillators, createDefaultOscillator(id)],
    }))
  },

  removeOscillator: (id) => {
    set((s) => ({
      oscillators: s.oscillators.filter((o) => o.id !== id),
    }))
  },

  updateOscillator: (id, updates) => {
    set((s) => {
      let merged = { ...updates }
      if (updates.frequency !== undefined) {
        const { modeM, modeN } = computeModesFromFrequency(updates.frequency)
        merged = { ...merged, modeM, modeN }
      }
      return {
        oscillators: s.oscillators.map((o) =>
          o.id === id ? { ...o, ...merged } : o
        ),
      }
    })
  },

  updateSimulation: (updates) => {
    set((s) => ({
      simulation: { ...s.simulation, ...updates },
    }))
  },

  setPlaying: (playing) => set({ isPlaying: playing }),
  togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setMasterVolume: (volume) => set({ masterVolume: volume }),
  setShowControls: (show) => set({ showControls: show }),

  setMicEnabled: (enabled) => set((s) => ({
    micEnabled: enabled,
    audioFileEnabled: enabled ? false : s.audioFileEnabled,
  })),
  setAudioFile: (fileName, fileData) => set((s) => ({
    audioFileName: fileName,
    audioFileData: fileData ?? null,
    audioFileEnabled: fileName !== null,
    micEnabled: false,
    oscillators: fileName !== null
      ? s.oscillators.map((o) => ({ ...o, enabled: false }))
      : s.oscillators,
  })),
  setAudioFileEnabled: (enabled) => set((s) => ({
    audioFileEnabled: enabled,
    micEnabled: false,
    oscillators: enabled
      ? s.oscillators.map((o) => ({ ...o, enabled: false }))
      : s.oscillators,
  })),
  setExternalFrequencies: (freqs) => set({ externalFrequencies: freqs }),

  savePreset: (name) => {
    const { oscillators, simulation } = get()
    const preset: Preset = {
      id: `preset-${Date.now()}`,
      name,
      oscillators: oscillators.map((o, i) => ({ ...o, id: `osc-${i}` })),
      simulation,
    }
    set((s) => ({ presets: [...s.presets, preset] }))
  },

  loadPreset: (id) => {
    const preset = get().presets.find((p) => p.id === id)
    if (!preset) return
    set({
      oscillators: preset.oscillators.map((o, i) => ({ ...o, id: `osc-${i}` })),
      simulation: { ...createDefaultSimulation(), ...preset.simulation },
    })
  },

  deletePreset: (id) => {
    set((s) => ({ presets: s.presets.filter((p) => p.id !== id) }))
  },

  resetSimulation: () => {
    set({
      oscillators: [{ ...createDefaultOscillator('osc-1') }],
      simulation: createDefaultSimulation(),
      isPlaying: false,
      micEnabled: false,
      audioFileName: null,
      audioFileEnabled: false,
      audioFileData: null,
      externalFrequencies: [],
    })
  },
}))
