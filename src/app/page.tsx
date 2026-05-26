'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { SimulationCanvas } from '@/components/chladni-simulation-canvas'
import { ControlPanel } from '@/components/control-panel'
import { useChladniStore } from '@/lib/chladni-store'
import { getAudioEngine, destroyAudioEngine } from '@/lib/audio-engine'
import { Button } from '@/components/ui/button'
import {
  PanelLeftClose,
  PanelLeft,
  Maximize2,
  Minimize2,
  Keyboard,
  Info,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

const Mermaid = dynamic(() => import('@/components/mermaid').then(m => ({ default: m.Mermaid })), { ssr: false })

const SHORTCUTS_LIST = [
  ['Space', 'Play / Pause'],
  ['Shift+O', 'Add oscillator'],
  ['R', 'Reset particles'],
  ['H', 'Toggle panel'],
  ['V', 'Toggle field overlay'],
  ['1-4', 'Toggle oscillator 1-4'],
]

export default function Home() {
  const engineRef = useRef(getAudioEngine())
  const [fullscreen, setFullscreen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(340)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)

  const oscillators = useChladniStore((s) => s.oscillators)
  const isPlaying = useChladniStore((s) => s.isPlaying)
  const masterVolume = useChladniStore((s) => s.masterVolume)
  const showControls = useChladniStore((s) => s.showControls)
  const setShowControls = useChladniStore((s) => s.setShowControls)

  useEffect(() => {
    return () => { destroyAudioEngine() }
  }, [])

  useEffect(() => {
    engineRef.current.syncOscillators(oscillators)
  }, [oscillators])

  useEffect(() => {
    const engine = engineRef.current
    if (isPlaying) {
      engine.init().then(() => {
        engine.syncOscillators(oscillators)
        engine.start()
      })
    } else {
      engine.stop()
    }
  }, [isPlaying])

  useEffect(() => {
    engineRef.current.setMasterVolume(masterVolume)
  }, [masterVolume])

  return (
    <main className="h-dvh w-screen overflow-hidden flex flex-col bg-[#0a0a0f]">
      <header className="flex-shrink-0 h-12 border-b border-zinc-800 flex items-center justify-between px-3 bg-zinc-900/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg
              id="Layer_2"
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 108.1 108.89"
            >
              <defs>
                <style>
                  {
                    "\n      .cls-1 {\n        fill: var(--accent);\n        fill-rule: evenodd;\n      }\n    "
                  }
                </style>
              </defs>
              <g id="Layer_1-2" data-name="Layer_1">
                <path
                  className="cls-1"
                  d="M1.19,55.72c-1.58-.38-1.58-2.64,0-3.02l15.13-3.6,20.72-5.01c.41-.1.84-.03,1.19.19l13.72,8.61c.97.61.97,2.01,0,2.62l-13.72,8.67c-.35.22-.79.29-1.19.2l-20.71-5.01-15.13-3.65ZM15.74,17.65c-.85-1.39.75-2.98,2.14-2.13l13.29,8.2,10.55,6.56c.57.35.84,1.03.69,1.68l-1.42,5.9c-.1.41-.03.83.19,1.19l.02.03c.87,1.39-.74,3.01-2.14,2.14l-.3-.19c-.35-.22-.78-.29-1.19-.19l-5.62,1.37c-.66.16-1.34-.12-1.69-.7l-6.38-10.49-8.14-13.36ZM17.56,93.06c-1.39.86-2.99-.73-2.14-2.12l8.13-13.35,6.5-10.69c.35-.58,1.04-.86,1.69-.7l5.81,1.43c.41.1.85.03,1.2-.2h0c1.39-.88,3.02.72,2.15,2.12l-.21.34c-.22.35-.28.77-.19,1.17l1.36,5.71c.16.65-.12,1.33-.69,1.68l-10.41,6.43-13.21,8.18ZM92.31,91.27c.85,1.39-.75,2.98-2.14,2.12l-13.21-8.18-10.61-6.57c-.57-.35-.85-1.03-.69-1.68l1.42-5.89c.1-.41.03-.83-.19-1.19l-.02-.03c-.87-1.39.74-3.01,2.14-2.14l.3.19c.35.22.78.29,1.19.19l5.62-1.37c.66-.16,1.34.12,1.69.7l6.38,10.49,8.13,13.35ZM90.52,15.86c1.39-.86,2.99.73,2.14,2.12l-8.15,13.43-6.5,10.63c-.35.58-1.04.86-1.69.7l-5.81-1.43c-.41-.1-.85-.03-1.2.2h0c-1.39.88-3.02-.72-2.15-2.12l.21-.34c.22-.35.28-.77.19-1.17l-1.36-5.71c-.16-.65.12-1.33.69-1.68l10.41-6.43,13.23-8.19ZM52.78,1.19c.38-1.59,2.64-1.59,3.02,0l3.62,15.24,4.91,20.91c.09.4.03.82-.19,1.17l-8.53,13.82c-.6.98-2.03.98-2.64,0l-8.59-13.82c-.22-.35-.29-.77-.19-1.18l4.98-20.91,3.62-15.24ZM106.91,53.23c1.58.38,1.58,2.63,0,3.01l-15.17,3.66-20.72,4.95c-.41.1-.83.03-1.18-.19l-13.72-8.62c-.97-.61-.97-2.01,0-2.62l13.72-8.67c.35-.22.79-.29,1.19-.2l20.71,5.01,15.17,3.66ZM55.29,107.7c-.38,1.59-2.65,1.59-3.02,0l-3.56-15.2-4.98-20.91c-.1-.4-.03-.82.19-1.17l8.53-13.82c.6-.98,2.03-.98,2.64,0l8.59,13.82c.22.35.29.77.19,1.18l-4.98,20.91-3.61,15.2Z"
                />
              </g>
            </svg>
            <h1 className="uppercase font-mono text-accent"> cymatics labs</h1>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowControls(!showControls)}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title={showControls ? 'Hide control panel' : 'Show control panel'}
          >
            {showControls ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfo(true)}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Open info & documentation"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800" title="View keyboard shortcuts">
                <Keyboard className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs bg-zinc-900 border-zinc-700">
              <DialogHeader>
                <DialogTitle className="text-zinc-100 text-sm">Keyboard Shortcuts</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 text-xs">
                {SHORTCUTS_LIST.map(([key, action], i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-zinc-400">{action}</span>
                    <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono text-zinc-300">{key}</kbd>
                  </div>
                ))}
                <Separator className="bg-zinc-700 my-1" />
                <p className="text-zinc-500 text-[10px]">z = cos(mπx)·cos(nπy) − cos(nπx)·cos(mπy)</p>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen()
                setFullscreen(true)
              } else {
                document.exitFullscreen()
                setFullscreen(false)
              }
            }}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 relative transition-[margin] duration-150 ${showControls ? '' : ''}`} style={{ marginRight: showControls ? sidebarWidth : 0 }}>
          <SimulationCanvas />
        </div>

        <div
          ref={sidebarRef}
          className={`fixed top-12 right-0 bottom-0 z-40 transition-transform duration-300 ${showControls ? 'translate-x-0' : 'translate-x-full'
            }`}
          style={{ width: sidebarWidth }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-accent/30 active:bg-accent/50 z-50 group"
            onMouseDown={(e) => {
              e.preventDefault()
              isResizing.current = true
              const startX = e.clientX
              const startWidth = sidebarWidth
              const onMouseMove = (ev: MouseEvent) => {
                if (!isResizing.current) return
                const newWidth = Math.max(280, Math.min(600, startWidth - (ev.clientX - startX)))
                setSidebarWidth(newWidth)
              }
              const onMouseUp = () => {
                isResizing.current = false
                document.removeEventListener('mousemove', onMouseMove)
                document.removeEventListener('mouseup', onMouseUp)
              }
              document.addEventListener('mousemove', onMouseMove)
              document.addEventListener('mouseup', onMouseUp)
            }}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-0.5 rounded-full bg-zinc-600 group-hover:bg-accent transition-colors" />
          </div>
          <ControlPanel />
        </div>
      </div>
      {showInfo && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col">
          <button
            onClick={() => setShowInfo(false)}
            className="fixed top-4 left-4 z-[101] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-mono"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 md:py-12 space-y-10">

              {/* ─── INTRODUCTION ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <svg width="28" height="28" viewBox="0 0 108.1 108.89" className="text-accent shrink-0">
                    <path fill="currentColor" fillRule="evenodd" d="M1.19,55.72c-1.58-.38-1.58-2.64,0-3.02l15.13-3.6,20.72-5.01c.41-.1.84-.03,1.19.19l13.72,8.61c.97.61.97,2.01,0,2.62l-13.72,8.67c-.35.22-.79.29-1.19.2l-20.71-5.01-15.13-3.65ZM15.74,17.65c-.85-1.39.75-2.98,2.14-2.13l13.29,8.2,10.55,6.56c.57.35.84,1.03.69,1.68l-1.42,5.9c-.1.41-.03.83.19,1.19l.02.03c.87,1.39-.74,3.01-2.14,2.14l-.3-.19c-.35-.22-.78-.29-1.19-.19l-5.62,1.37c-.66.16-1.34-.12-1.69-.7l-6.38-10.49-8.14-13.36ZM17.56,93.06c-1.39.86-2.99-.73-2.14-2.12l8.13-13.35,6.5-10.69c.35-.58,1.04-.86,1.69-.7l5.81,1.43c.41.1.85.03,1.2-.2h0c1.39-.88,3.02.72,2.15,2.12l-.21.34c-.22.35-.28.77-.19,1.17l1.36,5.71c.16.65-.12,1.33-.69,1.68l-10.41,6.43-13.21,8.18ZM92.31,91.27c.85,1.39-.75,2.98-2.14,2.12l-13.21-8.18-10.61-6.57c-.57-.35-.85-1.03-.69-1.68l1.42-5.89c.1-.41.03-.83-.19-1.19l-.02-.03c-.87-1.39.74-3.01,2.14-2.14l.3.19c.35.22.78.29,1.19.19l5.62-1.37c.66-.16,1.34.12,1.69.7l6.38,10.49,8.13,13.35ZM90.52,15.86c1.39-.86,2.99.73,2.14,2.12l-8.15,13.43-6.5,10.63c-.35.58-1.04.86-1.69.7l-5.81-1.43c-.41-.1-.85-.03-1.2.2h0c-1.39.88-3.02-.72-2.15-2.12l.21-.34c.22-.35.28-.77.19-1.17l-1.36-5.71c-.16-.65.12-1.33.69-1.68l10.41-6.43,13.23-8.19ZM52.78,1.19c.38-1.59,2.64-1.59,3.02,0l3.62,15.24,4.91,20.91c.09.4.03.82-.19,1.17l-8.53,13.82c-.6.98-2.03.98-2.64,0l-8.59-13.82c-.22-.35-.29-.77-.19-1.18l4.98-20.91,3.62-15.24ZM106.91,53.23c1.58.38,1.58,2.63,0,3.01l-15.17,3.66-20.72,4.95c-.41.1-.83.03-1.18-.19l-13.72-8.62c-.97-.61-.97-2.01,0-2.62l13.72-8.67c.35-.22.79-.29,1.19-.2l20.71,5.01,15.17,3.66ZM55.29,107.7c-.38,1.59-2.65,1.59-3.02,0l-3.56-15.2-4.98-20.91c-.1-.4-.03-.82.19-1.17l8.53-13.82c.6-.98,2.03-.98,2.64,0l8.59,13.82c.22.35.29.77.19,1.18l-4.98,20.91-3.61,15.2Z"/>
                  </svg>
                  <h3 className="text-xl font-semibold text-zinc-100 capitalize">cymatics labs</h3>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  A real-time, multi-oscillator cymatic pattern simulator that visualizes standing wave
                  phenomena through particle physics.
                </p>
              </section>

              {/* ─── WHAT IS CYMATICS ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm">01</span>
                  <h3 className="text-lg font-semibold text-zinc-100">What Is Cymatics?</h3>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-200">Cymatics</strong> (from Greek <em>κῦμα</em>, <em>kyma</em> — "wave") is
                  the study of visible sound and vibration. It sits at the intersection of physics, biology, and art,
                  revealing how oscillatory fields organize matter into geometric forms. Where sound is invisible to the
                  naked ear, cymatics makes it visible — transforming frequencies into patterns we can see and touch.
                </p>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  The core principle is deceptively simple: when a material surface (a plate, membrane, or body of
                  fluid) vibrates at specific resonant frequencies, different regions of the surface move up and down
                  with varying amplitude. Particles resting on the surface are driven away from regions of maximum
                  vibration (anti-nodes) and accumulate in regions of minimum vibration (nodes), forming intricate
                  geometric patterns that are deterministic, reproducible, and intimately tied to the frequency and
                  waveform of the driving oscillation.
                </p>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  While <strong className="text-zinc-200">Chladni figures</strong> (sand on a vibrating brass plate) are
                  the most famous and historically significant example, cymatic phenomena appear across an astonishing
                  range of scales and media: <strong className="text-zinc-200">Faraday waves</strong> on a vibrating
                  liquid surface, <strong className="text-zinc-200">Lissajous figures</strong> traced by coupled
                  pendulums and oscilloscopes, the <strong className="text-zinc-200">ripple tank</strong> in every
                  physics classroom, <strong className="text-zinc-200">granular segregation</strong> in industrial
                  sorting processes, <strong className="text-zinc-200">ultrasonic standing waves</strong> that levitate
                  droplets of water, and even the <strong className="text-zinc-200">cochlear travelling wave</strong> that
                  enables mammalian hearing — the inner ear is, in essence, a biological cymatic instrument.
                </p>

                <h4 className="text-base font-medium text-zinc-200 mt-6">
                  Cymatics &amp; Chladni — Historical Timeline
                </h4>
                <div>
                    <ol className="space-y-5 text-[14px] text-zinc-400 leading-relaxed">
                      <li className="flex gap-4">
                        <span className="text-accent font-bold font-mono text-xs whitespace-nowrap shrink-0 w-12 pt-0.5">~550 BCE</span>
                        <div>
                          <strong className="text-zinc-200">Pythagoras of Samos</strong> — The first recorded
                          observation linking vibration to pattern. Pythagoras noted that plucking strings in
                          simple integer ratios (2:1, 3:2, 4:3) produced consonant intervals — the foundation of
                          Western music theory. He also observed that lyre strings vibrating in sympathy with one
                          another (sympathetic resonance) suggested an underlying geometric order to sound. While
                          he never saw patterns on a plate, the intuition that numbers, ratios, and vibration are
                          woven together is the philosophical seed from which cymatics eventually grows.
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-mono text-sm shrink-0 w-12 pt-0.5">~1500</span>
                        <div>
                          <strong className="text-zinc-200">Leonardo da Vinci</strong> — In his notebooks, da Vinci
                          described how dust on a vibrating drumhead collects in patterns, and drew parallels
                          between sound waves and water ripples. He sketched the motion of vibrating strings and
                          noted that "the percussion of the air" could produce visible effects on loose particles —
                          an early prefiguration of Chladni's experiments by nearly three centuries.
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-mono text-sm shrink-0 w-12 pt-0.5">1680</span>
                        <div>
                          <strong className="text-zinc-200">Robert Hooke</strong> — The great English experimental
                          philosopher (of <em>Micrographia</em> fame) observed that a glass plate sprinkled with
                          flour produced "curious figures" when bowed with a violin bow. He described these in his
                          diary and lectures but never published a systematic study. Hooke also discovered the
                          nodal patterns of vibrating bells and membranes, making him the first person in recorded
                          history to deliberately excite standing waves in a solid plate to produce visible
                          patterns.
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-mono text-sm shrink-0 w-12 pt-0.5">1787</span>
                        <div>
                          <strong className="text-zinc-200">Ernst Florens Friedrich Chladni</strong> — The German
                          physicist and musician publishes <em>"Entdeckungen über die Theorie des Klanges"</em>
                          (Discoveries Concerning the Theory of Sound). Chladni's method: scatter fine sand over
                          a brass or glass plate, draw a violin bow across the edge to excite resonance, and
                          watch the sand migrate to the stationary nodal lines. He systematically catalogued
                          dozens of patterns — now called <strong className="text-zinc-200">Chladni figures</strong>
                          — corresponding to different modes of vibration. This is the first rigorous,
                          reproducible demonstration that sound can organize matter into visible geometric forms.
                          Chladni's work earns him the title "father of acoustics" and inspires Napoleon Bonaparte
                          to offer a 3,000-franc prize for a mathematical explanation of the patterns (won by
                          Sophie Germain in 1816).
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-mono text-sm shrink-0 w-12 pt-0.5">1816</span>
                        <div>
                          <strong className="text-zinc-200">Sophie Germain</strong> — The French mathematician
                          wins Napoleon's prize by deriving the first mathematical theory of elastic plate
                          vibration. Her fourth-order partial differential equation (the <strong className="text-zinc-200">
                          Germain-Lagrange plate equation</strong>) correctly models the restoring forces in a
                          vibrating plate, though she initially struggled with the boundary conditions. Her work
                          is later refined by Lagrange, Poisson, Kirchhoff, and Love, ultimately becoming the
                          foundation of modern structural mechanics and finite element analysis.
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-mono text-sm shrink-0 w-12 pt-0.5">1831</span>
                        <div>
                          <strong className="text-zinc-200">Michael Faraday</strong> — The British experimental
                          genius observes that a vibrating liquid surface produces regular, stationary ripple
                          patterns — now known as <strong className="text-zinc-200">Faraday waves</strong>.
                          Faraday noted that the pattern wavelength depends on the driving frequency and that
                          subharmonic response (the pattern vibrates at half the driving frequency) occurs. His
                          work extends cymatic principles from solids into fluids, demonstrating that the
                          phenomenon is universal across states of matter.
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-mono text-sm shrink-0 w-12 pt-0.5">1867</span>
                        <div>
                          <strong className="text-zinc-200">Hermann von Helmholtz</strong> — The German
                          polymath publishes <em>"On the Sensations of Tone as a Physiological Basis for the
                          Theory of Music"</em>, a landmark work linking physics, physiology, and musical
                          aesthetics. Helmholtz used glass spheres and resonant cavities (Helmholtz resonators)
                          to analyse the frequency content of complex sounds, and studied how the ear
                          decomposes sound into its constituent frequencies. His work provides the theoretical
                          bridge between Chladni's visible patterns and the auditory experience of sound.
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-mono text-sm shrink-0 w-12 pt-0.5">1887</span>
                        <div>
                          <strong className="text-zinc-200">John William Strutt, 3rd Baron Rayleigh</strong> —
                          Publishes <em>"The Theory of Sound"</em> (two volumes, 1877–1878, revised 1894–1896),
                          the definitive mathematical treatment of acoustics and vibration. Rayleigh provides
                          the complete analytical framework for plate vibrations, membrane vibrations, and
                          Chladni figures, including the method of separation of variables and the eigenvalue
                          problem that yields the mode shapes. His work remains the standard reference for
                          acoustic theory well into the 20th century and is still cited in contemporary research.
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-mono text-sm shrink-0 w-12 pt-0.5">1967</span>
                        <div>
                          <strong className="text-zinc-200">Hans Jenny</strong> — The Swiss physician and
                          natural scientist publishes <em>"Kymatic"</em> (later republished as
                          <em>"Cymatics: A Study of Wave Phenomena &amp; Vibration"</em>), coining the term
                          <strong className="text-zinc-200">cymatics</strong> itself. Jenny systematically
                          photographed and catalogued hundreds of patterns created by vibrating powders, fluids,
                          and pastes on steel plates driven by an oscillator and loudspeaker. He varied frequency
                          (from a few Hz to several kHz), amplitude, and waveform, documenting how each parameter
                          transforms the resulting geometry. Jenny's work extends Chladni's into a general
                          phenomenological study — he was also the first to use the term "cymatics" to describe
                          the field as a whole, framing it as a fundamental principle of nature rather than a
                          laboratory curiosity. His books remain the most visually comprehensive references in
                          the field.
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-mono text-sm shrink-0 w-12 pt-0.5">2005</span>
                        <div>
                          <strong className="text-zinc-200">John Stuart Reid</strong> — The British acoustic
                          engineer and researcher develops the <strong className="text-zinc-200">Cymascope</strong>,
                          a device that renders audible sounds into visible cymatic patterns by exciting a thin
                          membrane of water. Reid's work demonstrates that every audible frequency has a unique
                          geometric signature and that the patterns correlate with the vowel and consonant
                          structures of human speech — reviving interest in cymatics as a tool for acoustic
                          analysis and raising questions about the geometric basis of language perception.
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-mono text-sm shrink-0 w-12 pt-0.5">2014</span>
                        <div>
                          <strong className="text-zinc-200">Evan Grant</strong> — The British technologist and
                          artist delivers a widely-viewed TED talk, "Making Sound Visible Through Cymatics,"
                          bringing cymatics to a global mainstream audience. Grant demonstrates Chladni plates,
                          Faraday waves, and the Cymascope, arguing that cymatics offers a "new alphabet" for
                          understanding the relationship between vibration and form. The talk has been viewed
                          millions of times and sparks a resurgence of interest in both the science and the art
                          of visible sound.
                        </div>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-mono text-sm shrink-0 w-12 pt-0.5">Present</span>
                        <div>
                          <strong className="text-zinc-200">This Simulator</strong> — A real-time, browser-based
                          Chladni plate simulation built with Next.js&nbsp;16, Three.js (WebGL), and the Web Audio
                          API. It is a direct digital continuation of the 230-year tradition that began with
                          Chladni's bow and brass plate: 35+ built-in presets, multi-oscillator interference,
                          GPU-accelerated particle physics at up to 200k particles, and four waveform types —
                          all running in your browser at 60&nbsp;fps. What took Chladni hours to set up and days
                          to document can now be explored in real time with a single click.
                        </div>
                      </li>
                    </ol>
                </div>
              </section>

              {/* ─── WHAT IS A CHLADNI PATTERN ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm">02</span>
                  <h3 className="text-lg font-semibold text-zinc-100">What Is a Chladni Pattern?</h3>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  When a thin plate covered with fine powder (sand or lycopodium) vibrates at a resonant
                  frequency, the powder migrates to the <strong className="text-zinc-200">nodal lines</strong> — stationary regions
                  where the plate displacement is zero. The result is a geometric pattern that reveals the
                  standing wave mode shape.
                </p>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  Discovered by the German physicist and musician <strong className="text-zinc-200">Ernst Chladni</strong> in 1787
                  (<em>Entdeckungen über die Theorie des Klanges</em>), these patterns are the earliest known
                  example of experimental modal analysis — a technique now fundamental to mechanical
                  engineering, acoustics, and musical instrument design.
                </p>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 ml-2">mode-(3,5)-plate</span>
                  </div>
                  <Mermaid chart={`flowchart TB
  subgraph Plate["Mode (3,5) Standing Wave"]
      EQ["z = cos(3pix/L)*cos(5piy/L) - cos(5pix/L)*cos(3piy/L)"]
      V["3 vertical nodes (m=3)"]
      H["5 horizontal nodes (n=5)"]
      EQ --> V
      EQ --> H
  end
  subgraph Result["Nodal Pattern"]
      NP["Particles settle at z=0 intersections"]
  end
  Plate --> Result`} />
                </div>
              </section>

              {/* ─── MATHEMATICAL FOUNDATION ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm">03</span>
                  <h3 className="text-lg font-semibold text-zinc-100">Mathematical Foundation</h3>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  For a square plate clamped at its center, the vertical displacement z(x,&nbsp;y) for mode
                  (m,&nbsp;n) satisfies the Helmholtz wave equation ∇²z + k²z = 0.
                </p>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-5">
                  <div className="text-center font-mono text-sm text-zinc-200">
                    z(x, y) = cos(mπx/L) · cos(nπy/L) − cos(nπx/L) · cos(mπy/L)
                  </div>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  where <span className="text-zinc-200 font-mono text-sm">m, n ∈ ℕ⁺</span> are the mode
                  numbers and <span className="text-zinc-200 font-mono text-sm">L</span> is the plate
                  half-size. Each (m,&nbsp;n) pair corresponds to a resonant standing wave — the nodal
                  lines where z(x,&nbsp;y) = 0 form the visible pattern.
                </p>

                <h4 className="text-base font-medium text-zinc-200 mt-6">Gradient-Driven Particle Motion</h4>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  Particles are driven by the gradient of the field intensity |z|² — they flow
                  <strong className="text-zinc-200"> toward </strong> nodal lines (minima) and
                  <strong className="text-zinc-200"> away from </strong> anti-nodes (maxima):
                </p>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-5">
                  <div className="text-center font-mono text-sm text-zinc-200">
                    F(x, y) = −∇|z(x, y)|² &nbsp;→&nbsp; F<sub>x</sub> = −∂|z|²/∂x, &nbsp; F<sub>y</sub> = −∂|z|²/∂y
                  </div>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  The partial derivatives are computed analytically by differentiating the Chladni function
                  term-by-term, enabling stable simulation at 60&nbsp;fps:
                </p>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 ml-2">partial-derivatives.txt</span>
                  </div>
                  <pre className="text-[12px] font-mono text-zinc-400 leading-relaxed p-4 overflow-x-auto">
                    {`∂z/∂x   = -mπ/L · sin(mπx/L) · cos(nπy/L)
         +  nπ/L · sin(nπx/L) · cos(mπy/L)

∂|z|²/∂x = 2 · z · (∂z/∂x)

∂z/∂y   = -nπ/L · cos(mπx/L) · sin(nπy/L)
         +  mπ/L · cos(nπx/L) · sin(mπy/L)

∂|z|²/∂y = 2 · z · (∂z/∂y)`}
                  </pre>
                </div>
              </section>

              {/* ─── MULTI-OSCILLATOR INTERFERENCE ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm">04</span>
                  <h3 className="text-lg font-semibold text-zinc-100">Multi-Oscillator Interference</h3>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  Multiple active oscillators superpose linearly — the total displacement field Z(x,&nbsp;y)
                  is the sum of all individual contributions:
                </p>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-5">
                  <div className="text-center font-mono text-sm text-zinc-200">
                    Z(x, y) = Σᵢ A<sub>i</sub> · [cos(m<sub>i</sub>πx/L)·cos(n<sub>i</sub>πy/L) − cos(n<sub>i</sub>πx/L)·cos(m<sub>i</sub>πy/L)]
                  </div>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  Each oscillator contributes a standing wave weighted by amplitude A<sub>i</sub>.
                  Particles settle at the intersections of <em>all</em> superimposed nodal lines.
                  Complementary mode pairs like (m,&nbsp;n)&nbsp;+&nbsp;(n,&nbsp;m) produce symmetric
                  patterns reminiscent of mandalas and sacred geometry.
                </p>

                <h4 className="text-base font-medium text-zinc-200 mt-6">Interference Example: (3,5) + (5,3)</h4>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-5">
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center text-sm font-mono">
                    <div className="text-center space-y-1">
                      <div className="text-accent font-medium text-xs tracking-wide">MODE (3,5)</div>
                      <div className="text-zinc-400 text-[11px]">cos(3πx)·cos(5πy)</div>
                      <div className="text-zinc-500 text-[11px]">− cos(5πx)·cos(3πy)</div>
                      <div className="text-[10px] text-accent/50 mt-2">3 vertical · 5 horizontal</div>
                    </div>
                    <div className="text-zinc-600 text-2xl font-light px-2">+</div>
                    <div className="text-center space-y-1">
                      <div className="text-cyan-400 font-medium text-xs tracking-wide">MODE (5,3)</div>
                      <div className="text-zinc-400 text-[11px]">cos(5πx)·cos(3πy)</div>
                      <div className="text-zinc-500 text-[11px]">− cos(3πx)·cos(5πy)</div>
                      <div className="text-[10px] text-cyan-500/50 mt-2">5 vertical · 3 horizontal</div>
                    </div>
                  </div>
                  <div className="border-t border-zinc-800 mt-4 pt-4 text-center">
                    <span className="font-mono text-sm text-zinc-300">
                      = 2·cos(3πx)·cos(5πy) − 2·cos(5πx)·cos(3πy)
                    </span>
                  </div>
                  <div className="text-center text-xs text-zinc-500 mt-2">
                    Result: C₂ rotational symmetry — pure mandala topology
                  </div>
                </div>
              </section>

              {/* ─── FREQUENCY ↔ MODE MAPPING ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm">05</span>
                  <h3 className="text-lg font-semibold text-zinc-100">Frequency ↔ Mode Mapping</h3>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  Mode numbers are derived from frequency using the physical scaling relationship for a
                  thin square plate: f ∝ m² + n².
                </p>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-5">
                  <div className="text-center font-mono text-sm text-zinc-200">
                    ratio = √(f / 220) &nbsp;→&nbsp; m = round(ratio × 3), &nbsp; n = round(ratio × 5)
                  </div>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  Reference: <strong className="text-zinc-200">220&nbsp;Hz</strong> (A3) → mode
                  (3,&nbsp;5). Higher frequencies produce denser nodal grids, coupling pitch to
                  pattern complexity.
                </p>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 ml-2">frequency-lookup.csv</span>
                  </div>
                  <pre className="text-[12px] font-mono text-zinc-400 leading-relaxed p-4 overflow-x-auto">
                    {`  Frequency     (m,n)     Nodal Grid
 ────────────────────────────────────
   55 Hz        (1, 1)     1 × 1
  110 Hz        (2, 3)     2 × 3
  220 Hz        (3, 5)     3 × 5
  440 Hz        (4, 7)     4 × 7
  880 Hz        (6,10)     6 × 10
 1760 Hz        (9,14)     9 × 14`}
                  </pre>
                </div>
              </section>

              {/* ─── SYSTEM ARCHITECTURE ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm">06</span>
                  <h3 className="text-lg font-semibold text-zinc-100">System Architecture</h3>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 ml-2">architecture</span>
                  </div>
                  <Mermaid chart={`flowchart TB
  subgraph Store["Zustand Store"]
      O["oscillators[]"]
      S["simulation config"]
      P["presets[]"]
  end
  subgraph Physics["Physics Core (CPU)"]
      FG["computeChladniField + Gradient"]
  end
  subgraph Loop["Simulation Loop"]
      TP["tickPhysics: update pos/vel/life"]
  end
  subgraph Renderer["Renderer"]
      GPU["GPU: Three.js ShaderMaterial"]
      CPU["CPU: Canvas 2D fallback"]
  end
  subgraph Audio["Audio Engine"]
      AN["OscNode -> GainNode -> MasterGain -> Dest"]
  end
  subgraph UI["Control Panel"]
      CP["React / Tailwind sidebar"]
  end
  Store --> Physics
  Physics --> Loop
  Loop --> Renderer
  Store --> Audio
  Store --> UI
  UI --> Store`} />
                </div>

                <h4 className="text-base font-medium text-zinc-200 mt-6">GPU Rendering (WebGL)</h4>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  Uses <strong className="text-zinc-200">Three.js</strong> with a custom
                  <code className="text-accent text-sm mx-1">ShaderMaterial</code>. Particles are
                  rendered as <strong className="text-zinc-200">Points</strong> with additive blending.
                  Each particle carries three vertex attributes:
                </p>
                <ul className="space-y-2 text-[15px] text-zinc-400">
                  <li className="flex gap-3">
                    <span className="text-accent shrink-0 mt-1">▸</span>
                    <span><strong className="text-zinc-300">position (vec3)</strong> — updated every physics tick in world-space</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent shrink-0 mt-1">▸</span>
                    <span><strong className="text-zinc-300">aVelocity (vec2)</strong> — drives intensity-based coloring in the fragment shader</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent shrink-0 mt-1">▸</span>
                    <span><strong className="text-zinc-300">aLife (float)</strong> — [0,&nbsp;1], inversely proportional to speed; controls opacity &amp; size</span>
                  </li>
                </ul>

                <h4 className="text-base font-medium text-zinc-200 mt-6">CPU Fallback (Canvas 2D)</h4>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  Activates automatically when WebGL is unavailable. Each particle is drawn as a filled
                  circle with multi-pass glow emulation. The coordinate mapping mirrors the GPU camera
                  (zoom + pan), ensuring pixel-identical output.
                </p>

                <h4 className="text-base font-medium text-zinc-200 mt-6">Per-Frame Physics Loop</h4>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 ml-2">physics-tick.js</span>
                  </div>
                  <pre className="text-[12px] font-mono text-zinc-400 leading-relaxed p-4 overflow-x-auto">
                    {`for each particle i {
  1. Compute ∇Z at (xᵢ, yᵢ):
     (gx, gy) = analyticGradient(xᵢ, yᵢ, modes)

  2. Apply gradient force + noise:
     vx += (gx * intensity * speed * 0.01 + noise) · dt
     vy += (gy * intensity * speed * 0.01 + noise) · dt

  3. Dampen:  vx *= damping,  vy *= damping

  4. Integrate:  x += vx,  y += vy

  5. Periodic wrap:  if |x| > L → x ∓= 2L

  6. Life = 1.0 − min(1, ||v|| × 5)
}`}
                  </pre>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  Physics runs entirely on the <strong className="text-zinc-200">CPU</strong> in JavaScript.
                  The same physics core drives both the WebGL and Canvas&nbsp;2D renderers.
                </p>
              </section>

              {/* ─── AUDIO ENGINE ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm">07</span>
                  <h3 className="text-lg font-semibold text-zinc-100">Audio Engine</h3>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  Wraps the <strong className="text-zinc-200">Web Audio API</strong> with a deferred-initialization
                  pattern. Each visual oscillator maps to an
                  <code className="text-accent text-sm mx-1">OscillatorNode</code> in the audio graph:
                </p>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 ml-2">audio-signal-flow</span>
                  </div>
                  <Mermaid chart={`flowchart LR
  O1["Osc 1"] --> G1["Gain 1"]
  O2["Osc 2"] --> G2["Gain 2"]
  O3["Osc 3"] --> G3["Gain 3"]
  G1 --> M["MasterGain (volume)"]
  G2 --> M
  G3 --> M
  M --> D["AudioDestination"]`} />
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  Supports <strong className="text-zinc-200">sine</strong>,
                  <strong className="text-zinc-200"> square</strong>,
                  <strong className="text-zinc-200"> sawtooth</strong>, and
                  <strong className="text-zinc-200"> triangle</strong> waveforms with independent
                  frequency, amplitude, and detune controls. Oscillators added before
                  <code className="text-accent text-sm mx-1">AudioContext</code> creation are queued
                  and flushed on first play. Audio is <em>never</em> triggered during preset loading
                  unless the simulation was already running.
                </p>
              </section>

              {/* ─── STATE MANAGEMENT ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm">08</span>
                  <h3 className="text-lg font-semibold text-zinc-100">State Management</h3>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  A single <strong className="text-zinc-200">Zustand</strong> store manages all application
                  state with the following schema:
                </p>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 ml-2">store.d.ts</span>
                  </div>
                  <pre className="text-[12px] font-mono text-zinc-400 leading-relaxed p-4 overflow-x-auto">
                    {`Store {
  // --- Data ---
  oscillators[]: { id, enabled, frequency, amplitude,
                   modeM, modeN, waveform, detune }
  simulation:    { particleCount, particleSize, plateSize,
                   dampingFactor, vibrationIntensity, noiseAmount,
                   speedMultiplier, colorScheme, glowIntensity,
                   brightness, contrastBoost, showFieldOverlay }
  isPlaying:     boolean
  masterVolume:  number (0–1)
  showControls:  boolean
  presets:       { name, oscillators[], simulation[] }[]

  // --- Actions ---
  addOscillator, updateOscillator, removeOscillator
  loadPreset, savePreset, deletePreset, resetSimulation
  togglePlaying, setMasterVolume, updateSimulation
  setShowControls
}`}
                  </pre>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  The <code className="text-accent text-sm">updateOscillator</code> action automatically
                  recomputes mode numbers (m,&nbsp;n) from frequency. Presets store explicit
                  modeM/modeN values so they load faithfully regardless of frequency.
                </p>
              </section>

              {/* ─── CONTROLS REFERENCE ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm">09</span>
                  <h3 className="text-lg font-semibold text-zinc-100">Controls Reference</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <h5 className="text-sm font-medium text-zinc-200">Simulation Transport</h5>
                    </div>
                    <ul className="space-y-1 text-sm text-zinc-400">
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Start / Stop</strong> — Toggle simulation + audio</li>
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Record Video</strong> — Capture canvas to .webm</li>
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Reset Defaults</strong> — Restore initial state</li>
                    </ul>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      <h5 className="text-sm font-medium text-zinc-200">Oscillator Controls</h5>
                    </div>
                    <ul className="space-y-1 text-sm text-zinc-400">
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Frequency</strong> — Hz slider, auto-derives mode</li>
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Amplitude</strong> — Output level per oscillator</li>
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Waveform</strong> — Sine / Square / Saw / Triangle</li>
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Detune</strong> — ±50 cents fine tuning</li>
                    </ul>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <h5 className="text-sm font-medium text-zinc-200">Rendering</h5>
                    </div>
                    <ul className="space-y-1 text-sm text-zinc-400">
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Particles</strong> — Count (10k–200k) + size</li>
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Color Scheme</strong> — Classic, Rainbow, Heat, Ocean, Neon</li>
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Glow / Brightness</strong> — Visual tuning</li>
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Field Overlay</strong> — Show |z|² intensity map</li>
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Zoom / Pan</strong> — Scroll to zoom, toggle to pan</li>
                    </ul>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <h5 className="text-sm font-medium text-zinc-200">Presets &amp; Data</h5>
                    </div>
                    <ul className="space-y-1 text-sm text-zinc-400">
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">35 built-in presets</strong> — 4 categories</li>
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Save / Delete</strong> — Custom presets</li>
                      <li><span className="text-zinc-500">▸</span> <strong className="text-zinc-300">Export / Import</strong> — JSON files</li>
                    </ul>
                  </div>
                </div>

                <h4 className="text-base font-medium text-zinc-200 mt-6">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SHORTCUTS_LIST.map(([key, action], i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2">
                      <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] font-mono text-zinc-200 shrink-0">{key}</kbd>
                      <span className="text-sm text-zinc-400 truncate">{action}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ─── PRESET LIBRARY ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm">10</span>
                  <h3 className="text-lg font-semibold text-zinc-100">Preset Library</h3>
                </div>
                <p className="text-[15px] text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-200">35 hand-crafted presets</strong> across four categories.
                  Every pattern emerges purely from standing wave interference — no post-processing or
                  symmetry enforcement.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <h5 className="text-sm font-medium text-accent">Sacred Geometry &amp; Yantra</h5>
                    </div>
                    <p className="text-sm text-zinc-400">Sri Yantra, Mandala, Lotus, Om, Chakra motifs — created purely through complementary mode pair interference.</p>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      <h5 className="text-sm font-medium text-cyan-400">Sonic &amp; Harmonic</h5>
                    </div>
                    <p className="text-sm text-zinc-400">Musical intervals (octave, fifth, third) and harmonic series ratios — the visual analogue of consonance.</p>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <h5 className="text-sm font-medium text-amber-400">Classical Chladni</h5>
                    </div>
                    <p className="text-sm text-zinc-400">Pure single-mode patterns from Chladni's original experiments — (1,1), (2,2), (3,3), (2,3), (3,5).</p>
                  </div>
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      <h5 className="text-sm font-medium text-pink-400">Complex &amp; Symmetric</h5>
                    </div>
                    <p className="text-sm text-zinc-400">Multi-oscillator interference with rich nodal structures — Cosmic Web, Crystal Lattice, Stellar Nebula.</p>
                  </div>
                </div>
              </section>

              {/* ─── QUICK TIPS ─── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 text-sm">11</span>
                  <h3 className="text-lg font-semibold text-zinc-100">Quick Tips</h3>
                </div>
                <ul className="space-y-2 text-[15px] text-zinc-400">
                  <li className="flex gap-3">
                    <span className="text-accent shrink-0 mt-0.5">◆</span>
                    <span>Start with a <strong className="text-zinc-200">single oscillator</strong> and a Classical preset, then add more for complexity</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent shrink-0 mt-0.5">◆</span>
                    <span>Use <strong className="text-zinc-200">complementary (m,n)&nbsp;+&nbsp;(n,m) pairs</strong> for symmetric mandala-like patterns with C₂ rotational symmetry</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent shrink-0 mt-0.5">◆</span>
                    <span><strong className="text-zinc-200">Higher frequencies</strong> produce denser nodal grids; lower frequencies give larger, simpler structures</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent shrink-0 mt-0.5">◆</span>
                    <span>Reduce <strong className="text-zinc-200">damping</strong> (→0.999) for fluid motion; increase for quick settling</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent shrink-0 mt-0.5">◆</span>
                    <span>Add <strong className="text-zinc-200">noise</strong> for an organic "sandblasted" look; reduce for crisp nodal lines</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent shrink-0 mt-0.5">◆</span>
                    <span>Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono text-zinc-300">V</kbd> for field overlay, <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono text-zinc-300">H</kbd> to hide the panel</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent shrink-0 mt-0.5">◆</span>
                    <span><strong className="text-zinc-200">⟲</strong> resets both zoom and pan; zoom always on via scroll wheel</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent shrink-0 mt-0.5">◆</span>
                    <span>Particles <strong className="text-zinc-200">wrap toroidally</strong> — the pattern repeats infinitely when panning</span>
                  </li>
                </ul>
              </section>

              <div className="h-4" />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
