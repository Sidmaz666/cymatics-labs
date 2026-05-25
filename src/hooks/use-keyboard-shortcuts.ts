'use client';

import { useEffect, useCallback } from 'react';
import { useChladniStore } from '@/lib/chladni-store';

export function useKeyboardShortcuts() {
  const {
    isPlaying,
    setPlaying,
    addOscillator,
    oscillators,
    updateOscillator,
    simulation,
    updateSimulation,
    resetSimulation,
    showControls,
    setShowControls,
  } = useChladniStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault();
        setPlaying(!isPlaying);
        break;
      case 'o':
        if (e.shiftKey) {
          // Shift+O: Add new oscillator
          addOscillator();
        }
        break;
      case 'r':
        if (!e.shiftKey) {
          // R: Reset particles
          resetSimulation();
        }
        break;
      case 'h':
        // H: Toggle controls panel
        setShowControls(!showControls);
        break;
      case 'v':
        // V: Toggle field visualization
        updateSimulation({ showFieldVisualization: !simulation.showFieldVisualization });
        break;
      case '1':
      case '2':
      case '3':
      case '4':
        // Number keys: Toggle oscillator 1-4
        const index = parseInt(e.key) - 1;
        if (index < oscillators.length) {
          const osc = oscillators[index];
          updateOscillator(osc.id, { enabled: !osc.enabled });
        }
        break;
      case 'arrowup':
        // Arrow Up: Increase mode M for selected oscillator
        if (oscillators.length > 0) {
          const lastOsc = oscillators[oscillators.length - 1];
          updateOscillator(lastOsc.id, { modeM: Math.min(20, lastOsc.modeM + 1) });
        }
        break;
      case 'arrowdown':
        // Arrow Down: Decrease mode M
        if (oscillators.length > 0) {
          const lastOsc = oscillators[oscillators.length - 1];
          updateOscillator(lastOsc.id, { modeM: Math.max(1, lastOsc.modeM - 1) });
        }
        break;
      case 'arrowleft':
        // Arrow Left: Decrease mode N
        if (oscillators.length > 0) {
          const lastOsc = oscillators[oscillators.length - 1];
          updateOscillator(lastOsc.id, { modeN: Math.max(1, lastOsc.modeN - 1) });
        }
        break;
      case 'arrowright':
        // Arrow Right: Increase mode N
        if (oscillators.length > 0) {
          const lastOsc = oscillators[oscillators.length - 1];
          updateOscillator(lastOsc.id, { modeN: Math.min(20, lastOsc.modeN + 1) });
        }
        break;
    }
  }, [isPlaying, setPlaying, addOscillator, oscillators, updateOscillator, simulation, updateSimulation, resetSimulation, showControls, setShowControls]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: [
      { key: 'Space', action: 'Play/Pause' },
      { key: 'Shift+O', action: 'Add oscillator' },
      { key: 'R', action: 'Reset particles' },
      { key: 'H', action: 'Toggle controls' },
      { key: 'V', action: 'Toggle field visualization' },
      { key: '1-4', action: 'Toggle oscillator 1-4' },
      { key: '↑/↓', action: 'Change mode M' },
      { key: '←/→', action: 'Change mode N' },
    ],
  };
}
