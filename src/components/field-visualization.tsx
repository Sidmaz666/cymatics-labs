'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChladniStore } from '@/lib/chladni-store';
import { computeChladniField } from '@/lib/chladni-simulation';

interface FieldVisualizationProps {
  visible: boolean;
}

export function FieldVisualization({ visible }: FieldVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { oscillators, simulation } = useChladniStore();

  const drawField = useCallback(() => {
    if (!canvasRef.current || !visible) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    // Get active modes
    const modes = oscillators
      .filter((osc) => osc.enabled)
      .map((osc) => ({
        m: osc.modeM,
        n: osc.modeN,
        amplitude: osc.amplitude,
      }));
    
    if (modes.length === 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, width, height);
      return;
    }
    
    const { plateSize, colorScheme } = simulation;
    const halfPlate = plateSize;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Map pixel to plate coordinates
        const px = ((x / width) * 2 - 1) * halfPlate;
        const py = ((y / height) * 2 - 1) * halfPlate;
        
        // Compute field value
        const z = computeChladniField(px, py, modes, plateSize);
        const intensity = Math.abs(z);
        
        const i = (y * width + x) * 4;
        
        // Color based on scheme
        let r = 0, g = 0, b = 0;
        
        switch (colorScheme) {
          case 'classic':
            r = g = b = Math.floor(intensity * 100);
            break;
          case 'rainbow':
            const hue = (Math.atan2(py, px) + Math.PI) / (2 * Math.PI);
            const [h, s, v] = [hue * 360, 70, intensity * 100];
            [r, g, b] = hsvToRgb(h, s, v);
            break;
          case 'heat':
            r = Math.floor(intensity * 255);
            g = Math.floor(intensity * 100);
            b = Math.floor(intensity * 50);
            break;
          case 'ocean':
            r = Math.floor(intensity * 50);
            g = Math.floor(intensity * 150);
            b = Math.floor(intensity * 200);
            break;
          case 'neon':
            r = Math.floor(intensity * 255);
            g = Math.floor(intensity * 100);
            b = Math.floor(intensity * 200);
            break;
        }
        
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = Math.floor(intensity * 80); // Semi-transparent
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, [visible, oscillators, simulation]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    drawField();
  }, [drawField]);

  useEffect(() => {
    drawField();
  }, [oscillators, simulation, drawField]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  s /= 100;
  v /= 100;
  
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  
  let r = 0, g = 0, b = 0;
  
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  
  return [
    Math.floor((r + m) * 255),
    Math.floor((g + m) * 255),
    Math.floor((b + m) * 255),
  ];
}
