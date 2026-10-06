'use client'

import { useEffect, useRef } from 'react'
import '../hero/hero-scene.css'

/**
 * 3D hero scene. The engine (~55 KB) is loaded after the page has painted and the browser is idle,
 * so it never delays the first render of the landing.
 */
export default function HeroScene() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let cleanup: (() => void) | undefined, cancelled = false
    const start = () => import('../hero/heroScene').then(({ mountHeroScene }) => { if (!cancelled && ref.current) cleanup = mountHeroScene(ref.current) })
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    const id = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 1200 }) : window.setTimeout(start, 200)
    return () => { cancelled = true; if (w.cancelIdleCallback) w.cancelIdleCallback(id); else clearTimeout(id); cleanup?.() }
  }, [])
  return (
    <div className="ox" id="oxw" ref={ref} aria-hidden="true">
      <div className="stage" id="ox">
        <div className="grain" />
        <div className="hud2" id="hud2"><div className="n2" id="n2">RECAUDO 0 %</div><div className="lines" id="lines" /><div className="track2"><i id="fill2" /></div></div>
        <div className="scene"><div className="plane" id="pl" /></div>
      </div>
    </div>
  )
}
