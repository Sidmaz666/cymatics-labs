'use client'

import { useEffect, useCallback } from 'react'
import { useChladniStore } from '@/lib/chladni-store'

const SHORTCUTS = [
  { key: 'Space', action: 'Play/Pause' },
  { key: 'Shift+O', action: 'Add oscillator' },
  { key: 'R', action: 'Reset particles' },
  { key: 'H', action: 'Toggle panel' },
  { key: 'V', action: 'Toggle field overlay' },
  { key: '1-4', action: 'Toggle oscillator' },
]

export function useKeyboardShortcuts() {
  const store = useChladniStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) return

    const { isPlaying, oscillators, simulation } = useChladniStore.getState()

    switch (e.key.toLowerCase()) {
      case ' ':
        e.preventDefault()
        useChladniStore.getState().togglePlaying()
        break
      case 'o':
        if (e.shiftKey) useChladniStore.getState().addOscillator()
        break
      case 'r':
        if (!e.shiftKey) useChladniStore.getState().resetSimulation()
        break
      case 'h':
        useChladniStore.getState().setShowControls(!useChladniStore.getState().showControls)
        break
      case 'v':
        useChladniStore.getState().updateSimulation({ showFieldOverlay: !simulation.showFieldOverlay })
        break
      case '1':
      case '2':
      case '3':
      case '4': {
        const idx = parseInt(e.key) - 1
        const osc = oscillators[idx]
        if (osc) useChladniStore.getState().updateOscillator(osc.id, { enabled: !osc.enabled })
        break
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { shortcuts: SHORTCUTS }
}
