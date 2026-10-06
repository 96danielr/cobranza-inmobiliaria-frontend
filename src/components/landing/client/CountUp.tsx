'use client'

import { useEffect, useRef, useState } from 'react'

/** Number that counts up the first time it scrolls into view. Server render and reduced motion show the final value. */
export default function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    if (r.top < innerHeight && r.bottom > 0) return   // already visible: keep the final value, no flash
    setShown(0)
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now(), ease = (t: number) => 1 - Math.pow(1 - t, 3)
      const step = (now: number) => { const p = Math.min(1, (now - t0) / 1600); setShown(Math.round(value * ease(p))); if (p < 1) raf = requestAnimationFrame(step) }
      raf = requestAnimationFrame(step)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [value])

  return <div className="num" ref={ref}>{shown}{suffix}</div>
}
