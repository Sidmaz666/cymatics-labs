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
  CardDescription,
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
  Upload,
  Eye,
  EyeOff,
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
    <div className="h-full flex flex-col bg-background border-l">
      {/* Play/Pause Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center gap-2">
          <Button
            className="flex-1"
            size="lg"
            onClick={() => setPlaying(!isPlaying)}
            variant={isPlaying ? 'destructive' : 'default'}
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
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Master Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              {masterVolume > 0 ? (
                <Volume2 className="h-3 w-3" />
              ) : (
                <VolumeX className="h-3 w-3" />
              )}
              Master Volume
            </Label>
            <span className="text-xs font-mono">{(masterVolume * 100).toFixed(0)}%</span>
          </div>
          <Slider
            value={[masterVolume]}
            onValueChange={([value]) => setMasterVolume(value)}
            min={0}
            max={1}
            step={0.01}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="oscillators" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="oscillators" className="text-xs">
            <Waves className="h-3 w-3 mr-1" />
            Oscillators
          </TabsTrigger>
          <TabsTrigger value="simulation" className="text-xs">
            <Settings2 className="h-3 w-3 mr-1" />
            Simulation
          </TabsTrigger>
          <TabsTrigger value="presets" className="text-xs">
            <Save className="h-3 w-3 mr-1" />
            Presets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="oscillators" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
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
                className="w-full"
                onClick={addOscillator}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Oscillator
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="simulation" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Particle Settings */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Particles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Count</Label>
                      <span className="text-xs font-mono">{simulation.particleCount.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[simulation.particleCount]}
                      onValueChange={([value]) => 
                        updateSimulation({ particleCount: value })
                      }
                      min={5000}
                      max={200000}
                      step={5000}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Size</Label>
                      <span className="text-xs font-mono">{simulation.particleSize.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[simulation.particleSize]}
                      onValueChange={([value]) => 
                        updateSimulation({ particleSize: value })
                      }
                      min={0.5}
                      max={8}
                      step={0.5}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Physics Settings */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Physics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Damping</Label>
                      <span className="text-xs font-mono">{simulation.dampingFactor.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[simulation.dampingFactor]}
                      onValueChange={([value]) => 
                        updateSimulation({ dampingFactor: value })
                      }
                      min={0.9}
                      max={0.999}
                      step={0.001}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Noise</Label>
                      <span className="text-xs font-mono">{(simulation.noiseAmount * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[simulation.noiseAmount]}
                      onValueChange={([value]) => 
                        updateSimulation({ noiseAmount: value })
                      }
                      min={0}
                      max={0.5}
                      step={0.01}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Speed</Label>
                      <span className="text-xs font-mono">{simulation.speedMultiplier.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[simulation.speedMultiplier]}
                      onValueChange={([value]) => 
                        updateSimulation({ speedMultiplier: value })
                      }
                      min={0.1}
                      max={3}
                      step={0.1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Plate Size</Label>
                      <span className="text-xs font-mono">{simulation.plateSize.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[simulation.plateSize]}
                      onValueChange={([value]) => 
                        updateSimulation({ plateSize: value })
                      }
                      min={1}
                      max={4}
                      step={0.1}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Visual Settings */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Color Scheme</Label>
                    <Select
                      value={simulation.colorScheme}
                      onValueChange={(value) => 
                        updateSimulation({ colorScheme: value as typeof simulation.colorScheme })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorSchemes.map((scheme) => (
                          <SelectItem key={scheme.value} value={scheme.value}>
                            {scheme.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Field Visualization Toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
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
              <Button variant="outline" className="w-full" onClick={exportConfig}>
                <Download className="h-4 w-4 mr-2" />
                Export Configuration
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="presets" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Save Preset */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Save Current Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Preset name..."
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                    />
                    <Button onClick={handleSavePreset} disabled={!newPresetName.trim()}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Separator />
              
              {/* Preset List */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Load Preset</Label>
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => loadPreset(preset.id)}
                  >
                    {preset.name}
                    <span className="ml-auto text-xs text-muted-foreground">
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
