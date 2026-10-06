'use client'

import { useEffect, useRef } from 'react'
import { mountHeroScene } from '../hero/heroScene'
import '../hero/hero-scene.css'

/** 3D hero scene (approved prototype): the markup is static, the engine builds the model and runs the loop. */
export default function HeroScene() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => (ref.current ? mountHeroScene(ref.current) : undefined), [])
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
