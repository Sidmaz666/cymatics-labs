'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useChladniStore } from '@/lib/chladni-store'
import { OscillatorControl } from './oscillator-control'
import { COLOR_SCHEMES } from '@/lib/chladni-physics'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Play,
  Pause,
  Plus,
  Volume2,
  Save,
  Download,
  Upload,
  Atom,
  Sparkles,
  Zap,
  Palette,
  Square,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Circle,
  SquarePen,
  Mic,
  Music,
} from 'lucide-react'

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format = 'decimal',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format?: 'number' | 'decimal' | 'percent'
  onChange: (v: number) => void
}) {
  const fmt = (v: number) => {
    switch (format) {
      case 'number': return v.toLocaleString()
      case 'percent': return `${(v * 100).toFixed(0)}%`
      default: return v.toFixed(1)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-zinc-400 font-medium">{label}</Label>
        <span className="text-xs font-mono text-accent">{fmt(value)}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
    </div>
  )
}

function Section({
  icon: Icon,
  label,
  color,
  collapsible = true,
  defaultOpen = true,
  children,
}: {
  icon: React.ElementType
  label: string
  color: string
  collapsible?: boolean
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 space-y-3">
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left cursor-pointer"
        onClick={() => collapsible && setOpen(!open)}
      >
        <Icon className={`h-4 w-4 shrink-0 ${color}`} />
        <span className="text-sm font-medium text-zinc-200 flex-1">{label}</span>
        {collapsible && (
          open ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        )}
      </button>
      {(!collapsible || open) && children}
    </div>
  )
}

export function ControlPanel() {
  const {
    oscillators, addOscillator,
    simulation, updateSimulation,
    isPlaying, setPlaying,
    masterVolume, setMasterVolume,
    presets, loadPreset, savePreset, resetSimulation,
    micEnabled, setMicEnabled,
    audioFileName, setAudioFile,
  } = useChladniStore()
  const importRef = useRef<HTMLInputElement>(null)
  const audioFileInputRef = useRef<HTMLInputElement>(null)
  const [presetName, setPresetName] = useState('')
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleRecord = useCallback(() => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      return
    }
    const canvas = document.querySelector<HTMLCanvasElement>('canvas')
    if (!canvas) return
    try {
      const stream = canvas.captureStream(30)
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chladni-recording-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
        chunksRef.current = []
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      // captureStream not supported
    }
  }, [recording])

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.oscillators) {
          useChladniStore.setState({ oscillators: data.oscillators.map((o: any, i: number) => ({ ...o, id: `osc-${i}` })) })
        }
        if (data.simulation) {
          useChladniStore.getState().updateSimulation(data.simulation)
        }
      } catch { /* invalid file */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
      <div className="flex-shrink-0 p-3 border-b border-zinc-800 space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={micEnabled}
            onClick={() => setMicEnabled(!micEnabled)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${micEnabled ? 'bg-accent' : 'bg-zinc-700'}`}
          >
            <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${micEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
          <Label className="text-xs text-zinc-400 flex items-center gap-1.5 cursor-pointer" onClick={() => setMicEnabled(!micEnabled)}>
            <Mic className="h-3.5 w-3.5" />
            Capture Audio from the Device Microphone
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => audioFileInputRef.current?.click()}
          >
            <Music className="h-3 w-3 mr-1.5" />
            {audioFileName || 'Upload Audio'}
          </Button>
          <input
            ref={audioFileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) {
                const buffer = await file.arrayBuffer()
                setAudioFile(file.name, buffer)
              }
              e.target.value = ''
            }}
          />
        </div>

        <Button
          className="w-full bg-accent hover:bg-accent-darker text-white text-sm h-10 font-medium"
          onClick={() => setPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          {isPlaying ? 'Stop Simulation' : 'Start Simulation'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={resetSimulation}
        >
          <RotateCcw className="h-3 w-3 mr-1.5" />
          Reset Defaults
        </Button>

        {isPlaying && (
        <div className="flex gap-2">
        <Button
          variant={recording ? 'destructive' : 'outline'}
          size="sm"
          className={`flex-1 h-7 text-xs ${recording ? 'bg-red-600 hover:bg-red-500 text-white' : 'border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
          onClick={handleRecord}
        >
          <Circle className={`h-3 w-3 mr-1.5 ${recording ? 'animate-pulse' : ''}`} />
          {recording ? 'Stop' : 'Record'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-xs border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={() => {
            const canvas = document.querySelector<HTMLCanvasElement>('canvas')
            if (!canvas) return
            const link = document.createElement('a')
            link.download = `chladni-${Date.now()}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
          }}
        >
          <SquarePen className="h-3 w-3 mr-1.5" />
          Capture
        </Button>
        </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-accent" />
              Volume
            </Label>
            <span className="text-xs font-mono text-accent">{(masterVolume * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[masterVolume]}
            onValueChange={([v]) => setMasterVolume(v)}
            min={0} max={1} step={0.01}
          />
        </div>

      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth">
        <Section icon={Atom} label="Oscillators" color="text-accent">
          <div className="space-y-2">
            <div className="flex items-center justify-between -mt-1">
              <span className="text-[11px] text-zinc-500">
                {oscillators.filter((o) => o.enabled).length} active &middot; {oscillators.length} total
              </span>
              <Button
                size="sm"
                className="h-7 text-xs bg-accent hover:bg-accent-darker text-white font-medium px-3"
                onClick={addOscillator}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
              {oscillators.map((osc, i) => (
                <OscillatorControl key={osc.id} oscillator={osc} index={i} />
              ))}
            </div>
          </div>
        </Section>

        <Section icon={Sparkles} label="Particles" color="text-amber-400">
          <div className="space-y-3">
            <SliderRow label="Count" value={simulation.particleCount} min={5000} max={200000} step={5000} format="number" onChange={(v) => updateSimulation({ particleCount: v })} />
            <SliderRow label="Size" value={simulation.particleSize} min={0.5} max={8} step={0.5} onChange={(v) => updateSimulation({ particleSize: v })} />
          </div>
        </Section>

        <Section icon={Zap} label="Vibration" color="text-yellow-400">
          <div className="space-y-3">
            <SliderRow label="Intensity" value={simulation.vibrationIntensity} min={0.1} max={3} step={0.1} onChange={(v) => updateSimulation({ vibrationIntensity: v })} />
            <SliderRow label="Speed" value={simulation.speedMultiplier} min={0.1} max={3} step={0.1} onChange={(v) => updateSimulation({ speedMultiplier: v })} />
            <SliderRow label="Damping" value={simulation.dampingFactor} min={0.9} max={0.999} step={0.001} onChange={(v) => updateSimulation({ dampingFactor: v })} />
            <SliderRow label="Noise" value={simulation.noiseAmount} min={0} max={0.5} step={0.01} format="percent" onChange={(v) => updateSimulation({ noiseAmount: v })} />
          </div>
        </Section>

        <Section icon={Square} label="Plate" color="text-blue-400">
          <div className="space-y-3">
            <SliderRow label="Size" value={simulation.plateSize} min={1} max={4} step={0.1} onChange={(v) => updateSimulation({ plateSize: v })} />
          </div>
        </Section>

        <Section icon={Palette} label="Visual" color="text-purple-400">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Color Scheme</Label>
              <Select
                value={simulation.colorScheme}
                onValueChange={(v) => updateSimulation({ colorScheme: v as typeof simulation.colorScheme })}
              >
                <SelectTrigger className="h-8 bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {COLOR_SCHEMES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-zinc-200 text-xs focus:bg-zinc-700">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {simulation.colorScheme === 'custom' && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={simulation.customPrimary}
                      onChange={(e) => updateSimulation({ customPrimary: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-[11px] font-mono text-zinc-500">{simulation.customPrimary}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={simulation.customSecondary}
                      onChange={(e) => updateSimulation({ customSecondary: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-[11px] font-mono text-zinc-500">{simulation.customSecondary}</span>
                  </div>
                </div>
              </>
            )}

            <SliderRow label="Glow" value={simulation.glowIntensity} min={0} max={1} step={0.05} format="percent" onChange={(v) => updateSimulation({ glowIntensity: v })} />
            <SliderRow label="Brightness" value={simulation.brightness} min={0.5} max={2} step={0.1} onChange={(v) => updateSimulation({ brightness: v })} />
            <div className="flex items-center justify-between pt-1">
              <Label className="text-xs text-zinc-400">Field Overlay</Label>
              <Switch
                checked={simulation.showFieldOverlay}
                onCheckedChange={(v) => updateSimulation({ showFieldOverlay: v })}
                className="data-[state=checked]:bg-accent"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-400">Background Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={simulation.backgroundColor}
                  onChange={(e) => updateSimulation({ backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="text-[11px] font-mono text-zinc-500">{simulation.backgroundColor}</span>
              </div>
            </div>
          </div>
        </Section>

        <Section icon={Save} label="Presets" color="text-cyan-400">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Name..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="h-8 text-xs bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
              />
              <Button
                size="sm"
                className="h-8 shrink-0 bg-accent hover:bg-accent-darker text-white"
                disabled={!presetName.trim()}
                onClick={() => { savePreset(presetName.trim()); setPresetName('') }}
              >
                <Save className="h-3.5 w-3.5" />
              </Button>
            </div>
            {presets.length > 0 && (
              <div className="grid gap-1.5 max-h-40 overflow-y-auto">
                {presets.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-7 text-xs border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                    onClick={() => loadPreset(p.id)}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto text-[10px] text-zinc-500 shrink-0">{p.oscillators.length} osc</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Section>

        <Section icon={Download} label="Export / Import" color="text-orange-400" collapsible={false}>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
              onClick={() => {
                const blob = new Blob([JSON.stringify({ oscillators, simulation }, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'chladni-config.json'
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
              onClick={() => importRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Import
            </Button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </Section>
      </div>
    </div>
  )
}
