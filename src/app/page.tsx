'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { SimulationCanvas } from '@/components/chladni-simulation-canvas';
import { ControlPanel } from '@/components/control-panel';
import { useChladniStore } from '@/lib/chladni-store';
import { ChladniSimulation, ChladniSimulationCPU } from '@/lib/chladni-simulation';
import { getAudioEngine } from '@/lib/audio-engine';
import { Button } from '@/components/ui/button';
import {
  PanelLeftClose,
  PanelLeft,
  Maximize2,
  Minimize2,
  Info,
  Github,
  Keyboard,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const simulationRef = useRef<ChladniSimulation | ChladniSimulationCPU | null>(null);
  const audioEngineRef = useRef(getAudioEngine());
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const {
    oscillators,
    isPlaying,
    masterVolume,
    showControls,
    setShowControls,
  } = useChladniStore();

  // Handle simulation ready
  const handleSimulationReady = useCallback((simulation: ChladniSimulation | ChladniSimulationCPU) => {
    simulationRef.current = simulation;
  }, []);

  // Initialize audio engine
  useEffect(() => {
    const engine = audioEngineRef.current;
    
    return () => {
      engine.destroy();
    };
  }, []);

  // Sync oscillators with audio engine
  useEffect(() => {
    const engine = audioEngineRef.current;
    const currentOscIds = new Set(oscillators.map((o) => o.id));
    const engineOscIds = new Set(Array.from(engine['oscillators'].keys()));
    
    // Add new oscillators
    oscillators.forEach((osc) => {
      if (!engineOscIds.has(osc.id)) {
        engine.addOscillator(osc);
      } else {
        engine.updateOscillator(osc.id, osc);
      }
    });
    
    // Remove oscillators that no longer exist
    engineOscIds.forEach((id) => {
      if (!currentOscIds.has(id)) {
        engine.removeOscillator(id);
      }
    });
  }, [oscillators]);

  // Handle play/pause with audio
  useEffect(() => {
    const engine = audioEngineRef.current;
    
    if (isPlaying) {
      engine.initialize().then(() => {
        engine.start();
      });
    } else {
      engine.stop();
    }
  }, [isPlaying]);

  // Handle master volume
  useEffect(() => {
    const engine = audioEngineRef.current;
    engine.setMasterVolume(masterVolume);
  }, [masterVolume]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/20 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowControls(!showControls)}
            className="text-white/70 hover:text-white"
          >
            {showControls ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-white font-semibold text-lg">
              Chladni Pattern Simulator
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Keyboard Shortcuts Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                <Keyboard className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Keyboard Shortcuts</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Play/Pause</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Space</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add oscillator</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Shift+O</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reset particles</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">R</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Toggle controls</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">H</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Toggle field visualization</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">V</kbd>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Toggle oscillator 1-4</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">1-4</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Change mode M</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">↑ / ↓</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Change mode N</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">← / →</kbd>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* About Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                <Info className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>About Chladni Patterns</DialogTitle>
                <DialogDescription>
                  A physics-based simulation of Chladni figures
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Chladni patterns</strong> are formed when a 
                  flat surface, covered with sand or similar particles, is vibrated at specific 
                  frequencies. Named after German physicist Ernst Chladni (1756–1827), these patterns 
                  reveal the nodal lines—regions of minimal vibration—where particles accumulate.
                </p>
                <p>
                  <strong className="text-foreground">The Physics:</strong> For a square plate, 
                  the vibration pattern is described by the equation:
                </p>
                <div className="bg-muted p-3 rounded-lg font-mono text-center">
                  z(x,y) = cos(mπx)·cos(nπy) − cos(nπx)·cos(mπy)
                </div>
                <p>
                  Where <strong className="text-foreground">m</strong> and <strong className="text-foreground">n</strong> are 
                  mode numbers that determine the pattern&apos;s complexity. Different combinations 
                  create different geometric shapes.
                </p>
                <p>
                  <strong className="text-foreground">How to use:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Add multiple oscillators to create complex interference patterns</li>
                  <li>Adjust mode numbers (M, N) to change the geometric pattern</li>
                  <li>Control frequency, amplitude, and waveform for each oscillator</li>
                  <li>Experiment with particle count and physics settings</li>
                  <li>Try different color schemes for visualization</li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white/70 hover:text-white"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white"
          >
            <Button variant="ghost" size="icon">
              <Github className="h-5 w-5" />
            </Button>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Simulation Canvas */}
        <div className={`flex-1 relative transition-all duration-300 ${showControls ? 'mr-[360px]' : ''}`}>
          <SimulationCanvas onSimulationReady={handleSimulationReady} />
          
          {/* Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/40 backdrop-blur-sm flex items-center px-4 text-xs text-white/50 font-mono">
            <span>
              {isPlaying ? '▶ Playing' : '⏸ Paused'}
            </span>
            <span className="mx-4">|</span>
            <span>
              {oscillators.filter((o) => o.enabled).length} active mode{oscillators.filter((o) => o.enabled).length !== 1 ? 's' : ''}
            </span>
            <span className="mx-4">|</span>
            <span>
              {oscillators.filter((o) => o.enabled).map((o) => `(${o.modeM},${o.modeN})`).join(' + ') || 'No modes'}
            </span>
          </div>
        </div>

        {/* Control Panel */}
        <div
          className={`fixed top-14 right-0 bottom-0 w-[360px] transition-transform duration-300 z-40 ${
            showControls ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <ControlPanel />
        </div>
      </div>
    </main>
  );
}
