import { create } from 'zustand';

export interface OscillatorConfig {
  id: string;
  enabled: boolean;
  frequency: number;
  amplitude: number;
  modeM: number;
  modeN: number;
  phase: number;
  waveform: OscillatorType;
  detune: number;
}

export interface SimulationConfig {
  // Particle settings
  particleCount: number;
  particleSize: number;
  particleDensity: number; // How tightly particles cluster
  particleMass: number; // Affects momentum
  particleTrail: number; // Trail persistence (0-1)
  
  // Physics settings
  dampingFactor: number;
  noiseAmount: number;
  speedMultiplier: number;
  plateSize: number;
  gravity: number; // Downward force
  friction: number; // Surface friction
  bounceCoefficient: number; // Bounciness at boundaries
  
  // Vibration settings
  vibrationIntensity: number; // Overall vibration strength
  vibrationFrequency: number; // Base vibration frequency multiplier
  harmonicStrength: number; // How much harmonics affect the pattern
  
  // Visualization settings
  showFieldVisualization: boolean;
  colorScheme: 'classic' | 'rainbow' | 'heat' | 'ocean' | 'neon';
  glowIntensity: number; // Particle glow effect
  contrastBoost: number; // Visual contrast
  brightness: number; // Overall brightness
  
  // Advanced
  modeMixing: number; // How multiple modes blend (0=separate, 1=blend)
  timeEvolution: number; // Pattern evolution speed
  symmetryLock: boolean; // Force symmetric patterns
}

export interface Preset {
  id: string;
  name: string;
  oscillators: OscillatorConfig[];
  simulation: Partial<SimulationConfig>;
}

interface ChladniState {
  // Oscillators
  oscillators: OscillatorConfig[];
  addOscillator: () => void;
  removeOscillator: (id: string) => void;
  updateOscillator: (id: string, updates: Partial<OscillatorConfig>) => void;
  
  // Simulation
  simulation: SimulationConfig;
  updateSimulation: (updates: Partial<SimulationConfig>) => void;
  
  // Audio state
  isPlaying: boolean;
  masterVolume: number;
  setPlaying: (playing: boolean) => void;
  setMasterVolume: (volume: number) => void;
  
  // Visualization
  showControls: boolean;
  setShowControls: (show: boolean) => void;
  
  // Presets
  presets: Preset[];
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  
  // Reset
  resetSimulation: () => void;
}

const defaultOscillator: Omit<OscillatorConfig, 'id'> = {
  enabled: true,
  frequency: 440,
  amplitude: 1.0,
  modeM: 3,
  modeN: 5,
  phase: 0,
  waveform: 'sine',
  detune: 0,
};

const defaultSimulation: SimulationConfig = {
  // Particle settings
  particleCount: 50000,
  particleSize: 2.0,
  particleDensity: 1.0,
  particleMass: 1.0,
  particleTrail: 0.0,
  
  // Physics settings
  dampingFactor: 0.98,
  noiseAmount: 0.15,
  speedMultiplier: 1.0,
  plateSize: 2.0,
  gravity: 0.0,
  friction: 0.01,
  bounceCoefficient: 0.5,
  
  // Vibration settings
  vibrationIntensity: 1.0,
  vibrationFrequency: 1.0,
  harmonicStrength: 0.5,
  
  // Visualization settings
  showFieldVisualization: false,
  colorScheme: 'classic',
  glowIntensity: 0.3,
  contrastBoost: 0.0,
  brightness: 1.0,
  
  // Advanced
  modeMixing: 0.5,
  timeEvolution: 0.0,
  symmetryLock: false,
};

const builtInPresets: Preset[] = [
  {
    id: 'preset-1',
    name: 'Classic Pattern (3,5)',
    oscillators: [{ id: 'osc-1', ...defaultOscillator, modeM: 3, modeN: 5, frequency: 220 }],
    simulation: { particleCount: 50000 },
  },
  {
    id: 'preset-2',
    name: 'Complex Interference',
    oscillators: [
      { id: 'osc-1', ...defaultOscillator, modeM: 2, modeN: 3, frequency: 220, amplitude: 0.8 },
      { id: 'osc-2', ...defaultOscillator, modeM: 5, modeN: 7, frequency: 330, amplitude: 0.6 },
    ],
    simulation: { particleCount: 80000, modeMixing: 0.7 },
  },
  {
    id: 'preset-3',
    name: 'Symmetric Harmony',
    oscillators: [
      { id: 'osc-1', ...defaultOscillator, modeM: 4, modeN: 4, frequency: 440, amplitude: 1.0 },
      { id: 'osc-2', ...defaultOscillator, modeM: 6, modeN: 6, frequency: 660, amplitude: 0.5 },
      { id: 'osc-3', ...defaultOscillator, modeM: 8, modeN: 8, frequency: 880, amplitude: 0.25 },
    ],
    simulation: { particleCount: 60000, colorScheme: 'rainbow', symmetryLock: true },
  },
  {
    id: 'preset-4',
    name: 'Low Frequency Rumble',
    oscillators: [
      { id: 'osc-1', ...defaultOscillator, modeM: 1, modeN: 2, frequency: 55, amplitude: 1.0, waveform: 'triangle' },
      { id: 'osc-2', ...defaultOscillator, modeM: 2, modeN: 3, frequency: 82.5, amplitude: 0.7, waveform: 'triangle' },
    ],
    simulation: { particleCount: 40000, speedMultiplier: 0.5, vibrationIntensity: 1.5 },
  },
  {
    id: 'preset-5',
    name: 'High Frequency Shimmer',
    oscillators: [
      { id: 'osc-1', ...defaultOscillator, modeM: 7, modeN: 11, frequency: 880, amplitude: 0.8 },
      { id: 'osc-2', ...defaultOscillator, modeM: 11, modeN: 13, frequency: 1320, amplitude: 0.6 },
      { id: 'osc-3', ...defaultOscillator, modeM: 13, modeN: 17, frequency: 1760, amplitude: 0.4 },
    ],
    simulation: { 
      particleCount: 100000, 
      colorScheme: 'neon', 
      glowIntensity: 0.8,
      vibrationIntensity: 0.8,
    },
  },
  {
    id: 'preset-6',
    name: 'Heavy Grains',
    oscillators: [{ id: 'osc-1', ...defaultOscillator, modeM: 5, modeN: 7, frequency: 330 }],
    simulation: { 
      particleCount: 30000, 
      particleSize: 4.0, 
      particleMass: 2.0,
      dampingFactor: 0.95,
      glowIntensity: 0.5,
    },
  },
  {
    id: 'preset-7',
    name: 'Floating Dust',
    oscillators: [
      { id: 'osc-1', ...defaultOscillator, modeM: 3, modeN: 5, frequency: 440, amplitude: 0.6 },
    ],
    simulation: { 
      particleCount: 20000, 
      particleSize: 1.5, 
      particleMass: 0.3,
      noiseAmount: 0.3,
      gravity: 0.001,
      glowIntensity: 0.1,
      brightness: 1.3,
    },
  },
  {
    id: 'preset-8',
    name: 'Intense Vibration',
    oscillators: [
      { id: 'osc-1', ...defaultOscillator, modeM: 4, modeN: 6, frequency: 550, amplitude: 1.2 },
    ],
    simulation: { 
      particleCount: 60000,
      vibrationIntensity: 2.0,
      noiseAmount: 0.25,
      speedMultiplier: 1.5,
      colorScheme: 'heat',
      glowIntensity: 0.6,
    },
  },
];

export const useChladniStore = create<ChladniState>((set, get) => ({
  oscillators: [{ id: 'osc-1', ...defaultOscillator }],
  simulation: defaultSimulation,
  isPlaying: false,
  masterVolume: 0.3,
  showControls: true,
  presets: builtInPresets,

  addOscillator: () => {
    const newId = `osc-${Date.now()}`;
    set((state) => ({
      oscillators: [...state.oscillators, { id: newId, ...defaultOscillator }],
    }));
  },

  removeOscillator: (id) => {
    set((state) => ({
      oscillators: state.oscillators.filter((osc) => osc.id !== id),
    }));
  },

  updateOscillator: (id, updates) => {
    set((state) => ({
      oscillators: state.oscillators.map((osc) =>
        osc.id === id ? { ...osc, ...updates } : osc
      ),
    }));
  },

  updateSimulation: (updates) => {
    set((state) => ({
      simulation: { ...state.simulation, ...updates },
    }));
  },

  setPlaying: (playing) => set({ isPlaying: playing }),
  setMasterVolume: (volume) => set({ masterVolume: volume }),
  setShowControls: (show) => set({ showControls: show }),

  savePreset: (name) => {
    const { oscillators, simulation } = get();
    const newPreset: Preset = {
      id: `preset-${Date.now()}`,
      name,
      oscillators: oscillators.map((osc, i) => ({ ...osc, id: `osc-${i}` })),
      simulation,
    };
    set((state) => ({
      presets: [...state.presets, newPreset],
    }));
  },

  loadPreset: (id) => {
    const preset = get().presets.find((p) => p.id === id);
    if (preset) {
      set({
        oscillators: preset.oscillators.map((osc, i) => ({ ...osc, id: `osc-${i}` })),
        simulation: { ...defaultSimulation, ...preset.simulation },
      });
    }
  },

  deletePreset: (id) => {
    set((state) => ({
      presets: state.presets.filter((p) => p.id !== id),
    }));
  },

  resetSimulation: () => {
    set({
      oscillators: [{ id: 'osc-1', ...defaultOscillator }],
      simulation: defaultSimulation,
      isPlaying: false,
      masterVolume: 0.3,
    });
  },
}));
