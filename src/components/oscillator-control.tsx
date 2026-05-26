'use client'

import { useState } from 'react'
import { useChladniStore } from '@/lib/chladni-store'
import { OscillatorConfig, OscillatorType, FREQUENCY_PRESETS } from '@/lib/chladni-physics'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const INDICATOR_COLORS = [
  'bg-amber-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-accent',
  'bg-purple-500',
  'bg-orange-500',
]

const WAVEFORMS: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle']

interface Props {
  oscillator: OscillatorConfig
  index: number
}

export function OscillatorControl({ oscillator, index }: Props) {
  const { updateOscillator, removeOscillator, oscillators } = useChladniStore()
  const [expanded, setExpanded] = useState(true)
  const canDelete = oscillators.length > 1

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50">
      <div className="flex items-center px-3 py-2.5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Switch
            checked={oscillator.enabled}
            onCheckedChange={(v) => updateOscillator(oscillator.id, { enabled: v })}
            className="data-[state=checked]:bg-accent shrink-0"
          />
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${INDICATOR_COLORS[index % INDICATOR_COLORS.length]}`} />
            <span className="text-sm font-medium text-zinc-100">
              Osc {index + 1}
            </span>
          </div>
          <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-300 shrink-0">
            ({oscillator.modeM},{oscillator.modeN})
          </Badge>
          <Badge className="text-xs bg-zinc-700 text-zinc-200 shrink-0">
            {oscillator.frequency.toFixed(0)}Hz
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-700 shrink-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-3.5 border-t border-zinc-700/50 pt-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Frequency</Label>
              <span className="text-xs font-mono text-accent">{oscillator.frequency.toFixed(1)} Hz</span>
            </div>
            <Slider
              value={[oscillator.frequency]}
              onValueChange={([v]) => updateOscillator(oscillator.id, { frequency: v })}
              min={20} max={2000} step={0.1}
            />
            <div className="flex gap-1 flex-wrap pt-0.5">
              {FREQUENCY_PRESETS.map((freq) => (
                <Button
                  key={freq}
                  variant="outline"
                  size="sm"
                  className={`h-6 text-[10px] px-2 border-zinc-600 font-medium ${
                    Math.abs(oscillator.frequency - freq) < 1
                      ? 'bg-accent text-white border-accent hover:bg-accent-darker'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-700'
                  }`}
                  onClick={() => updateOscillator(oscillator.id, { frequency: freq })}
                >
                  {freq}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Amplitude</Label>
              <span className="text-xs font-mono text-accent">{(oscillator.amplitude * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[oscillator.amplitude]}
              onValueChange={([v]) => updateOscillator(oscillator.id, { amplitude: v })}
              min={0} max={2} step={0.01}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Waveform</Label>
              <Select
                value={oscillator.waveform}
                onValueChange={(v: OscillatorType) => updateOscillator(oscillator.id, { waveform: v })}
              >
                <SelectTrigger className="h-8 bg-zinc-700 border-zinc-600 text-zinc-100 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-700 border-zinc-600">
                  {WAVEFORMS.map((wf) => (
                    <SelectItem key={wf} value={wf} className="text-zinc-100 capitalize text-xs focus:bg-zinc-600">
                      {wf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400">Detune</Label>
                <span className="text-xs font-mono text-accent">{oscillator.detune}c</span>
              </div>
              <Slider
                value={[oscillator.detune]}
                onValueChange={([v]) => updateOscillator(oscillator.id, { detune: v })}
                min={-100} max={100} step={1}
              />
            </div>
          </div>

          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 mt-1"
              onClick={() => removeOscillator(oscillator.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete Oscillator
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
