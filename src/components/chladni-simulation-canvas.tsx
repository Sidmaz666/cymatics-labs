'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, Move, Eye, EyeOff, ScrollText } from 'lucide-react'
import { ChladniSimulation } from '@/lib/chladni-simulation'
import { ChladniSimulationCPU } from '@/lib/chladni-simulation-cpu'
import { useChladniStore } from '@/lib/chladni-store'
import { computeModesFromFrequency } from '@/lib/chladni-physics'
import { FieldVisualization } from './field-visualization'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
type Simulation = ChladniSimulation | ChladniSimulationCPU

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

function LogLine({ text }: { text: string }) {
  const [ts, ...rest] = text.split(' | ')
  const parts = rest.length > 0 ? rest : [ts]
  return (
    <span>
      <span className="text-white/30">{ts}</span>
      {parts.map((part, i) => {
        const trimmed = part.trim()
        let color = 'text-white/60'
        if (trimmed.startsWith('FPS:')) color = 'text-accent'
        else if (trimmed.startsWith('P:')) color = 'text-white/80'
        else if (trimmed.startsWith('M:')) color = 'text-cyan-400'
        else if (trimmed.startsWith('W:')) color = 'text-yellow-400'
        else if (trimmed.startsWith('v̅:')) color = 'text-amber-300'
        else if (trimmed.startsWith('σ:')) color = 'text-amber-300'
        else if (trimmed.startsWith('settled:')) color = 'text-emerald-400'
        else if (trimmed.startsWith('E:') || trimmed.startsWith('T:')) color = 'text-purple-400'
        else if (trimmed.startsWith('active:')) color = 'text-pink-400'
        else if (trimmed.startsWith('drift:') || trimmed.startsWith('vort:')) color = 'text-blue-400'
        else if (trimmed.startsWith('|∇|:')) color = 'text-sky-400'
        else if (trimmed.startsWith('skew:') || trimmed.startsWith('kurt:')) color = 'text-teal-400'
        else if (trimmed.startsWith('center:') || trimmed.startsWith('bias:')) color = 'text-orange-400'
        return (
          <span key={i}>
            <span className="text-white/20 mx-1">|</span>
            <span className={color}>{trimmed}</span>
          </span>
        )
      })}
    </span>
  )
}

export function SimulationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simRef = useRef<Simulation | null>(null)
  const [renderer, setRenderer] = useState<'webgl' | 'cpu'>('webgl')
  const [panEnabled, setPanEnabled] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [showLog, setShowLog] = useState(false)
  const [logEntries, setLogEntries] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const panEnabledRef = useRef(false)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const oscillators = useChladniStore((s) => s.oscillators)
  const config = useChladniStore((s) => s.simulation)
  const isPlaying = useChladniStore((s) => s.isPlaying)
  const updateSimulation = useChladniStore((s) => s.updateSimulation)
  const micEnabled = useChladniStore((s) => s.micEnabled)
  const audioFileName = useChladniStore((s) => s.audioFileName)
  const audioFileEnabled = useChladniStore((s) => s.audioFileEnabled)
  const externalFrequencies = useChladniStore((s) => s.externalFrequencies)
  const showFieldOverlay = config.showFieldOverlay

  panEnabledRef.current = panEnabled

  const zoomTo = useCallback((newZoom: number) => {
    const sim = simRef.current
    if (!sim) return
    const z = Math.max(1, newZoom)
    sim.setZoomPan(z, sim.panX, sim.panY)
    setZoomLevel(Math.round(z * 100))
  }, [])

  const resetView = useCallback(() => {
    const sim = simRef.current
    if (!sim) return
    sim.setZoomPan(1, 0, 0)
    setZoomLevel(100)
  }, [])

  const buildSim = useCallback((forceCPU = false) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (simRef.current) {
      simRef.current.destroy()
      simRef.current = null
    }

    const state = useChladniStore.getState()
    const cfg = state.simulation
    const playing = state.isPlaying
    const oscs = state.oscillators

    let sim: Simulation
    try {
      if (forceCPU || !isWebGLAvailable()) throw new Error('CPU forced')
      sim = new ChladniSimulation(canvas, cfg)
      setRenderer('webgl')
    } catch {
      sim = new ChladniSimulationCPU(canvas, cfg)
      setRenderer('cpu')
    }

    simRef.current = sim
    if (playing) sim.start()

    const modes = oscs.filter((o) => o.enabled).map((o) => ({ m: o.modeM, n: o.modeN, amplitude: o.amplitude }))
    const wf = oscs.find((o) => o.enabled)?.waveform ?? 'sine'
    sim.setModes(modes, wf)
  }, [])

  useKeyboardShortcuts()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || simRef.current) return

    buildSim()

    const onResize = () => simRef.current?.resize()
    window.addEventListener('resize', onResize)
    const observer = new ResizeObserver(onResize)
    if (containerRef.current) observer.observe(containerRef.current)

    return () => {
      window.removeEventListener('resize', onResize)
      observer.disconnect()
      if (simRef.current) {
        simRef.current.destroy()
        simRef.current = null
      }
    }
  }, [])

  const computeModes = useCallback(() => {
    const sim = simRef.current
    if (!sim) return
    const state = useChladniStore.getState()
    const oscs = state.oscillators
    const freqs = state.externalFrequencies

    const oscillatorModes = oscs
      .filter((o) => o.enabled)
      .map((o) => ({ m: o.modeM, n: o.modeN, amplitude: o.amplitude }))

    const externalModes = (state.micEnabled || (state.audioFileName && state.audioFileEnabled)) && freqs.length > 0
      ? freqs.map((f) => {
          const { modeM, modeN } = computeModesFromFrequency(f)
          return { m: modeM, n: modeN, amplitude: 0.6 }
        })
      : []

    const allModes = [...oscillatorModes, ...externalModes]
    const wf = oscs.find((o) => o.enabled)?.waveform ?? 'sine'
    sim.setModes(allModes, wf)
  }, [])

  useEffect(() => {
    computeModes()
  }, [oscillators, externalFrequencies, micEnabled, audioFileName, audioFileEnabled])

  useEffect(() => {
    if (!simRef.current) return
    simRef.current.updateConfig(config)
  }, [config])

  useEffect(() => {
    if (!simRef.current) return
    if (isPlaying) simRef.current.start()
    else simRef.current.stop()
  }, [isPlaying])

  /* ---- Log stats polling ---- */
  useEffect(() => {
    if (!isPlaying) return
    let rafId: number
    let lastTime = performance.now()
    let frameCount = 0
    let fpsAccum = 0
    const poll = () => {
      const now = performance.now()
      const elapsed = now - lastTime
      frameCount++
      if (elapsed >= 500) {
        fpsAccum = Math.round((frameCount / elapsed) * 1000)
        frameCount = 0
        lastTime = now
      }
      const sim = simRef.current
      if (sim) {
        const s = sim.getStats(fpsAccum || 60)
        const ts = new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + String(performance.now() % 1000).padStart(3, '0')
        const line = `[${ts}] FPS:${s.fps} | P:${s.particles} | M:${s.modesDetail} | W:${s.waveform} | ` +
          `v̅:${s.avgSpeed} | σ:${s.dispersion} | settled:${s.settled} | E:${s.energy} | ` +
          `T:${s.temperature} | active:${s.activePct} | drift:${s.drift} | vort:${s.vorticity} | ` +
          `|∇|:${s.gradient} | skew:${s.skewness} | kurt:${s.kurtosis} | ` +
          `center:${s.centerDist} bias:${s.centerBias}`
        setLogEntries((prev) => {
          const next = [...prev, line]
          return next.length > 200 ? next.slice(-200) : next
        })
      }
      rafId = requestAnimationFrame(poll)
    }
    rafId = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(rafId)
  }, [isPlaying])

  /* ---- Auto-scroll log to bottom ---- */
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logEntries])

  /* ---- Native event listeners for zoom & pan ---- */
  useEffect(() => {
    const el = containerRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const sim = simRef.current
      if (!sim) return
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(1, sim.zoom * factor)
      const rect = canvas.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / rect.width
      const my = (e.clientY - rect.top) / rect.height
      const half = useChladniStore.getState().simulation.plateSize
      const newPanX = sim.panX * factor + half * (1 - factor) + 2 * half * mx * (factor - 1)
      const newPanY = sim.panY * factor + half * (1 - factor) + 2 * half * my * (factor - 1)
      sim.setZoomPan(newZoom, newPanX, newPanY)
      setZoomLevel(Math.round(newZoom * 100))
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (!panEnabledRef.current) return
      if (e.target !== canvas) return
      e.preventDefault()
      canvas.style.cursor = 'grabbing'
      isDragging.current = true
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!panEnabledRef.current) {
        canvas.style.cursor = 'zoom-in'
        return
      }
      if (!isDragging.current) {
        canvas.style.cursor = 'grab'
        return
      }
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      lastMouse.current = { x: e.clientX, y: e.clientY }
      const sim = simRef.current
      if (!sim) return
      if (e.target !== canvas) return
      const rect = canvas.getBoundingClientRect()
      const half = useChladniStore.getState().simulation.plateSize
      const worldPerPixelX = (2 * half) / (sim.zoom * rect.width)
      const worldPerPixelY = (2 * half) / (sim.zoom * rect.height)
      sim.setZoomPan(sim.zoom, sim.panX - dx * worldPerPixelX, sim.panY - dy * worldPerPixelY)
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging.current) return
      isDragging.current = false
      canvas.style.cursor = panEnabledRef.current ? 'grab' : 'zoom-in'
    }

    const handleMouseLeave = () => {
      if (!isDragging.current) return
      isDragging.current = false
      canvas.style.cursor = panEnabledRef.current ? 'grab' : 'zoom-in'
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('mousedown', handleMouseDown)
    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseup', handleMouseUp)
    el.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('mousedown', handleMouseDown)
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseup', handleMouseUp)
      el.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ touchAction: 'none', backgroundColor: config.backgroundColor }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
      <FieldVisualization visible={config.showFieldOverlay} />

      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden pointer-events-auto">
        <button
          onClick={() => updateSimulation({ showFieldOverlay: !showFieldOverlay })}
          className={`flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono transition-colors ${
            showFieldOverlay
              ? 'bg-accent hover:bg-accent-darker text-white'
              : 'text-white/40 hover:text-white hover:bg-white/10'
          }`}
          title={showFieldOverlay ? 'Hide field overlay' : 'Show field overlay'}
        >
          {showFieldOverlay ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          Field
        </button>
        <span className="w-px h-4 bg-white/10" />
        <button
          onClick={() => {
            setPanEnabled(!panEnabled)
          }}
          className={`flex items-center gap-1 px-2 py-1.5 text-[11px] font-mono transition-colors ${
            panEnabled
              ? 'bg-accent hover:bg-accent-darker text-white'
              : 'text-white/40 hover:text-white hover:bg-white/10'
          }`}
          title={panEnabled ? 'Disable pan' : 'Enable pan'}
        >
          {panEnabled ? <Move className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
          {panEnabled ? 'Pan' : 'Zoom'}
        </button>
        <span className="w-px h-4 bg-white/10" />
        <button
          onClick={() => zoomTo((simRef.current?.zoom ?? 1) * 1.25)}
          className="px-2 py-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-colors text-sm font-mono"
          title="Zoom in"
        >+</button>
        <span className="text-[10px] font-mono text-white/30 min-w-[28px] text-center select-none">{zoomLevel}%</span>
        <button
          onClick={() => zoomTo((simRef.current?.zoom ?? 1) * 0.8)}
          className="px-2 py-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-colors text-sm font-mono"
          title="Zoom out"
        >−</button>
        <button
          onClick={resetView}
          className="px-2 py-1.5 text-white/30 hover:text-white hover:bg-white/10 transition-colors text-[10px] font-mono border-l border-white/10"
          title="Reset zoom & pan"
        >⟲</button>
      </div>

      {renderer === 'cpu' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-900/60 border border-amber-700/50 rounded-lg text-amber-200 text-xs text-center">
          WebGL not available — using CPU renderer (slower, fewer particles recommended)
        </div>
      )}

      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[60%] pointer-events-none">
        {oscillators.filter((o) => o.enabled).length > 0 ? (
          oscillators
            .filter((o) => o.enabled)
            .map((o, i) => (
              <div
                key={o.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[11px] text-white/70 font-mono shrink-0"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${['bg-amber-400', 'bg-cyan-400', 'bg-pink-400', 'bg-accent', 'bg-purple-400', 'bg-orange-400'][i % 6]}`} />
                ({o.modeM},{o.modeN}) {o.frequency.toFixed(0)}Hz
              </div>
            ))
        ) : (
          <span className="px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[11px] text-white/30 font-mono">No active modes</span>
        )}
      </div>

      {/* log panel — console-style rolling log above status bar */}
      {showLog && (
        <div
          className="absolute bottom-7 left-0 right-0 max-h-[240px] bg-black/85 backdrop-blur-sm border-t border-white/5 flex flex-col"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          {/* title bar */}
          <div className="flex items-center justify-between px-3 py-1 bg-zinc-900/80 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-mono text-accent font-semibold tracking-wider uppercase">Simulation Logs</span>
            </div>
            <span className="text-[9px] font-mono text-white/20">{logEntries.length} lines</span>
          </div>
          {/* scrollable content */}
          <div
            ref={logRef}
            className="flex-1 overflow-y-auto overflow-x-auto scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >
            {logEntries.length > 0 ? logEntries.map((entry, i) => (
              <div
                key={i}
                className="text-[10px] leading-[16px] px-3 text-white/60 hover:bg-white/5"
              >
                <LogLine text={entry} />
              </div>
            )) : (
              <div className="px-3 py-4 text-[10px] text-white/20 font-mono italic text-center">
                Start simulation to begin logging…
              </div>
            )}
          </div>
        </div>
      )}

      {/* bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-7 bg-black/60 backdrop-blur-sm flex items-center px-3 text-[11px] text-white/40 font-mono">
          <span>{isPlaying ? '▶ Playing' : '⏸ Paused'}</span>
          <span className="mx-3">|</span>
          <span>
            {oscillators.filter((o) => o.enabled).length} active mode{oscillators.filter((o) => o.enabled).length !== 1 ? 's' : ''}
          </span>
          <span className="mx-3 hidden sm:inline">|</span>
          <span className="hidden sm:inline">
            {oscillators.filter((o) => o.enabled).map((o) => `(${o.modeM},${o.modeN})`).join(' + ') || '—'}
          </span>
          <span className="ml-auto flex items-center gap-1 text-white/30">
            <span className="hidden sm:inline">Particles:</span>
            <span>{(config.particleCount / 1000).toFixed(0)}k</span>
          </span>
          <button
            onClick={() => setShowLog(!showLog)}
            className={`ml-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              showLog
                ? 'bg-accent hover:bg-accent-darker text-white'
                : 'text-white/30 hover:text-white hover:bg-white/10'
            }`}
            title={showLog ? 'Hide simulation log' : 'Show simulation log'}
          >
            <ScrollText className="h-3 w-3" />
            LOG
          </button>
        </div>
      </div>    
    )
  }
