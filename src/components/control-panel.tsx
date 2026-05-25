'use client';

import { useChladniStore } from '@/lib/chladni-store';
import { OscillatorControl } from './oscillator-control';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Play,
  Pause,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
  Palette,
  Save,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  Atom,
  Zap,
  Activity,
  Square,
  Settings,
} from 'lucide-react';
import { useState } from 'react';

export function ControlPanel() {
  const {
    oscillators,
    addOscillator,
    simulation,
    updateSimulation,
    isPlaying,
    setPlaying,
    masterVolume,
    setMasterVolume,
    presets,
    loadPreset,
    savePreset,
    resetSimulation,
  } = useChladniStore();
  
  const [newPresetName, setNewPresetName] = useState('');

  const colorSchemes = [
    { value: 'classic', label: 'Classic Sand' },
    { value: 'rainbow', label: 'Rainbow' },
    { value: 'heat', label: 'Heat Map' },
    { value: 'ocean', label: 'Ocean' },
    { value: 'neon', label: 'Neon' },
  ];

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      savePreset(newPresetName.trim());
      setNewPresetName('');
    }
  };

  const exportConfig = () => {
    const config = { oscillators, simulation };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chladni-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
      {/* Play/Pause Header - FIXED, NOT SCROLLABLE */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-800 space-y-4 bg-zinc-950">
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            size="lg"
            onClick={() => setPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={resetSimulation}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Master Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-zinc-300 font-medium flex items-center gap-2">
              {masterVolume > 0 ? (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-zinc-500" />
              )}
              Master Volume
            </Label>
            <span className="text-sm font-mono text-emerald-400 font-medium">{(masterVolume * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[masterVolume]}
            onValueChange={([value]) => setMasterVolume(value)}
            min={0}
            max={1}
            step={0.01}
            className="w-full"
          />
        </div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          <Accordion type="multiple" defaultValue={['oscillators', 'particles', 'vibration', 'motion', 'visual']} className="space-y-2">
            
            {/* Oscillators Section */}
            <AccordionItem value="oscillators" className="bg-zinc-900 border border-zinc-800 rounded-lg px-4">
              <AccordionTrigger className="text-zinc-200 hover:text-white hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Atom className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">Oscillators</span>
                  <span className="text-xs text-zinc-500 font-normal">({oscillators.filter(o => o.enabled).length} active)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-3">
                  {oscillators.map((osc, index) => (
                    <OscillatorControl
                      key={osc.id}
                      oscillator={osc}
                      index={index}
                    />
                  ))}
                  
                  <Button
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 font-medium mt-2"
                    onClick={addOscillator}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Oscillator
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Particles Section */}
            <AccordionItem value="particles" className="bg-zinc-900 border border-zinc-800 rounded-lg px-4">
              <AccordionTrigger className="text-zinc-200 hover:text-white hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="font-medium">Particles</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4">
                  <SliderControl
                    label="Count"
                    value={simulation.particleCount}
                    min={5000}
                    max={200000}
                    step={5000}
                    format="number"
                    onChange={(v) => updateSimulation({ particleCount: v })}
                  />
                  <SliderControl
                    label="Size"
                    value={simulation.particleSize}
                    min={0.5}
                    max={8}
                    step={0.5}
                    format="decimal"
                    onChange={(v) => updateSimulation({ particleSize: v })}
                  />
                  <SliderControl
                    label="Density"
                    value={simulation.particleDensity}
                    min={0.1}
                    max={3}
                    step={0.1}
                    format="decimal"
                    onChange={(v) => updateSimulation({ particleDensity: v })}
                  />
                  <SliderControl
                    label="Mass"
                    value={simulation.particleMass}
                    min={0.1}
                    max={5}
                    step={0.1}
                    format="decimal"
                    onChange={(v) => updateSimulation({ particleMass: v })}
                  />
                  <SliderControl
                    label="Trail Persistence"
                    value={simulation.particleTrail}
                    min={0}
                    max={0.95}
                    step={0.05}
                    format="percent"
                    onChange={(v) => updateSimulation({ particleTrail: v })}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Vibration Section */}
            <AccordionItem value="vibration" className="bg-zinc-900 border border-zinc-800 rounded-lg px-4">
              <AccordionTrigger className="text-zinc-200 hover:text-white hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">Vibration</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4">
                  <SliderControl
                    label="Intensity"
                    value={simulation.vibrationIntensity}
                    min={0.1}
                    max={3}
                    step={0.1}
                    format="decimal"
                    onChange={(v) => updateSimulation({ vibrationIntensity: v })}
                  />
                  <SliderControl
                    label="Frequency Multiplier"
                    value={simulation.vibrationFrequency}
                    min={0.1}
                    max={3}
                    step={0.1}
                    format="decimal"
                    onChange={(v) => updateSimulation({ vibrationFrequency: v })}
                  />
                  <SliderControl
                    label="Harmonic Strength"
                    value={simulation.harmonicStrength}
                    min={0}
                    max={1}
                    step={0.05}
                    format="percent"
                    onChange={(v) => updateSimulation({ harmonicStrength: v })}
                  />
                  <SliderControl
                    label="Mode Mixing"
                    value={simulation.modeMixing}
                    min={0}
                    max={1}
                    step={0.05}
                    format="percent"
                    onChange={(v) => updateSimulation({ modeMixing: v })}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Motion Section */}
            <AccordionItem value="motion" className="bg-zinc-900 border border-zinc-800 rounded-lg px-4">
              <AccordionTrigger className="text-zinc-200 hover:text-white hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-400" />
                  <span className="font-medium">Motion</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4">
                  <SliderControl
                    label="Damping"
                    value={simulation.dampingFactor}
                    min={0.9}
                    max={0.999}
                    step={0.001}
                    format="decimal3"
                    onChange={(v) => updateSimulation({ dampingFactor: v })}
                  />
                  <SliderControl
                    label="Noise"
                    value={simulation.noiseAmount}
                    min={0}
                    max={0.5}
                    step={0.01}
                    format="percent"
                    onChange={(v) => updateSimulation({ noiseAmount: v })}
                  />
                  <SliderControl
                    label="Speed"
                    value={simulation.speedMultiplier}
                    min={0.1}
                    max={3}
                    step={0.1}
                    format="decimal"
                    onChange={(v) => updateSimulation({ speedMultiplier: v })}
                  />
                  <SliderControl
                    label="Gravity"
                    value={simulation.gravity}
                    min={0}
                    max={0.01}
                    step={0.0005}
                    format="decimal4"
                    onChange={(v) => updateSimulation({ gravity: v })}
                  />
                  <SliderControl
                    label="Friction"
                    value={simulation.friction}
                    min={0}
                    max={0.1}
                    step={0.005}
                    format="decimal3"
                    onChange={(v) => updateSimulation({ friction: v })}
                  />
                  <SliderControl
                    label="Bounce"
                    value={simulation.bounceCoefficient}
                    min={0}
                    max={1}
                    step={0.05}
                    format="percent"
                    onChange={(v) => updateSimulation({ bounceCoefficient: v })}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Plate Section */}
            <AccordionItem value="plate" className="bg-zinc-900 border border-zinc-800 rounded-lg px-4">
              <AccordionTrigger className="text-zinc-200 hover:text-white hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-blue-400" />
                  <span className="font-medium">Plate</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4">
                  <SliderControl
                    label="Size"
                    value={simulation.plateSize}
                    min={1}
                    max={4}
                    step={0.1}
                    format="decimal"
                    onChange={(v) => updateSimulation({ plateSize: v })}
                  />
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm text-zinc-300 font-medium">Symmetry Lock</Label>
                    <Switch
                      checked={simulation.symmetryLock}
                      onCheckedChange={(checked) => 
                        updateSimulation({ symmetryLock: checked })
                      }
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>
                  <SliderControl
                    label="Time Evolution"
                    value={simulation.timeEvolution}
                    min={0}
                    max={1}
                    step={0.05}
                    format="percent"
                    onChange={(v) => updateSimulation({ timeEvolution: v })}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Visual Section */}
            <AccordionItem value="visual" className="bg-zinc-900 border border-zinc-800 rounded-lg px-4">
              <AccordionTrigger className="text-zinc-200 hover:text-white hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-purple-400" />
                  <span className="font-medium">Visual</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-zinc-300 font-medium">Color Scheme</Label>
                    <Select
                      value={simulation.colorScheme}
                      onValueChange={(value) => 
                        updateSimulation({ colorScheme: value as typeof simulation.colorScheme })
                      }
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {colorSchemes.map((scheme) => (
                          <SelectItem key={scheme.value} value={scheme.value} className="text-zinc-200 focus:bg-zinc-700 focus:text-white">
                            {scheme.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <SliderControl
                    label="Glow Intensity"
                    value={simulation.glowIntensity}
                    min={0}
                    max={1}
                    step={0.05}
                    format="percent"
                    onChange={(v) => updateSimulation({ glowIntensity: v })}
                  />
                  <SliderControl
                    label="Contrast Boost"
                    value={simulation.contrastBoost}
                    min={0}
                    max={1}
                    step={0.05}
                    format="percent"
                    onChange={(v) => updateSimulation({ contrastBoost: v })}
                  />
                  <SliderControl
                    label="Brightness"
                    value={simulation.brightness}
                    min={0.5}
                    max={2}
                    step={0.1}
                    format="decimal"
                    onChange={(v) => updateSimulation({ brightness: v })}
                  />
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                      {simulation.showFieldVisualization ? (
                        <Eye className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-zinc-500" />
                      )}
                      Show Field Overlay
                    </Label>
                    <Switch
                      checked={simulation.showFieldVisualization}
                      onCheckedChange={(checked) => 
                        updateSimulation({ showFieldVisualization: checked })
                      }
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Presets Section */}
            <AccordionItem value="presets" className="bg-zinc-900 border border-zinc-800 rounded-lg px-4">
              <AccordionTrigger className="text-zinc-200 hover:text-white hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4 text-cyan-400" />
                  <span className="font-medium">Presets</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-zinc-300 font-medium">Save Current Setup</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Preset name..."
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
                      />
                      <Button 
                        onClick={handleSavePreset} 
                        disabled={!newPresetName.trim()}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {presets.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-zinc-400">Load Preset</Label>
                      <div className="grid gap-2">
                        {presets.map((preset) => (
                          <Button
                            key={preset.id}
                            variant="outline"
                            className="w-full justify-start border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 font-medium"
                            onClick={() => loadPreset(preset.id)}
                          >
                            <span className="truncate">{preset.name}</span>
                            <span className="ml-auto text-xs text-zinc-500 shrink-0">
                              {preset.oscillators.length} osc
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Export Section */}
            <AccordionItem value="export" className="bg-zinc-900 border border-zinc-800 rounded-lg px-4">
              <AccordionTrigger className="text-zinc-200 hover:text-white hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-orange-400" />
                  <span className="font-medium">Export</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <Button 
                  variant="outline" 
                  className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 font-medium" 
                  onClick={exportConfig}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

// Helper component for slider controls
function SliderControl({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: 'number' | 'decimal' | 'decimal3' | 'decimal4' | 'percent';
  onChange: (value: number) => void;
}) {
  const formatValue = (v: number) => {
    switch (format) {
      case 'number':
        return v.toLocaleString();
      case 'decimal':
        return v.toFixed(1);
      case 'decimal3':
        return v.toFixed(3);
      case 'decimal4':
        return v.toFixed(4);
      case 'percent':
        return `${(v * 100).toFixed(0)}%`;
      default:
        return v.toString();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-zinc-400">{label}</Label>
        <span className="text-sm font-mono text-emerald-400">{formatValue(value)}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}
