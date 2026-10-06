'use client'

import { useEffect } from 'react'

/** Reveal-on-scroll for `.rv` / `.draw` elements and a gentle parallax on the hero art. Renders nothing. */
export default function LandingEffects() {
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }), { rootMargin: '0px 0px -12% 0px' })
    // anything already on screen is revealed right away; the rest waits for the observer
    document.querySelectorAll('.landing .rv, .landing .draw').forEach(el => {
      const r = el.getBoundingClientRect()
      if (r.top < innerHeight * 0.92 && r.bottom > 0) el.classList.add('in'); else io.observe(el)
    })

    const art = document.querySelector<HTMLElement>('.landing .hero .art')
    let ticking = false
    const onScroll = () => {
      if (ticking || !art) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        // parallax only while the hero is near the top, measured from the page offset (not the moved element),
        // and clamped, so the art can never drift into the sections below
        const y = Math.min(window.scrollY, innerHeight)
        art.style.transform = `translate3d(0, ${(y * 0.06).toFixed(1)}px, 0)`
      })
    }
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce) { window.addEventListener('scroll', onScroll, { passive: true }); onScroll() }
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])
  return null
}
