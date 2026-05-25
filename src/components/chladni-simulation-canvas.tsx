'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ChladniSimulation } from '@/lib/chladni-simulation';
import { useChladniStore } from '@/lib/chladni-store';
import { FieldVisualization } from './field-visualization';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

interface SimulationCanvasProps {
  onSimulationReady?: (simulation: ChladniSimulation) => void;
}

export function SimulationCanvas({ onSimulationReady }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<ChladniSimulation | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { oscillators, simulation: config, isPlaying } = useChladniStore();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize simulation
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const simulation = new ChladniSimulation(canvasRef.current, config);
    simulationRef.current = simulation;
    onSimulationReady?.(simulation);
    
    // Handle resize
    const handleResize = () => {
      simulation.resize();
    };
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver for container resize
    const resizeObserver = new ResizeObserver(() => {
      simulation.resize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      simulation.destroy();
    };
  }, []);

  // Update modes when oscillators change
  useEffect(() => {
    if (!simulationRef.current) return;
    
    const modes = oscillators
      .filter((osc) => osc.enabled)
      .map((osc) => ({
        m: osc.modeM,
        n: osc.modeN,
        amplitude: osc.amplitude,
      }));
    
    simulationRef.current.setModes(modes);
  }, [oscillators]);

  // Update config
  useEffect(() => {
    if (!simulationRef.current) return;
    simulationRef.current.updateConfig(config);
  }, [config]);

  // Play/pause
  useEffect(() => {
    if (!simulationRef.current) return;
    
    if (isPlaying) {
      simulationRef.current.start();
    } else {
      simulationRef.current.stop();
    }
  }, [isPlaying]);

  const resetSimulation = useCallback(() => {
    simulationRef.current?.reset();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0a0a0f]">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* Field Visualization Overlay */}
      <FieldVisualization visible={config.showFieldVisualization} />
      
      {/* Overlay controls */}
      <div className="absolute bottom-12 left-4 flex gap-2">
        <button
          onClick={resetSimulation}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg backdrop-blur-sm transition-colors"
        >
          Reset Particles
        </button>
      </div>
      
      {/* Mode indicator */}
      <div className="absolute top-4 left-4 text-white/60 text-sm font-mono">
        {oscillators.filter((o) => o.enabled).length > 0 ? (
          <div className="space-y-1">
            {oscillators
              .filter((o) => o.enabled)
              .map((osc, i) => (
                <div key={osc.id} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    ['bg-amber-400', 'bg-cyan-400', 'bg-pink-400', 'bg-green-400'][i % 4]
                  }`} />
                  Mode ({osc.modeM}, {osc.modeN}) @ {osc.frequency.toFixed(1)} Hz
                </div>
              ))}
          </div>
        ) : (
          <div className="text-white/40">No active modes - press Play to start</div>
        )}
      </div>
      
      {/* Particle count */}
      <div className="absolute top-4 right-4 text-white/40 text-xs font-mono">
        {config.particleCount.toLocaleString()} particles
      </div>
      
      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-12 right-4 text-white/30 text-xs font-mono space-y-0.5 text-right">
        <div>Space: Play/Pause</div>
        <div>R: Reset particles</div>
        <div>H: Toggle panel</div>
        <div>Arrows: Change modes</div>
      </div>
    </div>
  );
}
