'use client';

import { useState } from 'react';
import { useChladniStore, OscillatorConfig } from '@/lib/chladni-store';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  Waves,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OscillatorControlProps {
  oscillator: OscillatorConfig;
  index: number;
}

export function OscillatorControl({ oscillator, index }: OscillatorControlProps) {
  const { updateOscillator, removeOscillator } = useChladniStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const waveforms: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];

  const indicatorColors = [
    'bg-amber-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
  ];

  return (
    <Card className={cn(
      "transition-all duration-200 bg-zinc-900 border-zinc-800",
      !oscillator.enabled && "opacity-60"
    )}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              checked={oscillator.enabled}
              onCheckedChange={(checked) => 
                updateOscillator(oscillator.id, { enabled: checked })
              }
              className="data-[state=checked]:bg-amber-600"
            />
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-200">
                <div className={cn("w-2 h-2 rounded-full", indicatorColors[index % indicatorColors.length])} />
                <Waves className="h-4 w-4 text-zinc-400" />
                Oscillator {index + 1}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                  M={oscillator.modeM}, N={oscillator.modeN}
                </Badge>
                <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-300">
                  {oscillator.frequency.toFixed(0)} Hz
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-zinc-800"
              onClick={() => removeOscillator(oscillator.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4">
          {/* Mode Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Mode M</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[oscillator.modeM]}
                  onValueChange={([value]) => 
                    updateOscillator(oscillator.id, { modeM: value })
                  }
                  min={1}
                  max={20}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={oscillator.modeM}
                  onChange={(e) => 
                    updateOscillator(oscillator.id, { 
                      modeM: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) 
                    })
                  }
                  className="w-14 h-8 text-center bg-zinc-800 border-zinc-700 text-zinc-200"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Mode N</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[oscillator.modeN]}
                  onValueChange={([value]) => 
                    updateOscillator(oscillator.id, { modeN: value })
                  }
                  min={1}
                  max={20}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={oscillator.modeN}
                  onChange={(e) => 
                    updateOscillator(oscillator.id, { 
                      modeN: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) 
                    })
                  }
                  className="w-14 h-8 text-center bg-zinc-800 border-zinc-700 text-zinc-200"
                />
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Frequency</Label>
              <span className="text-xs font-mono text-zinc-500">{oscillator.frequency.toFixed(1)} Hz</span>
            </div>
            <Slider
              value={[oscillator.frequency]}
              onValueChange={([value]) => 
                updateOscillator(oscillator.id, { frequency: value })
              }
              min={20}
              max={2000}
              step={0.1}
              className="w-full"
            />
            <div className="flex gap-1 flex-wrap">
              {[55, 110, 220, 330, 440, 660, 880].map((freq) => (
                <Button
                  key={freq}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  onClick={() => updateOscillator(oscillator.id, { frequency: freq })}
                >
                  {freq}
                </Button>
              ))}
            </div>
          </div>

          {/* Amplitude */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Amplitude</Label>
              <span className="text-xs font-mono text-zinc-500">{(oscillator.amplitude * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[oscillator.amplitude]}
              onValueChange={([value]) => 
                updateOscillator(oscillator.id, { amplitude: value })
              }
              min={0}
              max={2}
              step={0.01}
              className="w-full"
            />
          </div>

          {/* Waveform */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Waveform</Label>
            <Select
              value={oscillator.waveform}
              onValueChange={(value: OscillatorType) => 
                updateOscillator(oscillator.id, { waveform: value })
              }
            >
              <SelectTrigger className="h-8 bg-zinc-800 border-zinc-700 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {waveforms.map((wf) => (
                  <SelectItem key={wf} value={wf} className="text-zinc-200 capitalize focus:bg-zinc-700">
                    {wf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Detune */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">Detune</Label>
              <span className="text-xs font-mono text-zinc-500">{oscillator.detune} cents</span>
            </div>
            <Slider
              value={[oscillator.detune]}
              onValueChange={([value]) => 
                updateOscillator(oscillator.id, { detune: value })
              }
              min={-100}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
