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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Settings2,
  Waves,
  Save,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  Atom,
  Zap,
  Activity,
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
      {/* Play/Pause Header */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-800 space-y-4 bg-zinc-950">
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
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
            <Label className="text-xs text-zinc-400 flex items-center gap-2">
              {masterVolume > 0 ? (
                <Volume2 className="h-3 w-3" />
              ) : (
                <VolumeX className="h-3 w-3" />
              )}
              Master Volume
            </Label>
            <span className="text-xs font-mono text-zinc-400">{(masterVolume * 100).toFixed(0)}%</span>
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

      {/* Tabs */}
      <Tabs defaultValue="oscillators" className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 mx-4 mt-2 bg-zinc-900">
          <TabsTrigger value="oscillators" className="text-xs data-[state=active]:bg-zinc-800">
            <Waves className="h-3 w-3 mr-1" />
            Oscillators
          </TabsTrigger>
          <TabsTrigger value="physics" className="text-xs data-[state=active]:bg-zinc-800">
            <Atom className="h-3 w-3 mr-1" />
            Physics
          </TabsTrigger>
          <TabsTrigger value="visual" className="text-xs data-[state=active]:bg-zinc-800">
            <Palette className="h-3 w-3 mr-1" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="presets" className="text-xs data-[state=active]:bg-zinc-800">
            <Save className="h-3 w-3 mr-1" />
            Presets
          </TabsTrigger>
        </TabsList>

        {/* Oscillators Tab */}
        <TabsContent value="oscillators" className="flex-1 min-h-0 m-0 mt-2">
          <ScrollArea className="h-full">
            <div className="p-4 pt-0 space-y-4">
              {/* Oscillator List */}
              {oscillators.map((osc, index) => (
                <OscillatorControl
                  key={osc.id}
                  oscillator={osc}
                  index={index}
                />
              ))}
              
              {/* Add Oscillator Button */}
              <Button
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                onClick={addOscillator}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Oscillator
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Physics Tab */}
        <TabsContent value="physics" className="flex-1 min-h-0 m-0 mt-2">
          <ScrollArea className="h-full">
            <div className="p-4 pt-0 space-y-4">
              {/* Particle Settings */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Particles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              {/* Vibration Settings */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Vibration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              {/* Physics Settings */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    Motion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              {/* Plate Settings */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-zinc-200">Plate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SliderControl
                    label="Size"
                    value={simulation.plateSize}
                    min={1}
                    max={4}
                    step={0.1}
                    format="decimal"
                    onChange={(v) => updateSimulation({ plateSize: v })}
                  />
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-zinc-400">Symmetry Lock</Label>
                    <Switch
                      checked={simulation.symmetryLock}
                      onCheckedChange={(checked) => 
                        updateSimulation({ symmetryLock: checked })
                      }
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
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Visual Tab */}
        <TabsContent value="visual" className="flex-1 min-h-0 m-0 mt-2">
          <ScrollArea className="h-full">
            <div className="p-4 pt-0 space-y-4">
              {/* Color Settings */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-purple-500" />
                    Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">Color Scheme</Label>
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
                          <SelectItem key={scheme.value} value={scheme.value} className="text-zinc-200 focus:bg-zinc-700">
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
                </CardContent>
              </Card>

              {/* Field Visualization */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-zinc-200">Overlay</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-zinc-400 flex items-center gap-2">
                      {simulation.showFieldVisualization ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      Show Field Overlay
                    </Label>
                    <Switch
                      checked={simulation.showFieldVisualization}
                      onCheckedChange={(checked) => 
                        updateSimulation({ showFieldVisualization: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Export */}
              <Button 
                variant="outline" 
                className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800" 
                onClick={exportConfig}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Configuration
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="flex-1 min-h-0 m-0 mt-2">
          <ScrollArea className="h-full">
            <div className="p-4 pt-0 space-y-4">
              {/* Save Preset */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-zinc-200">Save Current Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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
                      className="bg-amber-600 hover:bg-amber-500"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Separator className="bg-zinc-800" />
              
              {/* Preset List */}
              <div className="space-y-2">
                <Label className="text-xs text-zinc-400">Load Preset</Label>
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    className="w-full justify-start border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                    onClick={() => loadPreset(preset.id)}
                  >
                    {preset.name}
                    <span className="ml-auto text-xs text-zinc-500">
                      {preset.oscillators.length} osc
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
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
        <Label className="text-xs text-zinc-400">{label}</Label>
        <span className="text-xs font-mono text-zinc-500">{formatValue(value)}</span>
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
