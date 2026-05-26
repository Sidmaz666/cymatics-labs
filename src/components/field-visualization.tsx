'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useChladniStore } from '@/lib/chladni-store'
import { computeChladniField } from '@/lib/chladni-physics'

export function FieldVisualization({ visible }: { visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { oscillators, simulation } = useChladniStore()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !visible) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    const { width, height } = canvas
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    const modes = oscillators
      .filter((o) => o.enabled)
      .map((o) => ({ m: o.modeM, n: o.modeN, amplitude: o.amplitude }))

    if (modes.length === 0) return

    const { plateSize } = simulation
    const half = plateSize
    const aspect = width / height

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = (x / width) * 2 - 1
        const v = (y / height) * 2 - 1
        const px = aspect > 1 ? u * half : u * half * aspect
        const py = aspect > 1 ? v * (half / aspect) : v * half
        const z = computeChladniField(px, py, modes, plateSize)
        const intensity = Math.abs(z)

        const i = (y * width + x) * 4
        const val = Math.floor(intensity * 80)
        data[i] = val
        data[i + 1] = val
        data[i + 2] = val
        data[i + 3] = Math.floor(intensity * 60)
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [visible, oscillators, simulation])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const onResize = () => draw()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  if (!visible) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
