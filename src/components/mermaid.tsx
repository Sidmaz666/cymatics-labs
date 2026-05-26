'use client'

import { useEffect, useRef } from 'react'

interface MermaidProps {
  chart: string
}

export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false

    async function render() {
      try {
        const mmd = (await import('mermaid')).default
        if (cancelled || !el) return

        mmd.initialize({
          theme: 'dark',
          themeVariables: {
            background: 'transparent',
            primaryColor: '#1e293b',
            primaryTextColor: '#e2e8f0',
            primaryBorderColor: '#334155',
            lineColor: '#475569',
            secondaryColor: '#0f172a',
            tertiaryColor: '#1e293b',
          },
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
        })

        const { svg } = await mmd.render('g-' + Date.now(), chart)
        if (!cancelled && el) {
          el.innerHTML = svg
        }
      } catch (e: any) {
        if (!cancelled && el) {
          const safe = chart.replace(/</g, '&lt;').replace(/>/g, '&gt;')
          el.innerHTML = `<pre class="text-[11px] font-mono text-zinc-500 leading-relaxed p-4 whitespace-pre-wrap overflow-x-auto">${safe}</pre>`
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [chart])

  return <div ref={ref} className="w-full overflow-x-auto flex justify-center py-2" />
}
